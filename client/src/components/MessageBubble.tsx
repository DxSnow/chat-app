import type { Message } from '../stores/ChatStore';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] md:max-w-[60%] rounded-lg px-4 py-2 ${
          message.isSelf
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800 shadow-sm'
        }`}
      >
        <div
          className={`text-xs font-semibold mb-1 ${
            message.isSelf ? 'text-blue-100' : 'text-gray-600'
          }`}
        >
          {message.sender}
        </div>
        <div className="break-words">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            message.isSelf ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
