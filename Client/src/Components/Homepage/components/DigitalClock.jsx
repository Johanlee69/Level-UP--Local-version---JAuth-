import React, { useState, useEffect } from 'react';

export const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  
  const formatTimeUnit = (unit) => {
    return unit.toString().padStart(2, '0');
  };
  
  const hours = formatTimeUnit(time.getHours());
  const minutes = formatTimeUnit(time.getMinutes());
  const seconds = formatTimeUnit(time.getSeconds());
  
  return (
    <div className="digital-clock">
      <span className="time-unit">{hours}</span>
      <span className="time-separator">hrs : </span>
      <span className="time-unit">{minutes}</span>
      <span className="time-separator">m : </span>
      <span className="time-unit">{seconds}</span>
      <span className="time-separator">s</span>
    </div>
  );
};

export default DigitalClock; 