import apiClient from "./axios-instance";
import type { 
  AdminUser, 
  AdminDocument, 
  MaintenanceLog 
} from '@/types'

// ── User Management ──

export async function fetchUsers(): 
  Promise<AdminUser[]> {
  const { data } = await apiClient.get('/api/admin/users')
  return data
}

export async function createUser(payload: {
  name: string
  email: string
  password: string
  role: 'TECHNICIAN' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
}): Promise<AdminUser> {
  const { data } = await apiClient.post(
    '/api/admin/users', payload
  )
  return data
}

export async function updateUser(
  id: string,
  payload: Partial<{
    name: string
    email: string
    password: string
    role: 'TECHNICIAN' | 'ADMIN'
    status: 'ACTIVE' | 'INACTIVE'
  }>
): Promise<AdminUser> {
  const { data } = await apiClient.patch(
    `/api/admin/users/${id}`, payload
  )
  return data
}

export async function deleteUser(
  id: string
): Promise<void> {
  await apiClient.delete(`/api/admin/users/${id}`)
}

// ── Document Management ──

export async function fetchDocuments(): 
  Promise<AdminDocument[]> {
  const { data } = await apiClient.get('/api/admin/documents')
  return data
}

export async function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void
): Promise<AdminDocument> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(
    '/api/admin/documents/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    }
  )
  return data
}

export async function deleteDocument(
  id: string
): Promise<void> {
  await apiClient.delete(`/api/admin/documents/${id}`)
}

// ── Maintenance Logs ──

export async function fetchAdminMaintenanceLogs(): 
  Promise<MaintenanceLog[]> {
  const { data } = await apiClient.get(
    '/api/admin/maintenance-logs'
  )
  return data
}

export async function createMaintenanceLog(
  payload: Omit<MaintenanceLog, 
    'log_id' | 'created_at' | 'updated_at'>
): Promise<MaintenanceLog> {
  const { data } = await apiClient.post(
    '/api/admin/maintenance-logs', payload
  )
  return data
}

export async function updateMaintenanceLog(
  log_id: string,
  payload: Partial<Omit<MaintenanceLog,
    'log_id' | 'created_at' | 'updated_at'>>
): Promise<MaintenanceLog> {
  const { data } = await apiClient.patch(
    `/api/admin/maintenance-logs/${log_id}`,
    payload
  )
  return data
}

export async function deleteMaintenanceLog(
  log_id: string
): Promise<void> {
  await apiClient.delete(
    `/api/admin/maintenance-logs/${log_id}`
  )
}
