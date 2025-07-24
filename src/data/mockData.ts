import type { User, Chat, Message, Contact } from '../types/chat';

export const currentUser: User = {
  id: 'current-user',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  status: 'online'
};

export const users: User[] = [
  {
    id: '1',
    name: 'Darshan Zalavadiya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    status: 'online'
  },
  {
    id: '2',
    name: 'Devang Zalavadiya',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
    status: 'online'
  },
  {
    id: '3',
    name: 'Sahil Raj Ghori',
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=40&h=40&fit=crop&crop=face',
    status: 'offline',
    lastSeen: '2 hours ago'
  },
  {
    id: '4',
    name: 'Harsh Tiwana',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face',
    status: 'online'
  }
];

export const messages: Message[] = [
  {
    id: '1',
    senderId: '1',
    content: 'Hello',
    timestamp: new Date('2024-01-20T09:30:00'),
    type: 'text'
  },
  {
    id: '2',
    senderId: 'current-user',
    content: 'Hello, Darshan',
    timestamp: new Date('2024-01-20T09:30:30'),
    type: 'text'
  },
  {
    id: '3',
    senderId: 'current-user',
    content: 'How are you',
    timestamp: new Date('2024-01-20T09:31:00'),
    type: 'text'
  },
  {
    id: '4',
    senderId: '1',
    content: 'I am good',
    timestamp: new Date('2024-01-20T09:32:00'),
    type: 'text'
  },
  {
    id: '5',
    senderId: '1',
    content: 'What about You',
    timestamp: new Date('2024-01-20T09:32:15'),
    type: 'text'
  },
  {
    id: '6',
    senderId: 'current-user',
    content: 'Same for this side',
    timestamp: new Date('2024-01-20T09:33:00'),
    type: 'text'
  },
  {
    id: '7',
    senderId: '1',
    content: 'Good',
    timestamp: new Date('2024-01-20T09:34:00'),
    type: 'text'
  }
];

export const chats: Chat[] = [
  {
    id: '1',
    participants: [currentUser, users[0]],
    messages: messages,
    lastMessage: messages[messages.length - 1],
    unreadCount: 0
  },
  {
    id: '2',
    participants: [currentUser, users[1]],
    messages: [
      {
        id: 'msg-2-1',
        senderId: '2',
        content: 'Hey there!',
        timestamp: new Date('2024-01-20T08:15:00'),
        type: 'text'
      }
    ],
    lastMessage: {
      id: 'msg-2-1',
      senderId: '2',
      content: 'Hey there!',
      timestamp: new Date('2024-01-20T08:15:00'),
      type: 'text'
    },
    unreadCount: 1
  },
  {
    id: '3',
    participants: [currentUser, users[2]],
    messages: [
      {
        id: 'msg-3-1',
        senderId: '3',
        content: 'How was your day?',
        timestamp: new Date('2024-01-19T20:30:00'),
        type: 'text'
      }
    ],
    lastMessage: {
      id: 'msg-3-1',
      senderId: '3',
      content: 'How was your day?',
      timestamp: new Date('2024-01-19T20:30:00'),
      type: 'text'
    },
    unreadCount: 0
  },
  {
    id: '4',
    participants: [currentUser, users[3]],
    messages: [
      {
        id: 'msg-4-1',
        senderId: '4',
        content: 'Just finished the project!',
        timestamp: new Date('2024-01-19T18:45:00'),
        type: 'text'
      }
    ],
    lastMessage: {
      id: 'msg-4-1',
      senderId: '4',
      content: 'Just finished the project!',
      timestamp: new Date('2024-01-19T18:45:00'),
      type: 'text'
    },
    unreadCount: 0
  }
];

export const contacts: Contact[] = users.map(user => ({
  ...user,
  isOnline: user.status === 'online'
}));