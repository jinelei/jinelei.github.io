import client from './client';
import type { GenericResult, ServiceConfigRequest, ServiceConfigResponse, ScriptExecuteResponse } from '../types';

export async function getServiceConfigs(): Promise<GenericResult<ServiceConfigResponse[]>> {
  const res = await client.get('/system-services');
  return res.data;
}

export async function getServiceConfig(id: number): Promise<GenericResult<ServiceConfigResponse>> {
  const res = await client.get(`/system-services/${id}`);
  return res.data;
}

export async function createServiceConfig(req: ServiceConfigRequest): Promise<GenericResult<ServiceConfigResponse>> {
  const res = await client.post('/system-services', req);
  return res.data;
}

export async function updateServiceConfig(id: number, req: ServiceConfigRequest): Promise<GenericResult<ServiceConfigResponse>> {
  const res = await client.put(`/system-services/${id}`, req);
  return res.data;
}

export async function deleteServiceConfig(id: number): Promise<void> {
  await client.delete(`/system-services/${id}`);
}

export async function executeStatus(id: number): Promise<GenericResult<ScriptExecuteResponse>> {
  const res = await client.post(`/system-services/${id}/status`);
  return res.data;
}

export async function executeStart(id: number): Promise<GenericResult<ScriptExecuteResponse>> {
  const res = await client.post(`/system-services/${id}/start`);
  return res.data;
}

export async function executeStop(id: number): Promise<GenericResult<ScriptExecuteResponse>> {
  const res = await client.post(`/system-services/${id}/stop`);
  return res.data;
}

export async function executeRestart(id: number): Promise<GenericResult<ScriptExecuteResponse>> {
  const res = await client.post(`/system-services/${id}/restart`);
  return res.data;
}

export async function executeLog(id: number): Promise<GenericResult<ScriptExecuteResponse>> {
  const res = await client.post(`/system-services/${id}/log`);
  return res.data;
}
