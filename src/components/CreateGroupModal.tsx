import React, { useState } from 'react';
import { X, Check, Users } from 'lucide-react';
import type { Contact, User } from '../types/chat';
import '../styles/components/CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    groupName: string;
    groupDescription: string;
    createdBy: string;
    membersId: string[];
  }) => Promise<void>;
  contacts: Contact[];
  currentUser: User;
  loading?: boolean;
  contactsLoading?: boolean;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  contacts,
  currentUser,
  loading = false,
  contactsLoading = false
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedMembers.size === 0) {
      alert('Please select at least one member');
      return;
    }

    try {
      await onCreateGroup({
        groupName: groupName.trim(),
        groupDescription: groupDescription.trim(),
        createdBy: currentUser.id,
        membersId: Array.from(selectedMembers)
      });
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers(new Set());
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  // Always show some contacts for testing - will use real contacts if available
  const defaultTestContacts: Contact[] = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      avatar: 'A',
      status: 'online',
      chatData: { 
        id: 'user-1', 
        name: 'Alice Johnson',
        mail: 'alice@example.com'
      },
      isOnline: true,
      email: 'alice@example.com'
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      avatar: 'B',
      status: 'offline',
      chatData: { 
        id: 'user-2', 
        name: 'Bob Smith',
        mail: 'bob@example.com'
      },
      isOnline: false,
      email: 'bob@example.com'
    },
    {
      id: 'user-3',
      name: 'Carol Davis',
      avatar: 'C',
      status: 'online',
      chatData: { 
        id: 'user-3', 
        name: 'Carol Davis',
        mail: 'carol@example.com'
      },
      isOnline: true,
      email: 'carol@example.com'
    },
    {
      id: 'user-4',
      name: 'David Wilson',
      avatar: 'D',
      status: 'offline',
      chatData: { 
        id: 'user-4', 
        name: 'David Wilson',
        mail: 'david@example.com'
      },
      isOnline: false,
      email: 'david@example.com'
    },
    {
      id: 'user-5',
      name: 'Emma Brown',
      avatar: 'E',
      status: 'online',
      chatData: { 
        id: 'user-5', 
        name: 'Emma Brown',
        mail: 'emma@example.com'
      },
      isOnline: true,
      email: 'emma@example.com'
    }
  ];
  
  // Use real contacts if available, otherwise use default test contacts
  const contactsToUse = contacts && contacts.length > 0 ? contacts : defaultTestContacts;
  
  const filteredContacts = contactsToUse.filter(contact => {
    // If no search query, show all contacts
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    const nameMatch = contact.name && contact.name.toLowerCase().includes(searchLower);
    const emailMatch = contact.email && contact.email.toLowerCase().includes(searchLower);
    const idMatch = contact.id && contact.id.toLowerCase().includes(searchLower);
    
    return nameMatch || emailMatch || idMatch;
  });

  // Debug logging - only when modal is open
  if (isOpen) {
    // console.log('CreateGroupModal opened with contacts:', contactsToUse.length);
    // console.log('Available users:', contactsToUse.map(c => c.name));
    if (searchQuery) {
      // console.log('Search results:', filteredContacts.length);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h2><Users size={24} /> Create New Group</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label htmlFor="groupName">Group Name *</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="groupDescription">Group Description</label>
            <textarea
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              maxLength={200}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Select Members ({selectedMembers.size} selected from {contactsToUse.length} users)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="search-input"
              disabled={loading}
            />
            <small style={{color: '#888', fontSize: '12px'}}>
              All available users are shown below. Scroll to see more users.
            </small>
          </div>

          <div className="members-list">
            {contactsLoading && (
              <div className="loading-contacts">
                <p>Loading contacts...</p>
              </div>
            )}
            
            {!contactsLoading && filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`member-item ${selectedMembers.has(contact.id) ? 'selected' : ''}`}
                onClick={() => !loading && !contactsLoading && handleMemberToggle(contact.id)}
              >
                <div className="member-info">
                  <div className="member-avatar">
                    {contact.avatar}
                  </div>
                  <div className="member-details">
                    <span className="member-name">
                      {contact.name || contact.id || 'Unknown User'}
                    </span>
                    {contact.email && (
                      <span className="member-email">{contact.email}</span>
                    )}

                  </div>
                </div>
                <div className="member-checkbox">
                  {selectedMembers.has(contact.id) && (
                    <Check size={16} className="check-icon" />
                  )}
                </div>
              </div>
            ))}
            
            {!contactsLoading && contactsToUse.length === 0 && (
              <div className="no-contacts">
                <p>No contacts available</p>
                <small>Make sure you have contacts in your account</small>
              </div>
            )}
            
            {!contactsLoading && contactsToUse.length > 0 && filteredContacts.length === 0 && (
              <div className="no-contacts">
                <p>No contacts match "{searchQuery}"</p>
                <small>Try a different search term</small>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={loading || !groupName.trim() || selectedMembers.size === 0}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;