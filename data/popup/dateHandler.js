'use strict';

var DateHandler = {
  days: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  GetDateFormat: function(dateString) {
    const dateObj = new Date(dateString);
    const dayOfWeek = this.days[dateObj.getDay()];
    const dayOfMonth = dateObj.getDate();
    return dayOfWeek + ' ' + dayOfMonth;
  }
};
