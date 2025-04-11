import React, { useState, useEffect, useRef } from 'react';
import { useLevel } from '../../../Context/LevelContext';
import './TaskFocus.css';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds
const POMODOROS_BEFORE_LONG_BREAK = 4;

export const TaskFocus = ({ onClose }) => {
  // Use localStorage to initialize state if available
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('focusMode');
    return savedMode || 'focus';
  });
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem('focusTimeLeft');
    if (savedTime) {
      return parseInt(savedTime, 10);
    }
    
    // If no saved time, use default based on mode
    const savedMode = localStorage.getItem('focusMode') || 'focus';
    if (savedMode === 'focus') return FOCUS_DURATION;
    if (savedMode === 'shortBreak') return SHORT_BREAK_DURATION;
    return LONG_BREAK_DURATION;
  });
  
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem('focusIsActive') === 'true';
  });
  
  const [completedPomodoros, setCompletedPomodoros] = useState(() => {
    const saved = localStorage.getItem('focusCompletedPomodoros');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskList, setTaskList] = useState([]);
  
  const [showConfig, setShowConfig] = useState(false);
  
  const [customFocusDuration, setCustomFocusDuration] = useState(() => {
    const saved = localStorage.getItem('customFocusDuration');
    return saved ? parseInt(saved, 10) : 25;
  });
  
  const [customShortBreak, setCustomShortBreak] = useState(() => {
    const saved = localStorage.getItem('customShortBreak');
    return saved ? parseInt(saved, 10) : 5;
  });
  
  const [customLongBreak, setCustomLongBreak] = useState(() => {
    const saved = localStorage.getItem('customLongBreak');
    return saved ? parseInt(saved, 10) : 15;
  });
  
  const [notification, setNotification] = useState(null);
  const [customTask, setCustomTask] = useState('');
  const [modeChangeError, setModeChangeError] = useState('');
  
  // Record the last time of timer update for persistence
  const [lastUpdateTime, setLastUpdateTime] = useState(() => {
    const saved = localStorage.getItem('focusLastUpdateTime');
    return saved ? parseInt(saved, 10) : Date.now();
  });
  
  const { addXp } = useLevel();
  const audioRef = useRef(null);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('focusMode', mode);
    localStorage.setItem('focusTimeLeft', timeLeft.toString());
    localStorage.setItem('focusIsActive', isActive.toString());
    localStorage.setItem('focusCompletedPomodoros', completedPomodoros.toString());
    localStorage.setItem('customFocusDuration', customFocusDuration.toString());
    localStorage.setItem('customShortBreak', customShortBreak.toString());
    localStorage.setItem('customLongBreak', customLongBreak.toString());
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
  }, [mode, timeLeft, isActive, completedPomodoros, customFocusDuration, customShortBreak, customLongBreak]);
  
  // Account for time elapsed while component was unmounted (if timer was active)
  useEffect(() => {
    const now = Date.now();
    const lastUpdate = parseInt(localStorage.getItem('focusLastUpdateTime') || now, 10);
    
    if (isActive && lastUpdate < now) {
      const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
      
      // If enough time has passed to complete the timer
      if (elapsedSeconds >= timeLeft) {
        handleTimerComplete();
      } else {
        // Otherwise subtract the elapsed time
        setTimeLeft(prevTime => Math.max(0, prevTime - elapsedSeconds));
      }
    }
    
    // Update the last update time
    setLastUpdateTime(now);
  }, []);
  
  // Load tasks from localStorage
  useEffect(() => {
    // Try to load daily tasks
    try {
      const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks') || '[]');
      const customTasks = JSON.parse(localStorage.getItem('taskCards') || '[]');
      
      // Combine and filter for incomplete tasks
      const allTasks = [
        ...dailyTasks.filter(task => !task.completed).map(task => ({ ...task, type: 'daily' })),
        ...customTasks.filter(task => !task.completed && !task.failed).map(task => ({ ...task, type: 'custom' }))
      ];
      
      setTaskList(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTaskList([]);
    }
    
    // Try to load previously selected task
    try {
      const savedTask = JSON.parse(localStorage.getItem('focusTask'));
      if (savedTask) {
        setSelectedTask(savedTask);
      }
    } catch (error) {
      // Ignore
    }
  }, []);
  
  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        // Update localStorage with each tick to ensure state persistence
        localStorage.setItem('focusTimeLeft', newTimeLeft.toString());
        localStorage.setItem('focusLastUpdateTime', Date.now().toString());
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      handleTimerComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
      
      // Update last update time when component unmounts
      if (isActive) {
        localStorage.setItem('focusLastUpdateTime', Date.now().toString());
      }
    };
  }, [isActive, timeLeft]);
  
  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [notification]);
  
  // Clear mode change error after 3 seconds
  useEffect(() => {
    if (modeChangeError) {
      const timeout = setTimeout(() => {
        setModeChangeError('');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [modeChangeError]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    playSound();
    showBrowserNotification();
    
    if (mode === 'focus') {
      // Completed a focus session
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      localStorage.setItem('focusCompletedPomodoros', newCompletedPomodoros.toString());
      
      // Award XP for completing a focus session
      addXp(10);
      setNotification('Good job! +10 XP for completing a focus session.');
      
      // Determine next break type
      if (newCompletedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0) {
        setMode('longBreak');
        setTimeLeft(customLongBreak * 60);
        localStorage.setItem('focusMode', 'longBreak');
        localStorage.setItem('focusTimeLeft', (customLongBreak * 60).toString());
      } else {
        setMode('shortBreak');
        setTimeLeft(customShortBreak * 60);
        localStorage.setItem('focusMode', 'shortBreak');
        localStorage.setItem('focusTimeLeft', (customShortBreak * 60).toString());
      }
    } else {
      // Completed a break
      setMode('focus');
      setTimeLeft(customFocusDuration * 60);
      localStorage.setItem('focusMode', 'focus');
      localStorage.setItem('focusTimeLeft', (customFocusDuration * 60).toString());
      setNotification('Break completed! Time to focus again.');
    }
    
    setIsActive(false);
    localStorage.setItem('focusIsActive', 'false');
  };
  
  // Start/pause timer
  const toggleTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    localStorage.setItem('focusIsActive', newIsActive.toString());
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
    
    // If starting timer and there's no notification permission, request it
    if (newIsActive && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    localStorage.setItem('focusIsActive', 'false');
    
    let newTime = customFocusDuration * 60;
    if (mode === 'shortBreak') {
      newTime = customShortBreak * 60;
    } else if (mode === 'longBreak') {
      newTime = customLongBreak * 60;
    }
    
    setTimeLeft(newTime);
    localStorage.setItem('focusTimeLeft', newTime.toString());
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
  };
  
  // Skip to next timer
  const skipTimer = () => {
    setIsActive(false);
    localStorage.setItem('focusIsActive', 'false');
    
    let newMode, newTime;
    
    if (mode === 'focus') {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      localStorage.setItem('focusCompletedPomodoros', newCompletedPomodoros.toString());
      
      if (newCompletedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0) {
        newMode = 'longBreak';
        newTime = customLongBreak * 60;
      } else {
        newMode = 'shortBreak';
        newTime = customShortBreak * 60;
      }
    } else {
      newMode = 'focus';
      newTime = customFocusDuration * 60;
    }
    
    setMode(newMode);
    setTimeLeft(newTime);
    localStorage.setItem('focusMode', newMode);
    localStorage.setItem('focusTimeLeft', newTime.toString());
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
  };
  
  // Change timer mode manually
  const changeMode = (newMode) => {
    // If timer is active, show error and don't change mode
    if (isActive) {
      const modeName = mode === 'focus' ? 'Focus Mode' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
      setModeChangeError(`Currently on ${modeName}, stop the timer to change`);
      return;
    }
    
    setMode(newMode);
    
    let newTime;
    if (newMode === 'focus') {
      newTime = customFocusDuration * 60;
    } else if (newMode === 'shortBreak') {
      newTime = customShortBreak * 60;
    } else { // longBreak
      newTime = customLongBreak * 60;
    }
    
    setTimeLeft(newTime);
    
    // Update localStorage
    localStorage.setItem('focusMode', newMode);
    localStorage.setItem('focusTimeLeft', newTime.toString());
    localStorage.setItem('focusIsActive', 'false');
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
  };
  
  // Get mode friendly name
  const getModeFriendlyName = (modeStr) => {
    if (modeStr === 'focus') return 'Focus';
    if (modeStr === 'shortBreak') return 'Short Break';
    return 'Long Break';
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Play sound effect
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  };
  
  // Show browser notification
  const showBrowserNotification = () => {
    if (Notification.permission === 'granted') {
      let title, body;
      
      if (mode === 'focus') {
        title = 'Focus session completed!';
        body = 'Time for a break. Stand up, stretch, and hydrate.';
      } else {
        title = 'Break time is over!';
        body = 'Ready to focus again?';
      }
      
      new Notification(title, { 
        body,
        icon: '/favicon.ico'
      });
    }
  };
  
  // Apply config changes
  const applyConfig = () => {
    const newFocusDuration = Math.max(1, Math.min(60, customFocusDuration));
    const newShortBreak = Math.max(1, Math.min(30, customShortBreak));
    const newLongBreak = Math.max(1, Math.min(60, customLongBreak));
    
    // Update state with validated values
    setCustomFocusDuration(newFocusDuration);
    setCustomShortBreak(newShortBreak);
    setCustomLongBreak(newLongBreak);
    
    // Store in localStorage
    localStorage.setItem('customFocusDuration', newFocusDuration.toString());
    localStorage.setItem('customShortBreak', newShortBreak.toString());
    localStorage.setItem('customLongBreak', newLongBreak.toString());
    
    // Update timer with new duration if needed
    let newTime = timeLeft;
    if (mode === 'focus') {
      newTime = newFocusDuration * 60;
    } else if (mode === 'shortBreak') {
      newTime = newShortBreak * 60;
    } else {
      newTime = newLongBreak * 60;
    }
    
    setTimeLeft(newTime);
    localStorage.setItem('focusTimeLeft', newTime.toString());
    
    setShowConfig(false);
  };
  
  // Select a task to focus on
  const handleTaskSelect = (e) => {
    const taskId = e.target.value;
    if (taskId === 'custom') {
      // Custom task option selected
      return;
    }
    
    if (taskId === '') {
      setSelectedTask(null);
      localStorage.removeItem('focusTask');
      return;
    }
    
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      localStorage.setItem('focusTask', JSON.stringify(task));
    }
  };
  
  // Handle custom task input
  const handleCustomTaskInput = (e) => {
    setCustomTask(e.target.value);
  };
  
  // Add custom task
  const addCustomTask = () => {
    if (customTask.trim() === '') return;
    
    const newTask = {
      id: `custom-${Date.now()}`,
      title: customTask,
      type: 'custom-focus',
      priority: 'medium'
    };
    
    setSelectedTask(newTask);
    localStorage.setItem('focusTask', JSON.stringify(newTask));
    setCustomTask('');
  };
  
  // Handle closing the component
  const handleClose = () => {
    // Store the current state before closing
    localStorage.setItem('focusMode', mode);
    localStorage.setItem('focusTimeLeft', timeLeft.toString());
    localStorage.setItem('focusIsActive', isActive.toString());
    localStorage.setItem('focusLastUpdateTime', Date.now().toString());
    
    onClose();
  };
  
  return (
    <div className="task-focus-container">
      <div className="task-focus-header">
        <h2>Focus Mode</h2>
        <button className="close-button" onClick={handleClose}>×</button>
      </div>
      
      <div className="task-focus-content">
        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}
        
        {modeChangeError && (
          <div className="mode-change-error">
            {modeChangeError}
          </div>
        )}
        
        <div className="mode-selector">
          <button 
            className={`mode-button ${mode === 'focus' ? 'active' : ''} ${isActive ? 'disabled' : ''}`}
            onClick={() => changeMode('focus')}
            disabled={isActive}
          >
            Focus
          </button>
          <button 
            className={`mode-button ${mode === 'shortBreak' ? 'active' : ''} ${isActive ? 'disabled' : ''}`}
            onClick={() => changeMode('shortBreak')}
            disabled={isActive}
          >
            Short Break
          </button>
          <button 
            className={`mode-button ${mode === 'longBreak' ? 'active' : ''} ${isActive ? 'disabled' : ''}`}
            onClick={() => changeMode('longBreak')}
            disabled={isActive}
          >
            Long Break
          </button>
        </div>
        
        <div className={`timer-circle ${mode} ${isActive ? 'active' : ''}`}>
          <div className="timer-display">{formatTime(timeLeft)}</div>
          <div className="timer-label">{getModeFriendlyName(mode)}</div>
        </div>
        
        <div className="pomodoro-count">
          {Array.from({ length: POMODOROS_BEFORE_LONG_BREAK }).map((_, idx) => (
            <div 
              key={idx} 
              className={`pomodoro-indicator ${idx < completedPomodoros % POMODOROS_BEFORE_LONG_BREAK ? 'completed' : ''}`}
            />
          ))}
        </div>
        
        <div className="timer-controls">
          <button className="timer-button" onClick={toggleTimer}>
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button className="timer-button" onClick={resetTimer}>
            Reset
          </button>
          <button className="timer-button" onClick={skipTimer}>
            Skip
          </button>
        </div>
       
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            className="config-button"
            onClick={() => setShowConfig(!showConfig)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configure timer settings
          </button>
          
          {showConfig && (
            <div className="config-panel">
              <div className="config-row">
                <span className="config-label">Focus duration (minutes):</span>
                <input 
                  type="number"
                  className="config-input"
                  min="1"
                  max="60"
                  value={customFocusDuration}
                  onChange={(e) => setCustomFocusDuration(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="config-row">
                <span className="config-label">Short break (minutes):</span>
                <input 
                  type="number"
                  className="config-input"
                  min="1"
                  max="30"
                  value={customShortBreak}
                  onChange={(e) => setCustomShortBreak(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="config-row">
                <span className="config-label">Long break (minutes):</span>
                <input 
                  type="number"
                  className="config-input"
                  min="1"
                  max="60"
                  value={customLongBreak}
                  onChange={(e) => setCustomLongBreak(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <button 
                className="timer-button"
                style={{ marginTop: '12px', width: '100%' }}
                onClick={applyConfig}
              >
                Apply Settings
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Audio element for timer sound */}
      <audio ref={audioRef}>
        <source src="https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};