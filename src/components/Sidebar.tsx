import React, { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import type { Chat, Contact } from '../types/chat';
import ChatItem from './ChatItem';
import ContactItem from './ContactItem';
import '../styles/components/Sidebar.css';

interface SidebarProps {
  chats: Chat[];
  contacts: Contact[];
  activeSection: 'chats' | 'contacts' | 'calls' | 'settings';
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  contacts,
  activeSection,
  onChatSelect,
  selectedChatId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    const otherParticipant = chat.participants.find(p => p.id !== 'current-user');
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'chats':
        return 'Chats';
      case 'contacts':
        return 'Contacts';
      case 'calls':
        return 'Calls';
      case 'settings':
        return 'Settings';
      default:
        return 'Chats';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{getSectionTitle()}</h2>
        <button className="header-menu-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="search-container">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="sidebar-content">
        {activeSection === 'chats' && (
          <div className="chats-list">
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChatId === chat.id}
                onClick={() => onChatSelect(chat.id)}
              />
            ))}
          </div>
        )}
        
        {activeSection === 'contacts' && (
          <div className="contacts-list">
            {filteredContacts.map(contact => (
              <ContactItem
                key={contact.id}
                contact={contact}
              />
            ))}
          </div>
        )}

        {activeSection === 'calls' && (
          <div className="calls-list">
            <div className="empty-state">
              <p>No recent calls</p>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="settings-list">
            <div className="empty-state">
              <p>Settings coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;