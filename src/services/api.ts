// API service for backend communication
import type { ApiUser, ChatListResponse, ChatMessagesResponse, GenericResponse } from '../types/chat';
import { httpClient } from './httpClient';

export interface UserResponse {
  user: ApiUser[];
}

// Union type to handle different possible API response formats
type UsersApiResponse = 
  | GenericResponse<UserResponse>  // Expected format: { status: true, data: { user: ApiUser[] } }
  | GenericResponse<ApiUser[]>     // Alternative format: { status: true, data: ApiUser[] }
  | ApiUser[]                      // Direct array format
  | ApiUser;                       // Single user format

export const apiService = {
  // Function to get online/offline status (separate API call as you mentioned)
  async getUserStatus(_userId: string): Promise<'online' | 'offline'> {
    try {
      // This would be a separate API call to get real-time status
      // For now, return a mock status
      return Math.random() > 0.5 ? 'online' : 'offline';
    } catch (error) {
      console.error('Error fetching user status:', error);
      return 'offline';
    }
  },

  async getUsers(): Promise<ApiUser[]> {
    try {
      const result = await httpClient.get<UsersApiResponse>('/user');
      
      // Type guards
      const isValidUser = (obj: any): obj is ApiUser => {
        const isValid = obj && typeof obj === 'object' && obj.id && obj.name && obj.mail;
        console.log('Validating user object:', obj);
        console.log('Has id:', !!obj?.id);
        console.log('Has name:', !!obj?.name);
        console.log('Has mail:', !!obj?.mail);
        console.log('Is valid user:', isValid);
        return isValid;
      };

      const isGenericResponse = (obj: any): obj is GenericResponse<any> => {
        return obj && typeof obj === 'object' && typeof obj.status === 'boolean';
      };

      const hasUserArray = (obj: any): obj is { user: ApiUser[] } => {
        return obj && typeof obj === 'object' && Array.isArray(obj.user);
      };

      // Debug logging
      console.log('API Response:', result);
      console.log('Result type:', typeof result);
      
      // Handle different possible response formats
      console.log('Checking response format...');
      
      // Case 1: Generic response with UserResponse (data.user array)
      if (isGenericResponse(result) && result.status && result.data && hasUserArray(result.data)) {
        console.log('API format detected: GenericResponse<UserResponse>');
        console.log('Result.status:', result.status);
        console.log('Result.data type:', typeof result.data);
        console.log('Result.data.user type:', typeof result.data.user);
        console.log('Is result.data.user an array?', Array.isArray(result.data.user));
        console.log('Result.data.user length:', result.data.user.length);
        return result.data.user;
      }
      
      // Case 2: Generic response with direct ApiUser array
      if (isGenericResponse(result) && result.status && result.data && Array.isArray(result.data)) {
        console.log('API format detected: GenericResponse<ApiUser[]>');
        return result.data;
      }
      
      // Case 3: Generic response with single user
      if (isGenericResponse(result) && result.status && result.data && isValidUser(result.data)) {
        console.log('API format detected: GenericResponse<ApiUser>');
        return [result.data];
      }
      
      // Case 4: Direct array of users
      if (Array.isArray(result)) {
        console.log('Direct array response detected');
        return result;
      }
      
      // Case 5: Direct single user object
      if (isValidUser(result)) {
        console.log('Direct single user object detected');
        return [result];
      }
      
      // If none of the above cases match, throw error
      console.error('API returned unrecognized format:', result);
      throw new Error('API returned invalid data format - expected array or user object');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get chat list for a user
  async getChatLists(userId: string): Promise<ChatListResponse> {
    try {
      const result = await httpClient.get<any>(`/chat/getChatLists/${userId}`);
      
      console.log('Chat lists API Response:', result);
      
      // Handle the actual API response format
      if (result.status && result.data && result.data.chatList) {
        return result.data.chatList;
      }
      
      // Fallback: Direct response
      if (result.id && result.userId && result.chatlists) {
        return result;
      }
      
      throw new Error('API returned invalid chat list format');
    } catch (error) {
      console.error('Error fetching chat lists:', error);
      throw error;
    }
  },

  // Get chat messages between users
  async getChatMessages(userId: string, otherUserId: string): Promise<ChatMessagesResponse> {
    try {
      const result = await httpClient.get<any>(`/chat/get.chats?senderId=${userId}&receiverId=${otherUserId}`);
      
      console.log('Chat messages API Response:', result);
      
      // Handle different possible response formats
      if (result.status && result.data) {
        return result.data;
      }
      
      // Direct response
      if (Array.isArray(result)) {
        return {
          messages: result,
          totalCount: result.length
        };
      }
      
      throw new Error('API returned invalid chat messages format');
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }
};