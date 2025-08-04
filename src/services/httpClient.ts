// HTTP client with automatic authentication token injection
import type { AuthResponse, GenericResponse } from '../types/chat';

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean; // Skip adding auth token for login/refresh endpoints
}

class HttpClient {
  private baseURL: string;
  private authData: AuthResponse | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadAuthFromStorage();
  }

  // Load authentication data from localStorage
  private loadAuthFromStorage(): void {
    try {
      const storedAuth = localStorage.getItem('authData');
      if (storedAuth) {
        this.authData = JSON.parse(storedAuth);
      }
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearAuthData();
    }
  }

  // Save authentication data to localStorage
  private saveAuthToStorage(authData: AuthResponse): void {
    try {
      localStorage.setItem('authData', JSON.stringify(authData));
      this.authData = authData;
    } catch (error) {
      console.error('Error saving auth data to storage:', error);
    }
  }

  // Clear authentication data
  private clearAuthData(): void {
    localStorage.removeItem('authData');
    this.authData = null;
  }

  // Set authentication data after login
  setAuthData(authData: AuthResponse): void {
    this.saveAuthToStorage(authData);
  }

  // Get current authentication data
  getAuthData(): AuthResponse | null {
    return this.authData;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authData !== null && this.authData.accesstoken !== '';
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.authData?.userId || null;
  }

  // Get current user name
  getCurrentUserName(): string | null {
    return this.authData?.userName || null;
  }

  // Get current user role
  getCurrentUserRole(): string | null {
    return this.authData?.role || null;
  }

  // Clear authentication (logout)
  clearAuth(): void {
    this.clearAuthData();
  }

  // Make HTTP request with automatic token injection
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipAuth = false, ...requestConfig } = config;
    
    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestConfig.headers as Record<string, string>),
    };

    // Add authorization header if not skipping auth and token exists
    if (!skipAuth && this.authData?.accesstoken) {
      headers['Authorization'] = `Bearer ${this.authData.accesstoken}`;
    }

    try {
      const response = await fetch(url, {
        ...requestConfig,
        headers: headers as HeadersInit,
      });

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && !skipAuth) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.authData!.accesstoken}`;
          const retryResponse = await fetch(url, {
            ...requestConfig,
            headers: headers as HeadersInit,
          });
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        } else {
          // Refresh failed, clear auth and throw error
          this.clearAuth();
          throw new Error('Authentication failed. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`HTTP request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods for different HTTP verbs
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Refresh access token using refresh token
  private async refreshToken(): Promise<boolean> {
    if (!this.authData?.refreshtoken) {
      return false;
    }

    try {
      const response = await this.post<GenericResponse<AuthResponse>>(
        '/auth/refresh',
        this.authData.refreshtoken,
        { skipAuth: true }
      );

      if (response.status && response.data) {
        this.setAuthData(response.data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const httpClient = new HttpClient('http://localhost:8081/project/myapp');