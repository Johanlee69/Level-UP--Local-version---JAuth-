import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../Context/AuthContext';
import { chatAPI } from '../../../utils/api';
import './Sidebar.css';

// Enhanced markdown formatter
const formatMarkdown = (text) => {
  if (!text) return '';
  
  // Fix numbered lists that might be separated by newlines
  text = text.replace(/(\d+\.\s+.*?)(\n\n)(\d+\.\s+)/g, '$1\n$3');
  
  // Format unordered lists
  text = text.replace(/^\*\s+(.*?)(?=\n|$)/gm, '<li>$1</li>');
  text = text.replace(/^-\s+(.*?)(?=\n|$)/gm, '<li>$1</li>');
  
  // Format ordered lists
  text = text.replace(/^(\d+)\.\s+(.*?)(?=\n|$)/gm, '<li>$1. $2</li>');
  
  // Group consecutive list items
  let hasLists = true;
  while (hasLists) {
    const before = text;
    text = text.replace(/(<li>.*?<\/li>)(\s*)(<li>.*?<\/li>)/, '$1$3');
    if (before === text) {
      hasLists = false;
    }
  }
  
  // Wrap lists with ul/ol tags
  text = text.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  // Format headings (support for multiple #s)
  text = text.replace(/^(#{1,6})\s+(.*?)(?=\n|$)/gm, (match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });
  
  // Format bold text - do this before italic to handle cases like ***bold and italic***
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Format italic text
  text = text.replace(/\*([^\s*][^*]*?)\*/g, '<em>$1</em>');
  text = text.replace(/_([^\s_][^_]*?)_/g, '<em>$1</em>');
  
  // Format links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Format code blocks with language highlighting
  text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1">$2</code></pre>');
  
  // Format code blocks without language
  text = text.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');
  
  // Format inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Add paragraph tags to text blocks
  text = text.replace(/(?:\n\n)([^<\n].*?)(?=\n\n|$)/g, '<p>$1</p>');
  
  // Clean up extra paragraphs
  text = text.replace(/<p><\/p>/g, '');
  
  // Replace single newlines with breaks, but not inside code blocks
  text = text.replace(/\n(?!<\/code>)/g, '<br>');
  
  return text;
};

export const SidebarToggle = ({ isOpen, toggleSidebar }) => {
  return (
    <button
      onClick={toggleSidebar}
      className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <div className="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { text: "Welcome! I'm your AI assistant. How can I help you level up your productivity today?", sender: 'assistant' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (chatMessage.trim() === '' || isLoading) return;

    // Add user message to chat
    const newUserMessage = { text: chatMessage, sender: 'user' };
    setChatMessages(prev => [...prev, newUserMessage]);
    
    // Clear input field
    const userQuery = chatMessage;
    setChatMessage('');
    
    // Set loading state
    setIsLoading(true);
    
    // Add loading indicator
    setChatMessages(prev => [...prev, { text: "Thinking...", sender: 'assistant', isLoading: true }]);
    
    try {
      // Send request to backend using our API utility
      const response = await chatAPI.sendMessage(userQuery);
      
      // Remove loading message
      setChatMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // Add AI response
      if (response.success) {
        setChatMessages(prev => [...prev, { 
          text: response.data.message, 
          sender: 'assistant',
          isFormatted: true
        }]);
      } else {
        throw new Error(response.error || 'Response not successful');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Remove loading message
      setChatMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // Add error message
      setChatMessages(prev => [...prev, { 
        text: `Sorry, I couldn't process your request: ${error.message || 'Please try again later.'}`, 
        sender: 'assistant',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar content */}
      <div className={`sidebar ${isOpen ? 'open' : ''} `}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="app-logo">
              <span className="logo-text gradient-text">Level UP</span>
            </div>
          </div>

          {/* System Section (formerly AI Assistant) */}
          <div className="sidebar-section">
            <h3 className="section-title title-gradient">System</h3>
            <div className="chat-container" style={{ height: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`chat-message ${msg.sender} ${msg.isLoading ? 'loading' : ''} ${msg.isError ? 'error' : ''}`}
                  >
                    {msg.isFormatted ? (
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                    ) : (
                      msg.text
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-form" style={{ marginTop: 'auto' }}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask for productivity tips..."
                  className="chat-input"
                  disabled={isLoading}
                />
                <button type="submit" className={`chat-send-btn ${isLoading ? 'disabled' : ''}`} disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar footer with logout */}
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={logout}>
              <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9.5a1 1 0 10-2 0V15H4V5h10v2.5a1 1 0 102 0V4a1 1 0 00-1-1H3z" clipRule="evenodd" />
                <path d="M16 3a1 1 0 011 1v4.5a1 1 0 11-2 0V5.83l-5.58 5.59a1 1 0 01-1.41-1.42l5.58-5.58H10.5a1 1 0 110-2H16z" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
