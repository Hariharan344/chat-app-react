import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Users } from 'lucide-react';
import type { Chat, Contact, User, GroupChat } from '../types/chat';
import ChatItem from './ChatItem';
import GroupItem from './GroupItem';
import ContactItem from './ContactItem';
import '../styles/components/Sidebar.css';

interface SidebarProps {
  chats: Chat[];
  groups: GroupChat[];
  contacts: Contact[];
  activeSection: 'chats' | 'groups' | 'contacts' | 'calls' | 'settings';
  currentUser: User | null;
  onChatSelect: (chatId: string) => void;
  onGroupSelect: (groupId: string) => void;
  onUserSelect: (userId: string) => void;
  onContactSelect?: (contact: Contact) => void; // New prop for starting chat with contact
  onCreateGroupClick?: () => void; // New prop for create group button
  selectedChatId?: string;
  loading?: boolean;
  error?: string | null;
  wsConnected?: boolean; // WebSocket connection status
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  groups,
  contacts,
  activeSection,
  currentUser,
  onChatSelect,
  onGroupSelect,
  onUserSelect: _onUserSelect, // Prefix with underscore to indicate it's intentionally unused
  onContactSelect,
  onCreateGroupClick,
  selectedChatId,
  loading = false,
  error = null,
  wsConnected = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredChats = chats.filter(chat => {
    const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'chats':
        return 'Chats';
      case 'groups':
        return 'Groups';
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

  const handleCreateGroup = () => {
    setShowGroupMenu(false);
    onCreateGroupClick?.();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{getSectionTitle()}</h2>
        <div className="header-actions">
          <div className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`} title={wsConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}>
            <div className="ws-indicator"></div>
          </div>
          {activeSection === 'groups' && (
            <div className="dropdown-container" ref={dropdownRef}>
              <button 
                className="header-menu-btn"
                onClick={() => setShowGroupMenu(!showGroupMenu)}
              >
                <MoreVertical size={20} />
              </button>
              {showGroupMenu && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleCreateGroup}>
                    <Users size={16} />
                    <span>New Group</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {activeSection !== 'groups' && (
            <button className="header-menu-btn">
              <MoreVertical size={20} />
            </button>
          )}
        </div>
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
                currentUser={currentUser}
                isSelected={selectedChatId === chat.id}
                onClick={() => onChatSelect(chat.id)}
              />
            ))}
          </div>
        )}

        {activeSection === 'groups' && (
          <div className="groups-list">
            {filteredGroups.map(group => (
              <GroupItem
                key={group.id}
                group={group}
                isSelected={selectedChatId === group.id}
                onClick={() => onGroupSelect(group.id)}
              />
            ))}
          </div>
        )}
        
        {activeSection === 'contacts' && (
          <div className="contacts-list">
            {loading && (
              <div className="loading-state">
                <p>Loading users...</p>
              </div>
            )}
            {error && (
              <div className="error-state">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}
            {!loading && !error && filteredContacts.length === 0 && (
              <div className="empty-state">
                <p>No users found</p>
              </div>
            )}
            {!loading && !error && filteredContacts.map(contact => (
              <ContactItem
                key={contact.id}
                contact={contact}
                onClick={() => onContactSelect?.(contact)}
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