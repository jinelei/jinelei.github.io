import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiCheck, FiX, FiTrash2, FiPlus } from 'react-icons/fi'
import { listCerts, getCurrentCert, trustCert, deleteCert, type ClientCertResponse, type ParsedCert } from '../api/client-certs'
import { createLogger } from '../utils/logger'

const log = createLogger('ClientCerts')

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleString('zh-CN')
}

function shortFingerprint(fp: string): string {
  if (!fp || fp.length < 16) return fp
  return fp.slice(0, 8) + '…' + fp.slice(-8)
}

export default function ClientCerts() {
  const [certs, setCerts] = useState<ClientCertResponse[]>([])
  const [currentCert, setCurrentCert] = useState<ParsedCert | null>(null)
  const [loading, setLoading] = useState(true)
  const [trusting, setTrusting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    if (!confirm('确定要删除此证书吗？')) return
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
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="h-6 w-40 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <motion.div variants={item} className="glass rounded-xl p-5">
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
      </motion.div>
    </motion.div>
  )
}
