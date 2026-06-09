/**
 * cleanup_documents.js
 * Bersihkan semua data dokumen:
 *   1. Hapus semua dokumen dari Backend DB (via API)
 *   2. Hapus file DOC-* dari nlp/data/raw (uploaded files, bukan knowledge_base lama)
 *   3. Reset Qdrant collection ke kondisi awal
 *
 * Usage:
 *   node scripts/cleanup_documents.js
 */

const http = require('http')
const https = require('https')
const fs   = require('fs')
const path = require('path')

// ── Config ─────────────────────────────────────────────────────
const BACKEND_URL  = 'http://localhost:3000'
const QDRANT_URL   = 'http://localhost:6333'
const LOGIN_EMAIL  = 'admin@lapis-ai.com'
const LOGIN_PASS   = 'Admin@Lapis123'
const COLLECTION   = 'lapis_ai_chunks'
const RAW_DIR      = path.join(__dirname, '..', 'nlp', 'data', 'raw')
const DELAY_MS     = 200

// ── HTTP Helper ─────────────────────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const lib    = url.startsWith('https') ? https : http
    const parsed = new URL(url)
    const opts   = {
      hostname: parsed.hostname,
      port    : parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path    : parsed.pathname + parsed.search,
      method  : options.method  || 'GET',
      headers : options.headers || {},
    }

    const req = lib.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body))
    req.end()
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60))
  console.log('  Lapis AI — Document Cleanup Script')
  console.log('='.repeat(60))

  // ── STEP 1: Login ──────────────────────────────────────────────
  console.log('\n[1/4] Login ke Backend...')
  const loginRes = await request(
    `${BACKEND_URL}/api/auth/login`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: LOGIN_EMAIL, password: LOGIN_PASS }
  )

  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error('❌ Login gagal:', loginRes.body?.message)
    process.exit(1)
  }
  const TOKEN = loginRes.body.data.token
  const AUTH  = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  console.log('✅ Login berhasil')

  // ── STEP 2: Fetch & Delete semua dokumen dari DB ───────────────
  console.log('\n[2/4] Menghapus semua dokumen dari Backend DB...')
  const docsRes = await request(
    `${BACKEND_URL}/api/admin/documents`,
    { method: 'GET', headers: AUTH }
  )

  const allDocs = docsRes.body?.data?.documents ?? []
  console.log(`     Ditemukan: ${allDocs.length} dokumen`)

  let delOK = 0, delFail = 0
  for (let i = 0; i < allDocs.length; i++) {
    const doc   = allDocs[i]
    const docId = doc.doc_id || doc.document_id || doc.id
    process.stdout.write(`     [${String(i+1).padStart(3,'0')}/${allDocs.length}] Hapus ${docId}... `)

    try {
      const r = await request(
        `${BACKEND_URL}/api/admin/documents/${docId}`,
        { method: 'DELETE', headers: AUTH }
      )
      if (r.status === 200 || r.status === 204) {
        console.log('✅')
        delOK++
      } else {
        console.log(`⚠️  ${r.status}`)
        delFail++
      }
    } catch (e) {
      console.log(`❌ ${e.message}`)
      delFail++
    }

    if (i < allDocs.length - 1) await sleep(DELAY_MS)
  }
  console.log(`\n     Hapus DB: ✅ ${delOK}  ❌ ${delFail}`)

  // ── STEP 3: Hapus file DOC-* dari nlp/data/raw ────────────────
  console.log('\n[3/4] Membersihkan file upload dari nlp/data/raw...')
  let filesDel = 0, filesSkip = 0

  if (fs.existsSync(RAW_DIR)) {
    const files = fs.readdirSync(RAW_DIR)
    const uploadedFiles = files.filter(f =>
      f.startsWith('DOC-') || f.match(/^DOC-\d{8}-\d+-/)
    )
    console.log(`     File upload ditemukan: ${uploadedFiles.length}`)
    console.log(`     File knowledge_base (dipertahankan): ${files.length - uploadedFiles.length}`)

    for (const f of uploadedFiles) {
      try {
        fs.unlinkSync(path.join(RAW_DIR, f))
        filesDel++
      } catch (e) {
        console.log(`     ⚠️  Gagal hapus ${f}: ${e.message}`)
      }
    }
    console.log(`     ✅ ${filesDel} file upload dihapus`)
  } else {
    console.log(`     ⚠️  Direktori tidak ditemukan: ${RAW_DIR}`)
  }

  // ── STEP 4: Reset Qdrant collection ───────────────────────────
  console.log('\n[4/4] Reset Qdrant collection...')

  // Cek dulu apakah collection ada
  const colRes = await request(`${QDRANT_URL}/collections/${COLLECTION}`)

  if (colRes.status === 200) {
    // Hapus semua points (bukan drop collection — lebih aman)
    const clearRes = await request(
      `${QDRANT_URL}/collections/${COLLECTION}/points/delete`,
      {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      // Filter: hapus SEMUA points
      JSON.stringify({ filter: {} })
    )

    if (clearRes.status === 200) {
      console.log('✅ Semua vector points dihapus dari Qdrant')
    } else {
      // Fallback: delete seluruh collection
      console.log('     Mencoba drop collection...')
      const dropRes = await request(
        `${QDRANT_URL}/collections/${COLLECTION}`,
        { method: 'DELETE' }
      )
      if (dropRes.status === 200) {
        console.log('✅ Collection di-drop. NLP akan recreate saat startup.')
      } else {
        console.log(`⚠️  Qdrant cleanup gagal: ${JSON.stringify(dropRes.body).substring(0,100)}`)
      }
    }
  } else {
    console.log('     Collection belum ada di Qdrant — tidak perlu dibersihkan')
  }

  // ── DONE ───────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('  CLEANUP SELESAI')
  console.log('='.repeat(60))
  console.log(`
Langkah selanjutnya:
  1. Restart NLP container untuk re-init Qdrant:
     docker compose --profile app restart nlp
     (atau rebuild jika ada perubahan code)

  2. Tunggu NLP startup selesai (~2-3 menit)

  3. Upload ulang 120 dokumen dari admin page

  4. (Opsional) Monitor:
     docker logs lapis_nlp_engine -f --tail 30
  `)
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
