// Chatbot.jsx - Legal Document Chatbot with Markdown Support (Mobile-Optimized)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  sendChatMessage, 
  getChatHistory, 
  clearChatHistory,
  getChatSummary 
} from '../services/api';

const Chatbot = ({ documentInfo, sessionId }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    loadChatHistory();
    loadConversationSummary();
  }, []);

  const loadChatHistory = async () => {
    try {
      const result = await getChatHistory();
      if (result.success && result.data.messages) {
        const formattedMessages = result.data.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          document_id: msg.document_id
        }));
        setMessages(formattedMessages);
        console.log('✅ Loaded chat history:', formattedMessages.length, 'messages');
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const loadConversationSummary = async () => {
    try {
      const result = await getChatSummary();
      if (result.success) {
        setConversationSummary(result.data);
      }
    } catch (err) {
      console.error('Failed to load conversation summary:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');

    // Add user message to UI immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      const result = await sendChatMessage({
        message: userMessage,
        document_id: documentInfo?.document_id || null,
        use_rag: useRag && !!documentInfo?.document_id
      });

      if (result.success) {
        const botMessage = {
          role: 'assistant',
          content: result.data.response,
          timestamp: result.data.timestamp,
          chunks_retrieved: result.data.chunks_retrieved,
          relevant_sections: result.data.relevant_sections,
          used_rag: result.data.used_rag
        };
        setMessages(prev => [...prev, botMessage]);
        loadConversationSummary();
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('An error occurred while sending your message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the conversation history?')) {
      return;
    }

    try {
      const result = await clearChatHistory();
      if (result.success) {
        setMessages([]);
        setConversationSummary(null);
        console.log('✅ Conversation cleared');
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
      setError('Failed to clear conversation');
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={`flex mb-4 sm:mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
      >
        <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-2xl p-3 sm:p-4 shadow-lg ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
              : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold opacity-80">
                {isUser ? '👤 You' : '🤖 Legal Assistant'}
              </span>
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            {/* Markdown Content */}
            <div className={`text-sm leading-relaxed ${
              isUser ? 'markdown-user' : 'markdown-bot'
            }`}>
              {isUser ? (
                // User messages - simple text
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              ) : (
                // Bot messages - rendered with markdown
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom styling for markdown elements
                    h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-bold mb-2 mt-2 sm:mt-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 mt-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 break-words" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 sm:mb-3 space-y-1 pl-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 sm:mb-3 space-y-1 pl-2" {...props} />,
                    li: ({node, ...props}) => <li className="ml-2 break-words" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-blue-300" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-slate-300" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? (
                        <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-xs text-blue-300 font-mono break-all" {...props} />
                      ) : (
                        <code className="block bg-slate-900/50 p-2 sm:p-3 rounded-lg text-xs text-blue-300 font-mono overflow-x-auto my-2" {...props} />
                      ),
                    pre: ({node, ...props}) => <pre className="bg-slate-900/50 p-2 sm:p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500 pl-3 sm:pl-4 italic my-2 text-slate-300" {...props} />
                    ),
                    a: ({node, ...props}) => (
                      <a className="text-blue-400 hover:text-blue-300 underline break-all" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-2 sm:my-3 -mx-2 sm:mx-0">
                        <table className="min-w-full border border-slate-700 text-xs" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => <thead className="bg-slate-700/50" {...props} />,
                    th: ({node, ...props}) => <th className="border border-slate-700 px-2 sm:px-3 py-1 sm:py-2 text-left font-semibold" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-700 px-2 sm:px-3 py-1 sm:py-2 break-words" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
            
            {!isUser && message.used_rag && message.chunks_retrieved > 0 && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50">
                <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                  📄 Used {message.chunks_retrieved} section{message.chunks_retrieved > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const exampleQuestions = [
    "What are the key risks in this contract?",
    "Explain the payment terms",
    "What is the termination clause?",
    "Are there any penalties mentioned?",
    "What are my obligations?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] sm:h-[calc(100vh-300px)] lg:h-[calc(100vh-350px)] min-h-[500px] sm:min-h-[600px] bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 p-3 sm:p-4 lg:p-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
              💬 Legal Chatbot
            </h2>
            {documentInfo && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">
                📄 {documentInfo.filename || documentInfo.document_id || documentInfo.document_name}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {documentInfo && (
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-blue-500"
                />
                <span className="font-medium whitespace-nowrap">Use Context</span>
              </label>
            )}
            
            {messages.length > 0 && (
              <button 
                className="px-3 sm:px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 border border-red-500/50 whitespace-nowrap"
                onClick={handleClearChat}
                title="Clear conversation"
              >
                🗑️ <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation Summary */}
        {conversationSummary && conversationSummary.message_count > 0 && (
          <div className="mt-2 sm:mt-3 flex gap-3 sm:gap-4 text-xs text-slate-400 flex-wrap">
            <span>💬 {conversationSummary.message_count} msgs</span>
            {conversationSummary.documents_discussed?.length > 0 && (
              <span className="hidden sm:inline">📄 {conversationSummary.documents_discussed.length} doc(s)</span>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-slate-900/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center p-4 sm:p-8">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 opacity-80">💬</div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Start a conversation
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-md mb-6 sm:mb-8">
              {documentInfo 
                ? "Ask questions about your document or general legal queries."
                : "Ask general legal questions or upload a document."}
            </p>
            
            {documentInfo && (
              <div className="flex flex-col gap-2 sm:gap-3 max-w-xl w-full">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-1 sm:mb-2">Example questions:</p>
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 hover:translate-x-2 text-left text-xs sm:text-sm"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            {isLoading && (
              <div className="flex justify-start mb-4 sm:mb-6">
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-3 sm:p-4">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/40 backdrop-blur-sm border-t border-red-500/30 px-3 sm:px-5 py-2 sm:py-3 flex-shrink-0">
          <p className="text-red-300 text-xs sm:text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Input Area */}
      <form className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 p-3 sm:p-4 lg:p-5 flex-shrink-0" onSubmit={handleSendMessage}>
        <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={documentInfo 
              ? "Ask about your document..." 
              : "Ask a legal question..."}
            className="flex-1 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 bg-slate-900/60 border border-slate-600/50 rounded-lg text-sm sm:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 sm:px-6 lg:px-7 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/50 disabled:hover:translate-y-0 disabled:cursor-not-allowed whitespace-nowrap"
            disabled={isLoading || !inputMessage.trim()}
          >
            {isLoading ? '⏳' : '📤'}
            <span className="hidden sm:inline ml-1">{isLoading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1">
            💡 <span className="hidden sm:inline">Supports **bold**, *italic*, lists, and code</span>
            <span className="sm:hidden">Markdown supported</span>
          </span>
          {!documentInfo && (
            <span className="text-orange-400 font-medium text-xs">
              ⚠️ No document
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
