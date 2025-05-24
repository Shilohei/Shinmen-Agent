import React, { useState } from 'react';
import { Plus, MessageSquare, Settings, LogOut, User, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const ChatSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    createConversation, 
    loadConversation,
    updateConversationTitle,
    deleteConversation 
  } = useChat();
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateConversation = async () => {
    if (!newChatTitle.trim()) return;
    
    setIsCreating(true);
    try {
      await createConversation(newChatTitle.trim());
      setNewChatTitle('');
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTitle = async (conversationId: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await updateConversationTitle(conversationId, editTitle.trim());
      setEditingConversation(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to update conversation title:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  const startEditing = (conversationId: string, currentTitle: string) => {
    setEditingConversation(conversationId);
    setEditTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingConversation(null);
    setEditTitle('');
  };

  return (
    <div className="w-64 bg-white border-r border-secondary-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversation?.id === conversation.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-secondary-50'
              }`}
              onClick={() => loadConversation(conversation.id)}
            >
              {editingConversation === conversation.id ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editTitle}
                    onChange={setEditTitle}
                    placeholder="Conversation title"
                    className="text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditTitle(conversation.id)}
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={cancelEditing}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-secondary-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-secondary-900 truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-secondary-500 mt-1">
                        {conversation.messageCount} messages
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-secondary-400 mt-1 truncate">
                          {conversation.lastMessage.content.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conversation.id, conversation.title);
                        }}
                        className="p-1 text-secondary-400 hover:text-secondary-600 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        className="p-1 text-secondary-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-secondary-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-secondary-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start New Conversation"
      >
        <div className="space-y-4">
          <Input
            label="Conversation Title"
            value={newChatTitle}
            onChange={setNewChatTitle}
            placeholder="Enter a title for your conversation"
            required
          />
          
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsNewChatModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateConversation}
              loading={isCreating}
              disabled={!newChatTitle.trim() || isCreating}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatSidebar;
