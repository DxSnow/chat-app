// Configuration file for environment-specific settings
const config = {
  // Backend API URL - defaults to localhost in development
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',

  // WebSocket URL - defaults to localhost in development
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
};

export default config;
