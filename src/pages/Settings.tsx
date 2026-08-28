import { useState, useEffect, useRef, useCallback } from 'react'
import { FiUser, FiKey, FiSave, FiCheck, FiTrash2, FiShield, FiDownload, FiUpload, FiArchive, FiChrome, FiGlobe, FiRefreshCw, FiPlus, FiX, FiSmartphone, FiClock, FiXCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { changePassword, updateProfile, setupTotp, verifyTotpSetup, disableTotp } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { getAppConfig, updateAppConfig } from '../api/app-config'
import { exportBackup, importBackup } from '../utils/backup'
import { batchRefreshFavicons } from '../api/bookmarks'
import { listCerts, getCurrentCert, trustCert, deleteCert, type ClientCertResponse, type ParsedCert } from '../api/client-certs'
import { listDeviceFingerprints, updateDeviceFingerprintStatus, deleteDeviceFingerprint, type DeviceFingerprintResponse, type DeviceTrustStatus } from '../api/device-fingerprints'
import { useConfirm } from '../components/ConfirmDialog'
import { createLogger } from '../utils/logger'

const log = createLogger('Settings')

const sections = [
  { id: 'account', label: '账户', icon: FiUser },
  { id: 'password', label: '密码', icon: FiKey },
  { id: 'totp', label: '两步验证', icon: FiShield },
  { id: 'fingerprints', label: '指纹管理', icon: FiSmartphone },
  { id: 'data', label: '数据', icon: FiArchive },
  { id: 'plugin', label: '插件', icon: FiChrome },
  { id: 'brand', label: '品牌', icon: FiGlobe },
  { id: 'favicon', label: '图标刷新', icon: FiRefreshCw },
  { id: 'certificates', label: '证书', icon: FiShield },
]

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

function AccountSection() {
  const [nickname, setNickname] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    if (user?.name) setNickname(user.name)
  }, [user?.name])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      toast.error('昵称不能为空')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile({ name: nickname.trim() })
      await refreshUser()
      toast.success('昵称已更新')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新失败'
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div id="account" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
      <SectionHeader icon={FiUser} title="账户" desc="用户名和显示名称" />
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">用户名</label>
          <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 select-all">
            {user?.username}
          </div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">显示名称（昵称）</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
              placeholder="输入昵称"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <FiSave size={14} />
            {savingProfile ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordSection() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const { logout } = useAuth()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少 6 位')
      return
    }
    setChanging(true)
    try {
      await changePassword(oldPassword, newPassword)
      toast.success('密码修改成功，请重新登录')
      logout()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '修改失败'
      toast.error(msg)
    } finally {
      setChanging(false)
    }
  }

  return (
    <div id="password" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
      <SectionHeader icon={FiKey} title="密码" desc="修改后将自动退出，请重新登录" />
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
            placeholder="输入当前密码"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
            placeholder="至少 6 位"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
            placeholder="再次输入新密码"
            required
          />
        </div>
        <button
          type="submit"
          disabled={changing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
        >
          <FiSave size={14} />
          {changing ? '修改中...' : '保存密码'}
        </button>
      </form>
    </div>
  )
}

function TotpSection() {
  const { user, refreshUser } = useAuth()
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [saving, setSaving] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const handleSetup = async () => {
    try {
      const res = await setupTotp()
      setSecret(res.data.secret)
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(res.data.otpauthUri, { width: 200, margin: 2 })
      setQrDataUrl(url)
      setStep('setup')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '设置失败')
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    setSaving(true)
    try {
      await verifyTotpSetup(code.trim())
      await refreshUser()
      setStep('idle')
      setCode('')
      setSecret('')
      setQrDataUrl('')
      toast.success('两步验证已启用')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '验证失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async () => {
    try {
      await disableTotp()
      await refreshUser()
      toast.success('两步验证已关闭')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '关闭失败')
    }
  }

  return (
    <div id="totp" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
      <SectionHeader icon={FiShield} title="两步验证" desc="TOTP 二次验证提高账户安全性" />
      {user?.totpEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-neon-400">
            <FiCheck size={14} />
            两步验证已启用
          </div>
          <button
            onClick={handleDisable}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all active:scale-95"
          >
            <FiTrash2 size={14} />
            关闭两步验证
          </button>
        </div>
      ) : step === 'setup' ? (
        <div className="space-y-4">
          {qrDataUrl && (
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="TOTP QR Code" className="rounded-lg" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">或手动输入密钥</label>
            <code className="block w-full px-3 py-2 rounded-lg bg-black/30 text-xs text-neon-300 font-mono break-all select-all">
              {secret}
            </code>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">输入应用中的验证码确认</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 text-center tracking-[0.5em] focus:outline-none focus:border-accent-500/50 transition-colors"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={saving || code.trim().length !== 6}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
            >
              {saving ? '验证中...' : '确认并启用'}
            </button>
            <button
              onClick={() => setStep('idle')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">使用 Google Authenticator 等 TOTP 应用生成一次性验证码</p>
          <button
            onClick={handleSetup}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <FiShield size={14} />
            设置两步验证
          </button>
        </div>
      )}
    </div>
  )
}

function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importBackup(file)
      e.target.value = ''
    }
  }

  return (
    <div id="data" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
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
  )
}

