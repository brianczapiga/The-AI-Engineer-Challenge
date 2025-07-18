'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const DEFAULT_DEVELOPER_MESSAGE = 'You are a helpful assistant.';
const DEFAULT_MODEL = 'gpt-4.1-mini';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_KEY || '');
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) setShowApiKeyPrompt(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/chat`;
      console.log('Chat API URL:', url);
      
      // Build conversation history for the API
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Add the current user message
      conversationHistory.push({
        role: 'user',
        content: input
      });
      
      console.log('Sending conversation history:', conversationHistory.length, 'messages');
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          developer_message: DEFAULT_DEVELOPER_MESSAGE,
          user_message: input,
          conversation_history: conversationHistory,
          model: DEFAULT_MODEL,
          api_key: apiKey,
        }),
      });
      if (!res.ok) throw new Error('Backend error');
      
      const data = await res.text();
      setMessages((prev) => [...prev, { sender: 'ai', text: data || 'No response.' }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error contacting AI backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100%',
    backgroundColor: '#f3f4f6',
    padding: '16px'
  };

  const chatWindowStyle = {
    flex: 1,
    width: '80%',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px',
    paddingBottom: '100px'  // Add extra padding at bottom to account for fixed input bar
  };

  const messageRowStyle = {
    display: 'flex',
    marginBottom: '16px'
  };

  const userMessageStyle = {
    justifyContent: 'flex-end' as const
  };

  const aiMessageStyle = {
    justifyContent: 'flex-start' as const
  };

  const messageBubbleStyle = {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    lineHeight: '1.5',
    wordBreak: 'break-word' as const
  };

  const userBubbleStyle = {
    ...messageBubbleStyle,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    borderBottomRightRadius: '8px'
  };

  const aiBubbleStyle = {
    ...messageBubbleStyle,
    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    color: '#1f2937',
    borderBottomLeftRadius: '8px'
  };

  const inputContainerStyle = {
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    padding: '16px'
  };

  const inputRowStyle = {
    display: 'flex',
    gap: '12px'
  };

  const inputStyle = {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  if (showApiKeyPrompt) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: '16px',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '32px'
          }}>
            <form onSubmit={handleApiKeySubmit} style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <label style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Enter your OpenAI API Key:
                <input
                  type="password"
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <button
                type="submit"
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={chatWindowStyle}>
        <div style={messagesContainerStyle}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...messageRowStyle,
                ...(msg.sender === 'user' ? userMessageStyle : aiMessageStyle)
              }}
            >
              <div style={msg.sender === 'user' ? userBubbleStyle : aiBubbleStyle}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div style={{
        ...inputContainerStyle,
        position: 'fixed' as const,
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '1200px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: 'none'
      }}>
        <div style={inputRowStyle}>
          <input
            type="text"
            style={inputStyle}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={loading || !input.trim() ? disabledButtonStyle : buttonStyle}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 