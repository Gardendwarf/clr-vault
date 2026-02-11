import type { ApiResponse, ApiSuccess } from '@clr-vault/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('clrvault_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as { success: false; error: { code: string; message: string } };
      const error = new ApiError(
        errorData.error?.message || 'Request failed',
        errorData.error?.code || 'UNKNOWN',
        response.status
      );

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshed = await this.tryRefresh();
        if (!refreshed) {
          localStorage.removeItem('clrvault_access_token');
          localStorage.removeItem('clrvault_refresh_token');
          window.location.href = '/login';
        }
      }

      throw error;
    }

    return (data as ApiSuccess<T>).data;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('clrvault_refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('clrvault_access_token', data.data.tokens.accessToken);
        localStorage.setItem('clrvault_refresh_token', data.data.tokens.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    const token = localStorage.getItem('clrvault_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  getServeUrl(assetId: string): string {
    return `${this.baseUrl}/api/serve/${assetId}`;
  }

  getThumbnailUrl(assetId: string): string {
    return `${this.baseUrl}/api/serve/${assetId}/thumbnail`;
  }

  getTransformUrl(assetId: string, params: Record<string, string | number>): string {
    const url = new URL(`${this.baseUrl}/api/transform/${assetId}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }
}

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const api = new ApiClient(API_URL);
