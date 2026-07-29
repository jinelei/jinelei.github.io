import client from './client';
import type { GenericResult, PageResponse, MomentRequest, MomentResponse, DailyCount } from '../types';
import { API_BASE_URL } from '../config';

export async function getMomentList(page = 0, size = 20, date?: string): Promise<GenericResult<PageResponse<MomentResponse>>> {
  const params: Record<string, unknown> = { page, size };
  if (date) params.date = date;
  const res = await client.get('/moments', { params });
  return res.data;
}

export async function createMoment(req: MomentRequest): Promise<GenericResult<MomentResponse>> {
  const res = await client.post('/moments', req);
  return res.data;
}

export async function uploadMomentFile(
  file: File,
  terminalType: string,
  isLocked: boolean,
  displayContent?: string,
): Promise<GenericResult<MomentResponse>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('terminalType', terminalType);
  formData.append('isLocked', String(isLocked));
  if (displayContent) formData.append('displayContent', displayContent);
  const res = await client.post('/moments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateMoment(id: number, req: MomentRequest): Promise<GenericResult<MomentResponse>> {
  const res = await client.put(`/moments/${id}`, req);
  return res.data;
}

export async function toggleLock(id: number, isLocked: boolean, displayContent?: string): Promise<GenericResult<MomentResponse>> {
  const res = await client.put(`/moments/${id}/lock`, { isLocked, displayContent });
  return res.data;
}

export async function deleteMoment(id: number): Promise<void> {
  await client.delete(`/moments/${id}`);
}

export async function deleteAllMoments(): Promise<void> {
  await client.delete('/moments');
}

export function getMomentFileUrl(id: number): string {
  return `${API_BASE_URL}/moments/${id}/file`;
}

export async function getFileBlob(id: number): Promise<Blob> {
  const res = await client.get(`/moments/${id}/file`, { responseType: 'blob' });
  return res.data;
}

export async function downloadFile(id: number): Promise<void> {
  const blob = await getFileBlob(id);
  const res = await client.get(`/moments/${id}`);
  const fileName = res.data.data.fileName || 'file';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getCalendarStats(year: number): Promise<GenericResult<DailyCount[]>> {
  const res = await client.get('/moments/stats/calendar', { params: { year } });
  return res.data;
}

export function getMomentDownloadUrl(id: number): string {
  return `${API_BASE_URL}/moments/${id}/download`;
}
