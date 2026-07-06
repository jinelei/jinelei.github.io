import client from './client'
import type { GenericResult, SystemStats } from '../types'

export async function getSystemStats(): Promise<GenericResult<SystemStats>> {
  const res = await client.get('/system/stats')
  return res.data
}
