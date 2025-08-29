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
  name: string;
  mail?: string;
  role?: string;
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
  email?: string; // Email for contact search
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
  status: string | null;
  date: string;
  time: string;
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
  mustChangePassword: boolean;
}

// Password reset (first login) request payload
export interface ResetPasswordRequest {
  username: string;
  oldpassword: string;
  newpassword: string;
  confirmpassword: string;
}

export interface GenericResponse<T> {
  status: boolean;
  message: string;
  errorType?: string;
  data: T;
}

// Group Chat Types
export interface GroupDetails {
  groupName: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageBy: string;
  unreadCount: number;
  groupImage: string;
  createdBy: string;
}

export interface GroupChatListDto {
  id: string;
  UserId: string;
  groupsDet: Record<string, GroupDetails>; // Map with group IDs as keys
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  message: string;
  timestamp: Date;
  type: string;
}

export interface GroupMessagesResponse {
  messages: GroupMessage[];
  totalCount: number;
}

export interface GroupChat {
  id: string;
  name: string;
  image: string;
  participants: User[];
  messages: GroupMessage[];
  lastMessage?: GroupMessage;
  unreadCount: number;
  createdBy: string;
  createdAt?: Date;
}

// WebSocket DTO for group messages
export interface GroupChatDto {
  id?: string;
  groupId: string;
  senderId: string;
  message: string;
  timestamp?: string;
  type?: string;
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
      name: apiUser.name,
      mail: apiUser.mail,
      role: apiUser.role
    },
    fullData: apiUser
  };
};