import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, addHours, differenceInSeconds, differenceInHours, parseISO, isAfter } from 'date-fns';
import '../../Login_page/Login.css';
import './CustomTaskCards.css';
import { useLevel } from '../../../Context/LevelContext';

export const CustomTaskCards = ({ calendarTasks, initialCards = [], onCardsChange, onDeleteCard }) => {
  // Use a safe default in case initialCards is not an array
  const safeInitialCards = Array.isArray(initialCards) ? initialCards : [];
  // Remove default cards, just use what's provided from parent
  const [cards, setCards] = useState(safeInitialCards);
  // Use ref to avoid dependency in useEffect
  const previousInitialCardsRef = useRef(JSON.stringify(safeInitialCards));
  
  // Update cards when initialCards changes - only if they're actually different
  useEffect(() => {
    const currentInitialCardsStr = JSON.stringify(initialCards);
    if (previousInitialCardsRef.current !== currentInitialCardsStr) {
      setCards(Array.isArray(initialCards) ? initialCards : []);
      previousInitialCardsRef.current = currentInitialCardsStr;
    }
  }, [initialCards]);
  
  useEffect(() => {
    if (cards.length === 0 && (!initialCards || initialCards.length === 0)) {
      try {
        const storedCards = localStorage.getItem('taskCards');
        if (storedCards) {
          const parsedCards = JSON.parse(storedCards);
          if (Array.isArray(parsedCards) && parsedCards.length > 0) {
            setCards(parsedCards);
            // Also notify parent component if needed
            if (onCardsChange) {
              onCardsChange(parsedCards);
            }
          }
        }
      } catch (error) {
        // Handle error silently
      }
    }
  }, []);
  
  // Process calendar tasks and add them to cards
  useEffect(() => {
    if (!calendarTasks || Object.keys(calendarTasks).length === 0) {
      const hasCalendarCards = cards.some(card => card.fromCalendar);
      
      if (hasCalendarCards) {
        const nonCalendarCards = cards.filter(card => !card.fromCalendar);
        setCards(nonCalendarCards);
        
        // Notify parent only if we actually removed something
        if (nonCalendarCards.length !== cards.length && onCardsChange) {
          onCardsChange(nonCalendarCards);
        }
      }
      return;
    }
    //render tasks 
    const newCards = [];
    let cardsChanged = false;

    if (cardsChanged && newCards.length > 0) {
      const nonCalendarCards = cards.filter(card => !card.fromCalendar);
      const updatedCards = [...nonCalendarCards, ...newCards]; 
      setCards(updatedCards);
      if (onCardsChange) {
        onCardsChange(updatedCards);
      }
    }
  }, [calendarTasks, cards, onCardsChange]);
  
  // Process cards to mark expired tasks as failed
  const processExpiredTasks = useCallback(() => {
    const now = new Date();
    const updatedCards = cards.map(card => {
      if (card.completed) return card;
      if (card.dueDate) {
        const dueDate = parseISO(card.dueDate);
        if (isAfter(now, dueDate)) {
          return {
            ...card,
            failed: true,
            failedAt: card.failedAt || now.toISOString()
          };
        }
      }
      return card;
    });
    
    // Only update if we actually changed something
    const hasChanges = JSON.stringify(updatedCards) !== JSON.stringify(cards);
    if (hasChanges) {
      setCards(updatedCards);
      if (onCardsChange) {
        onCardsChange(updatedCards);
      }
    }
  }, [cards, onCardsChange]);
  
  // Check for expired tasks on component mount and when cards change
  useEffect(() => {
    processExpiredTasks();
    
    // Also set up a timer to check every minute
    const intervalId = setInterval(processExpiredTasks, 60000);
    return () => clearInterval(intervalId);
  }, [processExpiredTasks]);
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    color: 'blue'
  });
  
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium'
  });
  
  const { addXp, calculateTaskXp } = useLevel();
  
  // Open card form for creating a new card
  const openCardForm = () => {
    setCurrentCard(null);
    setCardForm({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      color: 'blue'
    });
    setShowForm(true);
  };
  
  // Open card form for editing an existing card
  const editCard = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    let date = '';
    let time = '';
    
    if (card.dueDate) {
      const dueDate = parseISO(card.dueDate);
      date = format(dueDate, 'yyyy-MM-dd');
      time = format(dueDate, 'HH:mm');
    }
    
    setCurrentCard(card);
    setCardForm({
      title: card.title || '',
      description: card.description || '',
      date: card.date || date,
      time: card.time || time,
      color: card.color || 'blue'
    });
    setShowForm(true);
  };
  
  // Close card form
  const closeCardForm = () => {
    setShowForm(false);
    setCurrentCard(null);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new card or update existing card
    if (currentCard) {
      // Update existing card
      const updatedCards = cards.map(card => {
        if (card.id === currentCard.id) {
          // Map the color to the priority
          const priorityMap = {
            'red': 'high',
            'yellow': 'medium',
            'green': 'low',
            'blue': 'none',
            'purple': 'Special'
          };
          
          return {
            ...card,
            title: cardForm.title,
            description: cardForm.description,
            date: cardForm.date,
            time: cardForm.time,
            color: cardForm.color,
            priority: priorityMap[cardForm.color] || 'medium',
            modified: new Date().toISOString()
          };
        }
        return card;
      });
      
      setCards(updatedCards);
      
      // Notify parent of changes
      if (onCardsChange) {
        onCardsChange(updatedCards);
      }
    } else {
      const priorityMap = {
        'red': 'high',
        'yellow': 'medium',
        'green': 'low',
        'blue': 'none',
        'purple': 'Special'
      };
      
      const newCardData = {
        id: `custom-${Date.now()}`,
        title: cardForm.title,
        description: cardForm.description,
        date: cardForm.date,
        time: cardForm.time,
        color: cardForm.color,
        priority: priorityMap[cardForm.color] || 'medium',
        created: new Date().toISOString()
      };
      
      const updatedCards = [...cards, newCardData];
      setCards(updatedCards);
      
      // Notify parent of changes
      if (onCardsChange) {
        onCardsChange(updatedCards);
      }
    }
    
    // Close form
    setShowForm(false);
    setCurrentCard(null);
  };
  
  const priorityClasses = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };
  
  const deleteCard = (cardId) => {
    // Filter out the card to be deleted
    const updatedCards = cards.filter(card => card.id !== cardId);
    // Update state
    setCards(updatedCards);
    // Update local storage
    localStorage.setItem('taskCards', JSON.stringify(updatedCards));
    // Notify parent if needed
    if (onCardsChange) {
      onCardsChange(updatedCards);
    }
  };
  
  // Toggle task completion
  const toggleComplete = (cardId, event) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering card edit
    }
    
    const cardToToggle = cards.find(card => card.id === cardId);
    
    if (!cardToToggle) return;
    
    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        // Toggle completed status
        const isCompleted = !card.completed;
        
        // If task is being marked as complete, award XP
        if (isCompleted && !card.completed) {
          // Get priority (default to medium if not set)
          const priority = card.priority || 'medium';
          
          // Calculate XP based on priority
          const xpAmount = calculateTaskXp('custom', priority);
          addXp(xpAmount);
        }
        
        return {
          ...card,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
          // If the task was failed but is now being completed, remove failed status
          failed: isCompleted ? false : card.failed
        };
      }
      return card;
    });
    
    setCards(updatedCards);
    
    // Notify parent of changes
    if (onCardsChange) {
      onCardsChange(updatedCards);
    }
  };
  
  const calculateTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = parseISO(dueDate);
    const diffInSeconds = differenceInSeconds(due, now);
    
    if (diffInSeconds <= 0) return 'Task Expired';
    
    const days = Math.floor(diffInSeconds / (24 * 60 * 60));
    const hours = Math.floor((diffInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };
  
  return (
    <div className="custom-tasks-container h-[70vh]">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5D1BE3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Custom Task Cards
      </h2>
      
      <div className="grid grid-cols-3 gap-6 task-cards-grid overflow-y-auto px-1 max-h-[calc(70vh-80px)]">
        {/* Show all cards, not just filtered ones */}
        {cards.map(card => (
          <div 
            key={card.id}
            className={`task-card relative p-5 rounded-xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              card.completed 
                ? 'bg-[#5D1BE320] border-[#5D1BE350] completed' 
                : card.failed
                  ? 'bg-[#F4365520] border-[#F4365550] failed'
                  : getBgColorClass(card.color)
            }`}
          >
            {!card.completed && !card.failed && (
              <div 
                className={`priority-indicator ${getPriorityIndicatorClass(card.color)}`}
                title={`Priority: ${getPriorityText(card.color)}`}
              ></div>
            )}
           
            
            {card.completed && (
              <span className="absolute top-2 right-2 bg-[#5D1BE3] text-xs text-white py-1 px-2 rounded-full">
                Completed
              </span>
            )}
            
            {card.failed && !card.completed && (
              <span className="absolute top-2 right-2 bg-[#F43655] text-xs text-white py-1 px-2 rounded-full">
                Failed
              </span>
            )}
            
            <h3 className={`text-lg font-semibold mb-1 pr-6 ${
              card.completed 
                ? 'text-[#ffffff80] line-through' 
                : card.failed 
                  ? 'text-[#F43655]' 
                  : 'text-white'
            }`}>
              {card.title}
            </h3>
            
            {(card.date || card.time) && (
              <p className="text-sm text-[#ffffff90] mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDateTime(card)}
              </p>
            )}
            
            <p className={`mb-4 whitespace-pre-wrap task-list ${
              card.completed 
                ? 'text-[#ffffff80]' 
                : card.failed 
                  ? 'text-[#ffffff80]' 
                  : 'text-[#ffffffd0]'
            }`}>
              {card.description}
              {card.failed && !card.completed && (
                <span className="block mt-2 text-[#F43655]">
                  This task has expired and was marked as failed.
                </span>
              )}
            </p>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center">
                {!card.failed && (
                  <input 
                    type="checkbox" 
                    checked={card.completed || false}
                    onChange={(e) => toggleComplete(card.id, e)}
                    className="w-5 h-5 rounded-md border-2 border-[#5D1BE380] text-[#5D1BE3] focus:ring-[#5D1BE3] focus:ring-offset-0 bg-[#ffffff10] cursor-pointer transition-all duration-200"
                    title={card.completed ? "Mark as incomplete" : "Mark as completed"}
                  />
                )}
                {card.completed && (
                  <span className="ml-2 text-xs text-[#5D1BE3]">Completed {card.completedAt ? format(parseISO(card.completedAt), 'MMM d') : ''}</span>
                )}
                {card.failed && !card.completed && (
                  <span className="text-xs text-[#F43655]">Failed {card.failedAt ? format(parseISO(card.failedAt), 'MMM d') : ''}</span>
                )}
              </div>
              
              <div className="flex space-x-2 ml-auto">
                {!card.fromCalendar && (
                  <button
                    onClick={() => editCard(card.id)}
                    className="p-1 text-[#ffffff80] hover:text-[#1072F1] transition-colors duration-300 cursor-pointer"
                    aria-label="Edit card"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => deleteCard(card.id)}
                  className="p-1 text-[#ffffff80] hover:text-[#F43655] transition-colors duration-300 cursor-pointer"
                  aria-label="Delete card"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add new card button */}
        <button
          onClick={openCardForm}
          className="flex flex-col items-center justify-center p-6 bg-[#ffffff10] text-[#ffffff80] rounded-xl border border-dashed border-[#ffffff30] min-h-[200px] transition-all duration-300 hover:bg-[#ffffff20] hover:border-[#ffffff50] hover:text-white cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium">Add New Card</span>
        </button>
      </div>
      
      {/* Card form modal */}
      {showForm && (
        <div className="card-form-modal">
          <div className="card-form-enter-active bg-[#1E1525] backdrop-blur-lg border border-[#ffffff20] rounded-xl shadow-2xl w-full max-w-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1072F1] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              {currentCard ? 'Edit Card' : 'Create New Card'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ffffff90] mb-1">Title</label>
                <input 
                  type="text" 
                  value={cardForm.title} 
                  onChange={(e) => setCardForm({...cardForm, title: e.target.value})}
                  className="custom-input w-full px-4 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  placeholder="Card title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#ffffff90] mb-1">Description</label>
                <textarea 
                  value={cardForm.description} 
                  onChange={(e) => setCardForm({...cardForm, description: e.target.value})}
                  className="custom-input w-full px-4 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  placeholder="Card description"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 form-row">
                <div>
                  <label className="block text-sm font-medium text-[#ffffff90] mb-1">Date (Optional)</label>
                  <input 
                    type="date" 
                    value={cardForm.date} 
                    onChange={(e) => setCardForm({...cardForm, date: e.target.value})}
                    className="custom-input w-full px-4 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#ffffff90] mb-1">Time (Optional)</label>
                  <input 
                    type="time" 
                    value={cardForm.time} 
                    onChange={(e) => setCardForm({...cardForm, time: e.target.value})}
                    className="custom-input w-full px-4 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#ffffff90] mb-1">Priority</label>
                <div className="flex flex-wrap gap-3">
                  {['red', 'yellow', 'green', 'blue', 'purple'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCardForm({...cardForm, color})}
                      className={`w-8 h-8 rounded-full focus:outline-none cursor-pointer ${getFormColorClass(color)} ${
                        cardForm.color === color ? 'ring-2 ring-offset-2 ring-[#ffffff80]' : ''
                      }`}
                      aria-label={`Priority ${color}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#ffffff60] mt-1">Selected: {getPriorityText(cardForm.color)} Priority</p>
              </div>
              
              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCardForm}
                  className="px-4 py-2 bg-[#ffffff20] text-white rounded-lg hover:bg-[#ffffff30] transition-all duration-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1072F1] text-white rounded-lg hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                >
                  {currentCard ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get background color class based on priority
const getBgColorClass = (color) => {
  const colors = {
    red: 'bg-[#F4365520] border-[#F4365550]',
    yellow: 'bg-[#FACC1520] border-[#FACC1550]',
    green: 'bg-[#34D39920] border-[#34D39950]',
    blue: 'bg-[#1072F120] border-[#1072F150]',
    purple: 'bg-[#5D1BE320] border-[#5D1BE350]',
  };
  return colors[color] || colors.blue;
};

// Helper function to get dot color class based on priority
const getDotColorClass = (color) => {
  const colors = {
    red: 'bg-[#F43655]',
    yellow: 'bg-[#FACC15]',
    green: 'bg-[#34D399]',
    blue: 'bg-[#1072F1]',
    purple: 'bg-[#5D1BE3]',
  };
  return colors[color] || colors.blue;
};

// Helper function to get form color selection button background
const getFormColorClass = (color) => {
  const colors = {
    red: 'bg-[#F43655]',
    yellow: 'bg-[#FACC15]',
    green: 'bg-[#34D399]',
    blue: 'bg-[#1072F1]',
    purple: 'bg-[#5D1BE3]',
  };
  return colors[color] || colors.blue;
};

// Helper function to get priority text
const getPriorityText = (color) => {
  const priorities = {
    red: 'High',
    yellow: 'Medium',
    green: 'Low',
    blue: 'none',
    purple: 'Special',
    indigo: 'Low'
  };
  return priorities[color] || 'Medium';
};

// Helper function to get priority indicator class
const getPriorityIndicatorClass = (color) => {
  const colors = {
    red: 'bg-[#F43655]',
    yellow: 'bg-[#FACC15]',
    green: 'bg-[#34D399]',
    blue: 'bg-[#1072F1]',
    purple: 'bg-[#5D1BE3]',
  };
  return colors[color] || colors.blue;
};

// Helper function to format the date and time for display
const formatDateTime = (card) => {
  let formattedDateTime = '';
  
  if (card.date) {
    formattedDateTime += format(new Date(card.date), 'MMM dd, yyyy');
  } else if (card.dueDate) {
    formattedDateTime += format(parseISO(card.dueDate), 'MMM dd, yyyy');
  }
  
  if (card.time) {
    formattedDateTime += formattedDateTime ? ` at ${card.time}` : card.time;
  } else if (card.dueDate) {
    formattedDateTime += ` (${calculateTimeRemaining(card.dueDate)})`;
  }
  
  return formattedDateTime;
}; 