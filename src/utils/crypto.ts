import { createLogger } from './logger'

const log = createLogger('crypto')

let cachedPublicKey: CryptoKey | null = null
let publicKeyBase64: string | null = null
const ALGORITHM = { name: 'RSA-OAEP', hash: 'SHA-256' }

async function fetchPublicKey(): Promise<void> {
  const res = await fetch('https://jinelei.asia/api/auth/public-key')
  if (!res.ok) throw new Error('获取加密密钥失败')
  const json = await res.json()
  publicKeyBase64 = json.data.key as string
  log.debug('Public key fetched')
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey
  await fetchPublicKey()
  const binaryDer = Uint8Array.from(atob(publicKeyBase64!), c => c.charCodeAt(0))
  cachedPublicKey = await crypto.subtle.importKey('spki', binaryDer.buffer, ALGORITHM, false, ['encrypt'])
  log.debug('Public key imported')
  return cachedPublicKey
}

export async function encryptPassword(password: string): Promise<string> {
  const publicKey = await getPublicKey()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(password),
  )
  const bytes = new Uint8Array(encrypted)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
