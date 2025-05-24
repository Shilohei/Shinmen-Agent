import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Conversation, ConversationSummary, ChatState, SendMessageRequest, Message } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

interface ChatContextType extends ChatState {
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (title: string) => Promise<string>;
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationSummary[] }
  | { type: 'ADD_CONVERSATION'; payload: ConversationSummary }
  | { type: 'UPDATE_CONVERSATION'; payload: ConversationSummary }
  | { type: 'REMOVE_CONVERSATION'; payload: string }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_CURRENT_CONVERSATION'; payload: Conversation }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isTyping: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      };
    
    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        currentConversation: state.currentConversation?.id === action.payload 
          ? null 
          : state.currentConversation,
      };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'ADD_MESSAGE':
      if (state.currentConversation?.id === action.payload.conversationId) {
        return {
          ...state,
          currentConversation: {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, action.payload.message],
          },
        };
      }
      return state;
    
    case 'UPDATE_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isTyping: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Set up socket listeners
  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.onMessageReceived((data) => {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            conversationId: data.conversationId,
            message: data.message,
          },
        });
      });

      return () => {
        socketService.offMessageReceived();
      };
    }
  }, [isAuthenticated, user]);

  const loadConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.getConversations();
      
      if (response.data) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: response.data });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadConversation = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.getConversation(id);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: response.data.conversation });
      } else {
        throw new Error(response.error || 'Failed to load conversation');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createConversation = async (title: string): Promise<string> => {
    try {
      const response = await apiService.createConversation(title);
      
      if (response.success && response.data) {
        const conversation = response.data.conversation;
        
        // Add to conversations list
        dispatch({
          type: 'ADD_CONVERSATION',
          payload: {
            id: conversation.id,
            title: conversation.title,
            messageCount: conversation.messages.length,
            lastMessage: conversation.messages[conversation.messages.length - 1] || null,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          },
        });
        
        // Set as current conversation
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
        
        return conversation.id;
      } else {
        throw new Error(response.error || 'Failed to create conversation');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const sendMessage = async (request: SendMessageRequest) => {
    try {
      dispatch({ type: 'SET_TYPING', payload: true });
      
      const response = await apiService.sendMessage(request);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_CURRENT_CONVERSATION', payload: response.data.conversation });
        
        // Update conversation in list
        const updatedConv = response.data.conversation;
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: {
            id: updatedConv.id,
            title: updatedConv.title,
            messageCount: updatedConv.messages.length,
            lastMessage: updatedConv.messages[updatedConv.messages.length - 1] || null,
            createdAt: updatedConv.createdAt,
            updatedAt: updatedConv.updatedAt,
          },
        });
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const response = await apiService.updateConversation(id, { title });
      
      if (response.success && response.data) {
        const conversation = response.data.conversation;
        
        // Update current conversation if it's the same
        if (state.currentConversation?.id === id) {
          dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
        }
        
        // Update in conversations list
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: {
            id: conversation.id,
            title: conversation.title,
            messageCount: conversation.messages.length,
            lastMessage: conversation.messages[conversation.messages.length - 1] || null,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          },
        });
      } else {
        throw new Error(response.error || 'Failed to update conversation');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await apiService.deleteConversation(id);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_CONVERSATION', payload: id });
      } else {
        throw new Error(response.error || 'Failed to delete conversation');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setCurrentConversation = (conversation: Conversation | null) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: ChatContextType = {
    ...state,
    loadConversations,
    loadConversation,
    createConversation,
    sendMessage,
    updateConversationTitle,
    deleteConversation,
    setCurrentConversation,
    clearError,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
