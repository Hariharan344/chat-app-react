# CSS Structure Documentation

This document outlines the organized CSS structure for the WhatsApp-like Chat Application.

## 📁 CSS File Organization

### **Global Styles**
- **`src/App-new.css`** - Main application layout and global styles
- **`src/index.css`** - Base HTML/body styles and resets

### **Component-Specific CSS Files**

#### 1. **NavigationSidebar.css**
```
src/components/NavigationSidebar.css
```
**Styles for:**
- `.navigation-sidebar` - Main container
- `.nav-header` - User avatar section
- `.nav-items` - Navigation icons
- `.nav-item` - Individual navigation buttons
- `.nav-footer` - Bottom section icons

#### 2. **Sidebar.css**
```
src/components/Sidebar.css
```
**Styles for:**
- `.sidebar` - Main sidebar container
- `.sidebar-header` - Title and menu button
- `.search-container` - Search input area
- `.sidebar-content` - Scrollable content area
- `.empty-state` - Empty state messages

#### 3. **ChatItem.css**
```
src/components/ChatItem.css
```
**Styles for:**
- `.chat-item` - Individual chat list item
- `.chat-avatar-container` - Avatar wrapper
- `.chat-info` - Name and message info
- `.chat-name` - Contact name
- `.last-message` - Preview message
- `.unread-badge` - Unread count indicator
- `.online-indicator` - Online status dot

#### 4. **ContactItem.css**
```
src/components/ContactItem.css
```
**Styles for:**
- `.contact-item` - Individual contact list item
- `.contact-avatar-container` - Avatar wrapper
- `.contact-info` - Contact details
- `.contact-name` - Contact name
- `.contact-status` - Online/offline status

#### 5. **ChatArea.css**
```
src/components/ChatArea.css
```
**Styles for:**
- `.chat-area` - Main chat container
- `.chat-header` - Chat header with contact info
- `.messages-container` - Messages scroll area
- `.messages-list` - Messages wrapper
- `.message-input-container` - Input area
- `.message-input-wrapper` - Input controls
- `.send-btn` - Send button
- `.input-btn` - Attachment/emoji buttons

#### 6. **MessageBubble.css**
```
src/components/MessageBubble.css
```
**Styles for:**
- `.message-bubble` - Individual message container
- `.message-content` - Message text wrapper
- `.message-text` - Message text
- `.message-time` - Timestamp
- `.own` / `.other` - Sent/received message variants

## 🎨 Design System

### **Color Palette**
```css
/* Primary Colors */
--bg-primary: #0b141a;      /* Main background */
--bg-secondary: #111b21;    /* Sidebar background */
--bg-tertiary: #202c33;     /* Header background */
--bg-hover: #2a3942;        /* Hover states */

/* Text Colors */
--text-primary: #e9edef;    /* Main text */
--text-secondary: #8696a0;  /* Secondary text */
--text-muted: #8696a0;      /* Muted text */

/* Accent Colors */
--accent-primary: #00a884;  /* WhatsApp green */
--accent-hover: #06cf9c;    /* Green hover */
--message-own: #005c4b;     /* Own message background */
--message-other: #202c33;   /* Other message background */
```

### **Typography Scale**
```css
/* Font Sizes */
--font-xs: 11px;    /* Timestamps, small text */
--font-sm: 12px;    /* Message previews, status */
--font-md: 13px;    /* Search input */
--font-base: 14px;  /* Names, message text */
--font-lg: 16px;    /* Chat header names */
--font-xl: 18px;    /* Sidebar titles */
```

### **Spacing System**
```css
/* Padding/Margin Scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;
```

## 🔧 Component Import Structure

Each component imports its own CSS file:

```typescript
// NavigationSidebar.tsx
import './NavigationSidebar.css';

// Sidebar.tsx
import './Sidebar.css';

// ChatItem.tsx
import './ChatItem.css';

// ContactItem.tsx
import './ContactItem.css';

// ChatArea.tsx
import './ChatArea.css';

// MessageBubble.tsx
import './MessageBubble.css';
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Layout Dimensions**
- **Navigation Sidebar**: 60px (fixed)
- **Chat List Sidebar**: 280px (fixed)
- **Chat Area**: Flexible (remaining space)

## 🎯 Benefits of This Structure

### **1. Modularity**
- Each component has its own CSS file
- Easy to maintain and update individual components
- No style conflicts between components

### **2. Performance**
- Only load styles needed for each component
- Better tree-shaking and optimization
- Smaller bundle sizes

### **3. Developer Experience**
- Easy to find styles for specific components
- Clear separation of concerns
- Better code organization

### **4. Maintainability**
- Changes to one component don't affect others
- Easy to add new components
- Simple to refactor individual components

## 🚀 Usage Examples

### **Adding New Styles**
To add styles for a new component:

1. Create `ComponentName.css` in the components folder
2. Import it in the component: `import './ComponentName.css';`
3. Use BEM naming convention for CSS classes

### **Modifying Existing Styles**
To modify styles for an existing component:

1. Open the corresponding CSS file
2. Make changes to the specific selectors
3. Changes will only affect that component

### **Global Style Changes**
For global changes (colors, fonts, etc.):

1. Update `App-new.css` for layout changes
2. Update `index.css` for base HTML styles
3. Consider using CSS custom properties for consistency

## 📋 File Structure Summary

```
src/
├── App-new.css              # Global app styles
├── index.css                # Base HTML styles
└── components/
    ├── NavigationSidebar.css # Navigation sidebar styles
    ├── Sidebar.css          # Main sidebar styles
    ├── ChatItem.css         # Chat list item styles
    ├── ContactItem.css      # Contact list item styles
    ├── ChatArea.css         # Main chat area styles
    └── MessageBubble.css    # Message bubble styles
```

This structure provides a clean, maintainable, and scalable approach to styling the chat application components.