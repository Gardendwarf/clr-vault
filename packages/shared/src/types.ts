// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN';
export type AssetStatus = 'PROCESSING' | 'ACTIVE' | 'ARCHIVED' | 'ERROR';
export type AssetVisibility = 'PUBLIC' | 'PRIVATE';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Asset ───────────────────────────────────────────────────────────────────

export interface AssetDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  storageKey: string;
  contentHash: string;
  status: AssetStatus;
  visibility: AssetVisibility;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnailKey: string | null;
  metadata: Record<string, unknown> | null;
  alt: string | null;
  caption: string | null;
  apiKeyId: string | null;
  tags: TagDto[];
  collections: CollectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetListParams {
  page?: number;
  pageSize?: number;
  status?: AssetStatus;
  visibility?: AssetVisibility;
  mimeType?: string;
  tagId?: string;
  collectionId?: string;
  sort?: 'createdAt' | 'sizeBytes' | 'filename';
  order?: 'asc' | 'desc';
}

export interface AssetUpdateRequest {
  filename?: string;
  alt?: string;
  caption?: string;
  visibility?: AssetVisibility;
  status?: AssetStatus;
}

// ─── Collection ──────────────────────────────────────────────────────────────

export interface CollectionDto {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  path: string;
  assetCount?: number;
  children?: CollectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  slug?: string;
  parentId?: string;
}

export interface UpdateCollectionRequest {
  name?: string;
  slug?: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface TagDto {
  id: string;
  name: string;
  slug: string;
  color: string;
  assetCount?: number;
  createdAt: string;
}

export interface CreateTagRequest {
  name: string;
  slug?: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  slug?: string;
  color?: string;
}

// ─── API Key ─────────────────────────────────────────────────────────────────

export interface ApiKeyDto {
  id: string;
  userId: string;
  name: string;
  appId: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  quotaBytes: string;
  usedBytes: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  rateLimit?: number;
  quotaBytes?: number;
}

export interface ApiKeyCreatedResponse {
  apiKey: ApiKeyDto;
  rawKey: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchParams {
  q?: string;
  type?: string;
  tag?: string;
  collection?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface StorageOverviewDto {
  totalAssets: number;
  totalSizeBytes: string;
  totalCollections: number;
  totalTags: number;
  assetsByStatus: Record<AssetStatus, number>;
  assetsByType: { mimeType: string; count: number; sizeBytes: string }[];
}

export interface BandwidthDataPoint {
  date: string;
  bytesServed: string;
  requests: number;
}

export interface PerAppUsageDto {
  apiKeyId: string;
  appId: string;
  name: string;
  totalRequests: number;
  totalBytesServed: string;
  assetCount: number;
  usedBytes: string;
  quotaBytes: string;
}

export interface TopAssetDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  accessCount: number;
  bytesServed: string;
}

// ─── Transform ───────────────────────────────────────────────────────────────

export interface TransformParams {
  w?: number;
  h?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface PresignedUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
  assetId: string;
}

export interface MultipartInitRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  parts: number;
}

export interface MultipartInitResponse {
  uploadId: string;
  storageKey: string;
  assetId: string;
}

export interface MultipartPartRequest {
  uploadId: string;
  storageKey: string;
  partNumber: number;
}

export interface MultipartPartResponse {
  presignedUrl: string;
}

export interface MultipartCompleteRequest {
  uploadId: string;
  storageKey: string;
  assetId: string;
  parts: { partNumber: number; etag: string }[];
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  apiKeyCount: number;
  createdAt: string;
}

export interface UpdateUserRequest {
  role?: UserRole;
  isActive?: boolean;
  name?: string;
}

export interface QuotaDto {
  apiKeyId: string;
  appId: string;
  name: string;
  quotaBytes: string;
  usedBytes: string;
  rateLimit: number;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export interface UpdateQuotaRequest {
  quotaBytes?: number;
  rateLimit?: number;
}
