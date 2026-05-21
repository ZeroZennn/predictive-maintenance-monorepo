"use client"

import { useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import ToastCard from "./ToastCard"
import { useToast } from "@/hooks"

const TOAST_DURATION = 5000 // 5 detik

export default function ToastContainer() {
  const { activeToasts, dismissToast } = useToast()

  useEffect(() => {
    if (activeToasts.length === 0) return

    // Set timer auto-dismiss untuk setiap toast baru
    const timers = activeToasts.map((alert) =>
      setTimeout(() => {
        dismissToast(alert.id)
      }, TOAST_DURATION)
    )

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [activeToasts.length]) // hanya re-run saat jumlah toast berubah

  return (
    <div className="fixed top-4 right-4 z-50 
                    flex flex-col gap-3 
                    pointer-events-none w-80">
      <AnimatePresence mode="sync">
        {activeToasts.map((alert) => (
          <ToastCard
            key={alert.id}
            alert={alert}
            onDismiss={dismissToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
