import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Button from '../ui/Button';

interface ChatInputProps {
  conversationId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sendMessage, isTyping, createConversation } = useChat();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) return;

    const messageText = message.trim();
    setMessage('');
    setAttachments([]);

    try {
      let targetConversationId = conversationId;
      
      // If no conversation exists, create one
      if (!targetConversationId) {
        const title = messageText.length > 50 
          ? messageText.substring(0, 50) + '...' 
          : messageText;
        targetConversationId = await createConversation(title);
      }

      await sendMessage({
        message: messageText,
        conversationId: targetConversationId,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border-t border-secondary-200 bg-white p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-secondary-50 rounded-lg p-2"
            >
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-secondary-500" />
                <span className="text-sm text-secondary-700">{file.name}</span>
                <span className="text-xs text-secondary-500">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={1}
            style={{ maxHeight: '120px' }}
            disabled={isTyping}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.csv"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={(!message.trim() && attachments.length === 0) || isTyping}
            loading={isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      {isTyping && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-secondary-500">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