function PluginSection() {
  return (
    <div id="plugin" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
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
  )
}

function BrandSection() {
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)

  useEffect(() => {
    getAppConfig().then(res => {
      const name = res.data?.display_name
      if (name) setDisplayNameInput(name)
    }).catch(() => {})
  }, [])

  return (
    <div id="brand" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
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
          <p className="text-[11px] text-gray-600 mt-1.5">修改后在顶部导航和浏览器标签页中显示</p>
        </div>
      </div>
    </div>
  )
}

function FaviconSection() {
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
    <div id="favicon" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
      <SectionHeader icon={FiRefreshCw} title="书签图标刷新" desc="为所有没有图标的书签自动获取网站图标" />
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
    </div>
  )
}

function CertificatesSection() {
  const [confirm, confirmDialog] = useConfirm()
  const [certs, setCerts] = useState<ClientCertResponse[]>([])
  const [currentCert, setCurrentCert] = useState<ParsedCert | null>(null)
  const [loading, setLoading] = useState(true)
  const [trusting, setTrusting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formatDate = (s: string | null): string => {
    if (!s) return '-'
    return new Date(s).toLocaleString('zh-CN')
  }

  const shortFingerprint = (fp: string): string => {
    if (!fp || fp.length < 16) return fp
    return fp.slice(0, 8) + '…' + fp.slice(-8)
  }

  const load = async () => {
    try {
      const [certsRes, currentRes] = await Promise.all([
        listCerts(),
        getCurrentCert(),
      ])
      setCerts(certsRes.data)
      setCurrentCert(currentRes.data)
    } catch (e) {
      log.warn('Failed to load certificates: %o', e)
      setMessage({ type: 'error', text: '加载证书列表失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleTrust = async () => {
    setTrusting(true)
    setMessage(null)
    try {
      await trustCert()
      setMessage({ type: 'success', text: '证书已信任' })
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || '信任失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setTrusting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: '删除证书',
      message: '确定要删除此证书吗？删除后该证书将无法再用于自动登录。',
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteCert(id)
      setMessage({ type: 'success', text: '证书已删除' })
      await load()
    } catch {
      setMessage({ type: 'error', text: '删除失败' })
    }
  }

  if (loading) {
    return (
      <div id="certificates" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div id="certificates" className="glass rounded-xl p-6 sm:p-8 scroll-mt-20">
      {confirmDialog}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <FiShield size={16} className="text-accent-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">客户端证书管理</h3>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-lg text-xs ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {currentCert ? (
        <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-lg p-4 mb-4 space-y-2">
          <div className="text-xs text-gray-500">当前请求携带的证书</div>
          <div className="text-xs">
            <div className="flex gap-2 py-0.5">
              <span className="text-gray-500 w-20 shrink-0">主题</span>
              <span className="text-gray-800 dark:text-gray-200 font-mono break-all">{currentCert.subjectDn}</span>
            </div>
            <div className="flex gap-2 py-0.5">
              <span className="text-gray-500 w-20 shrink-0">序列号</span>
              <span className="text-gray-800 dark:text-gray-200 font-mono text-[10px] break-all">{currentCert.serialNumber}</span>
            </div>
            <div className="flex gap-2 py-0.5">
              <span className="text-gray-500 w-20 shrink-0">指纹</span>
              <span className="text-gray-800 dark:text-gray-200 font-mono text-[10px] break-all">{currentCert.fingerprintSha256}</span>
            </div>
          </div>
          {certs.some(c => c.fingerprintSha256 === currentCert.fingerprintSha256) ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <FiCheck size={12} /> 此证书已被信任
            </div>
          ) : (
            <button
              onClick={handleTrust}
              disabled={trusting}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
            >
              <FiPlus size={12} />
              {trusting ? '信任中…' : '信任此证书'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-lg p-4 mb-4">
          <div className="text-xs text-gray-500">当前请求未携带客户端证书（或未通过 nginx 代理）</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-24">主题</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-20">序列号</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-28">指纹</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-16">状态</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-20">创建时间</th>
              <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((cert, i) => (
              <tr key={cert.id} className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 ${i % 2 === 0 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}`}>
                <td className="py-2 px-2 text-gray-800 dark:text-gray-200 truncate" title={cert.subjectDn}>{cert.subjectDn}</td>
                <td className="py-2 px-2 text-gray-500 font-mono text-[10px] truncate" title={cert.serialNumber}>{shortFingerprint(cert.serialNumber)}</td>
                <td className="py-2 px-2 text-gray-500 font-mono text-[10px] truncate" title={cert.fingerprintSha256}>{shortFingerprint(cert.fingerprintSha256)}</td>
                <td className="py-2 px-2">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    cert.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                  }`}>
                    {cert.isActive ? <FiCheck size={10} /> : <FiX size={10} />}
                    {cert.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="py-2 px-2 text-gray-500 text-[10px]">{formatDate(cert.createdAt)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <FiTrash2 size={11} />
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-gray-500">暂无已信任的证书</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function deviceLabel(d: DeviceFingerprintResponse): string {
  const ua = d.userAgent || ''
  let browser = '未知浏览器'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'
  const os = d.platform || (/Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '未知系统')
  return `${browser} · ${os}`
}

function formatFingerprintTime(s: string | null): string {
  if (!s) return '从未登录'
  // 后端 LocalDateTime 以 UTC 存储且序列化不带时区偏移，按 UTC 解析后转换为东八区显示
  const d = new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z')
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
}

function shortHash(fp: string): string {
  if (!fp || fp.length < 16) return fp
  return fp.slice(0, 8) + '…' + fp.slice(-6)
}

function FingerprintCard({
  device,
  actions,
}: {
  device: DeviceFingerprintResponse
  actions: { label: string; icon: React.ReactNode; onClick: () => void; tone: 'accent' | 'rose' | 'gray' }[]
}) {
  return (
    <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-2.5 sm:p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">
        <FiSmartphone size={12} className="shrink-0" />
        <span className="truncate" title={device.userAgent || ''}>{deviceLabel(device)}</span>
      </div>
      <div className="text-[10px] text-gray-500 font-mono break-all" title={device.fingerprintSha256}>
        {shortHash(device.fingerprintSha256)}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <FiClock size={10} className="shrink-0" />
        <span className="truncate" title={`最近登录：${formatFingerprintTime(device.lastLoginAt)}`}>
          最近登录：{formatFingerprintTime(device.lastLoginAt)}
        </span>
      </div>
      {device.lastIp && (
        <div className="text-[10px] text-gray-500 font-mono break-all">IP：{device.lastIp}</div>
      )}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-1.5 pt-1">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 sm:py-1 rounded text-[11px] sm:text-[10px] font-medium transition-colors ${
              a.tone === 'accent'
                ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400 hover:bg-accent-500/20'
                : a.tone === 'rose'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                : 'bg-white/5 text-gray-500 hover:bg-white/10'
            }`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FingerprintsSection() {
  const [confirm, confirmDialog] = useConfirm()
  const [devices, setDevices] = useState<DeviceFingerprintResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await listDeviceFingerprints()
      setDevices(res.data)
    } catch (e) {
      log.warn('Failed to load device fingerprints: %o', e)
      toast.error('加载设备指纹失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const move = async (d: DeviceFingerprintResponse, status: DeviceTrustStatus) => {
    setBusyId(d.id)
    try {
      await updateDeviceFingerprintStatus(d.id, status)
      toast.success(status === 'TRUSTED' ? '已设为信任设备' : status === 'UNTRUSTED' ? '已设为不信任' : '已移回待处理')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (d: DeviceFingerprintResponse) => {
    const ok = await confirm({
      title: '删除设备指纹',
      message: '确定删除该设备指纹吗？删除后该设备再次登录将重新出现在待处理中。',
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    setBusyId(d.id)
    try {
      await deleteDeviceFingerprint(d.id)
      toast.success('已删除')
      await load()
    } catch {
      toast.error('删除失败')
    } finally {
      setBusyId(null)
    }
  }

  const pending = devices.filter(d => d.trustStatus === 'PENDING')
  const trusted = devices.filter(d => d.trustStatus === 'TRUSTED')
  const untrusted = devices.filter(d => d.trustStatus === 'UNTRUSTED')

  const columns: {
    key: DeviceTrustStatus
    title: string
    icon: React.ReactNode
    accent: string
    items: DeviceFingerprintResponse[]
    empty: string
    actions: (d: DeviceFingerprintResponse) => { label: string; icon: React.ReactNode; onClick: () => void; tone: 'accent' | 'rose' | 'gray' }[]
  }[] = [
    {
      key: 'PENDING',
      title: '待处理',
      icon: <FiClock size={13} />,
      accent: 'text-amber-500',
      items: pending,
      empty: '暂无待处理设备',
      actions: (d) => [
        { label: '信任', icon: <FiCheck size={11} />, onClick: () => move(d, 'TRUSTED'), tone: 'accent' as const },
        { label: '不信任', icon: <FiX size={11} />, onClick: () => move(d, 'UNTRUSTED'), tone: 'rose' as const },
      ],
    },
    {
      key: 'TRUSTED',
      title: '信任',
      icon: <FiShield size={13} />,
      accent: 'text-emerald-500',
      items: trusted,
      empty: '暂无信任设备',
      actions: (d) => [
        { label: '不信任', icon: <FiXCircle size={11} />, onClick: () => move(d, 'UNTRUSTED'), tone: 'rose' as const },
      ],
    },
    {
      key: 'UNTRUSTED',
      title: '不信任',
      icon: <FiXCircle size={13} />,
      accent: 'text-rose-500',
      items: untrusted,
      empty: '暂无不信任设备',
      actions: (d) => [
        { label: '信任', icon: <FiCheck size={11} />, onClick: () => move(d, 'TRUSTED'), tone: 'accent' as const },
      ],
    },
  ]

  if (loading) {
    return (
      <div id="fingerprints" className="glass rounded-xl p-4 sm:p-6 lg:p-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-24 w-full bg-black/5 dark:bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div id="fingerprints" className="glass rounded-xl p-4 sm:p-6 lg:p-8 scroll-mt-20">
      {confirmDialog}
      <SectionHeader icon={FiSmartphone} title="指纹管理" desc="根据客户端指纹管理设备信任策略：信任设备可跳过两步验证，不信任设备将被拒绝登录" />
      {/* 移动端：三列纵向堆叠、高度自适应；md 及以上：三等分网格 */}
      <div className="grid grid-cols-1 grid-flow-row gap-3 md:gap-4 md:grid-cols-3">
        {columns.map(col => (
          <div key={col.key} className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-2.5 sm:p-3">
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2.5 sm:mb-3 ${col.accent}`}>
              {col.icon}
              {col.title}
              <span className="ml-auto text-gray-500 font-normal">{col.items.length}</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {col.items.length === 0 ? (
                <div className="text-[11px] text-gray-500 text-center py-4">{col.empty}</div>
              ) : (
                col.items.map(d => (
                  <div key={d.id} className={busyId === d.id ? 'opacity-50 pointer-events-none' : ''}>
                    <FingerprintCard
                      device={d}
                      actions={[
                        ...col.actions(d),
                        { label: '删除', icon: <FiTrash2 size={11} />, onClick: () => handleDelete(d), tone: 'gray' as const },
                      ]}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-600 mt-3">
        新设备登录成功后会自动进入「待处理」；在「信任」与「不信任」之间可随时互相移动。
      </p>
    </div>
  )
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('account')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id)
      }
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    })

    const sectionElements = sections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    sectionElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [handleIntersection])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileNavOpen(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 flex gap-6 max-w-6xl mx-auto" ref={mainRef}>
      <div className="flex-1 min-w-0 space-y-6 py-2">
        <AccountSection />
        <PasswordSection />
        <TotpSection />
        <FingerprintsSection />
        <DataSection />
        <PluginSection />
        <BrandSection />
        <FaviconSection />
        <CertificatesSection />
      </div>

      <aside className="hidden lg:block w-48 shrink-0">
        <div className="sticky top-6">
          <nav className="glass rounded-xl p-3 space-y-0.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all duration-200 text-left ${
                  activeSection === id
                    ? 'bg-accent-500/10 text-accent-400 font-medium'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-12 h-12 rounded-full bg-accent-500 hover:bg-accent-600 text-white shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          <FiUser size={18} />
        </button>
        {mobileNavOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 w-48 glass rounded-xl py-2 shadow-xl border border-white/10">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors ${
                    activeSection === id
                      ? 'text-accent-400 bg-accent-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
