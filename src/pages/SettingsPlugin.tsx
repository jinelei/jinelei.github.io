import { FiDownload, FiChrome } from 'react-icons/fi'

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

export default function SettingsPlugin() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-xl p-6 sm:p-8">
        <SectionHeader icon={FiChrome} title="插件" desc="Chrome 扩展" />
        <div className="flex items-center gap-3">
          <a
            href="/scalefish-chrome-ext.zip"
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <FiDownload size={14} />
            下载扩展 (ZIP)
          </a>
          <a
            href="/chrome-ext"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-all active:scale-95"
          >
            查看安装步骤
          </a>
        </div>
      </div>
    </div>
  )
}
