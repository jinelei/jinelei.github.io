import { useState, useEffect } from 'react'
import { FiUser, FiKey, FiSave, FiCheck, FiTrash2, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { changePassword, updateProfile, setupTotp, verifyTotpSetup, disableTotp } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

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

  if (user?.totpEnabled) {
    return (
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
    )
  }

  if (step === 'setup') {
    return (
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
    )
  }

  return (
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
  )
}

export default function SettingsAccount() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [nickname, setNickname] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const { user, logout, refreshUser } = useAuth()

  useEffect(() => {
    if (user?.name) setNickname(user.name)
  }, [user?.name])

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-xl p-6 sm:p-8">
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

      <div className="glass rounded-xl p-6 sm:p-8">
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

      <div className="glass rounded-xl p-6 sm:p-8">
        <SectionHeader icon={FiShield} title="两步验证" desc="TOTP 二次验证提高账户安全性" />
        <TotpSection />
      </div>
    </div>
  )
}
