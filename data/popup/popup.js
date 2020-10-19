/* globals WeatherServices, UI */
'use strict';

var forecastItemActive;
var forecastData;
var config = {temperature: 'Imperial',
  launch: {
    type: 'myLocation'
  },
  refreshTime: 15,
  badgeDecimalPoint: 'noDecimalPoints'
};

var favoriteList = [];
var myLocation = null;
var defaultLocation = null;

var lastLoadedCity = null;
var isFromFavorite = false;

function loadConfig(callback) {
  chrome.storage.local.get('config', result => {
    config = result.config || config;
    callback();
  });
}

function loadMyLocation(callback) {
  chrome.storage.local.get('myLocation', result => {
    myLocation = result.myLocation || myLocation;
    callback();
  });
}

function loadDefaultLocation(callback) {
  chrome.storage.local.get('defaultLocation', result => {
    defaultLocation = result.defaultLocation || defaultLocation;
    callback();
  });
}

function loadFavorites(callback) {
  chrome.storage.local.get('favoriteList', result => {
    favoriteList = result.favoriteList || favoriteList;
    if (callback !== null) {
      callback();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig(() => {
    chrome.storage.local.set({'config': config});
    loadDefaultLocation(() => {
      if (defaultLocation !== null) {
        PrepareDefaultLocationSetting();
      }
      InitializeSettingPage();
      document.querySelector('.navigation-item[data-page="homePage"]').click();
      document.querySelector('.setting-refresh-time-active').classList.remove('setting-refresh-time-active');
      document.querySelector('[data-min="' + config.refreshTime + '"]').classList.add('setting-refresh-time-active');
    });
  });
  loadFavorites(() => {
  });
  document.getElementById('btnSearch').value = chrome.i18n.getMessage('go');
});

document.addEventListener('click', e => {
  e.stopPropagation();
  switch (e.target.id) {
    case 'btnCloseDialog':
      document.getElementById('dialog').style.display = 'none';
      break;
  }

  if (e.target.classList.contains('forecast-item')) {
    if (forecastItemActive !== undefined) {
      forecastItemActive.classList.remove('forecast-item-active');
    }
    e.target.classList.add('forecast-item-active');
    forecastItemActive = e.target;
    const homePageElem = document.getElementsByClassName('home-page')[0];
    UI.GetHourlyFor(e.target.dataset.date, forecastData, homePageElem);
  }

  if (e.target.classList.contains('navigation-item')) {
    const navigationActiveElem = document.querySelector('.navigation-item-active');
    const pageShowElem = document.querySelector('[class$="-pageShow"]');

    const toolbar = document.querySelector('.toolbar');
    toolbar.classList.add('toobar-disabled');

    navigationActiveElem.classList.remove('navigation-item-active');
    pageShowElem.classList.remove(pageShowElem.classList[pageShowElem.classList.length - 1]);
    e.target.classList.add('navigation-item-active');

    const relatedPageElem = document.getElementById(e.target.dataset.page);
    relatedPageElem.classList.add(e.target.dataset.page + '-pageShow');
    if (e.target.dataset.page === 'homePage') {
      toolbar.classList.remove('toobar-disabled');
      InitializeServices(() => {
        if (defaultLocation !== null) {
          if (lastLoadedCity.id === defaultLocation.main.id) {
            document.getElementById('setAsDefault').classList.add('toolbar-default-active');
          }
          else {
            document.getElementById('setAsDefault').classList.remove('toolbar-default-active');
          }
        }
      });
    }

    if (e.target.dataset.page === 'favoritePage') {
      // document.getElementById('loader').style.display = 'flex';
      InitializeFavorites();
      // RefreshAllFavorites(() => {
      //   document.getElementById('loader').style.display = 'none';
      //   InitializeFavorites();
      // });
    }
  }

  if (e.target.className === 'icon-refresh') {
    RefreshWeather();
  }

  if (e.target.classList.contains('setting-refresh-time')) {
    document.querySelector('.setting-refresh-time-active').classList.remove('setting-refresh-time-active');
    e.target.classList.add('setting-refresh-time-active');
    config.refreshTime = parseFloat(e.target.dataset.min);
    chrome.storage.local.set({'config': config});
    chrome.alarms.create('alarmMyLocation', {when: new Date().getTime(), periodInMinutes: config.refreshTime});
  }

  if (e.target.classList.contains('icon-location')) {
    if (e.target.classList.contains('toolbar-default-active')) {
      e.target.classList.remove('toolbar-default-active');
      defaultLocation = null;
      chrome.storage.local.set({'defaultLocation': defaultLocation});
      config.launch.type = 'myLocation';
      chrome.storage.local.set({'config': config});
      document.querySelector('input[value="myLocation"]').checked = true;
      PrepareDefaultLocationSetting(true);
    }
    else {
      defaultLocation = {main: lastLoadedCity, forecast: forecastData};
      chrome.storage.local.set({'defaultLocation': defaultLocation});
      document.getElementById('dialogAreaName').textContent = lastLoadedCity.name;
      document.getElementById('dialogDescription').textContent = chrome.i18n.getMessage('set_as_default');
      document.getElementById('dialog').style.display = 'flex';
      config.launch.type = 'defaultLocation';
      chrome.storage.local.set({'config': config});
      document.querySelector('input[value="defaultLocation"]').checked = true;
      e.target.classList.add('toolbar-default-active');
      PrepareDefaultLocationSetting();
    }
    chrome.runtime.sendMessage({action: 'changeSettingTemp'});
  }

  if (e.target.classList.contains('toolbar-favorite')) {
    const dialogDescription = document.getElementById('dialogDescription');
    if (!favoriteList.some(p => p.id === lastLoadedCity.id)) {
      favoriteList.push({id: lastLoadedCity.id, obj: lastLoadedCity});
      chrome.storage.local.set({'favoriteList': favoriteList});
      dialogDescription.textContent = chrome.i18n.getMessage('added_to_favorite');
      document.querySelector('.toolbar-favorite').classList.add('icon-favorite', 'toolbar-favorite-active');
      document.getElementById('dialogAreaName').textContent = lastLoadedCity.name;
      document.getElementById('dialog').style.display = 'flex';
    }
    else {
      favoriteList = favoriteList.filter(p => p.id !== lastLoadedCity.id);
      chrome.storage.local.set({'favoriteList': favoriteList});
      document.querySelector('.toolbar-favorite').classList.remove('icon-favorite', 'toolbar-favorite-active');
    }
  }

  if (e.target.classList.contains('favorite-item')) {
    WeatherServices.GetWeartherById(parseInt(e.target.dataset.cityId), config.temperature, result => {
      lastLoadedCity = result;
      document.getElementById('loader').style.display = 'flex';
      const homePageElem = document.getElementsByClassName('home-page')[0];
      UI.CreateSummeryFor(result, config.temperature, homePageElem);
      WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
        UI.CreateDailyFor(forecastResult, homePageElem);
        forecastData = forecastResult;
        document.querySelector('.forecast-item').click();
        isFromFavorite = true;
        document.querySelector('.navigation-item[data-page = "homePage"]').click();
        isFromFavorite = false;
      });
    });
  }
});

