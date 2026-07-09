import client from './client'
import type { GenericResult, SystemStats } from '../types'

export async function getSystemStats(): Promise<GenericResult<SystemStats>> {
  const res = await client.get('/system/stats')
  return res.data
}

export async function getSystemUptime(): Promise<GenericResult<{ bootTime: number; uptime: number }>> {
  const res = await client.get('/system/stats/uptime')
  return res.data
}

export async function getSystemLoad(): Promise<GenericResult<{ cpuCores: number; loadAverage1: number; loadAverage5: number; loadAverage15: number }>> {
  const res = await client.get('/system/stats/load')
  return res.data
}

export async function getSystemCpu(): Promise<GenericResult<{ cpuCores: number; totalCpuLoad: number; cpuPerCore: number[] }>> {
  const res = await client.get('/system/stats/cpu')
  return res.data
}

export async function getSystemMemory(): Promise<GenericResult<{
  physicalTotal: number; physicalUsed: number; physicalFree: number;
  swapTotal: number; swapUsed: number; swapFree: number;
  jvmTotal: number; jvmUsed: number; jvmMax: number;
}>> {
  const res = await client.get('/system/stats/memory')
  return res.data
}

export async function getSystemDisk(): Promise<GenericResult<{
  fileSystems: { name: string; total: number; used: number; free: number; usage: number }[];
  physicalDisks: { name: string; total: number; used: number; free: number; usage: number }[];
}>> {
  const res = await client.get('/system/stats/disk')
  return res.data
}

export async function getSystemProcesses(): Promise<GenericResult<SystemStats['processes']>> {
  const res = await client.get('/system/stats/processes')
  return res.data
}
