import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import ChatWindow from './components/ChatWindow';
import NicknameModal from './components/NicknameModal';
import { chatStore } from './stores/ChatStore';
import config from './config';

const App = observer(() => {
  useEffect(() => {
    // Only connect if user has a nickname
    if (chatStore.hasNickname()) {
      // Load history messages
      chatStore.loadHistoryMessages();

      // Connect to WebSocket server
      chatStore.connectWebSocket(config.wsUrl);
    }

    // Cleanup on unmount
    return () => {
      chatStore.disconnectWebSocket();
    };
  }, []);

  const handleNicknameSubmit = (nickname: string) => {
    chatStore.setNickname(nickname);
    // Connect after nickname is set
    chatStore.loadHistoryMessages();
    chatStore.connectWebSocket(config.wsUrl);
  };

  if (!chatStore.hasNickname()) {
    return <NicknameModal onSubmit={handleNicknameSubmit} />;
  }

  return <ChatWindow />;
});

export default App;
