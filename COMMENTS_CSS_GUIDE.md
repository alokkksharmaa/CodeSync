# 💬 Comments Panel - CSS Styling Guide

## Overview
Professional CSS styling for the Comments Panel that matches CodeSync's modern dark theme aesthetic.

## Design System Integration

### Color Palette
```css
/* Backgrounds */
--bg-base:        #0B0C10  /* Deep dark base */
--bg-surface:     #111827  /* Elevated surface */
--bg-elevated:    #1F2937  /* Higher elevation */
--bg-hover:       rgba(255, 255, 255, 0.05)  /* Hover state */

/* Borders */
--border:         #374151  /* Standard border */
--border-subtle:  rgba(55, 65, 81, 0.5)  /* Subtle border */
--border-focus:   #3B82F6  /* Focus state */

/* Text */
--text-primary:   #ededf0  /* Primary text */
--text-secondary: #9ca3af  /* Secondary text */
--text-muted:     #6b7280  /* Muted text */

/* Accent */
--accent:         #3B82F6  /* Primary blue */
--accent-hover:   #2563EB  /* Hover blue */
```

### Typography
- **Font Family**: Inter (body), Space Grotesk (headings)
- **Font Sizes**: 11px - 14px (optimized for readability)
- **Font Weights**: 500 (medium), 600 (semibold), 700 (bold)
- **Letter Spacing**: -0.1px to -0.2px (tight, modern)

### Spacing
- **Padding**: 8px - 16px
- **Gaps**: 4px - 12px
- **Border Radius**: 6px - 12px

## Component Breakdown

### 1. Panel Container
```css
.comments-panel {
  width: 320px;
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(16px);
  border-left: 1px solid var(--border);
  animation: slideInRight 0.25s;
}
```

**Features:**
- Translucent background with blur
- Smooth slide-in animation
- Consistent border styling
- Responsive width

### 2. Header
```css
.comments-panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(31, 41, 55, 0.3);
}
```

**Features:**
- Elevated background
- Clear separation from content
- Badge for comment count
- Emoji icon for visual interest

### 3. Comment Items
```css
.comment-item {
  background: rgba(31, 41, 55, 0.4);
  border: 1px solid rgba(55, 65, 81, 0.5);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.2s;
}

.comment-item:hover {
  background: rgba(31, 41, 55, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

**Features:**
- Layered card design
- Smooth hover effects
- Subtle shadows
- Fade-in animation

### 4. User Avatar
```css
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.2), 
    rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(99, 102, 241, 0.3);
}
```

**Features:**
- Gradient background
- Circular shape
- Colored border
- Uppercase initial

### 5. Action Buttons
```css
.comment-action-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;
  opacity: 0;
}

.comment-item:hover .comment-actions {
  opacity: 1;
}
```

**Features:**
- Hidden until hover
- Smooth fade-in
- Scale on hover
- Color change on hover

### 6. Reactions
```css
.reaction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(55, 65, 81, 0.5);
  background: rgba(31, 41, 55, 0.3);
}

.reaction-btn.reacted {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}
```

**Features:**
- Pill-shaped design
- Active state styling
- Hover scale effect
- Grouped display

### 7. Emoji Picker
```css
.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: emojiPickerIn 0.2s;
}
```

**Features:**
- Floating popup
- Blur background
- Scale animation
- Hover effects on emojis

### 8. Input Form
```css
.comments-textarea {
  width: 100%;
  background: rgba(11, 12, 16, 0.6);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  transition: all 0.2s;
}

