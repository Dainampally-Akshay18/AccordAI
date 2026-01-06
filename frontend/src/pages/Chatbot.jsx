// Chatbot.jsx - Legal Document Chatbot with Fixed Height Container
// ✨ ENHANCED: Fixed-height container with auto-scroll, JSON fix, section references
// ✅ YOUR ORIGINAL DARK SLATE THEME PRESERVED 100%

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Extract clean text from any response format
  const extractCleanResponse = (responseData) => {
    if (typeof responseData === 'string') {
      try {
        const parsed = JSON.parse(responseData);
        return extractCleanResponse(parsed);
      } catch {
        return responseData;
      }
    }

    if (typeof responseData === 'object' && responseData !== null) {
      const possibleFields = ['response', 'content', 'text', 'message', 'answer', 'result'];
      for (const field of possibleFields) {
        if (responseData[field] && typeof responseData[field] === 'string') {
          return responseData[field];
        }
      }
      return JSON.stringify(responseData, null, 2);
    }

    return String(responseData);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');

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
        const cleanResponse = extractCleanResponse(result.data.response);

        const botMessage = {
          role: 'assistant',
          content: cleanResponse,
          timestamp: result.data.timestamp,
          chunks_retrieved: result.data.chunks_retrieved,
          relevant_sections: result.data.relevant_sections || [],
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
        className={`flex items-start gap-3 mb-4 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            isUser
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
          }`}
        >
          {isUser ? 'U' : 'AI'}
        </div>

        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div
            className={`inline-block max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
              isUser
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                : 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 text-slate-200'
            }`}
          >
            {isUser ? (
              <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-sm md:prose-base prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => (
                      <p className="mb-2 last:mb-0 text-sm md:text-base text-slate-200" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-sm md:text-base text-slate-200" {...props} />
                    ),
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <code className="bg-slate-700 px-1 py-0.5 rounded text-xs text-slate-200" {...props} />
                      ) : (
                        <code className="block bg-slate-900 p-2 rounded text-xs overflow-x-auto text-slate-200" {...props} />
                      ),
                    pre: ({ node, ...props }) => (
                      <pre className="bg-slate-900/60 border border-slate-600/50 p-3 rounded overflow-x-auto mb-2" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-3 italic text-slate-300 my-2" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="min-w-full border border-slate-700" {...props} />
                      </div>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Display metadata */}
            {!isUser && (message.chunks_retrieved > 0 || message.relevant_sections?.length > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-600/50">
                {message.chunks_retrieved > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{message.chunks_retrieved} document section{message.chunks_retrieved > 1 ? 's' : ''} referenced</span>
                  </div>
                )}

                {message.relevant_sections && message.relevant_sections.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-300 mb-1">
                      📄 Referenced Sections:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {message.relevant_sections.slice(0, 3).map((section, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/50"
                          title={section.text_preview || `Section ${section.chunk_index + 1}`}
                        >
                          {section.section_reference || `Section ${section.chunk_index + 1}`}
                          {section.relevance_score && (
                            <span className="ml-1 text-[10px] opacity-75">
                              ({(section.relevance_score * 100).toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      ))}
                      {message.relevant_sections.length > 3 && (
                        <span className="text-xs text-slate-400">
                          +{message.relevant_sections.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  };

  const exampleQuestions = [
    "What are the payment terms?",
    "Is there a non-compete clause?",
    "What are the termination conditions?",
    "What penalties are mentioned?",
    "Who owns the intellectual property?"
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">
                  Legal Document Assistant
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  {documentInfo && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      📄 {documentInfo.filename || documentInfo.document_id || documentInfo.document_name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="px-3 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed Height with Scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Welcome to Accord AI Assistant
              </h2>
              <p className="text-slate-400 mb-6">
                {documentInfo 
                  ? "Ask questions about your document or general legal queries."
                  : "Ask general legal questions or upload a document."}
              </p>

              {documentInfo && (
                <div className="max-w-md mx-auto">
                  <p className="text-sm font-semibold text-slate-300 mb-3">
                    Example questions:
                  </p>
                  <div className="space-y-2">
                    {exampleQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(question)}
                        className="block w-full text-left px-4 py-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg hover:bg-slate-700/50 hover:border-purple-500/50 transition-colors text-sm text-slate-300"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => renderMessage(msg, idx))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white">
                AI
              </div>
              <div className="flex-1">
                <div className="inline-block bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                ⚠️ {error}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form - Fixed at Bottom */}
      <div className="flex-shrink-0 bg-slate-800/40 backdrop-blur-sm border-t border-slate-700/50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {documentInfo && (
            <div className="mb-3 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">
                  Search document for answers
                </span>
              </label>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about the document..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-700/50 text-white placeholder-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
