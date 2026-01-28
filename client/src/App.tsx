import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import ChatWindow from './components/ChatWindow';
import AuthModal from './components/auth/AuthModal';
import { chatStore } from './stores/ChatStore';
import { authStore } from './stores/AuthStore';
import config from './config';

const App = observer(() => {
  useEffect(() => {
    // Only connect if user is authenticated
    if (authStore.isAuthenticated) {
      // Load history messages
      chatStore.loadHistoryMessages();

      // Connect to WebSocket server
      chatStore.connectWebSocket(config.wsUrl);
    }

    // Cleanup on unmount
    return () => {
      chatStore.disconnectWebSocket();
    };
  }, [authStore.isAuthenticated]);

  if (!authStore.isAuthenticated) {
    return <AuthModal />;
  }

  return <ChatWindow />;
});

export default App;
