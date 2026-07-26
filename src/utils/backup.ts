import client from '../api/client'
import toast from 'react-hot-toast'

export async function exportBackup() {
  try {
    const response = await client.get('/backup/export', {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const disposition = response.headers['content-disposition']
    let filename = `scalefish-backup-${new Date().toISOString().slice(0, 10)}.zip`
    if (disposition) {
      const match = disposition.match(/filename="?(.+?)"?$/)
      if (match) filename = match[1]
    }
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('备份导出成功')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '导出失败'
    toast.error(msg)
  }
}

export async function importBackup(file: File) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post('/backup/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    toast.success(res.data?.message || '导入成功')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '导入失败'
    toast.error(msg)
  }
}
