// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  codeStyle?: string;
  defaultLanguage?: string;
  [key: string]: any;
}

// Authentication types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'code' | 'image' | 'file' | 'visualization';
  url?: string;
  content?: string;
  language?: string;
  chartType?: string;
  data?: any;
  metadata?: any;
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: Message | null;
  createdAt: string;
  updatedAt: string;
}

// API Configuration types
export interface ApiConfig {
  id: string;
  userId: string;
  providerName: string;
  description?: string;
  endpointUrl: string;
  authType: 'apiKey' | 'bearer' | 'oauth';
  credentials: {
    apiKey?: string;
    bearerToken?: string;
    clientId?: string;
    clientSecret?: string;
  };
  modelName?: string;
  requestTemplate: any;
  responseMapping: any;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Chat types
export interface ChatState {
  conversations: ConversationSummary[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  attachments?: File[];
}

// UI types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'textarea';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Code preview types
export interface CodePreviewProps {
  code: string;
  language: string;
  showPreview?: boolean;
  onPreviewToggle?: () => void;
}

export interface SandboxResult {
  success: boolean;
  output?: string;
  error?: string;
  logs?: string[];
}

// Dashboard types
export interface DashboardStats {
  conversationCount: number;
  apiConfigCount: number;
  totalMessages: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  recentActivity: {
    conversations: ConversationSummary[];
  };
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Socket types
export interface SocketEvents {
  'message-received': (data: { conversationId: string; message: Message }) => void;
  'typing-start': (data: { conversationId: string; userId: string }) => void;
  'typing-stop': (data: { conversationId: string; userId: string }) => void;
  'user-connected': (data: { userId: string }) => void;
  'user-disconnected': (data: { userId: string }) => void;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | undefined;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}
