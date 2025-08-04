// Full user data from API
export interface ApiUser {
  id: string;
  name: string;
  mail: string;
  password: string;
  role: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

// Chat-specific user data (minimal data needed for chat)
export interface ChatUser {
  id: string;
  mail: string;
  role: string;
}

// User interface for UI display
export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  // Store chat-specific data
  chatData: ChatUser;
  // Store full data for other features
  fullData?: ApiUser;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Contact extends User {
  isOnline: boolean;
}

// Chat list types based on your backend structure
export interface ChatListDet {
  lastMsg: string;
  unreadcount: number;
  timestamp: string; // LocalDateTime from backend
  time: string;
}

export interface ChatListResponse {
  id: string;
  userId: string;
  chatlists: Record<string, ChatListDet>; // Map with user IDs as keys
  totalUnreadCount: number;
}

// Chat message types for API
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  roomId?: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  totalCount: number;
}

// Authentication types
export interface AuthRequest {
  mail: string;
  password: string;
}

export interface AuthResponse {
  accesstoken: string;
  refreshtoken: string;
  userName: string;
  userId: string;
  role: string;
}

export interface GenericResponse<T> {
  status: boolean;
  message: string;
  errorType?: string;
  data: T;
}

// Utility function to convert API user to app User
export const convertApiUserToUser = (apiUser: ApiUser, onlineStatus?: 'online' | 'offline'): User => {
  // Get first letter of name for avatar
  const firstLetter = apiUser.name.charAt(0).toUpperCase();
  
  // Use provided online status or default to offline (since online/offline comes from separate API)
  const status = onlineStatus || 'offline';
  
  return {
    id: apiUser.id,
    name: apiUser.name,
    avatar: firstLetter, // Just store the first letter
    status: status,
    lastSeen: status !== 'online' ? 'Last seen recently' : undefined,
    chatData: {
      id: apiUser.id,
      mail: apiUser.mail,
      role: apiUser.role
    },
    fullData: apiUser
  };
};