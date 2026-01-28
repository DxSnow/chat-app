import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import ChatWindow from './components/ChatWindow';
import AuthModal from './components/auth/AuthModal';
import { chatStore } from './stores/ChatStore';
import { authStore } from './stores/AuthStore';
import config from './config';

const App = observer(() => {
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Only connect if user is authenticated and not already connected
    if (authStore.isAuthenticated && !isConnectedRef.current) {
      isConnectedRef.current = true;

      // Load history messages
      chatStore.loadHistoryMessages();

      // Connect to WebSocket server
      chatStore.connectWebSocket(config.wsUrl);
    }

    // Disconnect when logging out
    if (!authStore.isAuthenticated && isConnectedRef.current) {
      isConnectedRef.current = false;
      chatStore.disconnectWebSocket();
    }
  }, [authStore.isAuthenticated]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      chatStore.disconnectWebSocket();
    };
  }, []);

  if (!authStore.isAuthenticated) {
    return <AuthModal />;
  }

  return <ChatWindow />;
});

export default App;