.comments-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: rgba(11, 12, 16, 0.8);
}
```

**Features:**
- Dark background
- Focus ring effect
- Character counter
- Disabled state styling

## Animations

### Slide In
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Fade In
```css
@keyframes commentFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Emoji Picker
```css
@keyframes emojiPickerIn {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Spin (Loading)
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## Interactive States

### Hover Effects
- **Comment Items**: Elevated shadow, brighter background
- **Buttons**: Scale up, color change
- **Reactions**: Scale 1.05x, border highlight
- **Emojis**: Scale 1.2x, background highlight

### Focus States
- **Inputs**: Blue ring, brighter background
- **Buttons**: Blue outline, 2px offset

### Active States
- **Reactions**: Indigo background, colored text
- **Buttons**: Scale down 0.98x

### Disabled States
- **Buttons**: 40% opacity, no pointer events

## Responsive Design

### Desktop (1200px+)
```css
.comments-panel {
  width: 320px;
}
```

### Laptop (900px - 1200px)
```css
.comments-panel {
  width: 280px;
}
```

### Mobile (<900px)
```css
.comments-panel {
  position: fixed;
  right: 0;
  top: var(--topbar-height);
  bottom: 0;
  width: 100%;
  max-width: 360px;
  z-index: 50;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}
```

## Scrollbar Styling

### Custom Scrollbar
```css
.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
```

## Accessibility Features

### Focus Indicators
```css
.comment-action-btn:focus-visible,
.reaction-btn:focus-visible,
.post-comment-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### ARIA Labels
- All interactive elements have aria-labels
- Buttons have descriptive titles
- Semantic HTML structure

### Keyboard Navigation
- Tab order follows visual order
- Focus visible on all interactive elements
- Enter to submit forms
- Escape to cancel editing

## Performance Optimizations

### GPU Acceleration
```css
transform: translateZ(0);
will-change: transform;
```

### Efficient Transitions
```css
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

### Backdrop Filter
```css
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
```

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- Backdrop filter fallback to solid background
- CSS Grid fallback to flexbox
- Transform fallback to position

## Dark Mode

### Automatic Detection
```css
@media (prefers-color-scheme: dark) {
  .comments-panel {
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.05);
  }
}
```

## Print Styles

### Hide on Print
```css
@media print {
  .comments-panel {
    display: none;
  }
}
```

## Usage Examples

### Basic Implementation
```jsx
import './CommentsPanel.css';

<div className="comments-panel">
  <div className="comments-panel-header">
    <h3 className="comments-panel-title">
      💬 Comments
      <span className="comments-count">5</span>
    </h3>
  </div>
  {/* ... */}
</div>
```

### Comment Item
```jsx
<div className="comment-item">
  <div className="comment-header">
    <div className="comment-user-info">
      <div className="comment-avatar">A</div>
      <div className="comment-user-details">
        <div className="comment-username">Alice</div>
        <div className="comment-timestamp">2m ago</div>
      </div>
    </div>
  </div>
  <p className="comment-text">Great work!</p>
</div>
```

### Reaction Button
```jsx
<button className="reaction-btn reacted">
  <span className="reaction-emoji">👍</span>
  <span className="reaction-count">3</span>
</button>
```

## Customization

### Changing Colors
```css
/* Override CSS variables */
:root {
  --accent: #10b981; /* Green instead of blue */
}
```

### Adjusting Sizes
```css
.comments-panel {
  width: 400px; /* Wider panel */
}

.comment-avatar {
  width: 40px; /* Larger avatars */
  height: 40px;
}
```

### Custom Animations
```css
.comment-item {
  animation: customFadeIn 0.5s ease-out;
}

@keyframes customFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Best Practices

### Do's ✅
- Use CSS variables for consistency
- Follow the design system
- Add smooth transitions
- Include hover states
- Provide focus indicators
- Test on multiple browsers
- Optimize for performance

### Don'ts ❌
- Don't use inline styles
- Don't hardcode colors
- Don't skip animations
- Don't forget accessibility
- Don't ignore mobile
- Don't use !important (unless necessary)

## Troubleshooting

### Issue: Backdrop blur not working
**Solution:** Add webkit prefix
```css
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
```

### Issue: Animations choppy
**Solution:** Use GPU acceleration
```css
transform: translateZ(0);
will-change: transform;
```

### Issue: Scrollbar not styled
**Solution:** Check browser support
```css
/* Webkit browsers only */
::-webkit-scrollbar { }
```

---

**Created**: February 2026
**Version**: 1.0
**Status**: Production Ready ✅

