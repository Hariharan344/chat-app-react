import React from 'react';
import { MessageCircle, Users, Phone, Settings, Archive, Star, LogOut, UsersRound } from 'lucide-react';
import '../styles/components/NavigationSidebar.css';
import type { User } from '../types/chat';

interface NavigationSidebarProps {
  activeSection: 'chats' | 'groups' | 'contacts' | 'calls' | 'settings';
  onSectionChange: (section: 'chats' | 'groups' | 'contacts' | 'calls' | 'settings') => void;
  currentUser: User;
  onLogout: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeSection,
  onSectionChange,
  currentUser,
  onLogout
}) => {
  const navigationItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'groups', icon: UsersRound, label: 'Groups' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="navigation-sidebar">
      <div className="nav-header">
        <div className="user-avatar">
          <div className="nav-user-avatar" title={currentUser.name}>
            {currentUser.avatar}
          </div>
        </div>
      </div>

      <div className="nav-items">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onSectionChange(item.id as any)}
              title={item.label}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>

      <div className="nav-footer">
        <button className="nav-item" title="Starred Messages">
          <Star size={24} />
        </button>
        <button className="nav-item" title="Archived Chats">
          <Archive size={24} />
        </button>
        <button className="nav-item logout-btn" title="Logout" onClick={onLogout}>
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

export default NavigationSidebar;