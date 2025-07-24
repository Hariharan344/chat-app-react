import React from 'react';
import type { Message } from '../types/chat';
import '../styles/components/MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showTime }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        <span className="message-text">{message.content}</span>
      </div>
      {showTime && (
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;