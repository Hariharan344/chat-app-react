import { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/components/Login.css';
import NavigationSidebar from './components/NavigationSidebar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Login from './components/Login';
import CreateGroupModal from './components/CreateGroupModal';
import { authService } from './services/auth';
import { apiService } from './services/api';
import { webSocketService, type ChatDto, type GroupChatDto, type GroupCreateDto } from './services/websocket';
import type { 
  Chat, 
  Message, 
  Contact, 
  User, 
  GroupChat,
  GroupMessage
} from './types/chat';
import { convertApiUserToUser } from './types/chat';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<'chats' | 'groups' | 'contacts' | 'calls' | 'settings'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined); // No chat selected initially
  const [chatList, setChatList] = useState<Chat[]>([]); // Start with empty chat list
  const [groupList, setGroupList] = useState<GroupChat[]>([]); // Group chats list
  const [apiUsers, setApiUsers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set()); // Track which chats have loaded messages
  const [loadedGroups, setLoadedGroups] = useState<Set<string>>(new Set()); // Track which groups have loaded messages
  const [chatMode, setChatMode] = useState<'individual' | 'group'>('individual'); // Track current chat mode
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false); // Create group modal state
  const [creatingGroup, setCreatingGroup] = useState(false); // Group creation loading state

  const selectedChat = chatList.find(chat => chat.id === selectedChatId);
  const selectedGroup = groupList.find(group => group.id === selectedChatId);
  
  // Load chat messages when a chat is selected
  useEffect(() => {
    if (!selectedChatId || !currentUser || !wsConnected) return;

    const loadChatMessages = async () => {
      try {
        // Check if it's a group chat or individual chat
        const isGroupChat = selectedChatId.startsWith('group-');
        
        if (isGroupChat) {
          // Handle group chat loading
          const group = groupList.find(g => g.id === selectedChatId);
          if (!group) return;
          
          const groupId = selectedChatId.replace('group-', '');

          // Skip loading if messages are already loaded for this group
          if (loadedGroups.has(selectedChatId)) {
            console.log('Messages already loaded for group:', selectedChatId);
            
            // Still subscribe to group room for real-time messages
            webSocketService.subscribeToGroupRoom(groupId);
            
            // Set this group as the active one for notification clearing
            webSocketService.setActiveGroup(groupId);
            return;
          }

          console.log('Loading group messages for group:', groupId);
          console.log('Current user ID:', currentUser.id);

          // Load group messages from API
          const messagesData = await apiService.getGroupChatMessages(groupId, currentUser.id);
          console.log('Raw group messages data:', messagesData);
          
          // Convert API messages to GroupMessage objects
          const messages: GroupMessage[] = messagesData.messages.map(msg => ({
            id: msg.id,
            groupId: msg.groupId,
            senderId: msg.senderId,
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            type: msg.type || 'text'
          }));
          
          console.log('Converted group messages:', messages);
          console.log('Selected group ID:', selectedChatId);
          console.log('Group ID from API:', groupId);

          // Update the group with loaded messages
          setGroupList(prevGroups => 
            prevGroups.map(g => {
              if (g.id === selectedChatId) {
                return {
                  ...g,
                  messages: messages
                };
              }
              return g;
            })
          );

          // Subscribe to group room for real-time messages
          webSocketService.subscribeToGroupRoom(groupId);
          
          // Set this group as the active one for notification clearing
          webSocketService.setActiveGroup(groupId);
          
          // Mark this group as loaded
          setLoadedGroups(prev => new Set(prev).add(selectedChatId));
          
          console.log('Loaded group messages:', messages);
        } else {
          // Handle individual chat loading
          const chat = chatList.find(c => c.id === selectedChatId);
          if (!chat) return;

          // Clear active group since we're switching to individual chat
          webSocketService.setActiveGroup(null);

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
          const messages: Message[] = messagesData.messages.map(msg => {
            // Combine date and time to create a proper timestamp
            const dateTimeString = `${msg.date} ${msg.time}`;
            const timestamp = new Date(dateTimeString);
            
            return {
              id: msg.id,
              senderId: msg.senderId,
              content: msg.message,
              timestamp: timestamp,
              type: 'text'
            };
          });

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
          
          // Clear active group since we're in individual chat
          webSocketService.setActiveGroup(null);
          
          // Mark this chat as loaded
          setLoadedChats(prev => new Set(prev).add(selectedChatId));
          
          console.log('Loaded chat messages:', messages);
        }
      } catch (err) {
        console.error('Error loading chat/group messages:', err);
      }
    };

    loadChatMessages();
  }, [selectedChatId, currentUser, wsConnected]); // Removed chatList from dependencies

  // Clear active group when no chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      webSocketService.setActiveGroup(null);
    }
  }, [selectedChatId]);
  
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
    setGroupList([]); // Clear group chats
    setApiUsers([]);
    setSelectedChatId(undefined);
    setLoadedChats(new Set()); // Clear loaded chats tracking
    setLoadedGroups(new Set()); // Clear loaded groups tracking
    setChatMode('individual'); // Reset chat mode
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

  // Handle incoming group WebSocket messages
  useEffect(() => {
    const handleIncomingGroupMessage = (groupDto: GroupChatDto) => {
      console.log('Received group WebSocket message:', groupDto);
      
      // Convert GroupChatDto to GroupMessage
      const newGroupMessage: GroupMessage = {
        id: groupDto.id || `group-msg-${Date.now()}`,
        groupId: groupDto.groupId,
        senderId: groupDto.senderId,
        message: groupDto.message,
        timestamp: groupDto.timestamp ? new Date(groupDto.timestamp) : new Date(),
        type: groupDto.type || 'text'
      };

      const groupChatId = `group-${groupDto.groupId}`;

      // Check if the group message is for the currently open group
      const isCurrentGroup = selectedChatId === groupChatId;

      setGroupList(prevGroups => {
        // Find the group and update it
        const existingGroupIndex = prevGroups.findIndex(group => group.id === groupChatId);

        if (existingGroupIndex >= 0) {
          // Update existing group
          const updatedGroups = [...prevGroups];
          const existingGroup = updatedGroups[existingGroupIndex];
          
          updatedGroups[existingGroupIndex] = {
            ...existingGroup,
            messages: [...existingGroup.messages, newGroupMessage],
            lastMessage: newGroupMessage,
            unreadCount: isCurrentGroup ? existingGroup.unreadCount : existingGroup.unreadCount + 1
          };
          
          // Move the updated group to the top of the list
          const updatedGroup = updatedGroups.splice(existingGroupIndex, 1)[0];
          return [updatedGroup, ...updatedGroups];
        } else {
          // Group not found - this shouldn't happen in normal flow
          console.warn('Received message for unknown group:', groupDto.groupId);
          return prevGroups;
        }
      });

      // Show notification if group is not currently selected
      if (!isCurrentGroup) {
        // You can add notification logic here
        console.log('New group message notification:', newGroupMessage);
      }
    };

    // Subscribe to incoming group messages
    webSocketService.onGroupMessage(handleIncomingGroupMessage);

    // Subscribe to group creation events to add group to list
    const handleGroupCreated = (group: GroupCreateDto) => {
      console.log('Group created event received:', group);
      const newGroupId = `group-${group.groupId}`;
      setGroupList(prev => {
        const exists = prev.some(g => g.id === newGroupId);
        if (exists) return prev;
        const newGroup: GroupChat = {
          id: newGroupId,
          name: group.groupName,
          image: group.groupImage || group.groupName.charAt(0).toUpperCase(),
          participants: [],
          messages: [],
          lastMessage: {
            id: `last-group-${group.groupId}`,
            groupId: group.groupId,
            senderId: group.createdBy,
            message: 'Group created',
            timestamp: group.createdAt ? new Date(group.createdAt) : new Date(),
            type: 'text'
          },
          unreadCount: 0,
          createdBy: group.createdBy,
          createdAt: group.createdAt ? new Date(group.createdAt) : new Date()
        };
        return [newGroup, ...prev];
      });
    };
    webSocketService.onGroupCreate(handleGroupCreated);

    // Cleanup
    return () => {
      webSocketService.removeGroupMessageCallback(handleIncomingGroupMessage);
      webSocketService.removeGroupCreateCallback(handleGroupCreated);
    };
  }, [currentUser, selectedChatId]);

  // Load contacts from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const loadContacts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting to load contacts for user:', currentUser);
        
        // Get users from API
        const apiUsers = await apiService.getUsers();
        console.log('Raw API users received:', apiUsers);
        console.log('API users count:', apiUsers.length);
        
        // Filter out current user and convert to contacts
        const otherUsers = apiUsers.filter(user => user.id !== currentUser.id);
        console.log('Other users (excluding current user):', otherUsers);
        console.log('Other users count:', otherUsers.length);
        
        if (otherUsers.length === 0) {
          console.warn('No other users found to create contacts from');
          
          // Add mock contacts for testing if no real users found
          console.warn('No real users found from API - adding mock contacts for testing');
          
          const mockContacts: Contact[] = [
            {
              id: 'mock-user-1',
              name: 'Alice Johnson',
              avatar: 'A',
              status: 'online',
              chatData: { 
                id: 'mock-user-1', 
                name: 'Alice Johnson',
                mail: 'alice@example.com'
              },
              isOnline: true,
              email: 'alice@example.com'
            },
            {
              id: 'mock-user-2', 
              name: 'Bob Smith',
              avatar: 'B',
              status: 'offline',
              chatData: { 
                id: 'mock-user-2', 
                name: 'Bob Smith',
                mail: 'bob@example.com'
              },
              isOnline: false,
              email: 'bob@example.com'
            },
            {
              id: 'mock-user-3',
              name: 'Carol Davis',
              avatar: 'C',
              status: 'online',
              chatData: { 
                id: 'mock-user-3', 
                name: 'Carol Davis',
                mail: 'carol@example.com'
              },
              isOnline: true,
              email: 'carol@example.com'
            },
            {
              id: 'mock-user-4',
              name: 'David Wilson',
              avatar: 'D',
              status: 'offline',
              chatData: { 
                id: 'mock-user-4', 
                name: 'David Wilson',
                mail: 'david@example.com'
              },
              isOnline: false,
              email: 'david@example.com'
            }
          ];
          
          console.log('Setting mock contacts:', mockContacts);
          setApiUsers(mockContacts);
          
          console.log('Mock contacts added - apiUsers should now have length:', mockContacts.length);
          return;
        }
        
        const convertedUsers: Contact[] = await Promise.all(
          otherUsers.map(async (user, index) => {
            console.log(`Converting user ${index + 1}/${otherUsers.length}:`, user);
            try {
              // Get online status for each user
              const status = await apiService.getUserStatus(user.id);
              console.log(`User ${user.id} status:`, status);
              
              const convertedUser = convertApiUserToUser(user, status);
              console.log('Converted user:', convertedUser);
              
              const contact = {
                ...convertedUser,
                isOnline: status === 'online',
                email: user.mail // Add email from API user
              };
              console.log('Final contact:', contact);
              return contact;
            } catch (userError) {
              console.error(`Error processing user ${user.id}:`, userError);
              // Return a basic contact even if status fails
              return {
                id: user.id,
                name: user.name || 'Unknown User',
                avatar: user.name ? user.name.charAt(0).toUpperCase() : '?',
                status: 'offline' as const,
                chatData: {
                  id: user.id,
                  name: user.name || 'Unknown User',
                  mail: user.mail
                },
                isOnline: false,
                email: user.mail
              };
            }
          })
        );
        
        setApiUsers(convertedUsers);
        console.log('Successfully loaded contacts:', convertedUsers);
        console.log('Contact summary:', convertedUsers.map(u => ({ 
          id: u.id, 
          name: u.name, 
          email: u.email,
          avatar: u.avatar 
        })));
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

  // Load group chats from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const loadGroupChats = async () => {
      try {
        const groupListData = await apiService.getGroupChatList(currentUser.id);
        console.log('Loaded group list:', groupListData);
        
        // Convert group list data to GroupChat objects
        const groups: GroupChat[] = [];
        
        for (const [groupId, groupDetails] of Object.entries(groupListData.groupsDet)) {
          // Parse timestamp for last message
          let messageTimestamp = new Date();
          if (groupDetails.lastMessageTime) {
            messageTimestamp = new Date(groupDetails.lastMessageTime);
          }

          const group: GroupChat = {
            id: `group-${groupId}`,
            name: groupDetails.groupName,
            image: groupDetails.groupImage || groupDetails.groupName.charAt(0).toUpperCase(),
            participants: [], // Will be populated when needed
            messages: [], // Messages will be loaded when group is opened
            lastMessage: groupDetails.lastMessage ? {
              id: `last-group-${groupId}`,
              groupId: groupId,
              senderId: groupDetails.lastMessageBy,
              message: groupDetails.lastMessage,
              timestamp: messageTimestamp,
              type: 'text'
            } : undefined,
            unreadCount: groupDetails.unreadCount || 0,
            createdBy: groupDetails.createdBy,
            createdAt: new Date()
          };
          groups.push(group);
        }
        
        // Sort groups by last message timestamp (most recent first)
        groups.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
        });
        
        setGroupList(groups);
        console.log('Converted group list to groups:', groups);
        console.log('Total groups loaded:', groups.length);
      } catch (err) {
        console.error('Error loading group chats:', err);
        // Don't show error to user, just log it
      }
    };

    loadGroupChats();
  }, [isAuthenticated, currentUser]);

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
    const isGroupChat = chatId.startsWith('group-');
    
    if (isGroupChat) {
      setGroupList(prevGroups => 
        prevGroups.map(group => {
          if (group.id === chatId) {
            return {
              ...group,
              unreadCount: 0
            };
          }
          return group;
        })
      );
    } else {
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
    }
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string) => {
    console.log('Group selected:', groupId);
    console.log('Available groups:', groupList.map(g => ({ id: g.id, name: g.name })));
    setSelectedChatId(groupId);
    setActiveSection('groups');
    setChatMode('group');
    markChatAsRead(groupId);
  };

  // Handle create group
  const handleCreateGroup = async (groupData: {
    groupName: string;
    groupDescription: string;
    createdBy: string;
    membersId: string[];
  }) => {
    setCreatingGroup(true);
    try {
      console.log('Creating group with data:', groupData);
      
      const newGroup = await apiService.createGroup(groupData);
      console.log('Group created successfully:', newGroup);
      
      // Refresh group list to include the new group
      const groupListData = await apiService.getGroupChatList(currentUser!.id);
      console.log('Refreshed group list:', groupListData);
      
      // Convert group list data to GroupChat objects
      const groups: GroupChat[] = [];
      
      for (const [groupId, groupDetails] of Object.entries(groupListData.groupsDet)) {
        // Parse timestamp for last message
        let messageTimestamp = new Date();
        if (groupDetails.lastMessageTime) {
          messageTimestamp = new Date(groupDetails.lastMessageTime);
        }

        const group: GroupChat = {
          id: `group-${groupId}`,
          name: groupDetails.groupName,
          image: groupDetails.groupImage || groupDetails.groupName.charAt(0).toUpperCase(),
          participants: [], // Will be populated when needed
          messages: [], // Messages will be loaded when group is opened
          lastMessage: groupDetails.lastMessage ? {
            id: `last-group-${groupId}`,
            groupId: groupId,
            senderId: groupDetails.lastMessageBy,
            message: groupDetails.lastMessage,
            timestamp: messageTimestamp,
            type: 'text'
          } : undefined,
          unreadCount: groupDetails.unreadCount || 0,
          createdBy: groupDetails.createdBy,
          createdAt: new Date()
        };
        groups.push(group);
      }
      
      // Sort groups by last message timestamp (most recent first)
      groups.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
      });
      
      setGroupList(groups);
      
      // Switch to groups section and select the newly created group
      setActiveSection('groups');
      // Find the newly created group - it might be the first one if it's most recent
      if (groups.length > 0) {
        const newGroupId = groups[0].id;
        setSelectedChatId(newGroupId);
        setChatMode('group');
      }
      
    } catch (error) {
      console.error('Error creating group:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setCreatingGroup(false);
    }
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

    const isGroupChat = selectedChatId.startsWith('group-');

    if (isGroupChat) {
      // Handle group message sending
      const selectedGroup = groupList.find(group => group.id === selectedChatId);
      if (!selectedGroup) {
        console.error('Selected group not found');
        return;
      }

      const groupId = selectedChatId.replace('group-', '');

      // Create group message for local display
      const newGroupMessage: GroupMessage = {
        id: `group-msg-${Date.now()}`,
        groupId: groupId,
        senderId: currentUser!.id,
        message: content,
        timestamp: new Date(),
        type: 'text'
      };

      // Create GroupChatDto for WebSocket
      const groupChatDto: GroupChatDto = {
        groupId: groupId,
        senderId: currentUser!.id,
        message: content,
        type: 'text'
      };

      console.log('Sending group message via WebSocket:', groupChatDto);

      // Send via WebSocket
      webSocketService.sendGroupMessage(groupChatDto);

      // Update local group immediately (optimistic update) and move to top
      setGroupList(prevGroups => {
        const updatedGroups = prevGroups.map(group => {
          if (group.id === selectedChatId) {
            return {
              ...group,
              messages: [...group.messages, newGroupMessage],
              lastMessage: newGroupMessage
            };
          }
          return group;
        });

        // Find the updated group and move it to the top
        const updatedGroupIndex = updatedGroups.findIndex(group => group.id === selectedChatId);
        if (updatedGroupIndex > 0) { // Only move if it's not already at the top
          const updatedGroup = updatedGroups.splice(updatedGroupIndex, 1)[0];
          return [updatedGroup, ...updatedGroups];
        }
        
        return updatedGroups;
      });
    } else {
      // Handle individual message sending
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
    }
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
        groups={groupList}
        contacts={apiUsers}
        activeSection={activeSection}
        currentUser={user}
        onChatSelect={(chatId) => {
          setSelectedChatId(chatId);
          setChatMode('individual');
          markChatAsRead(chatId);
        }}
        onGroupSelect={handleGroupSelect}
        onUserSelect={handleUserSelect}
        onContactSelect={handleStartChat}
        onCreateGroupClick={() => {
          console.log('=== OPENING CREATE GROUP MODAL ===');
          console.log('Current apiUsers state:', apiUsers);
          console.log('ApiUsers count:', apiUsers.length);
          console.log('ApiUsers details:', apiUsers.map(u => ({ 
            id: u.id, 
            name: u.name, 
            avatar: u.avatar,
            email: u.email 
          })));
          console.log('Loading state:', loading);
          console.log('Current user:', currentUser);
          console.log('=== OPENING MODAL NOW ===');
          setShowCreateGroupModal(true);
        }}
        selectedChatId={selectedChatId}
        loading={loading}
        error={error}
        wsConnected={wsConnected}
      />
      <ChatArea
        chat={selectedChat || null}
        group={selectedGroup || null}
        currentUser={user}
        onSendMessage={handleSendMessage}
      />
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
        contacts={apiUsers}
        currentUser={user}
        loading={creatingGroup}
        contactsLoading={loading}
      />
    </div>
  );
}

export default App;
