import { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import type { Message } from '../stores/ChatStore';
import { chatStore } from '../stores/ChatStore';
import ColorPicker from './ColorPicker';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = observer(({ message }: MessageBubbleProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDoubleClick = () => {
    if (!message.isSelf || !bubbleRef.current) return;

    const rect = bubbleRef.current.getBoundingClientRect();
    const colorPickerWidth = 288; // 72 * 4 = 288px (w-72 in ColorPicker)
    const colorPickerHeight = 450; // Approximate height of color picker
    const isMobile = window.innerWidth < 768;

    let x: number;
    let y: number;

    if (isMobile) {
      // On mobile, center the color picker horizontally
      x = Math.max(10, (window.innerWidth - colorPickerWidth) / 2);
      // Position it in the middle of the screen vertically
      y = Math.max(20, (window.innerHeight - colorPickerHeight) / 2);
    } else {
      // Desktop positioning
      x = rect.right + 10;
      y = rect.top;

      // If color picker would go off-screen to the right, position it to the left of the message
      if (x + colorPickerWidth > window.innerWidth) {
        x = rect.left - colorPickerWidth - 10;
      }

      // Ensure it doesn't go off the left edge
      if (x < 10) {
        x = 10;
      }

      // Ensure it doesn't go off the bottom - keep 20px margin
      if (y + colorPickerHeight > window.innerHeight - 20) {
        y = Math.max(20, window.innerHeight - colorPickerHeight - 20);
      }

      // Ensure it doesn't go off the top
      if (y < 20) {
        y = 20;
      }
    }

    setPickerPosition({ x, y });
    setShowColorPicker(true);
  };

  // Determine the background color for self messages
  const getBackgroundColor = () => {
    if (!message.isSelf) return undefined;

    // If in local mode, always use current color from store (allows changing past messages)
    // If in shared mode, use the message's saved color (or current if not set)
    if (chatStore.colorSharingMode === 'local') {
      return chatStore.currentColor;
    }

    // For shared mode: use message color if available, otherwise use current color
    return message.color || chatStore.currentColor;
  };

  return (
    <div
      className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
    >
      <div
        ref={bubbleRef}
        onDoubleClick={handleDoubleClick}
        className={`max-w-[70%] md:max-w-[60%] rounded-lg px-4 py-2 ${
          message.isSelf
            ? 'text-white cursor-pointer'
            : 'bg-white text-gray-800 shadow-sm'
        }`}
        style={message.isSelf ? { backgroundColor: getBackgroundColor() } : undefined}
      >
        <div
          className={`text-xs font-semibold mb-1 ${
            message.isSelf ? 'text-white/80' : 'text-gray-600'
          }`}
        >
          {message.sender}
        </div>
        <div className="break-words">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            message.isSelf ? 'text-white/70' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
      {showColorPicker && (
        <>
          {/* Mobile backdrop */}
          {window.innerWidth < 768 && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowColorPicker(false)}
            />
          )}
          <ColorPicker
            onClose={() => setShowColorPicker(false)}
            position={pickerPosition}
          />
        </>
      )}
    </div>
  );
});

export default MessageBubble;
