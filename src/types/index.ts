export interface GenericResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  totalDistinctCategories?: number;
  totalDistinctTags?: number;
}

export interface BatchBookmarkRequest {
  ids: number[];
  categoryId?: number | null;
  addTagIds?: number[];
  removeTagIds?: number[];
}

export interface BookmarkRequest {
  title: string;
  url: string;
  description?: string;
  categoryId?: number;
  tagIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BookmarkResponse {
  id: number;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  pinned: boolean;
  clickCount: number;
  category: CategoryBrief | null;
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  parentId?: number;
  sortOrder?: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  sortOrder: number;
  children: CategoryResponse[];
}

export interface CategoryBrief {
  id: number;
  name: string;
}

export interface TagRequest {
  name: string;
}

export interface TagResponse {
  id: number;
  name: string;
}

export interface TagStatsResponse {
  id: number;
  name: string;
  count: number;
}

export interface CategoryStatsResponse {
  id: number;
  name: string;
  count: number;
}

export interface BookmarkSearchParams {
  keyword?: string;
  categoryIds?: number[];
  tagIds?: number[];
  pinned?: boolean;
  page?: number;
  size?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
  totpRequired?: boolean;
  totpToken?: string;
}

export interface RegistrationStatus {
  allowRegistration: boolean;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  totpEnabled?: boolean;
}

export interface CreateApiTokenRequest {
  name: string;
  expiresIn?: string;
}

export interface ApiTokenResponse {
  id: number;
  name: string;
  token?: string;
  tokenPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ExternalLinkRequest {
  name: string;
  url: string;
  icon?: string;
  sortOrder?: number;
}

export interface ExternalLinkResponse {
  id: number;
  name: string;
  url: string;
  icon: string | null;
  sortOrder: number | null;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
}

export interface DiskInfo {
  name: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryBytes: number;
  state: string;
  user: string;
}

export interface SystemStats {
  bootTime: number;
  uptime: number;
  cpuCores: number;
  cpuUsage: number;
  cpuPerCore: number[];
  jvmTotalMemory: number;
  jvmUsedMemory: number;
  jvmMaxMemory: number;
  physicalMemory: MemoryInfo;
  swapMemory: MemoryInfo;
  fileSystems: DiskInfo[];
  physicalDisks: DiskInfo[];
  loadAverage: number[];
  processes: ProcessInfo[];
}

export interface ServiceConfigRequest {
  name: string;
  statusScript?: string;
  statusArgs?: string;
  startScript?: string;
  startArgs?: string;
  stopScript?: string;
  stopArgs?: string;
  restartScript?: string;
  restartArgs?: string;
  logScript?: string;
  logArgs?: string;
  description?: string;
  sortOrder?: number;
}

export interface ServiceConfigResponse {
  id: number;
  name: string;
  statusScript: string | null;
  statusArgs: string | null;
  startScript: string | null;
  startArgs: string | null;
  stopScript: string | null;
  stopArgs: string | null;
  restartScript: string | null;
  restartArgs: string | null;
  logScript: string | null;
  logArgs: string | null;
  description: string | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptExecuteResponse {
  output: string;
  exitCode: number;
}

export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
}

