import React, { useState, useEffect } from 'react';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import '../Login_page/Login.css';
import './PerformanceAnalytics.css';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PerformanceAnalytics = ({ dailyTasks = [], customCards = [], calendarTasks = {} }) => {
  // Ensure props are the correct types at the start
  const safeDailyTasks = Array.isArray(dailyTasks) ? dailyTasks : [];
  const safeCustomCards = Array.isArray(customCards) ? customCards : [];
  const safeCalendarTasks = calendarTasks && typeof calendarTasks === 'object' ? calendarTasks : {};
  
  // Calculate task statistics
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    failed: 0,
    total: 0,
    completionRate: 0
  });
  
  // Weekly productivity data for charts
  const [weeklyData, setWeeklyData] = useState([]);
  
  // Recent task history (24 hours)
  const [recentTasks, setRecentTasks] = useState({
    completed: [],
    failed: []
  });
  
  useEffect(() => {
    // Calculate overall task statistics
    calculateTaskStats();
    
    // Generate weekly productivity data
    generateWeeklyData();
    
    // Get recent task history
    getRecentTaskHistory();
  }, [safeDailyTasks, safeCustomCards, safeCalendarTasks]);
  
  const calculateTaskStats = () => {
    // Count completed and failed tasks from all sources
    let completed = 0;
    let failed = 0;
    
    // Daily tasks - already verified to be an array with safeDailyTasks
    safeDailyTasks.forEach(task => {
      if (task.completed) {
        completed++;
      } else {
        // Check if task is expired but not completed
        const taskCreatedAt = new Date(task.createdAt);
        const taskAge = new Date() - taskCreatedAt;
        const hoursPassed = taskAge / (1000 * 60 * 60);
        
        if (hoursPassed >= 24) {
          failed++;
        }
      }
    });
    
    // Custom cards - already verified to be an array with safeCustomCards
    safeCustomCards.forEach(card => {
      if (card.dueDate) {
        const dueDate = parseISO(card.dueDate);
        if (card.completed) {
          completed++;
        } else if (isAfter(new Date(), dueDate)) {
          // This task has expired and is considered failed
          failed++;
        }
      } else {
        // Handle cards with no due date
        if (card.completed) {
          completed++;
        }
      }
    });
    
    // Calendar tasks - already verified to be an object with safeCalendarTasks
    let calendarTaskCount = 0;
    Object.values(safeCalendarTasks).forEach(tasks => {
      // Ensure tasks is an array before iterating
      if (Array.isArray(tasks)) {
        tasks.forEach(task => {
          calendarTaskCount++;
          if (task.completed) {
            completed++;
          } else {
            // For calendar tasks, check if the date has passed
            const taskDate = parseISO(task.date || Object.keys(safeCalendarTasks).find(date => 
              safeCalendarTasks[date].some(t => t.id === task.id)
            ));
            
            if (taskDate && isAfter(new Date(), taskDate)) {
              failed++;
            }
          }
        });
      }
    });
    
    // Calculate total without forcing a minimum
    const total = safeDailyTasks.length + safeCustomCards.length + calendarTaskCount;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setTaskStats({
      completed,
      failed,
      total,
      completionRate
    });
  };
  
  const generateWeeklyData = () => {
    // Generate data for the last 7 days
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = format(date, 'EEE');
      
      // Count completed tasks for this day
      let completedCount = 0;
      
      // Daily tasks completed on this day - using safeDailyTasks
      safeDailyTasks.forEach(task => {
        const taskDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
        if (taskDate === dateStr && task.completed) {
          completedCount++;
        }
      });
      
      // Custom cards completed on this day - using safeCustomCards
      safeCustomCards.forEach(card => {
        if (card.completedAt) {
          const cardCompletedDate = format(parseISO(card.completedAt), 'yyyy-MM-dd');
          if (cardCompletedDate === dateStr) {
            completedCount++;
          }
        }
      });
      
      // Calendar tasks for this day - using safeCalendarTasks
      if (safeCalendarTasks[dateStr] && Array.isArray(safeCalendarTasks[dateStr])) {
        safeCalendarTasks[dateStr].forEach(task => {
          if (task.completed) {
            completedCount++;
          }
        });
      }
      
      data.push({
        day: dayLabel,
        completed: completedCount,
        productivity: completedCount > 0 ? 50 + (completedCount * 10) : Math.floor(Math.random() * 30) + 10
      });
    }
    
    setWeeklyData(data);
  };
  
  const getRecentTaskHistory = () => {
    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    
    // Get completed tasks in last 24 hours - DAILY TASKS
    const recentlyCompletedDaily = safeDailyTasks.filter(task => {
      return task.completed && isAfter(new Date(task.createdAt), oneDayAgo);
    });
    
    // Get failed tasks in last 24 hours - DAILY TASKS (using safeDailyTasks)
    const recentlyFailedDaily = safeDailyTasks.filter(task => {
      const taskCreatedAt = new Date(task.createdAt);
      return !task.completed && isAfter(taskCreatedAt, oneDayAgo) && 
        ((now - taskCreatedAt) / (1000 * 60 * 60)) >= 24;
    });
    
    // Get completed tasks in last 24 hours - CUSTOM CARDS (using safeCustomCards)
    const recentlyCompletedCustom = safeCustomCards
      .filter(card => card.completed && card.completedAt && isAfter(parseISO(card.completedAt), oneDayAgo))
      .map(card => ({
        id: card.id,
        title: card.title,
        createdAt: card.completedAt, // Use completedAt for display
        type: 'custom'
      }));
    
    // Get failed tasks in last 24 hours - CUSTOM CARDS (using safeCustomCards)
    const recentlyFailedCustom = safeCustomCards
      .filter(card => {
        if (!card.dueDate) return false; // Skip cards without due dates
        const dueDate = parseISO(card.dueDate);
        // Include all non-completed tasks with expired due dates
        return !card.completed && isAfter(now, dueDate);
      })
      .map(card => ({
        id: card.id,
        title: card.title,
        createdAt: card.dueDate, // Use dueDate for display
        type: 'custom'
      }));
    
    // Get completed tasks in last 24 hours - CALENDAR TASKS (using safeCalendarTasks)
    let recentlyCompletedCalendar = [];
    let recentlyFailedCalendar = [];
    
    Object.entries(safeCalendarTasks).forEach(([dateStr, tasks]) => {
      if (!Array.isArray(tasks)) return; // Skip if tasks is not an array
      
      const date = parseISO(dateStr);
      
      // Get completed calendar tasks from the last day
      if (isAfter(date, oneDayAgo)) {
        const completedTasks = tasks
          .filter(task => task.completed)
          .map(task => ({
            id: `calendar-${task.id}`,
            title: task.title,
            createdAt: dateStr, // Use the calendar date
            type: 'calendar'
          }));
        
        recentlyCompletedCalendar.push(...completedTasks);
      }
      
      // Get failed calendar tasks (all non-completed tasks whose due date has passed)
      const failedTasks = tasks
        .filter(task => !task.completed && isAfter(now, date))
        .map(task => ({
          id: `calendar-${task.id}`,
          title: task.title,
          createdAt: dateStr, // Use the calendar date
          type: 'calendar'
        }));
      
      recentlyFailedCalendar.push(...failedTasks);
    });
    
    // Combine all sources
    const allCompleted = [...recentlyCompletedDaily, ...recentlyCompletedCustom, ...recentlyCompletedCalendar];
    const allFailed = [...recentlyFailedDaily, ...recentlyFailedCustom, ...recentlyFailedCalendar];
    
    setRecentTasks({
      completed: allCompleted,
      failed: allFailed
    });
  };
  
  // Prepare data for charts
  const pieChartData = {
    labels: ['Completed', 'Failed', 'Pending'],
    datasets: [
      {
        data: [
          taskStats.completed || 0,
          taskStats.failed || 0,
          taskStats.total - taskStats.completed - taskStats.failed || 0 // Allow zero for pending tasks
        ],
        backgroundColor: ['#5D1BE3', '#F43655', '#ffffff40'],
        borderColor: ['#ffffff20', '#ffffff20', '#ffffff20'],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          color: '#ffffff'
        }
      },
      tooltip: {
        enabled: false, // Disable native tooltips
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.formattedValue || '';
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total === 0 ? 0 : Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
          // Apply custom class
          labelTextColor: function(context) {
            return '#ffffff';
          }
        },
        backgroundColor: '#362f2fcc',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff20',
        borderWidth: 1,
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        padding: 10,
        cornerRadius: 6,
        boxPadding: 4,
        usePointStyle: true,
        titleAlign: 'center',
        bodyAlign: 'center',
        displayColors: false,
        caretSize: 8,
        caretPadding: 6,
        external: function(context) {
          // Get the tooltip element
          let tooltipEl = document.getElementById('chartjs-tooltip');
          
          // Create the tooltip element if it doesn't exist
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.classList.add('custom-tooltip');
            document.body.appendChild(tooltipEl);
          }
          
          // Hide if no tooltip
          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }
          
          // Set caret position
          tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add('no-transform');
          }
          
          // Set content
          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map(b => b.lines);
            
            let innerHtml = '<div>';
            
            titleLines.forEach(title => {
              innerHtml += '<div class="chart-tooltip-title">' + title + '</div>';
            });
            
            innerHtml += '<div class="chart-tooltip-body">';
            bodyLines.forEach((body, i) => {
              innerHtml += '<div>' + body + '</div>';
            });
            innerHtml += '</div></div>';
            
            tooltipEl.innerHTML = innerHtml;
          }
          
          // Position tooltip and set display
          const position = context.chart.canvas.getBoundingClientRect();
          tooltipEl.style.opacity = 1;
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipEl.clientWidth / 2 + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - tooltipEl.clientHeight - 10 + 'px';
          tooltipEl.style.pointerEvents = 'none';
        }
      }
    },
    cutout: '50%',
    maintainAspectRatio: false
  };

  const productivityData = {
    labels: weeklyData.map(item => item.day),
    datasets: [
      {
        type: 'bar',
        label: 'Tasks Completed',
        data: weeklyData.map(item => item.completed),
        backgroundColor: '#5D1BE3',
        borderRadius: 4
      },
      {
        type: 'line',
        label: 'Productivity',
        data: weeklyData.map(item => item.productivity),
        borderColor: '#1072F1',
        backgroundColor: 'rgba(16, 114, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1072F1',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  const productivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          color: '#ffffff'
        },
        grid: {
          color: '#ffffff20'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          color: '#ffffff'
        }
      },
      tooltip: {
        enabled: false, // Disable native tooltips
        backgroundColor: '#362f2fcc',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff20',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 4,
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        padding: 10,
        usePointStyle: true,
        titleAlign: 'center',
        bodyAlign: 'left',
        displayColors: true,
        caretSize: 8,
        caretPadding: 6,
        external: function(context) {
          // Get the tooltip element
          let tooltipEl = document.getElementById('chartjs-tooltip-productivity');
          
          // Create the tooltip element if it doesn't exist
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip-productivity';
            tooltipEl.classList.add('custom-tooltip');
            document.body.appendChild(tooltipEl);
          }
          
          // Hide if no tooltip
          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }
          
          // Set caret position
          tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add('no-transform');
          }
          
          // Set content
          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map(b => b.lines);
            
            let innerHtml = '<div>';
            
            titleLines.forEach(title => {
              innerHtml += '<div class="chart-tooltip-title font-medium">' + title + '</div>';
            });
            
            innerHtml += '<div class="chart-tooltip-body">';
            bodyLines.forEach((body, i) => {
              const colors = tooltipModel.labelColors[i];
              const style = 'background-color: ' + colors.backgroundColor;
              const dot = '<span class="inline-block w-3 h-3 mr-2 rounded-full" style="' + style + '"></span>';
              innerHtml += '<div class="flex items-center">' + dot + body + '</div>';
            });
            innerHtml += '</div></div>';
            
            tooltipEl.innerHTML = innerHtml;
          }
          
          // Position tooltip and set display
          const position = context.chart.canvas.getBoundingClientRect();
          tooltipEl.style.opacity = 1;
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipEl.clientWidth / 2 + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - tooltipEl.clientHeight - 10 + 'px';
          tooltipEl.style.pointerEvents = 'none';
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  return (
    <div className="analytics-container px-4 pb-16">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#1072F1] mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm12 12v-2H3v2a2 2 0 002 2h10a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        Performance Analytics
      </h2>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-sm font-medium text-[#ffffff90]">Total Tasks</h3>
          <p className="text-2xl font-bold text-white mt-1">{taskStats.total}</p>
        </div>
        
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-sm font-medium text-[#ffffff90]">Completed</h3>
          <p className="text-2xl font-bold text-[#5D1BE3] mt-1">{taskStats.completed}</p>
        </div>
        
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-sm font-medium text-[#ffffff90]">Failed</h3>
          <p className="text-2xl font-bold text-[#F43655] mt-1">{taskStats.failed}</p>
        </div>
        
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-sm font-medium text-[#ffffff90]">Completion Rate</h3>
          <p className="text-2xl font-bold text-[#1072F1] mt-1">{taskStats.completionRate}%</p>
        </div>
      </div>
      
      {/* Pie chart and graph section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Task completion pie chart */}
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5D1BE3] mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            Task Completion Ratio
          </h3>
          
          <div className="h-64 chart-container">
            {taskStats.total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <p className="text-[#ffffff80] text-sm bg-[#00000050] px-3 py-1 rounded-full">No tasks data available yet</p>
              </div>
            )}
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
        
        {/* Weekly productivity graph */}
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1072F1] mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Weekly Productivity
          </h3>
          
          <div className="h-64 chart-container">
            <Bar data={productivityData} options={productivityOptions} />
          </div>
        </div>
      </div>
      
      {/* Task history section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Completed Tasks in Last 24 Hours */}
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#5D1BE3] mr-2"></span>
            Completed Tasks (Last 24 hours)
          </h3>
          
          <div className="task-list">
            {recentTasks.completed.length > 0 ? (
              <ul className="space-y-3">
                {recentTasks.completed.map(task => (
                  <li key={task.id} className="task-item bg-[#ffffff10] rounded-lg border border-[#ffffff20] p-3 hover:bg-[#ffffff15] transition-colors duration-300">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-[#5D1BE3] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-[#ffffff80]">
                            Completed {format(new Date(task.createdAt), 'h:mm a, MMM d')}
                          </p>
                          {task.type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.type === 'custom' 
                                ? 'bg-[#5D1BE320] text-[#5D1BE3] border border-[#5D1BE380]' 
                                : task.type === 'calendar' 
                                  ? 'bg-[#1072F120] text-[#1072F1] border border-[#1072F180]' 
                                  : 'bg-[#34D39920] text-[#34D399] border border-[#34D39980]'
                            }`}>
                              {task.type === 'custom' 
                                ? 'Custom' 
                                : task.type === 'calendar' 
                                  ? 'Calendar' 
                                  : 'Daily'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 bg-[#ffffff10] rounded-lg border border-[#ffffff20]">
                <svg className="mx-auto h-12 w-12 text-[#ffffff40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9zm12 12v-2H3v2a2 2 0 002 2h10a2 2 0 002-2zM9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-sm text-[#ffffff80]">No tasks completed in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Failed Tasks in Last 24 Hours */}
        <div className="analytics-card bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#F43655] mr-2"></span>
            Failed Tasks (Last 24 hours)
          </h3>
          
          <div className="task-list">
            {recentTasks.failed.length > 0 ? (
              <ul className="space-y-3">
                {recentTasks.failed.map(task => (
                  <li key={task.id} className="task-item bg-[#F4365510] rounded-lg border border-[#F4365530] p-3 hover:bg-[#F4365515] transition-colors duration-300">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-[#F43655] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-[#ffffff80]">
                            Expired {format(new Date(task.createdAt), 'h:mm a, MMM d')}
                          </p>
                          {task.type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.type === 'custom' 
                                ? 'bg-[#5D1BE320] text-[#5D1BE3] border border-[#5D1BE380]' 
                                : task.type === 'calendar' 
                                  ? 'bg-[#1072F120] text-[#1072F1] border border-[#1072F180]' 
                                  : 'bg-[#34D39920] text-[#34D399] border border-[#34D39980]'
                            }`}>
                              {task.type === 'custom' 
                                ? 'Custom' 
                                : task.type === 'calendar' 
                                  ? 'Calendar' 
                                  : 'Daily'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 bg-[#ffffff10] rounded-lg border border-[#ffffff20]">
                <svg className="mx-auto h-12 w-12 text-[#ffffff40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-[#ffffff80]">No failed tasks in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 