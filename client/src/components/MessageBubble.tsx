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
    const messageDate = new Date(date);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();
    const isThisYear = messageDate.getFullYear() === today.getFullYear();

    const timeStr = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return timeStr;
    }

    // Show date for older messages
    if (isThisYear) {
      const dateStr = messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${dateStr}, ${timeStr}`;
    }

    // Show year for messages from previous years
    const dateStr = messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${dateStr}, ${timeStr}`;
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

  // Determine the background color for messages
  const getBackgroundColor = () => {
    if (message.isSelf) {
      // For own messages, always use current color from store (allows changing past messages)
      // This works in both local and shared modes
      return chatStore.currentColor;
    } else {
      // For other users' messages, show their color if they shared it
      return message.color || undefined;
    }
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
            : getBackgroundColor()
              ? 'text-white shadow-sm'
              : 'bg-white text-gray-800 shadow-sm'
        }`}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <div
          className={`text-xs font-semibold mb-1 ${
            message.isSelf || getBackgroundColor() ? 'text-white/80' : 'text-gray-600'
          }`}
        >
          {message.sender}
        </div>
        {message.hasImage && message.imageUrl && (
          <div className="mb-2">
            <img
              src={message.imageUrl}
              alt="Uploaded image"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                window.open(message.imageUrl, '_blank');
              }}
              loading="lazy"
            />
          </div>
        )}
        {message.content && <div className="break-words">{message.content}</div>}
        <div
          className={`text-xs mt-1 ${
            message.isSelf || getBackgroundColor() ? 'text-white/70' : 'text-gray-400'
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
