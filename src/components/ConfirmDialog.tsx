import { useCallback, useRef, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import Modal from './Modal'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function useConfirm(): [(opts: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({ message: '' })
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options)
    setOpen(true)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    setOpen(false)
    resolver.current?.(result)
    resolver.current = null
  }

  const dialog = (
    <Modal open={open} onClose={() => close(false)} title={opts.title || '请确认'} size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${opts.danger ? 'bg-rose-500/10 text-rose-400' : 'bg-accent-500/10 text-accent-400'}`}>
            <FiAlertTriangle size={17} />
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed pt-1.5">{opts.message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-300 text-sm transition-colors"
          >
            {opts.cancelText || '取消'}
          </button>
          <button
            onClick={() => close(true)}
            autoFocus
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              opts.danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-accent-600 hover:bg-accent-500'
            }`}
          >
            {opts.confirmText || '确定'}
          </button>
        </div>
      </div>
    </Modal>
  )

  return [confirm, dialog]
}
