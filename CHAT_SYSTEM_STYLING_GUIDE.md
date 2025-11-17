# Chat System - Styling Guide (Modern UI)

## Color Palette (Freelancer.com Style)

```css
:root {
  /* Primary Colors */
  --primary: #0066cc;
  --primary-light: #e6f0ff;
  --primary-dark: #003d99;

  /* Neutrals */
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Status Colors */
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;

  /* Chat Colors */
  --message-own-bg: #0066cc;
  --message-own-text: #ffffff;
  --message-other-bg: #f3f4f6;
  --message-other-text: #111827;
  --online-status: #10b981;
  --offline-status: #9ca3af;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --message-other-bg: #2d2d2d;
    --message-other-text: #ffffff;
    --gray-50: #1a1a1a;
    --gray-100: #262626;
    --gray-200: #404040;
    --gray-300: #595959;
  }
}
```

---

## Component Styling

### ChatWindow.css

```css
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: slideIn var(--transition-base);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-window-mobile {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

@media (min-width: 768px) {
  .chat-window {
    border-radius: var(--radius-lg);
    max-width: 800px;
    height: calc(100vh - 120px);
  }

  .chat-window-mobile {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 500px;
    height: 600px;
    border-radius: var(--radius-lg);
  }
}

.chat-loading,
.chat-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  color: var(--gray-500);
}

.chat-error {
  color: var(--error);
  flex-direction: column;
  gap: var(--spacing-lg);
}

.chat-error button {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}
```

### ChatList.css

```css
.chat-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--white);
  border-right: 1px solid var(--gray-200);
}

/* Desktop Layout */
@media (min-width: 768px) {
  .chat-list {
    width: 320px;
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    border-right: 1px solid var(--gray-200);
  }
}

.chat-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.chat-list-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--gray-900);
}

.btn-new-chat {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--primary);
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-new-chat:hover {
  background-color: var(--primary-dark);
  transform: scale(1.05);
}

.btn-new-chat:active {
  transform: scale(0.95);
}

/* Search */
.chat-search {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-bottom: 1px solid var(--gray-200);
  font-size: 14px;
  background-color: var(--gray-50);
  color: var(--gray-900);
  outline: none;
  transition: background-color var(--transition-base);
}

.chat-search:focus {
  background-color: var(--white);
  border-bottom-color: var(--primary);
}

.chat-search::placeholder {
  color: var(--gray-400);
}

/* Filter Tabs */
.chat-filters {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  overflow-x: auto;
}

.filter-tab {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  background-color: transparent;
  color: var(--gray-600);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  white-space: nowrap;
}

.filter-tab:hover {
  background-color: var(--gray-100);
}

.filter-tab.active {
  background-color: var(--primary-light);
  color: var(--primary);
}

/* Conversations List */
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  scroll-behavior: smooth;
}

.conversations-list::-webkit-scrollbar {
  width: 6px;
}

.conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

.conversations-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* Conversation Item */
.conversation-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  margin-bottom: var(--spacing-xs);
}

.conversation-item:hover {
  background-color: var(--gray-50);
}

.conversation-item.selected {
  background-color: var(--primary-light);
}

.conversation-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.conversation-item .avatar::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: var(--online-status);
  border: 2px solid white;
  border-radius: var(--radius-full);
  bottom: -2px;
  right: -2px;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: flex-start;
}

.conversation-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: var(--gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-header .time {
  font-size: 12px;
  color: var(--gray-400);
  white-space: nowrap;
  margin-left: var(--spacing-sm);
}

.last-message {
  font-size: 13px;
  color: var(--gray-600);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.unread-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background-color: var(--primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: var(--spacing-sm);
}

.conversation-item.selected .unread-badge {
  background-color: var(--primary-dark);
}
```

### MessageBubble.css

```css
.message-bubble {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  animation: messageSlideIn var(--transition-base);
  position: relative;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.own {
  justify-content: flex-end;
}

.message-bubble.own .message-avatar {
  display: none;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.message-content-wrapper {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message-bubble.own .message-content-wrapper {
  align-items: flex-end;
  max-width: 80%;
}

.message-bubble-inner {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  word-wrap: break-word;
  word-break: break-word;
}

.message-bubble:not(.own) .message-bubble-inner {
  background-color: var(--message-other-bg);
  color: var(--message-other-text);
}

.message-bubble.own .message-bubble-inner {
  background-color: var(--message-own-bg);
  color: var(--message-own-text);
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-attachments {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.message-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 11px;
  opacity: 0.7;
  margin-top: var(--spacing-xs);
}

.message-time {
  white-space: nowrap;
}

.read-receipt {
  font-size: 12px;
  white-space: nowrap;
}

.read-receipt.blue {
  color: var(--primary);
}

.message-actions {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background-color: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-xs);
  box-shadow: var(--shadow-sm);
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background-color: transparent;
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--gray-100);
}

/* Message Reactions */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.reaction-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-full);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.reaction-pill:hover {
  background-color: rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.reaction-pill.has-user-reaction {
  background-color: var(--primary-light);
  color: var(--primary);
}

.reaction-count {
  font-size: 11px;
  opacity: 0.8;
}
```

### MessageInput.css

