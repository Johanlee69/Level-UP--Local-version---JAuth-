import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../../utils/api';
import './TaskSuggestions.css';

const TaskSuggestions = ({ tasks, onAddTask }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState(null);

  // Get the most recent task from daily tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    // Sort tasks by creation date (newest first)
    const sortedTasks = [...tasks].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Get the most recent task
    const recentTask = sortedTasks[0];
    if (!recentTask) return;

    // Only fetch suggestions if we have a recent task
    fetchSuggestions(recentTask);
  }, [tasks]);

  // Function to fetch suggestions from AI based on recent task
  const fetchSuggestions = async (recentTask) => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `Based on your task "${recentTask.title}", here are some related tasks. Each must be a single line. Use *asterisks* for bold text or important words. Respond with 5 bullet points only,no confirmation just the task`;
      
      const response = await chatAPI.sendMessage(prompt);
      
      if (response && response.data && response.data.message) {
        // Parse bullet points from the response
        const parsedSuggestions = parseBulletPoints(response.data.message);
        setSuggestions(parsedSuggestions);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Could not generate new tasks, wait 6 seconds..');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse bullet points from the AI response
  const parseBulletPoints = (text) => {
    const bulletRegex = /(?:^|\n)[•\-*]?\s*(.+?)(?=\n|$)/g;
    const matches = [...text.matchAll(bulletRegex)];
    
    return matches.map((match, index) => ({
      id: `suggestion-${index}`,
      text: match[1].trim(),
      formattedText: formatText(match[1].trim())
    }));
  };

  // Function to format text with markdown-like styling
  const formatText = (text) => {
    return text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  };

  // Function to add a suggestion as a new task
  const handleAddSuggestion = (suggestion) => {
    if (onAddTask) {
      // Strip formatting when adding as a task
      const plainText = suggestion.text.replace(/\*([^*]+)\*/g, '$1');
      onAddTask(plainText);
      
      // Remove the suggestion from the list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  };

  // Toggle the open/closed state
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // No suggestions, don't render anything
  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`task-suggestions-container ${isOpen ? 'open' : 'closed'}`}>
      <div 
        className="task-suggestions-header"
        onClick={toggleOpen}
      >
        <h3>Task Suggestions</h3>
        <div className="toggle-indicator">
          {isOpen ? '×' : '+'}
        </div>
      </div>
      
      <div className="task-suggestions-content">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Getting suggestions...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <ul className="suggestions-list">
            {suggestions.map(suggestion => (
              <li 
                key={suggestion.id} 
                className="suggestion-item"
                onClick={() => handleAddSuggestion(suggestion)}
              >
                <span 
                  className="suggestion-text"
                  dangerouslySetInnerHTML={{ __html: suggestion.formattedText }}
                />
                <button 
                  className="add-suggestion-button"
                  aria-label="Add this task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskSuggestions; 