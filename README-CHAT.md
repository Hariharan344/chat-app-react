# WhatsApp-like Chat Application

A modern chat application built with React, TypeScript, and Vite that mimics the WhatsApp interface and functionality.

## Features

### 🎨 **WhatsApp-like UI Design**
- Dark theme with authentic WhatsApp colors
- Responsive sidebar with chat list and contacts
- Modern message bubbles with proper alignment
- Online status indicators
- Smooth animations and hover effects

### 💬 **Chat Functionality**
- Real-time message sending and receiving
- Message timestamps
- Chat selection and switching
- Unread message badges
- Search functionality for chats and contacts

### 👥 **Contact Management**
- Contact list with online/offline status
- User avatars and profile information
- Quick access to recent conversations

### 📱 **Interface Components**
- **Sidebar**: Chat list, contacts, and calls sections
- **Chat Area**: Message display with header and input
- **Message Input**: Text input with emoji and attachment buttons
- **Header**: Contact info with call and video buttons

## Technology Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with modern features

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-app-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── Sidebar.tsx     # Main sidebar component
│   ├── ChatArea.tsx    # Chat display area
│   ├── ChatItem.tsx    # Individual chat item
│   ├── ContactItem.tsx # Contact list item
│   └── MessageBubble.tsx # Message display component
├── types/              # TypeScript type definitions
│   └── chat.ts         # Chat-related interfaces
├── data/               # Mock data and utilities
│   └── mockData.ts     # Sample chat data
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## Key Features Implemented

### 1. **Chat Interface**
- Switch between different conversations
- Send and receive messages in real-time
- Message timestamps and read status
- Proper message alignment (sent vs received)

### 2. **Sidebar Navigation**
- Toggle between Chats and Contacts tabs
- Search functionality across all chats
- Recent calls section
- Online status indicators

### 3. **Responsive Design**
- Mobile-friendly layout
- Proper scrolling for long conversations
- Hover effects and smooth transitions
- WhatsApp-authentic color scheme

### 4. **TypeScript Integration**
- Fully typed components and data structures
- Type-safe props and state management
- Interface definitions for all data models

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Adding New Features
1. **Voice Messages**: Extend the `Message` type to include audio
2. **File Sharing**: Add file upload functionality
3. **Group Chats**: Modify chat structure for multiple participants
4. **Real-time Updates**: Integrate with WebSocket or Socket.io

### Styling
- Modify `App.css` for theme changes
- Update color variables for different themes
- Customize component styles in individual components

## Future Enhancements

- [ ] Real-time messaging with WebSocket
- [ ] Voice and video calling
- [ ] File and image sharing
- [ ] Group chat functionality
- [ ] Message encryption
- [ ] Push notifications
- [ ] Mobile app version
- [ ] User authentication
- [ ] Message search
- [ ] Chat backup and restore

## How to Use

1. **Starting the App**: Run `npm run dev` and open `http://localhost:5173`
2. **Switching Chats**: Click on any chat in the sidebar to open the conversation
3. **Sending Messages**: Type in the message input at the bottom and press Enter or click the send button
4. **Viewing Contacts**: Click the "Contacts" tab in the sidebar to see all contacts
5. **Search**: Use the search box to find specific chats or contacts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by WhatsApp's user interface
- Built with modern React best practices
- Uses Lucide React for consistent iconography