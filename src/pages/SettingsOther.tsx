import { useState, useEffect } from 'react'
import { FiSave, FiRefreshCw, FiGlobe } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getAppConfig, updateAppConfig } from '../api/app-config'
import { batchRefreshFavicons } from '../api/bookmarks'

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

function FaviconRefreshSection() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  const handleRefresh = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await batchRefreshFavicons()
      setResult(res.data)
      toast.success(`已刷新 ${res.data} 个书签图标`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '刷新图标失败')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">自动为所有没有图标的书签获取网站图标</p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
        >
          <FiRefreshCw size={14} className={running ? 'animate-spin' : ''} />
          {running ? '刷新中...' : '开始刷新'}
        </button>
        {result !== null && (
          <span className="text-xs text-gray-400">
            共处理 {result} 个书签
          </span>
        )}
      </div>
    </div>
  )
}

export default function SettingsOther() {
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)

  useEffect(() => {
    getAppConfig().then(res => {
      const name = res.data?.display_name
      if (name) setDisplayNameInput(name)
    }).catch(() => {})
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-xl p-6 sm:p-8">
        <SectionHeader icon={FiGlobe} title="品牌" desc="自定义网站显示名称" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">应用显示名称</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayNameInput}
                onChange={e => setDisplayNameInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
                placeholder="例如: scalefish"
              />
              <button
                onClick={async () => {
                  if (!displayNameInput.trim()) return
                  setSavingBrand(true)
                  try {
                    await updateAppConfig({ display_name: displayNameInput.trim() })
                    toast.success('显示名称已更新')
                  } catch {
                    toast.error('更新失败')
                  } finally {
                    setSavingBrand(false)
                  }
                }}
                disabled={savingBrand || !displayNameInput.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
              >
                <FiSave size={14} />
                {savingBrand ? '保存中...' : '保存'}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-1.5">修改后在侧边栏和浏览器标签页中显示</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 sm:p-8">
        <SectionHeader icon={FiRefreshCw} title="书签图标刷新" desc="为所有没有图标的书签自动获取网站图标" />
        <FaviconRefreshSection />
      </div>
    </div>
  )
}
