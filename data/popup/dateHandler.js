'use strict';

var DateHandler = {
  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  GetDateFormat: function(dateString) {
    const dateObj = new Date(dateString);
    const dayOfWeek = this.days[dateObj.getDay()];
    const dayOfMonth = dateObj.getDate();
    return dayOfWeek + ' ' + dayOfMonth;
  }
};