// locales
[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  const value = e.dataset.i18nValue || 'textContent';
  e[value] = chrome.i18n.getMessage(e.dataset.i18n);
});

document.getElementById('settingTemp').addEventListener('change', ({target}) => {
  document.getElementById('loader').style.display = 'flex';
  config.temperature = target.value;
  chrome.storage.local.set({'config': config});
  if (config.launch.type === 'myLocation') {
    RefreshMyLocation();
    if (defaultLocation !== null) {
      RefreshDefaultLocation();
    }
  }
  else if (config.launch.type === 'defaultLocation') {
    RefreshDefaultLocation();
  }

  RefreshAllFavorites(() => {});
  chrome.runtime.sendMessage({action: 'changeSettingTemp'});
});

document.getElementById('badgeSetting').addEventListener('change', ({target}) => {
  config.badgeDecimalPoint = target.value;
  chrome.storage.local.set({'config': config});
  chrome.runtime.sendMessage({action: 'changeSettingTemp'});
});

document.getElementById('settingLaunch').addEventListener('change', ({target}) => {
  config.launch.type = target.value;
  chrome.storage.local.set({'config': config});
  chrome.runtime.sendMessage({action: 'changeSettingLaunch'});
});

function InitializeSettingPage() {
  document.querySelector('input[value ="' + config.temperature + '"]').checked = true;
  document.querySelector('input[value ="' + config.launch.type + '"]').checked = true;
  document.querySelector('input[value ="' + config.badgeDecimalPoint + '"]').checked = true;
}

