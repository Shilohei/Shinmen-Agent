import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import Message from '../components/chat/Message';
import ChatInput from '../components/chat/ChatInput';
import { MessageSquare } from 'lucide-react';

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { 
    currentConversation, 
    loadConversation, 
    loadConversations, 
    isLoading, 
    error 
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load specific conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          Welcome to AI Agent Platform
        </h3>
        <p className="text-secondary-600 mb-6">
          Start a conversation with our AI agent. Ask questions, request code generation, 
          data analysis, or get help with any task.
        </p>
        <div className="space-y-2 text-sm text-secondary-500">
          <p>💡 Try asking: "Generate a React component for a todo list"</p>
          <p>📊 Or: "Analyze this data and create a visualization"</p>
          <p>🔧 Or: "Help me debug this JavaScript function"</p>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => {
    if (!currentConversation?.messages.length) {
      return renderEmptyState();
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {currentConversation.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const renderError = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-secondary-600 mb-4">
          {error || 'Failed to load conversation'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-secondary-600">Loading conversation...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-secondary-50">
      {/* Sidebar */}
      <ChatSidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-secondary-900">
                {currentConversation?.title || 'AI Agent Chat'}
              </h1>
              {currentConversation && (
                <p className="text-sm text-secondary-500">
                  {currentConversation.messages.length} messages
                </p>
              )}
            </div>
            
            {/* Additional header actions could go here */}
            <div className="flex items-center space-x-2">
              {/* API status, settings, etc. */}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        {isLoading ? renderLoading() : error ? renderError() : renderMessages()}

        {/* Input Area */}
        <ChatInput conversationId={conversationId} />
      </div>
    </div>
  );
};

export default Chat;
