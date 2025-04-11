import React, { useState, useEffect, useRef } from 'react';
import ReactCalendar from 'react-calendar';
import { format, isSameDay, parseISO, isToday, differenceInHours } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import '../../Login_page/Login.css';
import './Calendar.css';
import { useLevel } from '../../../Context/LevelContext';

export const Calendar = ({ initialTasks = {}, onTasksChange, onDeleteTask }) => {
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [dayTasks, setDayTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    time: '12:00',
    color: 'blue'
  });
  const hasLocalChangesRef = useRef(false);
  const { addXp, calculateTaskXp } = useLevel();
  
  // Initialize tasks from localStorage if not provided by parent
  useEffect(() => {
    if (!initialTasks || Object.keys(initialTasks).length === 0) {
      try {
        const storedTasks = localStorage.getItem('calendarTasks');
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks);
          if (parsedTasks && typeof parsedTasks === 'object') {
            setTasks(parsedTasks);
            // Notify parent component if needed
            if (onTasksChange) {
              onTasksChange(parsedTasks);
            }
          }
        }
      } catch (error) {
        // Handle error silently
      }
    }
  }, []);
  
  // Update tasks when initialTasks changes
  useEffect(() => {
    if (initialTasks && Object.keys(initialTasks).length > 0 && !hasLocalChangesRef.current) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);
  
  // Update dayTasks when date or tasks change
  useEffect(() => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    setDayTasks(tasks[formattedDate] || []);
  }, [date, tasks]);

  // Update dayTasks when initialTasks is first loaded
  useEffect(() => {
    if (initialTasks && Object.keys(initialTasks).length > 0) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setDayTasks(initialTasks[formattedDate] || []);
    }
  }, [initialTasks]);
  
  // Handle date selection change
  const onDateChange = (newDate) => {
    setDate(newDate);
    const formattedDate = format(newDate, 'yyyy-MM-dd');
    setDayTasks(tasks[formattedDate] || []);
  };
  
  // Notify parent of task changes
  useEffect(() => {
    // Only update parent if our tasks are different from initialTasks
    
    if (onTasksChange && JSON.stringify(tasks) !== JSON.stringify(initialTasks)) {
      onTasksChange(tasks);
    }
  }, [tasks, initialTasks, onTasksChange]);
  
  const formattedDate = format(date, 'yyyy-MM-dd');
  const selectedDayTasks = tasks[formattedDate] || [];
  
  const taskColors = {
    blue: { bg: 'bg-[#1072F120]', text: 'text-white', border: 'border-[#1072F1]', dot: 'bg-[#1072F1]' },
    green: { bg: 'bg-[#34D39920]', text: 'text-white', border: 'border-[#34D399]', dot: 'bg-[#34D399]' },
    red: { bg: 'bg-[#F4365520]', text: 'text-white', border: 'border-[#F43655]', dot: 'bg-[#F43655]' },
    yellow: { bg: 'bg-[#FBBF2420]', text: 'text-white', border: 'border-[#FBBF24]', dot: 'bg-[#FBBF24]' },
    purple: { bg: 'bg-[#9333EA20]', text: 'text-white', border: 'border-[#9333EA]', dot: 'bg-[#9333EA]' },
    indigo: { bg: 'bg-[#5D1BE320]', text: 'text-white', border: 'border-[#5D1BE3]', dot: 'bg-[#5D1BE3]' },
  };
  
  // Add a new task
  const addTask = (e) => {
    if (e) e.preventDefault();
    
    if (newTask.title.trim()) {
      hasLocalChangesRef.current = true;
      const formattedDate = format(date, 'yyyy-MM-dd');
      const taskId = Date.now().toString();
      
      const newTaskObj = {
        id: taskId,
        title: newTask.title,
        time: newTask.time,
        color: newTask.color,
        completed: false,
        date: formattedDate,
        created: new Date().toISOString()
      };
      
      const updatedTasks = { ...tasks };
      if (!updatedTasks[formattedDate]) {
        updatedTasks[formattedDate] = [];
      }
      updatedTasks[formattedDate].push(newTaskObj);
      
      // Update tasks state
      setTasks(updatedTasks);
      // Update dayTasks for immediate UI update
      setDayTasks(updatedTasks[formattedDate]);
      
      // Notify parent component
      if (onTasksChange) {
        onTasksChange(updatedTasks);
      }
      
      // Reset new task form
      setNewTask({ title: '', time: '', color: 'blue' });
    }
  };
  
  // Toggle task completion status
  const toggleTaskCompletion = (taskId) => {
    hasLocalChangesRef.current = true;
    const formattedDate = format(date, 'yyyy-MM-dd');
    const updatedTasks = { ...tasks };
    
    if (updatedTasks[formattedDate]) {
      const taskIndex = updatedTasks[formattedDate].findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        const task = updatedTasks[formattedDate][taskIndex];
        
        // Toggle completion status
        const newCompletionStatus = !task.completed;
        updatedTasks[formattedDate][taskIndex].completed = newCompletionStatus;
        
        // If task is being marked as complete, add XP
        if (newCompletionStatus) {
          // Map color to priority level
          const priorityMap = {
            'red': 'high',
            'yellow': 'medium',
            'green': 'low',
            'blue': 'low',
            'purple': 'high',
            'indigo': 'low'
          };
          
          // Calculate XP based on priority
          const xpAmount = calculateTaskXp('calendar', priorityMap[task.color] || 'medium');
          addXp(xpAmount);
        }
        
        // Update tasks state
        setTasks(updatedTasks);
        // Update dayTasks for immediate UI update
        setDayTasks(updatedTasks[formattedDate]);
        
        // Notify parent component
        if (onTasksChange) {
          onTasksChange(updatedTasks);
        }
      }
    }
  };
  
  // Delete a task
  const deleteTask = (taskId) => {
    hasLocalChangesRef.current = true;
    const formattedDate = format(date, 'yyyy-MM-dd');
    const updatedTasks = { ...tasks };
    
    if (updatedTasks[formattedDate]) {
      const taskIndex = updatedTasks[formattedDate].findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        updatedTasks[formattedDate].splice(taskIndex, 1);
        
        // If no tasks left for this date, remove the date entry
        if (updatedTasks[formattedDate].length === 0) {
          delete updatedTasks[formattedDate];
        }
        
        // Update tasks state
        setTasks(updatedTasks);
        // Update dayTasks for immediate UI update
        setDayTasks(updatedTasks[formattedDate] || []);
        
        // Notify parent component
        if (onTasksChange) {
          onTasksChange(updatedTasks);
        }
        
        // Call parent delete handler if provided
        if (onDeleteTask) {
          onDeleteTask(taskId);
        }
      }
    }
  };
  
  // Function to add indicators under dates that have tasks
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedTileDate = format(date, 'yyyy-MM-dd');
    const dateTasks = tasks[formattedTileDate];
    
    if (!dateTasks || dateTasks.length === 0) return null;
    
    // Check if there are any expired tasks for this date
    const now = new Date();
    const hasExpiredTasks = dateTasks.some(task => {
      const taskDateTime = new Date(`${formattedTileDate}T${task.time}`);
      return taskDateTime < now && !task.completed;
    });
    
    // Show different colored dots for different task types
    return (
      <div className="flex justify-center mt-1 space-x-1">
        {/* Only show up to 3 dots to avoid cluttering */}
        {dateTasks.slice(0, 3).map((task, index) => {
          // Check if this specific task is expired
          const taskDateTime = new Date(`${formattedTileDate}T${task.time}`);
          const isTaskExpired = taskDateTime < now && !task.completed;
          
          return (
            <div 
              key={index} 
              className={`h-1.5 w-1.5 rounded-full ${isTaskExpired ? 'bg-[#F43655]' : taskColors[task.color]?.dot || 'bg-[#f1102e]'}`}
            ></div>
          );
        })}
        {dateTasks.length > 3 && (
          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
        )}
      </div>
    );
  };

  // Custom navigation for the calendar
  const formatShortWeekday = (locale, date) => 
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
  
  // Function to convert color name to color code for styling
  const getColorCode = (color) => {
    switch (color) {
      case 'blue': return '1072F1';
      case 'green': return '34D399';
      case 'red': return 'F43655';
      case 'yellow': return 'FBBF24';
      case 'purple': return '5D1BE3';
      case 'indigo': return '6366F1';
      default: return '1072F1';
    }
  };

  // Tile class name for styling calendar days with tasks
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    const hasTasksForDate = tasks[formattedDate] && tasks[formattedDate].length > 0;
    
    return hasTasksForDate ? 'has-tasks' : '';
  };

  return (
    <div className="calendar-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="calendar-wrapper bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5">
          <ReactCalendar
            onChange={onDateChange}
            value={date}
            formatShortWeekday={formatShortWeekday}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="custom-calendar"
          />
        </div>
        
        <div className="task-section">
          <div className="bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 mb-4">
            <h3 className="text-xl font-medium text-white mb-4">
              {isToday(date) ? 'Today\'s Tasks' : format(date, 'MMMM d, yyyy')}
            </h3>
            
            <div className="task-form-container mt-4 bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-2">Add Task for {format(date, 'MMMM d, yyyy')}</h3>
              <form onSubmit={addTask} className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Add a task..."
                      className="w-full px-3 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                      className="w-full px-3 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="submit"
                      className="w-full h-full bg-[#1072F1] text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto task-list pr-2">
              {dayTasks.length === 0 ? (
                <p className="text-center py-4 text-[#ffffff80]">No tasks for this day</p>
              ) : (
                <ul className="space-y-2">
                  {dayTasks.map(task => {
                    // Check if task is expired (in the past)
                    const taskDate = new Date(`${formattedDate}T${task.time}`);
                    const now = new Date();
                    const isExpired = taskDate < now && !task.completed;
                    
                    return (
                      <li key={task.id} className={`p-3 rounded-lg flex items-center justify-between 
                        ${task.completed ? 'bg-[#34D39930] text-[#ffffff90]' : 
                          isExpired ? 'bg-[#F4365520] text-[#ffffff90]' : 
                          'bg-[#1072F120] text-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          {isExpired ? (
                            <div className="h-5 w-5 flex items-center justify-center text-[#F43655]">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <input 
                              type="checkbox" 
                              checked={task.completed}
                              onChange={() => toggleTaskCompletion(task.id)}
                              className={`h-5 w-5 rounded border-${task.color}-500 ${task.completed ? 'text-[#34D399]' : `text-[#${getColorCode(task.color)}]`} focus:ring-${task.color}-500`}
                            />
                          )}
                          <div>
                            <p className={task.completed ? 'line-through' : 
                              isExpired ? 'text-[#F43655]' : ''}>
                              {task.title}
                              {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
                            </p>
                            <p className="text-xs text-[#ffffff80]">{task.time}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[#ffffff60] hover:text-[#F43655] transition-colors duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 