import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send } from 'lucide-react';
import type { Chat, User } from '../types/chat';
import MessageBubble from './MessageBubble';
import '../styles/components/ChatArea.css';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: User | null;
  onSendMessage: (content: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!chat || !currentUser) {
    return (
      <div className="chat-area-empty">
        <div className="empty-state">
          <h2>Welcome to Chat App</h2>
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            {otherParticipant?.avatar}
          </div>
          <div className="header-details">
            <h3>{otherParticipant?.name}</h3>
            <span className="status">
              {otherParticipant?.status === 'online' ? 'Online' : otherParticipant?.lastSeen || 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="chat-header-actions">
          <button className="header-btn">
            <Phone size={20} />
          </button>
          <button className="header-btn">
            <Video size={20} />
          </button>
          <button className="header-btn">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {chat.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser.id}
              showTime={
                index === 0 || 
                chat.messages[index - 1].senderId !== message.senderId ||
                (message.timestamp.getTime() - chat.messages[index - 1].timestamp.getTime()) > 300000 // 5 minutes
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <div className="message-input-wrapper">
          <button className="input-btn">
            <Paperclip size={20} />
          </button>
          
          <div className="message-input-box">
            <input
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="message-input"
            />
            <button className="input-btn">
              <Smile size={20} />
            </button>
          </div>

          {newMessage.trim() ? (
            <button className="send-btn" onClick={handleSendMessage}>
              <Send size={20} />
            </button>
          ) : (
            <button className="input-btn">
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;