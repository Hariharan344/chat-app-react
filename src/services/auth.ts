import type { User, AuthRequest, AuthResponse, GenericResponse } from '../types/chat';
import { httpClient } from './httpClient';

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Check if user is already logged in (from httpClient)
    this.loadUserFromAuth();
  }

  private loadUserFromAuth() {
    const authData = httpClient.getAuthData();
    if (authData) {
      // Create a basic user object from auth data
      this.currentUser = {
        id: authData.userId,
        name: authData.userName,
        avatar: authData.userName.charAt(0).toUpperCase(),
        status: 'online',
        chatData: {
          id: authData.userId,
          mail: '', // Will be populated when we fetch full user data
          role: authData.role
        }
      };
    }
  }

  async login(mail: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const authRequest: AuthRequest = { mail, password };
      
      // Call the backend login API
      const response = await httpClient.post<GenericResponse<AuthResponse>>(
        '/auth/login',
        authRequest,
        { skipAuth: true } // Skip auth for login endpoint
      );

      if (response.status && response.data) {
        // Store authentication data in httpClient
        httpClient.setAuthData(response.data);
        
        // Create user object from auth response
        this.currentUser = {
          id: response.data.userId,
          name: response.data.userName,
          avatar: response.data.userName.charAt(0).toUpperCase(),
          status: 'online',
          chatData: {
            id: response.data.userId,
            mail: mail, // Use the email from login
            role: response.data.role
          }
        };

        console.log('Login successful:', response.message);
        return { success: true, user: this.currentUser };
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed. Please try again.' 
      };
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const authData = httpClient.getAuthData();
      if (!authData?.refreshtoken) {
        return false;
      }

      const response = await httpClient.post<GenericResponse<AuthResponse>>(
        '/auth/refresh',
        authData.refreshtoken,
        { skipAuth: true }
      );

      if (response.status && response.data) {
        httpClient.setAuthData(response.data);
        
        // Update current user with new data
        this.currentUser = {
          id: response.data.userId,
          name: response.data.userName,
          avatar: response.data.userName.charAt(0).toUpperCase(),
          status: 'online',
          chatData: {
            id: response.data.userId,
            mail: this.currentUser?.chatData.mail || '',
            role: response.data.role
          }
        };

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  logout() {
    this.currentUser = null;
    httpClient.clearAuth();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return httpClient.isAuthenticated() && this.currentUser !== null;
  }

  // Get authentication data
  getAuthData(): AuthResponse | null {
    return httpClient.getAuthData();
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return httpClient.getCurrentUserId();
  }

  // Get current user name
  getCurrentUserName(): string | null {
    return httpClient.getCurrentUserName();
  }

  // Get current user role
  getCurrentUserRole(): string | null {
    return httpClient.getCurrentUserRole();
  }
}

// Create a singleton instance
export const authService = new AuthService();