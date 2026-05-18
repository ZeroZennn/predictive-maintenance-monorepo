import { useEffect } from 'react'
import { useMaintenanceStore } from '@/stores'
import { fetchMaintenanceTasks } from '@/lib/api'

export function useMaintenanceSocket() {
  const setTasks = useMaintenanceStore(s => s.setTasks)
  const setLoading = useMaintenanceStore(s => s.setLoading)

  useEffect(() => {
    let cancelled = false

    async function loadInitialTasks() {
      setLoading(true)
      try {
        const data = await fetchMaintenanceTasks()
        if (!cancelled) setTasks(data)
      } catch (err) {
        console.error('[useMaintenanceSocket] fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitialTasks()

    // Cleanup: cegah state update jika komponen unmount
    // sebelum fetch selesai
    return () => { cancelled = true }

    // WebSocket real-time update sudah otomatis via:
    // ws-manager → isMaintenanceTask() → maintenanceStore.addTask()
    // Tidak perlu tambah listener di sini.
  }, [setTasks, setLoading])
}
