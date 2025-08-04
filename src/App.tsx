import { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/components/Login.css';
import NavigationSidebar from './components/NavigationSidebar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Login from './components/Login';
import { authService } from './services/auth';
import { apiService } from './services/api';
import { webSocketService, type ChatDto } from './services/websocket';
import type { Chat, Message, Contact, ApiUser, User, ChatListResponse, ChatMessagesResponse } from './types/chat';
import { convertApiUserToUser } from './types/chat';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<'chats' | 'contacts' | 'calls' | 'settings'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined); // No chat selected initially
  const [chatList, setChatList] = useState<Chat[]>([]); // Start with empty chat list
  const [apiUsers, setApiUsers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set()); // Track which chats have loaded messages

  const selectedChat = chatList.find(chat => chat.id === selectedChatId);
  
  // Load chat messages when a chat is selected
  useEffect(() => {
    if (!selectedChatId || !currentUser || !wsConnected) return;

    const loadChatMessages = async () => {
      try {
        const chat = chatList.find(c => c.id === selectedChatId);
        if (!chat) return;

        // Skip loading if messages are already loaded for this chat
        if (loadedChats.has(selectedChatId)) {
          console.log('Messages already loaded for chat:', selectedChatId);
          
          // Still subscribe to chat room for real-time messages
          const otherUser = chat.participants.find(p => p.id !== currentUser.id);
          if (otherUser) {
            webSocketService.subscribeToChatRoom(currentUser.id, otherUser.id);
          }
          return;
        }

        // Find the other user in the chat
        const otherUser = chat.participants.find(p => p.id !== currentUser.id);
        if (!otherUser) return;

        console.log('Loading chat messages between', currentUser.id, 'and', otherUser.id);

        // Load messages from API
        const messagesData = await apiService.getChatMessages(currentUser.id, otherUser.id);
        
        // Convert API messages to Message objects
        const messages: Message[] = messagesData.messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.message,
          timestamp: new Date(msg.timestamp),
          type: 'text'
        }));

        // Update the chat with loaded messages
        setChatList(prevChats => 
          prevChats.map(c => {
            if (c.id === selectedChatId) {
              return {
                ...c,
                messages: messages
              };
            }
            return c;
          })
        );

        // Subscribe to specific chat room for real-time messages
        webSocketService.subscribeToChatRoom(currentUser.id, otherUser.id);
        
        // Mark this chat as loaded
        setLoadedChats(prev => new Set(prev).add(selectedChatId));
        
        console.log('Loaded chat messages:', messages);
      } catch (err) {
        console.error('Error loading chat messages:', err);
      }
    };

    loadChatMessages();
  }, [selectedChatId, currentUser, wsConnected]); // Removed chatList from dependencies
  
  // Check authentication on app load
  useEffect(() => {
    const user = authService.getCurrentUser();
    const isLoggedIn = authService.isLoggedIn();
    
    if (isLoggedIn && user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setChatList([]);
    setApiUsers([]);
    setSelectedChatId(undefined);
    setLoadedChats(new Set()); // Clear loaded chats tracking
    webSocketService.disconnect();
    setWsConnected(false);
  };
  
  // Debug: Log selected chat info
  useEffect(() => {
    if (selectedChat) {
      console.log('Selected chat participants:', selectedChat.participants.map(p => ({ id: p.id, name: p.name })));
    }
  }, [selectedChat]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const connectWebSocket = async () => {
      try {
        console.log('Connecting to WebSocket with user ID:', currentUser.id);
        await webSocketService.connect(currentUser.id);
        setWsConnected(true);
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
      setWsConnected(false);
    };
  }, [isAuthenticated, currentUser]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    const handleIncomingMessage = (chatDto: ChatDto) => {
      console.log('Received WebSocket message:', chatDto);
      
      // Convert ChatDto to Message
      const newMessage: Message = {
        id: chatDto.id || `msg-${Date.now()}`,
        senderId: chatDto.senderId,
        content: chatDto.message,
        timestamp: new Date(),
        type: 'text'
      };

      // Find or create chat with the sender
      const senderId = chatDto.senderId;
      const sender = apiUsers.find(user => user.id === senderId);
      
      if (!sender) {
        console.error('Sender not found in contacts:', senderId);
        return;
      }

      setChatList(prevChats => {
        // Check if chat already exists
        const existingChatIndex = prevChats.findIndex(chat => 
          chat.participants.some(p => p.id === senderId)
        );

        if (existingChatIndex >= 0) {
          // Update existing chat
          const updatedChats = [...prevChats];
          const existingChat = updatedChats[existingChatIndex];
          
          // Only increment unread count if this chat is not currently selected
          const isCurrentChat = selectedChatId === existingChat.id;
          
          updatedChats[existingChatIndex] = {
            ...existingChat,
            messages: [...existingChat.messages, newMessage],
            lastMessage: newMessage,
            unreadCount: isCurrentChat ? existingChat.unreadCount : existingChat.unreadCount + 1
          };
          
          // Move the updated chat to the top of the list
          const updatedChat = updatedChats.splice(existingChatIndex, 1)[0];
          return [updatedChat, ...updatedChats];
        } else {
          // Create new chat
          const newChat: Chat = {
            id: `chat-${senderId}`,
            participants: [currentUser!, sender],
            messages: [newMessage],
            lastMessage: newMessage,
            unreadCount: 1
          };
          return [newChat, ...prevChats];
        }
      });
    };

    // Subscribe to incoming messages
    webSocketService.onMessage(handleIncomingMessage);

    // Cleanup
    return () => {
      webSocketService.removeMessageCallback(handleIncomingMessage);
    };
  }, [apiUsers, currentUser, selectedChatId]);

  // Load contacts from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const loadContacts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get users from API
        const apiUsers = await apiService.getUsers();
        
        // Filter out current user and convert to contacts
        const otherUsers = apiUsers.filter(user => user.id !== currentUser.id);
        
        const convertedUsers: Contact[] = await Promise.all(
          otherUsers.map(async (user) => {
            // Get online status for each user
            const status = await apiService.getUserStatus(user.id);
            const convertedUser = convertApiUserToUser(user, status);
            return {
              ...convertedUser,
              isOnline: status === 'online'
            };
          })
        );
        
        setApiUsers(convertedUsers);
        console.log('Loaded contacts from API:', convertedUsers);
        console.log('Contact IDs:', convertedUsers.map(u => ({ id: u.id, name: u.name })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
        console.error('Error loading contacts:', err);
        setApiUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [isAuthenticated, currentUser]);

  // Load chat lists from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const loadChatLists = async () => {
      try {
        const chatListData = await apiService.getChatLists(currentUser.id);
        console.log('Loaded chat lists:', chatListData);
        
        // Convert chat list data to Chat objects
        const chats: Chat[] = [];
        
        for (const [userId, chatDet] of Object.entries(chatListData.chatlists)) {
          // Find the user in contacts by matching user ID
          const user = apiUsers.find(u => u.id === userId);
          if (user) {
            // Parse timestamp - handle both timestamp and time fields
            let messageTimestamp = new Date();
            if (chatDet.timestamp) {
              messageTimestamp = new Date(chatDet.timestamp);
            } else if (chatDet.time) {
              // Parse the time string format: "Thu Jul 31 19:42:06 IST 2025"
              messageTimestamp = new Date(chatDet.time);
            }

            const chat: Chat = {
              id: `chat-${userId}`,
              participants: [currentUser, user],
              messages: [], // Messages will be loaded when chat is opened
              lastMessage: chatDet.lastMsg ? {
                id: `last-${userId}`,
                senderId: userId, // Assuming last message is from the other user
                content: chatDet.lastMsg,
                timestamp: messageTimestamp,
                type: 'text'
              } : undefined,
              unreadCount: chatDet.unreadcount || 0
            };
            chats.push(chat);
          } else {
            console.warn(`User with ID ${userId} not found in contacts list`);
          }
        }
        
        // Sort chats by last message timestamp (most recent first)
        chats.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
        });
        
        setChatList(chats);
        console.log('Converted chat lists to chats:', chats);
      } catch (err) {
        console.error('Error loading chat lists:', err);
        // Don't show error to user, just log it
      }
    };

    // Only load chat lists after contacts are loaded
    if (apiUsers.length > 0) {
      loadChatLists();
    }
  }, [isAuthenticated, currentUser, apiUsers]);

  // Handle user selection from contacts - create or find existing chat
  const handleUserSelect = (userId: string) => {
    // Find if chat already exists with this user
    const existingChat = chatList.find(chat => 
      chat.participants.some(participant => participant.id === userId)
    );

    if (existingChat) {
      // Switch to existing chat and mark as read
      setSelectedChatId(existingChat.id);
      setActiveSection('chats');
      markChatAsRead(existingChat.id);
    } else {
      // Create new chat
      const selectedUser = apiUsers.find(user => user.id === userId);
      if (selectedUser) {
        const newChat: Chat = {
          id: `chat-${Date.now()}`,
          participants: [currentUser!, selectedUser],
          messages: [],
          unreadCount: 0
        };
        
        setChatList(prevChats => [...prevChats, newChat]);
        setSelectedChatId(newChat.id);
        setActiveSection('chats');
      }
    }
  };

  // Mark chat as read (reset unread count)
  const markChatAsRead = (chatId: string) => {
    setChatList(prevChats => 
      prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            unreadCount: 0
          };
        }
        return chat;
      })
    );
  };

  // Function to start a chat with a contact
  const handleStartChat = (contact: Contact) => {
    console.log('Starting chat with contact:', contact.name, 'ID:', contact.id);
    console.log('Current chat list:', chatList.map(c => ({ 
      id: c.id, 
      participants: c.participants.map(p => ({ id: p.id, name: p.name })) 
    })));
    
    // Check if chat already exists
    const existingChat = chatList.find(chat => 
      chat.participants.some(p => p.id === contact.id)
    );
    
    console.log('Existing chat found:', !!existingChat);

    if (existingChat) {
      // If chat exists, move it to top, select it and mark as read
      console.log('Selecting existing chat:', existingChat.id);
      
      // Move chat to top of the list
      setChatList(prevChats => {
        const chatIndex = prevChats.findIndex(chat => chat.id === existingChat.id);
        if (chatIndex > 0) { // Only move if it's not already at the top
          const chatToMove = prevChats.splice(chatIndex, 1)[0];
          return [chatToMove, ...prevChats];
        }
        return prevChats;
      });
      
      setSelectedChatId(existingChat.id);
      setActiveSection('chats');
      markChatAsRead(existingChat.id);
    } else {
      // Create new chat
      const newChat: Chat = {
        id: `chat-${contact.id}`,
        participants: [currentUser!, contact],
        messages: [],
        unreadCount: 0
      };

      console.log('Creating new chat:', newChat.id, 'for contact:', contact.name);
      
      // Add to chat list
      setChatList(prevChats => [newChat, ...prevChats]);
      
      // Select the new chat
      setSelectedChatId(newChat.id);
      setActiveSection('chats');
    }
  };

  const handleSendMessage = (content: string) => {
    if (!selectedChatId || !wsConnected) {
      console.error('Cannot send message: no chat selected or WebSocket not connected');
      return;
    }

    // Find the selected chat to get receiver info
    const selectedChat = chatList.find(chat => chat.id === selectedChatId);
    if (!selectedChat) {
      console.error('Selected chat not found');
      return;
    }

    // Find the receiver (the other participant who is not the current user)
    const receiver = selectedChat.participants.find(p => p.id !== currentUser!.id);
    if (!receiver) {
      console.error('Receiver not found in chat participants');
      return;
    }

    // Create message for local display
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser!.id,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    // Create ChatDto for WebSocket
    const chatDto: ChatDto = {
      roomId: selectedChatId, // Use chat ID as room ID
      senderId: currentUser!.id,
      receiverId: receiver.id,
      message: content
    };

    console.log('Sending message via WebSocket:', chatDto);

    // Send via WebSocket
    webSocketService.sendMessage(chatDto);

    // Update local chat immediately (optimistic update) and move to top
    setChatList(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: newMessage
          };
        }
        return chat;
      });

      // Find the updated chat and move it to the top
      const updatedChatIndex = updatedChats.findIndex(chat => chat.id === selectedChatId);
      if (updatedChatIndex > 0) { // Only move if it's not already at the top
        const updatedChat = updatedChats.splice(updatedChatIndex, 1)[0];
        return [updatedChat, ...updatedChats];
      }
      
      return updatedChats;
    });
  };

  // Show login screen if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // At this point, currentUser is guaranteed to be non-null
  const user = currentUser;

  return (
    <div className="app">
      <NavigationSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        currentUser={user}
        onLogout={handleLogout}
      />
      <Sidebar
        chats={chatList}
        contacts={apiUsers}
        activeSection={activeSection}
        currentUser={user}
        onChatSelect={(chatId) => {
          setSelectedChatId(chatId);
          markChatAsRead(chatId);
        }}
        onUserSelect={handleUserSelect}
        onContactSelect={handleStartChat}
        selectedChatId={selectedChatId}
        loading={loading}
        error={error}
        wsConnected={wsConnected}
      />
      <ChatArea
        chat={selectedChat || null}
        currentUser={user}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;
