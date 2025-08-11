import React from 'react';
import type { GroupChat } from '../types/chat';
import '../styles/components/GroupItem.css';

interface GroupItemProps {
  group: GroupChat;
  isSelected: boolean;
  onClick: () => void;
}

const GroupItem: React.FC<GroupItemProps> = ({ group, isSelected, onClick }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If message is from today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from this year, show month and day
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show year
    return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className={`group-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="group-avatar">
        {typeof group.image === 'string' && group.image.length === 1 ? (
          <span className="avatar-text">{group.image}</span>
        ) : (
          <img src={group.image} alt={group.name} className="avatar-img" />
        )}
      </div>
      
      <div className="group-info">
        <div className="group-header">
          <h3 className="group-name">{group.name}</h3>
          {group.lastMessage && (
            <span className="message-time">
              {formatTime(group.lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        <div className="group-preview">
          {group.lastMessage ? (
            <span className="last-message">
              {truncateMessage(group.lastMessage.message)}
            </span>
          ) : (
            <span className="no-messages">No messages yet</span>
          )}
          
          {group.unreadCount > 0 && (
            <span className="unread-badge">{group.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupItem;