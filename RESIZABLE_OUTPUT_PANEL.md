# Resizable Output Panel

## Overview

The output panel is now fully resizable and can be positioned either on the side (horizontal layout) or at the bottom (vertical layout) of the editor.

## Features

### 🔄 Resizable Split Pane
- Drag the divider between the editor and output panel to resize
- Smooth resizing with visual feedback
- Minimum size: 30% of container
- Maximum size: 80% of container
- Hover effect on resize handle (blue highlight)

### 📐 Layout Options

#### Horizontal Layout (Side by Side)
- Editor on the left, output on the right
- Default size: 60% editor, 40% output
- Best for wide screens
- Button: ⬌

#### Vertical Layout (Top and Bottom)
- Editor on top, output on bottom
- Default size: 70% editor, 30% output
- Best for tall screens or when you need full width for code
- Button: ⬍

### 🎯 Usage

1. **Show Output Panel**
   - Click "📋 Show Output" button
   - Panel appears with default horizontal layout

2. **Change Layout**
   - Click ⬌ for side-by-side layout
   - Click ⬍ for top-bottom layout
   - Active layout button is highlighted in blue

3. **Resize Panel**
   - Hover over the divider between editor and output
   - Divider turns blue on hover
   - Click and drag to resize
   - Release to set new size

4. **Hide Output Panel**
   - Click "📋 Hide Output" button
   - Editor expands to full size

## Components

### ResizablePanel Component
**Location:** `frontend/src/components/ResizablePanel.jsx`

**Props:**
- `children` - Two child elements (editor and output)
- `direction` - 'horizontal' or 'vertical'
- `defaultSize` - Initial size percentage (default: 60)
- `minSize` - Minimum size percentage (default: 20)
- `maxSize` - Maximum size percentage (default: 80)

**Features:**
- Mouse-based resizing with drag and drop
- Cursor changes during resize
- Prevents text selection during drag
- Smooth visual feedback

### EditorRoom Updates
**Location:** `frontend/src/components/EditorRoom.jsx`

**New State:**
- `outputLayout` - Tracks current layout ('horizontal' or 'vertical')

**New UI Elements:**
- Layout toggle buttons (⬌ and ⬍)
- Conditional rendering based on output visibility
- ResizablePanel wrapper when output is shown

## Styling

### CSS Classes
- `.resize-handle` - The draggable divider
- `.resize-handle:hover` - Blue highlight on hover
- `.layout-button` - Layout toggle buttons
- `.layout-button.active` - Active layout indicator
- `.output-panel` - Output container (now flexible)

### Visual Feedback
- Resize handle: #3e3e42 (default) → #007acc (hover)
- Layout buttons: #3e3e42 (default) → #007acc (active)
- Cursor changes: col-resize (horizontal) / row-resize (vertical)

## Keyboard Shortcuts (Future Enhancement)

Potential shortcuts to add:
- `Ctrl/Cmd + B` - Toggle output panel
- `Ctrl/Cmd + Shift + H` - Horizontal layout
- `Ctrl/Cmd + Shift + V` - Vertical layout

## Technical Details

### Resize Implementation
1. Mouse down on handle → Start resize mode
2. Mouse move → Calculate new size based on position
3. Update size state → Re-render with new dimensions
4. Mouse up → End resize mode

### Size Calculation
```javascript
// Horizontal (side-by-side)
newSize = (mouseX / containerWidth) * 100

// Vertical (top-bottom)
newSize = (mouseY / containerHeight) * 100

// Clamp between min and max
finalSize = Math.max(minSize, Math.min(maxSize, newSize))
```

### Event Handling
- Uses `useEffect` to manage global mouse events during resize
- Cleans up event listeners on unmount
- Prevents memory leaks with proper cleanup

## Browser Compatibility

✅ Chrome/Edge (Chromium)  
✅ Firefox  
✅ Safari  
✅ Opera  

Requires modern browser with:
- CSS Flexbox support
- Mouse event handling
- React 18+ hooks

## Performance

- Resize updates are throttled by React's render cycle
- No performance impact on editor typing
- Smooth 60fps resize animation
- Minimal re-renders (only size state changes)

## Accessibility

### Current Implementation
- Visual resize handle with hover feedback
- Clear layout toggle buttons with icons
- Keyboard accessible buttons

### Future Improvements
- Add ARIA labels for screen readers
- Keyboard-based resizing (arrow keys)
- Focus management during layout changes
- Announce size changes to screen readers

## Tips

1. **For Code Review**: Use horizontal layout to see code and output side-by-side
2. **For Long Output**: Use vertical layout and resize to give more space to output
3. **For Mobile**: Consider hiding output by default (small screens)
4. **For Presentations**: Adjust size to emphasize either code or output

## Troubleshooting

### Resize not working
- Check if mouse events are being captured
- Verify container has proper dimensions
- Check browser console for errors

### Layout buttons not responding
- Verify `outputLayout` state is updating
- Check if `showOutput` is true
- Inspect React DevTools for state changes

### Output panel too small/large
- Adjust `minSize` and `maxSize` props
- Check default size percentage
- Verify container flex properties

## Future Enhancements

1. **Persistent Layout Preferences**
   - Save layout choice to localStorage
   - Remember size between sessions
   - Per-user preferences via API

2. **Multiple Panels**
   - Add third panel for input (stdin)
   - Support for test cases panel
   - Debug console panel

3. **Snap Points**
   - Snap to 25%, 50%, 75% sizes
   - Double-click to reset to default
   - Predefined layouts (code-focused, output-focused)

4. **Touch Support**
   - Touch-based resizing for tablets
   - Gesture support for layout switching
   - Mobile-optimized controls

5. **Advanced Features**
   - Maximize/minimize buttons
   - Collapse/expand animations
   - Picture-in-picture output window

---

**Enjoy the flexible workspace!** 🎨
