import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLevel } from '../../../Context/LevelContext';
import '../../Login_page/Login.css';

export const DailyTasks = ({ tasks: initialTasks = [], onTasksChange, onDeleteTask }) => {
  // Ensure initialTasks is always an array
  const safeInitialTasks = Array.isArray(initialTasks) ? initialTasks : [];
  
  // Remove default tasks, just use what's provided from parent
  const [tasks, setTasks] = useState(safeInitialTasks);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { calculateTaskXp, addXp } = useLevel();
  
  useEffect(() => {
    // Always sync with parent state, ensuring it's an array
    const safeTasks = Array.isArray(initialTasks) ? initialTasks : [];
    setTasks(safeTasks);
  }, [initialTasks]);
  
  // Memoize the task filtering function to avoid recreating it on every render
  const filterExpiredTasks = useCallback(() => {
    const now = new Date();
    // Ensure tasks is an array before filtering
    if (!Array.isArray(tasks)) return [];
    
    return tasks.filter(task => {
      if (!task || !task.createdAt) return false;
      const taskCreatedAt = new Date(task.createdAt);
      const taskAge = now - taskCreatedAt;
      const hoursPassed = taskAge / (1000 * 60 * 60);
      return hoursPassed < 24;
    });
  }, [tasks]);
  
  // Check for expired tasks (older than 24 hours) and remove them
  useEffect(() => {
    const interval = setInterval(() => {
      const filteredTasks = filterExpiredTasks();
      
      if (filteredTasks.length !== tasks.length) {
        setTasks(filteredTasks);
        if (onTasksChange) {
          onTasksChange(filteredTasks);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [tasks, filterExpiredTasks, onTasksChange]);
  
  const addTask = (e) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    // Ensure tasks is an array before adding to it
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updatedTasks = [...currentTasks, newTask];
    
    setTasks(updatedTasks);
    
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
    
    setNewTaskTitle('');
  };
  
  const toggleTaskCompletion = (taskId) => {
    // Ensure tasks is an array before mapping
    if (!Array.isArray(tasks)) {
      // Tasks is not an array, cannot toggle completion
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Only award XP when marking as complete, not when unchecking
    const willBeComplete = !task.completed;
    
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    // Award XP if the task is being marked as complete
    if (willBeComplete) {
      const xpAmount = calculateTaskXp('daily');
      addXp(xpAmount);
    }
    
    setTasks(updatedTasks);
    
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
  };
  
  const deleteTask = (taskId) => {
    // Call parent delete handler if provided
    if (onDeleteTask) {
      onDeleteTask(taskId);
    }
    
    // Ensure tasks is an array before filtering
    if (!Array.isArray(tasks)) {
      // Tasks is not an array, cannot delete task
      return;
    }
    
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
  };
  
  // Separate completed and incomplete tasks
  const incompleteTasks = Array.isArray(tasks) ? tasks.filter(task => !task.completed) : [];
  const completedTasks = Array.isArray(tasks) ? tasks.filter(task => task.completed) : [];
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#1072F1] mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Daily Tasks
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={addTask} className="mb-6 p-5 bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl shadow-lg">
            <div className="flex items-center">
              <input
                type="text"
                className="flex-grow px-4 py-2 bg-[#ffffff10] text-white border-b border-[#5d1be380] rounded-l-lg focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                placeholder="Add a new task for today..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1072F1] text-white rounded-r-lg hover:bg-blue-600 transition-all duration-300 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 task-list">
          <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1072F1] mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-4.707-5.293a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L6 10.586l-.293-.293a1 1 0 00-1.414 1.414l1 1z" clipRule="evenodd" />
            </svg>
            To Do ({incompleteTasks.length})
          </h3>
          
          {incompleteTasks.length === 0 ? (
            <div className="text-center py-6 bg-[#362f2f50] backdrop-blur-sm rounded-xl border border-[#ffffff10]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#ffffff30] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[#ffffff80]">All tasks completed! Add a new task to get started.</p>
            </div>
          ) : (
            incompleteTasks.map(task => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-3 bg-[#1072F120] text-white rounded-xl border border-[#1072F150] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                    className="h-5 w-5 rounded mt-1 border-[#5D1BE3] text-[#1072F1] focus:ring-[#1072F1] transition-colors duration-200"
                  />
                  <div>
                    <p className="text-white">{task.title}</p>
                    <p className="text-xs text-[#ffffff80] mt-1">
                      Added {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-[#ffffff60] hover:text-[#F43655] transition-colors duration-300 cursor-pointer"
                  aria-label="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 task-list">
          <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#34D399] mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed ({completedTasks.length})
          </h3>
          
          {completedTasks.length === 0 ? (
            <div className="text-center py-6 bg-[#362f2f50] backdrop-blur-sm rounded-xl border border-[#ffffff10]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#ffffff30] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[#ffffff80]">No completed tasks yet. Complete a task to see it here!</p>
            </div>
          ) : (
            completedTasks.map(task => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-3 bg-[#34D39930] text-[#ffffff90] rounded-xl border border-[#34D39950] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                    className="h-5 w-5 rounded mt-1 border-[#34D399] text-[#34D399] focus:ring-[#34D399] transition-colors duration-200"
                  />
                  <div>
                    <p className="line-through">{task.title}</p>
                    <p className="text-xs text-[#ffffff70] mt-1">
                      Added {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-[#ffffff60] hover:text-[#F43655] transition-colors duration-300 cursor-pointer"
                  aria-label="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 