function InitializeServices(callback) {
  const homePageElem = document.getElementsByClassName('home-page')[0];
  document.getElementById('loader').style.display = 'flex';
  homePageElem.textContent = '';
  if (config.launch.type === 'myLocation' && isFromFavorite === false) {
    loadMyLocation(() => {
      if (myLocation === null) {
        WeatherServices.GetCurrentLocation((lat, lon) => {
          WeatherServices.GetByCoordinates(lat, lon, config.temperature, result => {
            lastLoadedCity = result;
            document.getElementById('loader').style.display = 'none';
            UI.CreateSummeryFor(result, config.temperature, homePageElem);
            WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
              UI.CreateDailyFor(forecastResult, homePageElem);
              forecastData = forecastResult;
              myLocation = {main: result, forecast: forecastResult};
              chrome.storage.local.set({'myLocation': myLocation});
              document.querySelector('.forecast-item').click();
              ReformToolbarFavorite();
            });
          });
        });
        chrome.alarms.create('myLocation', {when: new Date().getTime(), periodInMinutes: 15});
      }
      else {
        lastLoadedCity = myLocation.main;
        ReformToolbarFavorite();
        document.getElementById('loader').style.display = 'none';
        UI.CreateSummeryFor(myLocation.main, config.temperature, homePageElem);
        UI.CreateDailyFor(myLocation.forecast, homePageElem);
        forecastData = myLocation.forecast;
        document.querySelector('.forecast-item').click();
      }
    });
  }
  else if (config.launch.type === 'defaultLocation' && isFromFavorite === false) {
    LoadDefaultLocationWeather();
    ReformToolbarFavorite();
  }
  else if (isFromFavorite === true) {
    PrepareFavoriteWeather();
    ReformToolbarFavorite();
  }
  setTimeout(function() {
    callback();
  }, 1000);
}

document.querySelector('#txtSearch').addEventListener('input', e => {
  const queryText = e.target.value;

  // using google suggested service.
  WeatherServices.FindCity(queryText, config.temperature, suggestedList => {
    let cityNames = null;
    let countryNames = null;
    if (suggestedList.list.length > 0) {
      cityNames = suggestedList.list.map(p => p.name);
      countryNames = suggestedList.list.map(p => p.sys.country);
    }
    const datalist = document.getElementById('suggestedDatalist');
    ClearAllChilds(datalist);
    let stationCounter = 0;
    for (let i = 0; i < suggestedList.list.length; i++) {
      const newOption = document.createElement('option');
      if ((cityNames.filter(p => p === suggestedList.list[i].name).length > 1) &&
          countryNames.filter(p => p === suggestedList.list[i].sys.country).length > 1) {
        stationCounter++;
        newOption.setAttribute('value', suggestedList.list[i].name + ', ' + suggestedList.list[i].sys.country + ' - Station ' + stationCounter);
        newOption.dataset.station = 'Station ' + stationCounter;
        newOption.dataset.id = suggestedList.list[i].id;
      }
      else {
        newOption.setAttribute('value', suggestedList.list[i].name + ', ' + suggestedList.list[i].sys.country);
      }
      if (navigator.userAgent.indexOf('Firefox') === -1) {
        if (config.temperature === 'Imperial') {
          newOption.textContent = Math.round(suggestedList.list[i].main.temp, 0) + '°F';
        }
        else {
          newOption.textContent = Math.round(suggestedList.list[i].main.temp, 0) + '°C';
        }
      }
      datalist.appendChild(newOption);
    }
  });
});

