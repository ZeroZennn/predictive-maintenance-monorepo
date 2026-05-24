import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 
                       bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            className="fixed inset-0 z-50 flex 
                       items-center justify-center
                       pointer-events-none"
          >
            <div className="pointer-events-auto w-full 
                            max-w-sm mx-4 rounded-2xl
                            bg-lapis-surface 
                            border border-lapis-border
                            shadow-2xl p-6">

              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl 
                                bg-lapis-red/10 
                                border border-lapis-red/30
                                flex items-center 
                                justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 
                                            text-lapis-red" />
                </div>
                <h3 className="text-sm font-bold 
                               text-lapis-text">
                  {title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs text-lapis-muted 
                            leading-relaxed mb-6 pl-13">
                {description}
              </p>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-xs 
                             font-semibold text-lapis-muted
                             bg-lapis-card border 
                             border-lapis-border
                             hover:text-lapis-text
                             disabled:opacity-50
                             transition-colors duration-150"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-xs 
                             font-semibold text-white
                             bg-lapis-red/80
                             hover:bg-lapis-red
                             disabled:opacity-50
                             flex items-center gap-2
                             transition-colors duration-150"
                >
                  {isLoading && (
                    <Loader2 className="w-3 h-3 
                                       animate-spin" />
                  )}
                  Hapus
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
