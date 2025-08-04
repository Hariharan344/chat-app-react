// WebSocket service for real-time chat messaging
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { httpClient } from './httpClient';

export interface ChatDto {
  id?: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  message: string;
}

export interface MessageCallback {
  (message: ChatDto): void;
}

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private messageCallbacks: MessageCallback[] = [];
  private currentUserId: string = '';

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

  // Subscribe to receive messages
  private subscribeToMessages(userId: string) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    // Subscribe to user's message queue
    this.client.subscribe(`/user/${userId}/queue/chat`, (message) => {
      try {
        const chatDto: ChatDto = JSON.parse(message.body);
        console.log('Received message:', chatDto);
        
        // Notify all callbacks
        this.messageCallbacks.forEach(callback => callback(chatDto));
      } catch (error) {
        console.error('Error parsing received message:', error);
      }
    });

    console.log(`Subscribed to /user/${userId}/queue/chat`);
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

      console.log('Message sent:', chatDto);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Add callback for received messages
  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  // Remove callback
  removeMessageCallback(callback: MessageCallback): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.messageCallbacks = [];
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