document.querySelector('#frmSearch').addEventListener('submit', e => {
  e.preventDefault();
  const searchElem = document.getElementById('txtSearch');
  const formElem = document.getElementById('frmSearch');
  const indexOfSearchValue = searchElem.value.indexOf('Station');
  let stationId = 0;
  let stationName = '';
  if (indexOfSearchValue !== -1) {
    stationName = searchElem.value.substring(indexOfSearchValue);
    const relatedStationId = document.querySelector('[data-station = "' + stationName + '"]');
    if (relatedStationId !== null) {
      StartSearch(parseInt(relatedStationId.dataset.id), config.temperature);
      formElem.reset();
    }
    else {
      chrome.runtime.sendMessage({action: 'noSearchResult'});
    }
  }
  else {
    WeatherServices.FindCity(searchElem.value, config.temperature, suggestedList => {
      if (suggestedList.list.length > 0) {
        StartSearch(suggestedList.list[0].id, config.temperature);
        formElem.reset();
      }
      else {
        chrome.runtime.sendMessage({action: 'noSearchResult'});
      }
    });
  }
});

function StartSearch(id, temp) {
  const homePageElem = document.getElementsByClassName('home-page')[0];
  document.getElementById('loader').style.display = 'flex';
  homePageElem.textContent = '';
  WeatherServices.GetWeartherById(id, temp, result => {
    lastLoadedCity = result;
    document.getElementById('loader').style.display = 'none';
    UI.CreateSummeryFor(result, config.temperature, homePageElem);
    WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
      UI.CreateDailyFor(forecastResult, homePageElem);
      forecastData = forecastResult;
      document.querySelector('.forecast-item').click();
      ReformToolbarFavorite();
      if (defaultLocation !== null) {
        if (lastLoadedCity.id === defaultLocation.main.id) {
          document.getElementById('setAsDefault').classList.add('toolbar-default-active');
        }
        else {
          document.getElementById('setAsDefault').classList.remove('toolbar-default-active');
        }
      }
    });
  });
}

function InitializeFavorites() {
  const favoritePageElem = document.getElementById('favoritePage');
  favoritePageElem.textContent = '';
  if (defaultLocation !== null) {
    const defaultLaunchHeading = document.createElement('p');
    defaultLaunchHeading.className = 'favorite-heading';
    defaultLaunchHeading.textContent = chrome.i18n.getMessage('default_launch_heading');
    favoritePageElem.appendChild(defaultLaunchHeading);

    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.dataset.cityId = defaultLocation.main.id;
    favoriteItem.style.background = UI.ChangeBackground(defaultLocation.main.weather[0].icon);
    UI.CreateSummeryFor(defaultLocation.main, config.temperature, favoriteItem);
    favoritePageElem.appendChild(favoriteItem);
  }

  if (favoriteList.length > 0) {
    const favoritesHeading = document.createElement('p');
    favoritesHeading.className = 'favorite-heading';
    favoritesHeading.textContent = chrome.i18n.getMessage('favorite_heading');
    favoritePageElem.appendChild(favoritesHeading);
  }
  favoriteList.forEach(p => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.dataset.cityId = p.id;
    favoriteItem.style.background = UI.ChangeBackground(p.obj.weather[0].icon);
    UI.CreateSummeryFor(p.obj, config.temperature, favoriteItem);
    favoritePageElem.appendChild(favoriteItem);
  });
}

function ClearAllChilds(parent) {
  parent.textContent = '';
}

function RefreshMyLocation() {
  WeatherServices.GetCurrentLocation((lat, lon) => {
    WeatherServices.GetByCoordinates(lat, lon, config.temperature, result => {
      lastLoadedCity = result;
      WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
        forecastData = forecastResult;
        myLocation = {main: result, forecast: forecastResult};
        chrome.storage.local.set({'myLocation': myLocation});
        document.getElementById('loader').style.display = 'none';
      });
    });
  });
}

