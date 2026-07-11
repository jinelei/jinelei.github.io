import client from './client'
import type { GenericResult } from '../types'

export interface ParsedCert {
  serialNumber: string
  subjectDn: string
  fingerprintSha256: string
}

export interface ClientCertResponse {
  id: number
  userId: number | null
  serialNumber: string
  subjectDn: string
  fingerprintSha256: string
  allowedTimeStart: string | null
  allowedTimeEnd: string | null
  allowedDays: string | null
  bypassAuth: boolean
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ClientCertRequest {
  serialNumber: string
  subjectDn: string
  fingerprintSha256: string
  userId?: number | null
  allowedTimeStart?: string | null
  allowedTimeEnd?: string | null
  allowedDays?: string | null
  bypassAuth?: boolean
  description?: string | null
  isActive?: boolean
}

export async function listCerts(): Promise<GenericResult<ClientCertResponse[]>> {
  const res = await client.get('/client-certificates')
  return res.data
}

export async function getCurrentCert(): Promise<GenericResult<ParsedCert | null>> {
  const res = await client.get('/client-certificates/current')
  return res.data
}

export async function trustCert(): Promise<GenericResult<ClientCertResponse>> {
  const res = await client.post('/client-certificates/trust')
  return res.data
}

export async function createCert(data: ClientCertRequest): Promise<GenericResult<ClientCertResponse>> {
  const res = await client.post('/client-certificates', data)
  return res.data
}

export async function updateCert(id: number, data: ClientCertRequest): Promise<GenericResult<ClientCertResponse>> {
  const res = await client.put(`/client-certificates/${id}`, data)
  return res.data
}

export async function deleteCert(id: number): Promise<void> {
  await client.delete(`/client-certificates/${id}`)
}
