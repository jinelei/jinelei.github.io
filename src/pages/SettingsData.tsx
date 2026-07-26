import { useRef } from 'react'
import { FiDownload, FiUpload, FiArchive } from 'react-icons/fi'
import { exportBackup, importBackup } from '../utils/backup'

function SectionHeader({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
        <Icon size={18} className="text-accent-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

export default function SettingsData() {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importBackup(file)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-xl p-6 sm:p-8">
        <SectionHeader icon={FiArchive} title="数据" desc="ZIP 格式备份和恢复完整网站数据（书签、时刻、账户、证书等）" />
        <div className="flex items-center gap-3">
          <button
            onClick={exportBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all active:scale-95"
          >
            <FiDownload size={14} />
            导出备份
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all active:scale-95"
          >
            <FiUpload size={14} />
            导入备份
          </button>
          <input ref={fileRef} type="file" accept=".zip" onChange={handleImport} className="hidden" />
        </div>
      </div>
    </div>
  )
}
