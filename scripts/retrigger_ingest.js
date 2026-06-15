/**
 * retrigger_ingest.js
 * Re-trigger POST /nlp/ingest untuk semua dokumen yang stuck di "processing"
 *
 * Usage:
 *   node scripts/retrigger_ingest.js
 *
 * Pastikan:
 *   - Backend jalan di localhost:3000
 *   - NLP container jalan di localhost:8001 (dengan bind mount nlp/data/raw)
 */

const http  = require('http')
const https = require('https')

// ── Config ─────────────────────────────────────────────────────
const BACKEND_URL   = 'http://localhost:3000'
const NLP_URL       = 'http://localhost:8001'
const LOGIN_EMAIL   = 'admin@lapis-ai.com'
const LOGIN_PASS    = 'Admin@Lapis123'
const DELAY_MS      = 500    // jeda antar request ke NLP (ms)
const NLP_FILE_DIR  = '/app/nlp/data/raw'  // path di dalam NLP container

// ── Helper: HTTP request as Promise ───────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const lib     = url.startsWith('https') ? https : http
    const parsed  = new URL(url)
    const reqOpts = {
      hostname: parsed.hostname,
      port    : parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path    : parsed.pathname + parsed.search,
      method  : options.method  || 'GET',
      headers : options.headers || {},
    }

    const req = lib.request(reqOpts, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60))
  console.log('  Lapis AI — NLP Re-trigger Ingest Script')
  console.log('='.repeat(60))

  // Step 1: Login
  console.log('\n[1/4] Login ke Backend...')
  const loginRes = await request(
    `${BACKEND_URL}/api/auth/login`,
    {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: LOGIN_EMAIL, password: LOGIN_PASS }
  )

  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error('❌ Login gagal:', loginRes.body)
    process.exit(1)
  }

  const TOKEN = loginRes.body.data.token
  console.log('✅ Login berhasil')

  // Step 2: Fetch semua dokumen
  console.log('\n[2/4] Mengambil daftar dokumen...')
  const docsRes = await request(
    `${BACKEND_URL}/api/admin/documents`,
    {
      method : 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type' : 'application/json',
      },
    }
  )

  if (docsRes.status !== 200) {
    console.error('❌ Gagal fetch dokumen:', docsRes.body)
    process.exit(1)
  }

  const allDocs = docsRes.body?.data?.documents ?? []
  console.log(`✅ Total dokumen: ${allDocs.length}`)

  // Step 3: Filter yang masih processing/pending/failed
  const stuckDocs = allDocs.filter(d =>
    ['processing', 'pending', 'failed', 'PROCESSING', 'PENDING', 'FAILED']
      .includes(d.status)
  )

  if (stuckDocs.length === 0) {
    console.log('\n✅ Tidak ada dokumen yang perlu di-retrigger. Semua sudah READY!')
    return
  }

  console.log(`\n[3/4] Dokumen yang akan di-retrigger: ${stuckDocs.length}`)
  console.log(`     Delay antar request: ${DELAY_MS}ms`)
  console.log(`     Estimated time: ${Math.ceil(stuckDocs.length * DELAY_MS / 1000)}s\n`)

  // Step 4: Re-trigger satu per satu
  let success = 0
  let failed  = 0

  for (let i = 0; i < stuckDocs.length; i++) {
    const doc      = stuckDocs[i]
    const filename = doc.filename || doc.original_filename
    const docId    = doc.doc_id   || doc.document_id || doc.id
    const docType  = doc.doc_type || doc.file_type?.toLowerCase() || 'sop'
    const filePath = `${NLP_FILE_DIR}/${filename}`

    process.stdout.write(
      `[${String(i+1).padStart(3,'0')}/${stuckDocs.length}] ` +
      `${filename?.substring(0, 40).padEnd(40)} → `
    )

    try {
      const ingestRes = await request(
        `${NLP_URL}/nlp/ingest`,
        {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          document_id: String(docId),
          file_path  : filePath,
          filename   : filename,
          doc_type   : docType,
        }
      )

      if (ingestRes.status === 200 || ingestRes.status === 202) {
        console.log(`✅ accepted`)
        success++
      } else {
        console.log(`⚠️  status ${ingestRes.status}: ${JSON.stringify(ingestRes.body).substring(0,80)}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ error: ${err.message}`)
      failed++
    }

    // Delay agar NLP tidak kewalahan
    if (i < stuckDocs.length - 1) await sleep(DELAY_MS)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`  SELESAI`)
  console.log(`  ✅ Accepted : ${success}`)
  console.log(`  ❌ Failed   : ${failed}`)
  console.log(`  Total       : ${stuckDocs.length}`)
  console.log('='.repeat(60))
  console.log('\nTunggu background task NLP selesai (~5-10 menit untuk 120 dokumen).')
  console.log('Cek status di http://localhost:3000/api/admin/documents')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
