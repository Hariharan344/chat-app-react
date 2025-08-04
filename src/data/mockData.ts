import type { User, Chat, Message, Contact } from '../types/chat';

// Static login user based on your example
export const currentUser: User = {
  id: '68826294b49ac2ac32816e84',
  name: 'Hari Haran',
  avatar: 'H', // First letter of name
  status: 'online',
  chatData: {
    id: '68826294b49ac2ac32816e84',
    mail: 'hari123@gmail.com',
    role: 'USER'
  },
  fullData: {
    id: '68826294b49ac2ac32816e84',
    name: 'Hari Haran',
    mail: 'hari123@gmail.com',
    password: '$2a$10$rhibWWTd3ZF8F0wwR60OL.p5yYyI376mOrnnkXrdl3NgRwuOhgnVi',
    role: 'USER',
    phoneNumber: '8794567345',
    status: 'ACTIVE',
    createdAt: '2025-07-24T22:13:00.050445500',
    updatedAt: null
  }
};

export const users: User[] = [
  {
    id: '1',
    name: 'Darshan Zalavadiya',
    avatar: 'D', // First letter of name
    status: 'online',
    chatData: {
      id: '1',
      mail: 'darshan@example.com',
      role: 'USER'
    }
  },
  {
    id: '2',
    name: 'Devang Zalavadiya',
    avatar: 'D', // First letter of name
    status: 'online',
    chatData: {
      id: '2',
      mail: 'devang@example.com',
      role: 'USER'
    }
  },
  {
    id: '3',
    name: 'Sahil Raj Ghori',
    avatar: 'S', // First letter of name
    status: 'offline',
    lastSeen: '2 hours ago',
    chatData: {
      id: '3',
      mail: 'sahil@example.com',
      role: 'USER'
    }
  },
  {
    id: '4',
    name: 'Harsh Tiwana',
    avatar: 'H', // First letter of name
    status: 'online',
    chatData: {
      id: '4',
      mail: 'harsh@example.com',
      role: 'USER'
    }
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
    senderId: '68826294b49ac2ac32816e84', // Current user ID
    content: 'Hello, Darshan',
    timestamp: new Date('2024-01-20T09:30:30'),
    type: 'text'
  },
  {
    id: '3',
    senderId: '68826294b49ac2ac32816e84', // Current user ID
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
    senderId: '68826294b49ac2ac32816e84', // Current user ID
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