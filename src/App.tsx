import React, { useState } from 'react';
import './styles/App.css';
import NavigationSidebar from './components/NavigationSidebar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { chats, contacts } from './data/mockData';
import type { Chat, Message } from './types/chat';

function App() {
  const [activeSection, setActiveSection] = useState<'chats' | 'contacts' | 'calls' | 'settings'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(chats[0]?.id);
  const [chatList, setChatList] = useState<Chat[]>(chats);

  const selectedChat = chatList.find(chat => chat.id === selectedChatId);

  const handleSendMessage = (content: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      content,
      timestamp: new Date(),
      type: 'text'
    };

    setChatList(prevChats => 
      prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: newMessage
          };
        }
        return chat;
      })
    );
  };

  return (
    <div className="app">
      <NavigationSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <Sidebar
        chats={chatList}
        contacts={contacts}
        activeSection={activeSection}
        onChatSelect={setSelectedChatId}
        selectedChatId={selectedChatId}
      />
      <ChatArea
        chat={selectedChat || null}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;