function RefreshDefaultLocation() {
  WeatherServices.GetWeartherById(defaultLocation.main.id, config.temperature, result => {
    lastLoadedCity = result;
    WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
      forecastData = forecastResult;
      defaultLocation = {main: result, forecast: forecastResult};
      chrome.storage.local.set({'defaultLocation': defaultLocation});
      document.getElementById('loader').style.display = 'none';
    });
  });
}

function RefreshWeather() {
  const homePageElem = document.getElementsByClassName('home-page')[0];
  document.getElementById('loader').style.display = 'flex';
  homePageElem.textContent = '';
  WeatherServices.GetWeartherById(lastLoadedCity.id, config.temperature, result => {
    lastLoadedCity = result;
    document.getElementById('loader').style.display = 'none';
    UI.CreateSummeryFor(result, config.temperature, homePageElem);
    WeatherServices.GetFiveForecast(result.id, config.temperature, forecastResult => {
      UI.CreateDailyFor(forecastResult, homePageElem);
      forecastData = forecastResult;
      chrome.runtime.sendMessage({action: 'refreshWeather'});
      document.querySelector('.forecast-item').click();
    });
  });
}

function PrepareDefaultLocationSetting(isDisabled = false) {
  if (isDisabled === false) {
    const defaultLocationRadio = document.getElementById('rdoDefaultLocation');
    defaultLocationRadio.removeAttribute('disabled');
    const defaultLocationName = document.getElementById('defaultLocationName');
    defaultLocationName.textContent = '(' + defaultLocation.main.name + ', ' + defaultLocation.main.sys.country + ')';
  }
  else {
    const defaultLocationRadio = document.getElementById('rdoDefaultLocation');
    defaultLocationRadio.setAttribute('disabled', true);
    const defaultLocationName = document.getElementById('defaultLocationName');
    defaultLocationName.textContent = '';
  }
}

function LoadDefaultLocationWeather() {
  const homePageElem = document.getElementsByClassName('home-page')[0];
  lastLoadedCity = defaultLocation.main;
  document.getElementById('loader').style.display = 'none';
  UI.CreateSummeryFor(defaultLocation.main, config.temperature, homePageElem);
  UI.CreateDailyFor(defaultLocation.forecast, homePageElem);
  forecastData = defaultLocation.forecast;
  document.querySelector('.forecast-item').click();
}

function PrepareFavoriteWeather() {
  const homePageElem = document.getElementsByClassName('home-page')[0];
  document.getElementById('loader').style.display = 'none';
  UI.CreateSummeryFor(lastLoadedCity, config.temperature, homePageElem);
  UI.CreateDailyFor(forecastData, homePageElem);
  document.querySelector('.forecast-item').click();
}

function ReformToolbarFavorite() {
  if (favoriteList.length > 0) {
    const favoriteIdList = favoriteList.map(p => p.id);
    if (favoriteIdList.indexOf(lastLoadedCity.id) > -1) {
      document.querySelector('.toolbar-favorite').classList.add('icon-favorite', 'toolbar-favorite-active');
    }
    else {
      document.querySelector('.toolbar-favorite').classList.remove('icon-favorite', 'toolbar-favorite-active');
    }
  }
}

function RefreshAllFavorites(callback) {
  const lenghtNumber = favoriteList.length;
  let counter = 0;
  if (favoriteList.length === 0) {
    callback();
  }
  favoriteList.forEach(p => {
    WeatherServices.GetWeartherById(p.id, config.temperature, result => {
      const indexOfItem = favoriteList.findIndex(q => q.id === p.id);
      favoriteList[indexOfItem].obj = result;
      chrome.storage.local.set({'favoriteList': favoriteList});
      counter++;
      if (counter === lenghtNumber) {
        callback();
      }
    });
  });
}
