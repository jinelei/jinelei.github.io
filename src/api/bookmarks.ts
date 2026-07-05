import client from './client';
import type {
  BatchBookmarkRequest,
  BookmarkRequest,
  BookmarkResponse,
  BookmarkSearchParams,
  GenericResult,
  PageResponse,
} from '../types';

export async function searchBookmarks(
  params: BookmarkSearchParams,
): Promise<GenericResult<PageResponse<BookmarkResponse>>> {
  const res = await client.get('/bookmarks', { params });
  return res.data;
}

export async function getBookmark(
  id: number,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.get(`/bookmarks/${id}`);
  return res.data;
}

export async function createBookmark(
  req: BookmarkRequest,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.post('/bookmarks', req);
  return res.data;
}

export async function updateBookmark(
  id: number,
  req: BookmarkRequest,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.put(`/bookmarks/${id}`, req);
  return res.data;
}

export async function deleteBookmark(id: number): Promise<void> {
  await client.delete(`/bookmarks/${id}`);
}

export async function togglePin(
  id: number,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.patch(`/bookmarks/${id}/pin`);
  return res.data;
}

export async function recordClick(
  id: number,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.post(`/bookmarks/${id}/click`);
  return res.data;
}

export async function batchUpdateBookmarks(
  req: BatchBookmarkRequest,
): Promise<GenericResult<void>> {
  const res = await client.patch('/bookmarks/batch', req);
  return res.data;
}

export async function refreshFavicon(
  id: number,
): Promise<GenericResult<BookmarkResponse>> {
  const res = await client.post(`/bookmarks/${id}/refresh-favicon`);
  return res.data;
}

export async function batchRefreshFavicons(): Promise<GenericResult<number>> {
  const res = await client.post('/bookmarks/batch/refresh-favicons');
  return res.data;
}
