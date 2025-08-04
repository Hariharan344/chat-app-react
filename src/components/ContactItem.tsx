import React from 'react';
import type { Contact } from '../types/chat';
import '../styles/components/ContactItem.css';

interface ContactItemProps {
  contact: Contact;
  onClick?: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, onClick }) => {
  return (
    <div className="contact-item" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="contact-avatar-container">
        <div className="contact-avatar">
          {contact.avatar}
        </div>
        {contact.isOnline && (
          <div className="online-indicator"></div>
        )}
      </div>
      
      <div className="contact-info">
        <span className="contact-name">{contact.name}</span>
        <span className="contact-status">
          {contact.isOnline ? 'Online' : contact.lastSeen || 'Offline'}
        </span>
      </div>
    </div>
  );
};

export default ContactItem;