```css
.message-input-container {
  padding: var(--spacing-lg);
  background-color: var(--white);
  border-top: 1px solid var(--gray-200);
}

/* Attachment Preview */
.attachment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 12px;
}

.attachment-item button {
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  transition: transform var(--transition-base);
}

.attachment-item button:hover {
  transform: scale(1.2);
}

/* Input Wrapper */
.message-input-wrapper {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  background-color: var(--gray-50);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  transition: border-color var(--transition-base);
}

.message-input-wrapper:focus-within {
  border-color: var(--primary);
  background-color: var(--white);
}

.btn-icon {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-icon:hover {
  background-color: var(--gray-200);
}

/* Textarea */
.message-textarea {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  color: var(--gray-900);
  resize: none;
  max-height: 200px;
  min-height: 36px;
  line-height: 1.5;
  padding: var(--spacing-sm) 0;
}

.message-textarea::placeholder {
  color: var(--gray-400);
}

/* Emoji Picker */
.relative {
  position: relative;
}

.emoji-picker-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: var(--spacing-md);
  z-index: 1000;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: popIn var(--transition-base);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Send Button */
.btn-send {
  width: 40px;
  height: 40px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: scale(1.05);
}

.btn-send:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### TypingIndicator.css

```css
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--gray-600);
  font-size: 13px;
  animation: fadeIn var(--transition-base);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background-color: var(--gray-600);
  border-radius: var(--radius-full);
  animation: typingAnimation 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingAnimation {
  0%, 60%, 100% {
    opacity: 0.5;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}
```

### Notifications.css

```css
.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  max-width: 400px;
}

.notification-toast {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--white);
  border-left: 4px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-md);
  animation: slideInRight var(--transition-base);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-toast.success {
  border-left-color: var(--success);
}

.notification-toast.error {
  border-left-color: var(--error);
}

.notification-toast.warning {
  border-left-color: var(--warning);
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--gray-900);
}

.notification-message {
  font-size: 13px;
  margin: 0;
  color: var(--gray-600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-close {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  font-size: 16px;
  transition: color var(--transition-base);
  flex-shrink: 0;
}

.notification-close:hover {
  color: var(--gray-600);
}

/* Unread Badge */
.unread-badge-ring {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: var(--error);
  border: 3px solid white;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  top: -8px;
  right: -8px;
}
```

### Responsive.css

```css
/* Mobile (< 640px) */
@media (max-width: 639px) {
  .chat-list {
    width: 100%;
    position: fixed !important;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
  }

  .chat-list.open {
    transform: translateX(0);
  }

  .message-content-wrapper {
    max-width: 90%;
  }

  .message-input-wrapper {
    padding: var(--spacing-sm);
  }

  .message-textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .emoji-picker-container {
    bottom: auto;
    top: -400px;
    left: auto;
    right: 0;
  }

  .conversation-item {
    padding: var(--spacing-sm);
  }

  .conversation-header h3 {
    font-size: 13px;
  }

  .last-message {
    font-size: 12px;
  }
}

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1024px) {
  .chat-window {
    height: calc(100vh - 60px);
  }

  .message-content-wrapper {
    max-width: 75%;
  }

  .chat-list {
    width: 280px;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .chat-window {
    display: grid;
    grid-template-columns: 320px 1fr;
  }

  .message-content-wrapper {
    max-width: 70%;
  }

  .chat-list {
    position: relative;
    height: 100%;
    width: 320px;
    border-right: 1px solid var(--gray-200);
  }
}

/* Very Large Screens */
@media (min-width: 1920px) {
  .chat-window {
    max-width: 1400px;
    margin: 0 auto;
  }

  .message-content-wrapper {
    max-width: 60%;
  }
}

/* Landscape Mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .message-input-wrapper {
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
  }

  .message-textarea {
    min-height: 28px;
    max-height: 100px;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
  }
}

/* High DPI Screens */
@media (min-resolution: 192dpi) {
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Print Styles */
@media print {
  .chat-list,
  .message-input-container,
  .message-actions,
  .btn-icon,
  .btn-send {
    display: none;
  }

  .chat-window {
    box-shadow: none;
    border: 1px solid #ccc;
  }

  .message-bubble {
    page-break-inside: avoid;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Typography

```css
/* Font Family */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Text Styles */
h1 { font-size: 24px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 20px; font-weight: 700; line-height: 1.3; }
h3 { font-size: 16px; font-weight: 600; line-height: 1.4; }
p { font-size: 14px; font-weight: 400; line-height: 1.5; }
small { font-size: 12px; font-weight: 400; line-height: 1.5; }

/* Message Styles */
.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}
```

---

## Animations

```css
/* Smooth transitions */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(10px); }
  to { transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Use in components */
.loading { animation: pulse 1.5s ease-in-out infinite; }
.spinner { animation: spin 1s linear infinite; }
```

---

## Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  :root {
    --white: #1a1a1a;
    --gray-900: #f5f5f5;
    --message-other-bg: #2d2d2d;
    --message-other-text: #ffffff;
    --gray-50: #1a1a1a;
  }

  .message-input-wrapper {
    background-color: #2d2d2d;
    border-color: #404040;
  }

  .chat-list {
    background-color: #1a1a1a;
  }
}

/* Toggle switch */
.theme-toggle {
  width: 50px;
  height: 24px;
  background-color: var(--gray-300);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-base);
  position: relative;
}

.theme-toggle::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: var(--radius-full);
  top: 2px;
  left: 2px;
  transition: left var(--transition-base);
}

.theme-toggle.dark::after {
  left: 28px;
}

.theme-toggle.dark {
  background-color: var(--primary);
}
```

---

## Installation

```bash
# Create CSS files
mkdir -p src/styles/chat

# Copy all CSS into respective files:
# src/styles/chat/ChatWindow.css
# src/styles/chat/ChatList.css
# src/styles/chat/MessageBubble.css
# src/styles/chat/MessageInput.css
# src/styles/chat/TypingIndicator.css
# src/styles/chat/Notifications.css
# src/styles/chat/responsive.css
```

---

## Import in Components

```javascript
// In ChatWindow.jsx
import '../styles/chat/ChatWindow.css';

// In ChatList.jsx
import '../styles/chat/ChatList.css';

// etc.
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

*All styling uses modern CSS Grid, Flexbox, and CSS Variables for maximum compatibility and maintainability.*
