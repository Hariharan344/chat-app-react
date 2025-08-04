import React from 'react';
import type { Chat, User } from '../types/chat';
import '../styles/components/ChatItem.css';

interface ChatItemProps {
  chat: Chat;
  currentUser: User | null;
  isSelected: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, currentUser, isSelected, onClick }) => {
  const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      className={`chat-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="chat-avatar-container">
        <div className="chat-avatar">
          {otherParticipant?.avatar}
        </div>
        {otherParticipant?.status === 'online' && (
          <div className="online-indicator"></div>
        )}
      </div>
      
      <div className="chat-info">
        <div className="chat-header">
          <span className="chat-name">{otherParticipant?.name}</span>
          {chat.lastMessage && (
            <span className="chat-time">
              {formatTime(chat.lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        <div className="chat-preview">
          <span className="last-message">
            {chat.lastMessage?.content || 'No messages yet'}
          </span>
          {chat.unreadCount > 0 && (
            <span className="unread-badge">{chat.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;