import client from './client'
import type { AuthResponse, LoginRequest, UserInfo, RegistrationStatus, GenericResult } from '../types'
import { encryptPassword } from '../utils/crypto'

export async function login(req: LoginRequest): Promise<GenericResult<AuthResponse>> {
  const encryptedPassword = await encryptPassword(req.password)
  const res = await client.post('/auth/login', { username: req.username, encryptedPassword })
  return res.data
}

export async function register(req: LoginRequest & { name?: string; email?: string }): Promise<GenericResult<AuthResponse>> {
  const encryptedPassword = await encryptPassword(req.password)
  const res = await client.post('/auth/register', { username: req.username, encryptedPassword, name: req.name, email: req.email })
  return res.data
}

export async function refreshToken(token: string): Promise<GenericResult<AuthResponse>> {
  const res = await client.post('/auth/refresh', { refreshToken: token })
  return res.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function getMe(): Promise<GenericResult<UserInfo>> {
  const res = await client.get('/auth/me')
  return res.data
}

export async function getRegistrationStatus(): Promise<GenericResult<RegistrationStatus>> {
  const res = await client.get('/auth/registration-status')
  return res.data
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<GenericResult<void>> {
  const [encryptedOldPassword, encryptedNewPassword] = await Promise.all([
    encryptPassword(oldPassword),
    encryptPassword(newPassword),
  ])
  const res = await client.post('/auth/change-password', { encryptedOldPassword, encryptedNewPassword })
  return res.data
}

export async function updateProfile(data: { name?: string; email?: string }): Promise<GenericResult<UserInfo>> {
  const res = await client.post('/auth/update-profile', data)
  return res.data
}

export async function setupTotp(): Promise<GenericResult<{ secret: string; otpauthUri: string }>> {
  const res = await client.post('/auth/totp/setup')
  return res.data
}

export async function verifyTotpSetup(code: string): Promise<GenericResult<void>> {
  const res = await client.post('/auth/totp/verify', { code })
  return res.data
}

export async function disableTotp(): Promise<GenericResult<void>> {
  const res = await client.post('/auth/totp/disable')
  return res.data
}

export async function verifyTotpLogin(totpToken: string, code: string): Promise<GenericResult<AuthResponse>> {
  const res = await client.post('/auth/totp/verify-login', { totpToken, code })
  return res.data
}

export async function heartbeat(): Promise<GenericResult<void>> {
  const res = await client.get('/auth/heartbeat')
  return res.data
}

export async function certStatus(): Promise<GenericResult<{ available: boolean }>> {
  const res = await client.get('/auth/cert-status')
  return res.data
}
