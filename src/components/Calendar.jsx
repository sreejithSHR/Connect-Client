import React, { useState } from 'react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-white border-opacity-20 p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="text-white hover:text-white">&lt;</button>
        <h2 className="text-xl text-white font-semibold">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={nextMonth} className="text-white hover:text-white">&gt;</button>
      </div>
      <div className="grid grid-cols-7 text-white gap-2 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-sm font-medium text-white">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(firstDayOfMonth)].map((_, index) => (
          <div key={`empty-${index}`} className="h-8 md:h-10"></div>
        ))}
        {[...Array(daysInMonth)].map((_, index) => (
          <div
            key={index + 1}
            className={`h-8 md:h-10 flex items-center justify-center rounded-full text-sm text-white
              ${index + 1 === currentDate.getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
                ? 'bg-blue text-white'
                : 'hover:bg-white hover:bg-opacity-10'
              }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

