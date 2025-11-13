import { observer } from 'mobx-react-lite';
import { useState, useEffect, useRef } from 'react';
import { chatStore } from '../stores/ChatStore';

interface ColorPickerProps {
  onClose: () => void;
  position: { x: number; y: number };
}

const COLOR_PRESETS = [
  '#3b82f6', // Blue (default)
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const ColorPicker = observer(({ onClose, position }: ColorPickerProps) => {
  const [tempColor, setTempColor] = useState(chatStore.currentColor);
  const [tempMode, setTempMode] = useState(chatStore.colorSharingMode);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleApply = () => {
    chatStore.setColor(tempColor);
    chatStore.setColorSharingMode(tempMode);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 max-h-[calc(100vh-40px)] overflow-y-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Choose Color</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Color Presets */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Presets</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setTempColor(color)}
              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 transition ${
                tempColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Custom Color</p>
        <input
          type="color"
          value={tempColor}
          onChange={(e) => setTempColor(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      {/* Preview */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Preview</p>
        <div
          className="rounded-lg p-3 text-white text-sm"
          style={{ backgroundColor: tempColor }}
        >
          This is how your messages will look
        </div>
      </div>

      {/* Sharing Mode Toggle */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Visibility</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTempMode('local')}
            className={`flex-1 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
              tempMode === 'local'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Only me
          </button>
          <button
            onClick={() => setTempMode('shared')}
            className={`flex-1 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
              tempMode === 'shared'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Share with everyone
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {tempMode === 'local'
            ? 'Color visible only to you'
            : 'Everyone sees your chosen color'}
        </p>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-3 sm:py-2 rounded-lg transition touch-manipulation"
      >
        Apply
      </button>
    </div>
  );
});

export default ColorPicker;
