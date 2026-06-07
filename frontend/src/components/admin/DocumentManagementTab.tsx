'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocuments, uploadDocument, deleteDocument } from '@/lib/api'
import type { AdminDocument } from '@/types'
import { ConfirmDeleteModal } from './index'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, FileType, File, Trash2, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MOCK_DOCUMENTS: AdminDocument[] = [
  { document_id: 'd-001',
    filename: 'SOP-01_M-01_Rev2.pdf',
    file_type: 'PDF', status: 'READY',
    file_size_kb: 2048,
    uploaded_at: '2026-04-25T00:00:00Z' },
  { document_id: 'd-002',
    filename: 'Manual_Operasi_M-07.docx',
    file_type: 'DOCX', status: 'PROCESSING',
    file_size_kb: 512,
    uploaded_at: '2026-05-01T00:00:00Z' },
  { document_id: 'd-003',
    filename: 'Panduan_Safety_Pabrik.txt',
    file_type: 'TXT', status: 'FAILED',
    file_size_kb: 128,
    uploaded_at: '2026-05-10T00:00:00Z' },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES LOKAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface UploadingFile {
  id: string         // temporary local id
  filename: string
  progress: number   // 0–100
  error?: string
}

export default function DocumentManagementTab() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE LOKAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA FETCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch(() => setDocuments(MOCK_DOCUMENTS))
      .finally(() => setIsLoading(false))
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPLOAD HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const allowed = ['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']

      const validFiles = Array.from(files).filter(f =>
        allowed.includes(f.type)
      )

      if (validFiles.length === 0) return

      for (const file of validFiles) {
        const tempId = `upload-${Date.now()}-${Math.random()}`

        // Tambah ke uploadingFiles list
        setUploadingFiles(prev => [...prev, {
          id: tempId,
          filename: file.name,
          progress: 0,
        }])

        try {
          const uploaded = await uploadDocument(
            file,
            (percent) => {
              setUploadingFiles(prev => prev.map(u =>
                u.id === tempId
                  ? { ...u, progress: percent }
                  : u
              ))
            }
          )
          // Upload selesai → pindah ke tabel dokumen
          setDocuments(prev => [uploaded, ...prev])
        } catch {
          setUploadingFiles(prev => prev.map(u =>
            u.id === tempId
              ? { ...u, error: 'Upload gagal', progress: 0 }
              : u
          ))
        } finally {
          // Hapus dari uploadingFiles setelah 2 detik
          setTimeout(() => {
            setUploadingFiles(prev =>
              prev.filter(u => u.id !== tempId)
            )
          }, 2000)
        }
      }
    }, []
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DRAG & DROP HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteDocument(deleteTarget.document_id)
    } catch {
      // Optimistic delete untuk dev
    } finally {
      setDocuments(prev => prev.filter(
        d => d.document_id !== deleteTarget.document_id
      ))
      setDeleteTarget(null)
      setIsDeleting(false)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function getFileIcon(type: AdminDocument['file_type']) {
    if (type === 'PDF') return FileText
    if (type === 'DOCX') return FileType
    return File
  }

  function formatFileSize(kb: number): string {
    if (kb >= 1024) 
      return `${(kb / 1024).toFixed(1)} MB`
    return `${kb} KB`
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const STATUS_CONFIG = {
    PENDING: {
      label: 'Pending',
      className: 'bg-lapis-muted/10 text-lapis-muted border-lapis-muted/30',
      icon: Loader2,
    },
    READY: {
      label: 'Ready',
      className: 'bg-lapis-neon/10 text-lapis-neon border-lapis-neon/30',
      icon: CheckCircle,
    },
    PROCESSING: {
      label: 'Processing',
      className: 'bg-lapis-amber/10 text-lapis-amber border-lapis-amber/30',
      icon: Loader2,
    },
    FAILED: {
      label: 'Failed',
      className: 'bg-lapis-red/10 text-lapis-red border-lapis-red/30',
      icon: AlertCircle,
    },
  } as const

  const DEFAULT_STATUS_CFG = {
    label: 'Unknown',
    className: 'bg-lapis-muted/10 text-lapis-muted border-lapis-muted/30',
    icon: AlertCircle,
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STRUKTUR JSX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <>
      <div className="h-full p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden bg-[#2B3739] rounded-2xl shadow-xl border border-lapis-border/30 gap-0">
          {/* ── Upload Area ── */}
          <div className="p-5 border-b border-lapis-border/20 flex-shrink-0">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center
              gap-3 p-8 rounded-xl border-2 border-dashed
              cursor-pointer transition-all duration-200
              ${isDragging
                ? 'border-lapis-neon bg-lapis-neon/5 scale-[1.01]'
                : 'border-lapis-border/50 bg-[#101617] hover:border-lapis-neon/50 hover:bg-[#101617]/80'
              }
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex 
                             items-center justify-center
                             transition-colors duration-200
                             ${isDragging
                               ? 'bg-lapis-neon/20'
                               : 'bg-[#2B3739]'}`}>
              <CloudUpload className={`w-6 h-6 
                transition-colors duration-200
                ${isDragging
                  ? 'text-lapis-neon'
                  : 'text-lapis-muted'}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold 
                            text-lapis-text">
                {isDragging
                  ? 'Lepaskan file di sini'
                  : 'Drag & drop file di sini'}
              </p>
              <p className="text-xs text-lapis-muted mt-1">
                atau klik untuk browse · 
                PDF, DOCX, TXT · Maks 50MB
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={e => {
              if (e.target.files) 
                handleFiles(e.target.files)
              e.target.value = ''
            }}
          />

          {/* Uploading Files Progress */}
          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-col gap-2 
                           overflow-hidden"
              >
                {uploadingFiles.map(uf => (
                  <div key={uf.id}
                    className="flex flex-col gap-1.5 
                               p-3 rounded-lg
                               bg-lapis-card 
                               border border-lapis-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-lapis-text truncate max-w-[70%]">
                        {uf.filename}
                      </span>
                      {uf.error ? (
                        <span className="text-[10px] text-lapis-red">
                          {uf.error}
                        </span>
                      ) : uf.progress < 100 ? (
                        <span className="text-[10px] text-lapis-muted">
                          {uf.progress}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-lapis-amber">
                          Processing...
                        </span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    {!uf.error && (
                      <div className="w-full h-1 rounded-full bg-lapis-surface">
                        <motion.div
                          className={`h-full rounded-full 
                            ${uf.progress < 100
                              ? 'bg-lapis-neon'
                              : 'bg-lapis-amber'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${uf.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Tabel Dokumen ── */}
        <div className="flex-1 overflow-auto px-4 md:px-6 pt-2
                        scrollbar-thin 
                        scrollbar-thumb-lapis-border
                        scrollbar-track-transparent">
          <div className="rounded-xl overflow-hidden border border-lapis-border/20">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#505C5E]">
              <tr className="border-b border-lapis-border/20">
                {['No', 'Nama File', 'Tipe', 'Status', 
                  'Ukuran', 'Upload Date', 'Aksi']
                  .map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left
                                 text-lapis-muted font-semibold
                                 uppercase tracking-widest 
                                 text-[10px]">
                      {h}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="bg-[#101617] border-b border-lapis-border/20">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-lapis-surface/50 rounded animate-pulse"/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr className="bg-[#101617]">
                  <td colSpan={7}
                    className="px-4 py-12 text-center text-lapis-muted">
                    Belum ada dokumen terunggah
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => {
                  const FileIcon = getFileIcon(doc.file_type)
                  const statusCfg =
                    STATUS_CONFIG[
                      (doc.status?.toUpperCase() ?? '') as keyof typeof STATUS_CONFIG
                    ] ?? DEFAULT_STATUS_CFG
                  const StatusIcon = statusCfg.icon

                  return (
                    <tr key={doc.document_id || index}
                      className="bg-[#101617] border-b border-[#2B3739]
                                 hover:bg-lapis-surface/30
                                 transition-colors duration-100">

                      {/* No */}
                      <td className="px-4 py-3 text-lapis-muted font-medium w-10">
                        {index + 1}
                      </td>

                      {/* Nama File */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-lapis-muted flex-shrink-0" />
                          <span className="font-medium text-lapis-text truncate max-w-[200px]">
                            {doc.filename}
                          </span>
                        </div>
                      </td>

                      {/* Tipe */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 
                          rounded text-[10px] font-bold
                          bg-lapis-surface text-lapis-muted 
                          border border-lapis-border">
                          {doc.file_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className={`
                          inline-flex items-center gap-1.5
                          px-2 py-0.5 rounded-full border
                          text-[10px] font-semibold
                          ${statusCfg.className}
                        `}>
                          <StatusIcon className={`
                            w-3 h-3 flex-shrink-0
                            ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}
                          `} />
                          {statusCfg.label}
                        </div>
                      </td>

                      {/* Ukuran */}
                      <td className="px-4 py-3 text-lapis-muted">
                        {formatFileSize(doc.file_size_kb)}
                      </td>

                      {/* Upload Date */}
                      <td className="px-4 py-3 text-lapis-muted">
                        {formatDate(doc.uploaded_at)}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          disabled={doc.status === 'PROCESSING'}
                          title={doc.status === 'PROCESSING'
                            ? 'Tidak bisa hapus saat processing'
                            : 'Hapus dokumen'}
                          className="p-1.5 rounded-lg
                            text-lapis-muted hover:text-lapis-red
                            hover:bg-lapis-red/10
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-colors duration-150">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
        </div>
      </div>

      {/* ── CONFIRM DELETE ── */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Hapus "${deleteTarget?.filename}"?`}
        description="Dokumen akan dihapus dari sistem dan index RAG. Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </>
  )
}
