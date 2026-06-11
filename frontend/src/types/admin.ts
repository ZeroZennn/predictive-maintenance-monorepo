export interface AdminUser {
  user_id: string
  name: string
  email: string
  role: 'TECHNICIAN' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

export interface AdminDocument {
  document_id: string
  filename: string
  file_type: 'PDF' | 'DOCX' | 'TXT' | string
  file_size_kb: number
  status: 'READY' | 'PROCESSING' | 'FAILED'
  uploaded_at: string
  // Extended fields from backend
  chunks_count?: number
  doc_type?: string
  label?: string
  ready_at?: string | null
  error_message?: string | null
}

export type AdminTab = 
  'dashboard' | 'users' | 'documents' | 'logs'
