import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  Conversation,
  ConversationSummary,
  ApiConfig,
  SendMessageRequest,
  ApiResponse,
  PaginatedResponse,
  DashboardData
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
      await this.api.post('/api/auth/login', credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
      await this.api.post('/api/auth/register', credentials);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.get('/api/auth/profile');
    return response.data;
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.put('/api/auth/profile', updates);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.put('/api/auth/password', { currentPassword, newPassword });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.post('/api/auth/logout');
    return response.data;
  }

  // Chat endpoints
  async getConversations(page = 1, limit = 20): Promise<PaginatedResponse<ConversationSummary>> {
    const response: AxiosResponse<PaginatedResponse<ConversationSummary>> = 
      await this.api.get(`/api/chat/conversations?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getConversation(id: string): Promise<ApiResponse<{ conversation: Conversation }>> {
    const response: AxiosResponse<ApiResponse<{ conversation: Conversation }>> = 
      await this.api.get(`/api/chat/conversations/${id}`);
    return response.data;
  }

  async createConversation(title: string): Promise<ApiResponse<{ conversation: Conversation }>> {
    const response: AxiosResponse<ApiResponse<{ conversation: Conversation }>> = 
      await this.api.post('/api/chat/conversations', { title });
    return response.data;
  }

  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<{ conversation: Conversation }>> {
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.conversationId) {
      formData.append('conversationId', request.conversationId);
    }
    
    if (request.attachments) {
      request.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
    }

    const response: AxiosResponse<ApiResponse<{ conversation: Conversation }>> = 
      await this.api.post(`/api/chat/conversations/${request.conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
  }

  async updateConversation(id: string, updates: { title?: string }): Promise<ApiResponse<{ conversation: Conversation }>> {
    const response: AxiosResponse<ApiResponse<{ conversation: Conversation }>> = 
      await this.api.put(`/api/chat/conversations/${id}`, updates);
    return response.data;
  }

  async deleteConversation(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.delete(`/api/chat/conversations/${id}`);
    return response.data;
  }

  // API Configuration endpoints
  async getApiConfigs(): Promise<ApiResponse<{ apiConfigs: ApiConfig[] }>> {
    const response: AxiosResponse<ApiResponse<{ apiConfigs: ApiConfig[] }>> = 
      await this.api.get('/api/apis');
    return response.data;
  }

  async getApiConfig(id: string): Promise<ApiResponse<{ apiConfig: ApiConfig }>> {
    const response: AxiosResponse<ApiResponse<{ apiConfig: ApiConfig }>> = 
      await this.api.get(`/api/apis/${id}`);
    return response.data;
  }

  async createApiConfig(config: Omit<ApiConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ApiResponse<{ apiConfig: ApiConfig }>> {
    const response: AxiosResponse<ApiResponse<{ apiConfig: ApiConfig }>> = 
      await this.api.post('/api/apis', config);
    return response.data;
  }

  async updateApiConfig(id: string, updates: Partial<ApiConfig>): Promise<ApiResponse<{ apiConfig: ApiConfig }>> {
    const response: AxiosResponse<ApiResponse<{ apiConfig: ApiConfig }>> = 
      await this.api.put(`/api/apis/${id}`, updates);
    return response.data;
  }

  async testApiConfig(id: string): Promise<ApiResponse<{ result: any }>> {
    const response: AxiosResponse<ApiResponse<{ result: any }>> = 
      await this.api.post(`/api/apis/${id}/test`);
    return response.data;
  }

  async deleteApiConfig(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.delete(`/api/apis/${id}`);
    return response.data;
  }

  // User endpoints
  async getDashboard(): Promise<ApiResponse<{ dashboard: DashboardData }>> {
    const response: AxiosResponse<ApiResponse<{ dashboard: DashboardData }>> = 
      await this.api.get('/api/user/dashboard');
    return response.data;
  }

  async updatePreferences(preferences: any): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.put('/api/user/preferences', { preferences });
    return response.data;
  }

  async exportUserData(): Promise<Blob> {
    const response = await this.api.get('/api/user/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteAccount(password: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.delete('/api/user/account', {
        data: { confirmPassword: password }
      });
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const apiService = new ApiService();
export default apiService;
