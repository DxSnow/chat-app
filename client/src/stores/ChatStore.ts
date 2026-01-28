import { makeAutoObservable, runInAction } from 'mobx';
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
  conversationId?: string; // ID of private conversation (null = public)
  messageType?: 'public' | 'private';
}

export interface Participant {
  _id: string;
  displayName: string;
  email: string;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  createdAt: Date;
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

  // Conversation state
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  isLoadingConversations: boolean = false;

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

  // Get the other participant in the active private conversation
  get activeConversationPartner(): Participant | null {
    if (!this.activeConversation || !this.currentUser) {
      return null;
    }
    return this.activeConversation.participants.find(
      p => p._id !== this.currentUser?.id
    ) || null;
  }

  // Get chat title for the current conversation
  get activeChatTitle(): string {
    if (!this.activeConversation) {
      return 'Select a conversation';
    }
    return this.activeConversationPartner?.displayName || 'Private Chat';
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

    // Already connected to same URL, skip
    if (this.ws && this.wsUrl === url && this.isConnected) {
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
      // Close existing connection if any - nullify handlers first to prevent state changes
      if (this.ws) {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.onopen = null;
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

        // Check if message belongs to active conversation
        const isForActiveConversation = this.activeConversation
          && data.conversationId === this.activeConversation._id;

        if (isForActiveConversation) {
          this.addMessage(data);
        }

        // Refresh conversations list to update lastMessage
        // Use silent refresh to avoid re-renders that cause input focus loss
        this.loadConversations(true);
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

    // Must have an active conversation to send a message
    if (!this.activeConversation) {
      console.error('No conversation selected');
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
      // All messages are private now
      conversationId: this.activeConversation._id,
      messageType: 'private',
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

    // No conversation selected - nothing to load
    if (!this.activeConversation) {
      this.setMessages([]);
      return;
    }

    try {
      const response = await fetch(
        `${config.apiUrl}/api/conversations/${this.activeConversation._id}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${authStore.token}`,
          },
        }
      );

      if (response.ok) {
        const messages = await response.json();
        // Update isSelf flag based on current user's display name
        const updatedMessages = messages.map((msg: Message) => ({
          ...msg,
          isSelf: msg.sender === this.currentUser?.displayName,
        }));
        runInAction(() => {
          this.setMessages(updatedMessages);
        });
      } else if (response.status === 401) {
        // Token expired or invalid
        console.error('Auth token expired');
        authStore.logout();
      }
    } catch (error) {
      console.error('Failed to load history messages:', error);
    }
  }

  // Load user's conversations
  // silent=true skips loading state updates to prevent input focus loss
  async loadConversations(silent = false) {
    if (!authStore.token) {
      return;
    }

    if (!silent) {
      this.isLoadingConversations = true;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });

      if (response.ok) {
        const conversations = await response.json();
        runInAction(() => {
          this.conversations = conversations;
        });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      if (!silent) {
        runInAction(() => {
          this.isLoadingConversations = false;
        });
      }
    }
  }

  // Select a conversation
  async selectConversation(conversation: Conversation | null) {
    this.activeConversation = conversation;
    this.messages = []; // Clear current messages
    await this.loadHistoryMessages(); // Load messages for this conversation
  }

  // Start a new private conversation with a user by their ID
  async startConversation(userId: string): Promise<Conversation | null> {
    if (!authStore.token) {
      return null;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: userId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        // Add to conversations list if not already there
        runInAction(() => {
          const exists = this.conversations.find(c => c._id === conversation._id);
          if (!exists) {
            this.conversations.unshift(conversation);
          }
        });
        // Select the new conversation
        await this.selectConversation(conversation);
        return conversation;
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
    return null;
  }

  // Find or create conversation by username
  async findConversationByUsername(username: string): Promise<{ conversation: Conversation | null; error: string | null }> {
    if (!authStore.token) {
      return { conversation: null, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/conversations/by-username`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const conversation = await response.json();
        // Add to conversations list if not already there
        runInAction(() => {
          const exists = this.conversations.find(c => c._id === conversation._id);
          if (!exists) {
            this.conversations.unshift(conversation);
          }
        });
        // Select the new conversation
        await this.selectConversation(conversation);
        return { conversation, error: null };
      } else {
        const errorData = await response.json();
        return { conversation: null, error: errorData.error || 'User not found' };
      }
    } catch (error) {
      console.error('Failed to find conversation by username:', error);
      return { conversation: null, error: 'Failed to connect to server' };
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
    this.conversations = [];
    this.activeConversation = null;
  }
}

export const chatStore = new ChatStore();
