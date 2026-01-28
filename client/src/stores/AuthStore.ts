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

  // OTP flow state
  otpSent: boolean = false;
  otpEmail: string = '';
  otpUsername: string = '';

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

  async register(email: string, password: string, username?: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.register(email, password, username);
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

  async requestOTP(email: string, username?: string) {
    this.isLoading = true;
    this.error = null;

    try {
      await authService.requestOTP(email);
      runInAction(() => {
        this.otpSent = true;
        this.otpEmail = email;
        this.otpUsername = username || '';
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to send code';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async verifyOTP(email: string, code: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.verifyOTP(email, code, this.otpUsername || undefined);
      runInAction(() => {
        this.setAuth(response.token, response.user);
        this.otpSent = false;
        this.otpEmail = '';
        this.otpUsername = '';
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Invalid code';
      });
      throw error;
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
    this.otpSent = false;
    this.otpEmail = '';
    this.otpUsername = '';
    this.error = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Also clear old nickname data
    localStorage.removeItem('chatNickname');
  }

  clearError() {
    this.error = null;
  }

  resetOTPFlow() {
    this.otpSent = false;
    this.otpEmail = '';
    this.otpUsername = '';
    this.error = null;
  }
}

export const authStore = new AuthStore();
