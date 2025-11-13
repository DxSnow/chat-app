import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { chatStore } from '../stores/ChatStore';
import MessageBubble from './MessageBubble';

const MessageList = observer(() => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatStore.messages.length]); // Track length to ensure scroll on every new message

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {chatStore.messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-center">
            No messages yet. Start chatting!
          </p>
        </div>
      ) : (
        chatStore.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
