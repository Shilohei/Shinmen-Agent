import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Eye, EyeOff, Code } from 'lucide-react';
import { Message as MessageType } from '../../types';
import Button from '../ui/Button';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [showPreview, setShowPreview] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCodeAttachment = (attachment: any) => {
    return (
      <div className="mt-3 border border-secondary-200 rounded-lg overflow-hidden">
        <div className="bg-secondary-50 px-3 py-2 border-b border-secondary-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700">
              {attachment.language || 'Code'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {attachment.language && ['html', 'css', 'javascript'].includes(attachment.language.toLowerCase()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(attachment.content)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <SyntaxHighlighter
          language={attachment.language || 'text'}
          style={tomorrow as any}
          customStyle={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {attachment.content}
        </SyntaxHighlighter>

        {showPreview && attachment.language === 'html' && (
          <div className="border-t border-secondary-200">
            <div className="bg-secondary-50 px-3 py-2 border-b border-secondary-200">
              <span className="text-sm font-medium text-secondary-700">Preview</span>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={attachment.content}
                className="w-full h-64 border border-secondary-200 rounded"
                sandbox="allow-scripts"
                title="Code Preview"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVisualizationAttachment = (attachment: any) => {
    return (
      <div className="mt-3 border border-secondary-200 rounded-lg overflow-hidden">
        <div className="bg-secondary-50 px-3 py-2 border-b border-secondary-200">
          <span className="text-sm font-medium text-secondary-700">
            Data Visualization ({attachment.chartType})
          </span>
        </div>
        <div className="p-4">
          {/* This would integrate with a charting library like Chart.js or D3 */}
          <div className="bg-secondary-100 h-48 rounded flex items-center justify-center">
            <p className="text-secondary-600">Chart visualization would appear here</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAttachment = (attachment: any) => {
    switch (attachment.type) {
      case 'code':
        return renderCodeAttachment(attachment);
      case 'visualization':
        return renderVisualizationAttachment(attachment);
      case 'image':
        return (
          <div className="mt-3">
            <img
              src={attachment.url}
              alt="Attachment"
              className="max-w-full h-auto rounded-lg border border-secondary-200"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className={`max-w-3xl ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-secondary-200 text-secondary-900'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <p className="text-white m-0">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={tomorrow as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          fontSize: '14px',
                          lineHeight: '1.5',
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Render attachments */}
          {message.attachments && message.attachments.map((attachment, index) => (
            <div key={index}>
              {renderAttachment(attachment)}
            </div>
          ))}
        </div>

        <div className={`mt-1 text-xs text-secondary-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
