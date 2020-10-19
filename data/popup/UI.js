/* globals DateHandler */
'use strict';

var UI = {
  CreateSummeryFor: (currentData, degree, target) => {
    const summery = document.createElement('div');
    summery.className = 'summery';

    const cityAndCountry = document.createElement('p');
    cityAndCountry.className = 'summery-city';
    cityAndCountry.textContent = currentData.name + ', ' + currentData.sys.country;

    const summeryState = document.createElement('div');
    summeryState.className = 'summery-state';

    const temp = document.createElement('span');
    temp.className = 'summery-temp';
    temp.textContent = Math.round(currentData.main.temp * 10) / 10;

    const deg = document.createElement('span');
    if (degree === 'Imperial') {
      deg.className = 'summery-deg wi wi-fahrenheit';
    }
    else {
      deg.className = 'summery-deg wi wi-celsius';
    }

    const icon = document.createElement('span');
    icon.className = 'summery-icon ' + UI.GetIcon(currentData.weather[0].icon);

    summeryState.appendChild(icon);
    summeryState.appendChild(temp);
    summeryState.appendChild(deg);

    const status = document.createElement('span');
    status.className = 'summery-status';
    status.textContent = currentData.weather[0].description;

    const summeryDetails = document.createElement('div');
    summeryDetails.className = 'summery-details';

    const detailsWind = document.createElement('span');
    detailsWind.textContent = chrome.i18n.getMessage('wind') + ' ' + currentData.wind.speed + ' m/h';

    const detailsVisibility = document.createElement('span');
    if (currentData.visibility !== undefined) {
      detailsVisibility.textContent = chrome.i18n.getMessage('visibility') + ' ' + Math.round(currentData.visibility / 1000) + 'km';
    }

    const detailsHumidity = document.createElement('span');
    detailsHumidity.textContent = chrome.i18n.getMessage('humidity') + ' ' + currentData.main.humidity + '%';

    const detailsPressure = document.createElement('span');
    detailsPressure.textContent = chrome.i18n.getMessage('pressure') + ' ' + currentData.main.pressure + ' hpa';

    summeryDetails.appendChild(detailsWind);
    summeryDetails.appendChild(detailsVisibility);
    summeryDetails.appendChild(detailsHumidity);
    summeryDetails.appendChild(detailsPressure);

    summery.appendChild(cityAndCountry);
    summery.appendChild(summeryState);
    summery.appendChild(status);
    summery.appendChild(summeryDetails);
    target.appendChild(summery);
    UI.ChangeBackground(currentData.weather[0].icon);
  },
  CreateDailyFor: (weatherCollection, target) => {
    const forecast = document.createElement('div');
    forecast.className = 'forecast';
    const dayFilter = [];
    weatherCollection.list.forEach(p => {
      if (dayFilter.length > 0) {
        const isExist = dayFilter.some(q => q.dt_txt.substring(0, q.dt_txt.indexOf(' ')) ===
          p.dt_txt.substring(0, p.dt_txt.indexOf(' ')));
        if (isExist === false) {
          dayFilter.push(p);
        }
      }
      else {
        dayFilter.push(p);
      }
    });

    const dailyTitle = document.createElement('p');
    dailyTitle.className = 'page-title';
    dailyTitle.textContent = chrome.i18n.getMessage('daily');
    target.appendChild(dailyTitle);

    for (let i = 1; i < 6; i++) {
      const forecastItem = document.createElement('div');
      forecastItem.className = 'forecast-item';
      forecastItem.dataset.date = dayFilter[i].dt_txt.substring(0, dayFilter[i].dt_txt.indexOf(' '));
      const dateElem = document.createElement('span');
      dateElem.className = 'forecast-date';
      dateElem.textContent = DateHandler.GetDateFormat(dayFilter[i].dt_txt);

      const forecastIcon = document.createElement('span');
      forecastIcon.className = UI.GetIcon(dayFilter[i].weather[0].icon);
      forecastIcon.classList.add('forecast-icon');

      const degreeWrapper = document.createElement('div');
      degreeWrapper.className = 'forecast-degree';
      const maxTemp = document.createElement('span');
      maxTemp.className = 'forecast-max';


      const currentDate = dayFilter[i].dt_txt.split(' ')[0];
      const currentDayCollection = weatherCollection.list.filter(p => p.dt_txt.split(' ')[0] === currentDate);
      const minimumTemp = currentDayCollection.map(p => p.main.temp_min);
      const maximumTemp = currentDayCollection.map(p => p.main.temp_max);

      maxTemp.textContent = Math.round(parseFloat(Math.max(...maximumTemp)), 0) + '°';

      const minTemp = document.createElement('span');
      minTemp.textContent = Math.round(parseFloat(Math.min(...minimumTemp)), 0) + '°';

      const status = document.createElement('span');
      status.className = 'forecast-status';
      status.textContent = dayFilter[i].weather[0].description;

      degreeWrapper.appendChild(maxTemp);
      degreeWrapper.appendChild(minTemp);

      forecastItem.appendChild(dateElem);
      forecastItem.appendChild(forecastIcon);
      forecastItem.appendChild(degreeWrapper);
      forecastItem.appendChild(status);
      forecast.appendChild(forecastItem);
    }

    target.appendChild(forecast);
  },
  GetHourlyFor: (date, forecastData, target) => {
    const oldHourlyWrapper = document.querySelector('.hourlyWrapper');
    if (oldHourlyWrapper !== null) {
      oldHourlyWrapper.remove();
    }
    const hourlyWrapper = document.createElement('div');
    hourlyWrapper.className = 'hourlyWrapper';
    const dailyTitle = document.createElement('p');
    dailyTitle.className = 'page-title';
    dailyTitle.textContent = chrome.i18n.getMessage('hourly');
    hourlyWrapper.appendChild(dailyTitle);

    const hourlyData = forecastData.list.filter(p => p.dt_txt.substring(0, p.dt_txt.indexOf(' ')) === date);
    const hourlyItems = document.createElement('div');
    hourlyItems.className = 'hourly-items';
    hourlyData.forEach(p => {
      const hourlyItem = document.createElement('div');
      hourlyItem.className = 'hourly-item';

      const hourlyIcon = document.createElement('span');
      hourlyIcon.className = 'hourly-icon ' + UI.GetIcon(p.weather[0].icon);

      const hourlyTemp = document.createElement('span');
      hourlyTemp.className = 'hourly-temp';
      hourlyTemp.textContent = Math.round(parseFloat(p.main.temp), 0) + '°';

      const status = document.createElement('span');
      status.className = 'hourly-status';
      status.textContent = p.weather[0].main;

      const hourlyHumidity = document.createElement('span');
      hourlyHumidity.className = 'hourly-humidity';
      hourlyHumidity.textContent = p.main.humidity + '%';

      const hour = document.createElement('span');
      hour.className = 'hourly-hour';
      hour.textContent = p.dt_txt.substring(p.dt_txt.indexOf(' '), p.dt_txt.length);

      hourlyItem.appendChild(hourlyIcon);
      hourlyItem.appendChild(hourlyTemp);
      hourlyItem.appendChild(status);
      hourlyItem.appendChild(hourlyHumidity);
      hourlyItem.appendChild(hour);
      hourlyItems.appendChild(hourlyItem);
    });
    hourlyWrapper.appendChild(hourlyItems);
    target.appendChild(hourlyWrapper);
  },
  GetIcon: iconCode => {
    switch (iconCode) {
      case '01d':
        return 'wi wi-day-sunny';
      case '01n':
        return 'wi wi-night-clear';
      case '02d':
        return 'wi wi-day-cloudy';
      case '02n':
        return 'wi wi-night-alt-cloudy';
      case '03d':
        return 'wi wi-cloud';
      case '03n':
        return 'wi wi-cloud';
      case '04d':
        return 'wi wi-cloudy';
      case '04n':
        return 'wi wi-cloudy';
      case '09d':
        return 'wi wi-rain';
      case '09n':
        return 'wi wi-rain';
      case '10d':
        return 'wi wi-day-rain';
      case '10n':
        return 'wi wi-night-alt-rain';
      case '11d':
        return 'wi wi-thunderstorm';
      case '11n':
        return 'wi wi-thunderstorm';
      case '13d':
        return 'wi wi-snow';
      case '13n':
        return 'wi wi-snow';
      case '50d':
        return 'wi wi-windy';
      case '50n':
        return 'wi wi-windy';
    }
  },
  ChangeBackground: iconCode => {
    let newBackground = 'url(../Images/MostlyCloudly.jpg) no-repeat';
    switch (iconCode) {
      case '01d':
      case '01n':
        newBackground = 'url(../Images/Sunny.jpg) no-repeat';
        break;
      case '02d':
      case '02n':
        newBackground = 'url(../Images/PartlySunny.jpg) no-repeat';
        break;
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        newBackground = 'url(../Images/MostlyCloudly.jpg) no-repeat';
        break;
      case '09d':
      case '09n':
      case '10d':
      case '10n':
      case '11d':
      case '11n':
        newBackground = 'url(../Images/Rain.jpg) no-repeat';
        break;
      case '13d':
      case '13n':
        newBackground = 'url(../Images/Snow.jpg) no-repeat';
        break;
    }
    document.documentElement.style.setProperty('--background', newBackground);
    return newBackground;
  },
  MiliSecToTime: ms => {
    // Pad to 2 or 3 digits, default is 2
    var pad = (n, z = 2) => ('00' + n).slice(-z);
    return pad(ms / 3.6e6 | 0) + ':' + pad((ms % 3.6e6) / 6e4 | 0) + ':' + pad((ms % 6e4) / 1000 | 0) + '.' + pad(((ms % 1000)), 3);
  }
};
