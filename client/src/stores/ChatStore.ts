import { makeAutoObservable } from 'mobx';
import config from '../config';
import { authStore } from './AuthStore';

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isSelf: boolean;
  color?: string; // Message bubble color (hex format)
  imageUrl?: string; // URL to uploaded image
  hasImage?: boolean; // Flag indicating if message has an image
}

class ChatStore {
  messages: Message[] = [];
  isConnected: boolean = false;
  ws: WebSocket | null = null;
  currentColor: string = '#3b82f6'; // Default blue color
  colorSharingMode: 'local' | 'shared' = 'shared'; // Default: share with everyone
  wsUrl: string = ''; // Store the WebSocket URL for reconnection
  reconnectAttempts: number = 0;
  maxReconnectAttempts: number = 10;
  reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadColorPreferences();
  }

  // Get current user from AuthStore
  get currentUser() {
    return authStore.user;
  }

  // Check if user is authenticated
  get isAuthenticated() {
    return authStore.isAuthenticated;
  }

  loadColorPreferences() {
    const savedColor = localStorage.getItem('chatColor');
    const savedMode = localStorage.getItem('chatColorSharingMode');
    if (savedColor) {
      this.currentColor = savedColor;
    }
    if (savedMode === 'local' || savedMode === 'shared') {
      this.colorSharingMode = savedMode;
    }
  }

  setColor(color: string) {
    this.currentColor = color;
    localStorage.setItem('chatColor', color);
  }

  setColorSharingMode(mode: 'local' | 'shared') {
    this.colorSharingMode = mode;
    localStorage.setItem('chatColorSharingMode', mode);
  }

  connectWebSocket(url: string) {
    // Must be authenticated to connect
    if (!authStore.isAuthenticated || !authStore.token) {
      console.error('Not authenticated, cannot connect WebSocket');
      return;
    }

    // Store base URL for reconnection attempts
    this.wsUrl = url;

    // Add token to WebSocket URL
    const wsUrlWithToken = `${url}?token=${authStore.token}`;

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(wsUrlWithToken);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle auth errors from server
        if (data.type === 'auth_error') {
          console.error('WebSocket auth error:', data.message);
          authStore.logout();
          return;
        }

        this.addMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        console.log('WebSocket disconnected', event.code, event.reason);

        // Don't reconnect if closed due to auth failure (4001)
        if (event.code === 4001) {
          console.log('WebSocket closed due to auth failure');
          authStore.logout();
          return;
        }

        // Attempt to reconnect if still authenticated
        if (authStore.isAuthenticated) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      if (authStore.isAuthenticated) {
        this.attemptReconnect();
      }
    }
  }

  attemptReconnect() {
    // Don't reconnect if we've exceeded max attempts, not authenticated, or wsUrl not set
    if (!this.wsUrl || !authStore.isAuthenticated || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
      }
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Attempting to reconnect in ${delay / 1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting...');
      this.connectWebSocket(this.wsUrl);
    }, delay);
  }

  sendMessage(content: string, imageUrl?: string) {
    if (!this.ws || !this.isConnected || !this.currentUser) {
      console.error('WebSocket is not connected or user not authenticated');
      return;
    }

    const message: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: this.currentUser.displayName,
      timestamp: new Date(),
      isSelf: true,
      // Include color only if sharing mode is 'shared', otherwise only apply locally
      color: this.colorSharingMode === 'shared' ? this.currentColor : undefined,
      imageUrl,
      hasImage: !!imageUrl,
    };

    this.ws.send(JSON.stringify(message));
    // In local mode, don't store color on message (use currentColor reactively)
    // In shared mode, store the color on the message (immutable)
    if (this.colorSharingMode === 'shared') {
      this.addMessage({ ...message, color: this.currentColor });
    } else {
      this.addMessage(message); // No color property for local mode
    }
  }

  async sendImage(file: File) {
    if (!this.ws || !this.isConnected || !authStore.token) {
      console.error('WebSocket is not connected or not authenticated');
      throw new Error('Not connected to server');
    }

    try {
      // Upload image to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${config.apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: formData,
      });

      // Parse error response from server
      if (!response.ok) {
        let errorMessage = 'Failed to upload image';

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If can't parse JSON, use status text
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Send message with image URL
      const fullImageUrl = `${config.apiUrl}${data.imageUrl}`;
      this.sendMessage('', fullImageUrl);

      return data;
    } catch (error: unknown) {
      console.error('Error uploading image:', error);

      // Add more context to network errors
      if (error instanceof Error && error.message === 'Failed to fetch') {
        throw new Error('Network error: Could not connect to server. Check your internet connection.');
      }

      throw error;
    }
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }

  setMessages(messages: Message[]) {
    this.messages = messages;
  }

  async loadHistoryMessages() {
    if (!authStore.token) {
      console.error('Not authenticated, cannot load messages');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });

      if (response.ok) {
        const messages = await response.json();
        // Update isSelf flag based on current user's display name
        const updatedMessages = messages.map((msg: Message) => ({
          ...msg,
          isSelf: msg.sender === this.currentUser?.displayName,
        }));
        this.setMessages(updatedMessages);
      } else if (response.status === 401) {
        // Token expired or invalid
        console.error('Auth token expired');
        authStore.logout();
      }
    } catch (error) {
      console.error('Failed to load history messages:', error);
    }
  }

  disconnectWebSocket() {
    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Reset reconnection state
    this.reconnectAttempts = 0;
    this.wsUrl = '';

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Clear messages when logging out
  clearMessages() {
    this.messages = [];
  }
}

export const chatStore = new ChatStore();
