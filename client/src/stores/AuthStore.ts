import { makeAutoObservable, runInAction } from 'mobx';
import * as authService from '../services/authService';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

class AuthStore {
  user: AuthUser | null = null;
  token: string | null = null;
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  loadFromStorage() {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('authUser');

    if (token && userJson) {
      try {
        this.token = token;
        this.user = JSON.parse(userJson);
        this.isAuthenticated = true;
      } catch {
        this.clearAuth();
      }
    }
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.login(email, password);
      runInAction(() => {
        this.setAuth(response.token, response.user);
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async register(
    email: string,
    password: string,
    username?: string,
    secretWord?: string
  ) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.register(email, password, username, secretWord);
      runInAction(() => {
        this.setAuth(response.token, response.user);
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Registration failed';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async verifyEmailForReset(email: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      await authService.verifyEmailForReset(email);
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Email verification failed';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async resetPassword(email: string, secretWord: string, newPassword: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      await authService.resetPassword(email, secretWord, newPassword);
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Password reset failed';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async updateDisplayName(displayName: string): Promise<boolean> {
    if (!this.token) {
      this.error = 'Not authenticated';
      return false;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.updateProfile(this.token, displayName);
      runInAction(() => {
        if (this.user) {
          this.user = response.user;
          localStorage.setItem('authUser', JSON.stringify(response.user));
        }
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update display name';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  setAuth(token: string, user: AuthUser) {
    this.token = token;
    this.user = user;
    this.isAuthenticated = true;
    this.error = null;
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  logout() {
    this.clearAuth();
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    this.error = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Also clear old nickname data
    localStorage.removeItem('chatNickname');
  }

  clearError() {
    this.error = null;
  }
}

export const authStore = new AuthStore();
