// WebSocket service for real-time chat messaging
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { httpClient } from './httpClient';
import { apiService } from './api';

export interface ChatDto {
  id?: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  message: string;
}

export interface GroupChatDto {
  id?: string;
  groupId: string;
  senderId: string;
  message: string;
  timestamp?: string;
  type?: string;
}

export interface MessageCallback {
  (message: ChatDto): void;
}

export interface GroupMessageCallback {
  (message: GroupChatDto): void;
}

export interface GroupCreateDto {
  groupId: string;
  groupName: string;
  createdBy: string;
  members?: string[];
  groupImage?: string;
  createdAt?: string;
}

export interface GroupCreateCallback {
  (group: GroupCreateDto): void;
}

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private messageCallbacks: MessageCallback[] = [];
  private groupMessageCallbacks: GroupMessageCallback[] = [];
  private groupCreateCallbacks: GroupCreateCallback[] = [];
  private currentUserId: string = '';
  private activeGroupId: string | null = null; // currently open group chat

  constructor() {
    this.client = null;
    this.connected = false;
  }

  // Connect to WebSocket
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentUserId = userId;
      
      // Get authentication token
      const authData = httpClient.getAuthData();
      if (!authData) {
        reject(new Error('No authentication token available'));
        return;
      }
      
      // Create SockJS connection
      const socket = new SockJS('http://localhost:8081/project/myapp/ws/chat');
      
      // Create STOMP client with authentication headers
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${authData.accesstoken}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // Connection success
      this.client.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        this.connected = true;
        
        // Subscribe to receive messages for this user
        this.subscribeToMessages(userId);
        
        resolve();
      };

      // Connection error
      this.client.onStompError = (frame) => {
        console.error('WebSocket Error:', frame.headers['message']);
        console.error('Additional details:', frame.body);
        this.connected = false;
        reject(new Error(frame.headers['message']));
      };

      // Connection closed
      this.client.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      };

      // Activate the client
      this.client.activate();
    });
  }

  // Set the active (open) group chat ID so we can clear notifications when messages arrive
  setActiveGroup(groupId: string | null): void {
    console.log('Setting active group:', groupId);
    this.activeGroupId = groupId;
  }

  // Subscribe to receive messages
  private subscribeToMessages(userId: string) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    // Subscribe to user's private message queue
    this.client.subscribe(`/user/${userId}/queue/chat`, (message) => {
      try {
        const chatDto: ChatDto = JSON.parse(message.body);
        console.log('Received private message:', chatDto);
        
        // Notify all callbacks
        this.messageCallbacks.forEach(callback => callback(chatDto));
      } catch (error) {
        console.error('Error parsing received private message:', error);
      }
    });

    // Subscribe to user's group message queue
    this.client.subscribe(`/user/${userId}/group/message`, async (message) => {
      try {
        const groupChatDto: GroupChatDto = JSON.parse(message.body);
        // console.log('Received group message:', groupChatDto);

        // If the currently open group matches the incoming message group, clear notifications
        console.log('Checking if should clear notification - activeGroupId:', this.activeGroupId, 'messageGroupId:', groupChatDto.groupId);
        if (this.activeGroupId && groupChatDto.groupId === this.activeGroupId) {
          console.log('Clearing notification for group:', groupChatDto.groupId, 'user:', userId);
          try {
            await apiService.clearGroupNotification(groupChatDto.groupId, userId);
            console.log('Successfully cleared notification');
          } catch (err) {
            console.error('Failed to clear group notification:', err);
          }
        }
        
        // Notify all group message callbacks
        this.groupMessageCallbacks.forEach(callback => callback(groupChatDto));
      } catch (error) {
        console.error('Error parsing received group message:', error);
      }
    });

    // Subscribe to group creation events for this user
    this.client.subscribe(`/user/${userId}/group/create`, (message) => {
      try {
        const groupCreateDto: GroupCreateDto = JSON.parse(message.body);
        console.log('Received group create event:', groupCreateDto);
        
        // Notify all group create callbacks
        this.groupCreateCallbacks.forEach(callback => callback(groupCreateDto));
      } catch (error) {
        console.error('Error parsing received group create event:', error);
      }
    });

    // console.log(`Subscribed to /user/${userId}/queue/chat, /user/${userId}/group/message and /user/${userId}/group/create`);
  }

  // Send message to another user
  sendMessage(chatDto: ChatDto): void {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      // Send message to the server
      this.client.publish({
        destination: '/app/send.chat',
        body: JSON.stringify(chatDto)
      });

      console.log('Private message sent:', chatDto);
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  }

  // Send group message
  sendGroupMessage(groupChatDto: GroupChatDto): void {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      // Send group message to the server
      this.client.publish({
        destination: '/app/sendMessage',
        body: JSON.stringify(groupChatDto)
      });

      console.log('Group message sent:', groupChatDto);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  }

  // Add callback for received private messages
  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  // Add callback for received group messages
  onGroupMessage(callback: GroupMessageCallback): void {
    this.groupMessageCallbacks.push(callback);
  }

  // Remove private message callback
  removeMessageCallback(callback: MessageCallback): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  // Remove group message callback
  removeGroupMessageCallback(callback: GroupMessageCallback): void {
    const index = this.groupMessageCallbacks.indexOf(callback);
    if (index > -1) {
      this.groupMessageCallbacks.splice(index, 1);
    }
  }

  // Add callback for group created events
  onGroupCreate(callback: GroupCreateCallback): void {
    this.groupCreateCallbacks.push(callback);
  }

  // Remove callback for group created events
  removeGroupCreateCallback(callback: GroupCreateCallback): void {
    const index = this.groupCreateCallbacks.indexOf(callback);
    if (index > -1) {
      this.groupCreateCallbacks.splice(index, 1);
    }
  }

  // Subscribe to specific chat room for real-time messages
  subscribeToChatRoom(currentUserId: string, otherUserId: string): void {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected, cannot subscribe to chat room');
      return;
    }

    try {
      // Subscribe to chat room topic for real-time messages
      const roomTopic = `/topic/chat/${currentUserId}/${otherUserId}`;
      this.client.subscribe(roomTopic, (message) => {
        try {
          const chatDto: ChatDto = JSON.parse(message.body);
          console.log('Received chat room message:', chatDto);
          
          // Notify all callbacks
          this.messageCallbacks.forEach(callback => callback(chatDto));
        } catch (error) {
          console.error('Error parsing chat room message:', error);
        }
      });

      console.log(`Subscribed to chat room: ${roomTopic}`);
    } catch (error) {
      console.error('Error subscribing to chat room:', error);
    }
  }

  // Subscribe to group chat room
  subscribeToGroupRoom(groupId: string): void {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected, cannot subscribe to group room');
      return;
    }

    try {
      // Subscribe to group topic for real-time messages
      const groupTopic = `/topic/group/${groupId}`;
      this.client.subscribe(groupTopic, (message) => {
        try {
          const groupChatDto: GroupChatDto = JSON.parse(message.body);
          console.log('Received group room message:', groupChatDto);
          
          // Notify all group message callbacks
          this.groupMessageCallbacks.forEach(callback => callback(groupChatDto));
        } catch (error) {
          console.error('Error parsing group room message:', error);
        }
      });

      console.log(`Subscribed to group room: ${groupTopic}`);
    } catch (error) {
      console.error('Error subscribing to group room:', error);
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.messageCallbacks = [];
      this.groupMessageCallbacks = [];
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get current user ID
  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();