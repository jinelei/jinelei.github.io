import client from './client';
import type {
  CategoryRequest,
  CategoryResponse,
  CategoryStatsResponse,
  GenericResult,
} from '../types';

export async function getCategoryTree(): Promise<
  GenericResult<CategoryResponse[]>
> {
  const res = await client.get('/categories');
  return res.data;
}

export async function getCategoryStats(): Promise<
  GenericResult<CategoryStatsResponse[]>
> {
  const res = await client.get('/categories/stats');
  return res.data;
}

export async function createCategory(
  req: CategoryRequest,
): Promise<GenericResult<CategoryResponse>> {
  const res = await client.post('/categories', req);
  return res.data;
}

export async function updateCategory(
  id: number,
  req: CategoryRequest,
): Promise<GenericResult<CategoryResponse>> {
  const res = await client.put(`/categories/${id}`, req);
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`);
}

export async function mergeCategories(sourceId: number, targetId: number): Promise<GenericResult<number>> {
  const res = await client.patch('/categories/merge', { sourceId, targetId });
  return res.data;
}
