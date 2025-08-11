import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send } from 'lucide-react';
import type { Chat, User, GroupChat, Message } from '../types/chat';
import MessageBubble from './MessageBubble';
import '../styles/components/ChatArea.css';

interface ChatAreaProps {
  chat: Chat | null;
  group: GroupChat | null;
  currentUser: User | null;
  onSendMessage: (content: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, group, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, group?.messages]);

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

  if ((!chat && !group) || !currentUser) {
    return (
      <div className="chat-area-empty">
        <div className="empty-state">
          <h2>Welcome to Chat App</h2>
          <p>Select a chat or group to start messaging</p>
        </div>
      </div>
    );
  }

  // Determine if we're in a group chat or individual chat
  const isGroupChat = !!group;
  const otherParticipant = chat?.participants.find(p => p.id !== currentUser.id);
  
  console.log('ChatArea - isGroupChat:', isGroupChat);
  console.log('ChatArea - chat:', chat);
  console.log('ChatArea - group:', group);
  
  // Get messages - convert group messages to display format if needed
  const messages = isGroupChat 
    ? (group!.messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.message,
        timestamp: msg.timestamp,
        type: 'text' as const
      })) as Message[])
    : (chat!.messages || []);
    
  console.log('ChatArea - messages:', messages);
  console.log('ChatArea - messages length:', messages.length);

  // Get display name
  const displayName = isGroupChat ? group!.name : otherParticipant?.name || 'Unknown';
  const displayAvatar = isGroupChat ? group!.image : otherParticipant?.avatar || '?';
  const displayStatus = isGroupChat 
    ? `${group!.participants.length} members` 
    : (otherParticipant?.status === 'online' ? 'Online' : otherParticipant?.lastSeen || 'Offline');

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            {typeof displayAvatar === 'string' && displayAvatar.length === 1 ? (
              <span>{displayAvatar}</span>
            ) : (
              <img src={displayAvatar} alt={displayName} />
            )}
          </div>
          <div className="header-details">
            <h3>{displayName}</h3>
            <span className="status">
              {displayStatus}
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
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser.id}
              showTime={true}
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