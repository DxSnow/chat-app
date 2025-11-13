import { makeAutoObservable } from 'mobx';
import config from '../config';

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isSelf: boolean;
  color?: string; // Message bubble color (hex format)
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

class ChatStore {
  messages: Message[] = [];
  currentUser: User = {
    id: 'user-1',
    name: '',
  };
  isConnected: boolean = false;
  ws: WebSocket | null = null;
  currentColor: string = '#3b82f6'; // Default blue color
  colorSharingMode: 'local' | 'shared' = 'shared'; // Default: share with everyone

  constructor() {
    makeAutoObservable(this);
    // Load nickname and color preferences from localStorage on initialization
    this.loadNickname();
    this.loadColorPreferences();
  }

  loadNickname() {
    const savedNickname = localStorage.getItem('chatNickname');
    if (savedNickname) {
      this.currentUser.name = savedNickname;
    }
  }

  setNickname(nickname: string) {
    this.currentUser.name = nickname;
    localStorage.setItem('chatNickname', nickname);
  }

  hasNickname(): boolean {
    return this.currentUser.name.trim().length > 0;
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
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.addMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  sendMessage(content: string) {
    if (!this.ws || !this.isConnected) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: this.currentUser.name,
      timestamp: new Date(),
      isSelf: true,
      // Include color only if sharing mode is 'shared', otherwise only apply locally
      color: this.colorSharingMode === 'shared' ? this.currentColor : undefined,
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

  addMessage(message: Message) {
    this.messages.push(message);
  }

  setMessages(messages: Message[]) {
    this.messages = messages;
  }

  async loadHistoryMessages() {
    try {
      const response = await fetch(`${config.apiUrl}/api/messages`);
      if (response.ok) {
        const messages = await response.json();
        // Update isSelf flag based on current user's nickname
        const updatedMessages = messages.map((msg: Message) => ({
          ...msg,
          isSelf: msg.sender === this.currentUser.name,
        }));
        this.setMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Failed to load history messages:', error);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const chatStore = new ChatStore();
