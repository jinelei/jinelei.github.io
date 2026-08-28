import client from './client'
import type { GenericResult } from '../types'

export type DeviceTrustStatus = 'PENDING' | 'TRUSTED' | 'UNTRUSTED'

export interface DeviceFingerprintResponse {
  id: number
  userId: number
  fingerprintSha256: string
  trustStatus: DeviceTrustStatus
  userAgent: string | null
  platform: string | null
  language: string | null
  timezone: string | null
  screenResolution: string | null
  colorDepth: string | null
  cpuCores: string | null
  deviceMemory: string | null
  hardwareConcurrency: string | null
  timezoneOffset: string | null
  touchSupport: string | null
  webglVendor: string | null
  webglRenderer: string | null
  lastIp: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginCheckResult {
  totpRequired: boolean
  trustStatus: string
  trusted: boolean
  blocked: boolean
}

export async function loginCheck(username: string, fingerprint: Record<string, string>): Promise<GenericResult<LoginCheckResult>> {
  const res = await client.post('/auth/login-check', { username, fingerprint })
  return res.data
}

export async function listDeviceFingerprints(): Promise<GenericResult<DeviceFingerprintResponse[]>> {
  const res = await client.get('/device-fingerprints')
  return res.data
}

export async function updateDeviceFingerprintStatus(id: number, status: DeviceTrustStatus): Promise<GenericResult<DeviceFingerprintResponse>> {
  const res = await client.put(`/device-fingerprints/${id}/status`, { status })
  return res.data
}

export async function deleteDeviceFingerprint(id: number): Promise<void> {
  await client.delete(`/device-fingerprints/${id}`)
}
