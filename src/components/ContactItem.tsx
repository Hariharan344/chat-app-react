import React from 'react';
import type { Contact } from '../types/chat';
import '../styles/components/ContactItem.css';

interface ContactItemProps {
  contact: Contact;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact }) => {
  return (
    <div className="contact-item">
      <div className="contact-avatar-container">
        <img 
          src={contact.avatar} 
          alt={contact.name} 
          className="contact-avatar"
        />
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