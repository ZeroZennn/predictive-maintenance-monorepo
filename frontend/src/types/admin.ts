export interface AdminUser {
  user_id: string
  name: string
  email: string
  role: 'TECHNICIAN' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

export interface AdminDocument {
  doc_id: string
  filename: string
  file_type: 'PDF' | 'DOCX' | 'TXT'
  status: 'READY' | 'PROCESSING' | 'FAILED'
  file_size_kb: number
  uploaded_at: string
}

export type AdminTab = 
  'dashboard' | 'users' | 'documents' | 'logs'
