/* globals serviceConfig */
'use strict';

window.setTimeout(function () {
  chrome.storage.local.get("version", e => {
    if (!e.version) {
      var version = chrome.runtime.getManifest().version;
      var homepage = chrome.runtime.getManifest().homepage_url;
      var url = homepage + "?v=" + version + "&type=install";
      chrome.tabs.create({"url": url, "active": true});
      chrome.storage.local.set({"version": version}, function () {});
    }
  });
}, 3000);

var alarmCallback = () => {
  chrome.alarms.create('alarmMyLocation', {when: new Date().getTime() + 1000, periodInMinutes: 15});
  //console.log('alarm');
};

var contextCallback = () => chrome.contextMenus.create({
  'id': 'refreshWeather',
  'title': chrome.i18n.getMessage('browserAction_context_menu'),
  'contexts': ['browser_action'],
  'documentUrlPatterns': ['*://*/*']
});

chrome.runtime.onInstalled.addListener(() => {
  alarmCallback();
  contextCallback();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('config', configResult => {
    let refreshTime = 15;
    if (configResult.config !== undefined) {
      refreshTime = configResult.config.refreshTime;
    }
    chrome.alarms.create('alarmMyLocation', {when: new Date().getTime(), periodInMinutes: refreshTime});
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  //console.log('AlarmCalled');
  if (alarm.name === 'alarmMyLocation') {
    Initialize();
  }
});

chrome.idle.onStateChanged.addListener(newState => {
  if (newState === 'active') {
    chrome.storage.local.get('config', configResult => {
      if (configResult.config !== undefined) {
        chrome.alarms.create('alarmMyLocation', {when: new Date().getTime(), periodInMinutes: configResult.config.refreshTime});
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener(() => {
  UpdateBrowserAction();
});

chrome.runtime.onMessage.addListener(request => {
  if (request.action === 'changeSettingTemp' ||
       request.action === 'changeSettingDecimalPoint' ||
       request.action === 'changeSettingLaunch' ||
       request.action === 'refreshWeather') {
    UpdateBrowserAction();
  }
  else if (request.action === 'noSearchResult') {
    chrome.notifications.create('noti', {
      type: 'basic',
      title: chrome.i18n.getMessage('no_search_result_title'),
      iconUrl: 'data/icons/24.png',
      message: chrome.i18n.getMessage('no_search_result')
    });
  }
});

function UpdateBrowserAction() {
  chrome.storage.local.get('config', configResult => {
    if (configResult.config !== undefined) {
      if (configResult.config.launch.type === 'myLocation') {
        RefreshCurrentLocation(configResult.config.temperature, configResult.config.badgeDecimalPoint);
      }
      else if (configResult.config.launch.type === 'defaultLocation') {
        RefreshDefaultLocation(configResult.config.temperature, configResult.config.badgeDecimalPoint);
      }
    }
  });
}

function ChangeBadge(temp, decimalPointType) {
  const badgeDecimalPoints = decimalPointType;
  if (badgeDecimalPoints === 'noDecimalPoints') {
    temp = Math.round(temp);
  }
  else {
    temp = temp.toFixed(1);
  }
  chrome.browserAction.setBadgeText({text: temp.toString()});
}

function ChangeBrowserActionIcon(icon) {
  chrome.browserAction.setIcon({path:
  {16: 'data/icons/16/' + icon + '.png',
    18: 'data/icons/18/' + icon + '.png',
    19: 'data/icons/19/' + icon + '.png',
    32: 'data/icons/32/' + icon + '.png',
    36: 'data/icons/36/' + icon + '.png',
    38: 'data/icons/38/' + icon + '.png'}
  }, () => {

  });
}

function SetTooltip(temp, state, decimalPointType, cityName) {
  const tooltipDecimalPoints = decimalPointType;
  if (tooltipDecimalPoints === 'noDecimalPoints') {
    temp = Math.round(temp);
  }
  else {
    temp = temp.toFixed(1);
  }
  chrome.browserAction.setTitle({title :'City: ' + cityName + '\nTemp: ' + temp.toString() +
    '\nState: ' + state + '\n\nLast Update Time: ' + new Date().toLocaleString()
  });
}

function Initialize() {
  chrome.storage.local.get('config', configResult => {
    if (configResult.config !== undefined) {
      if (configResult.config.launch.type === 'myLocation') {
        RefreshCurrentLocation(configResult.config.temperature);
      }
      else {
        RefreshDefaultLocation(configResult.config.temperature, configResult.config.badgeDecimalPoint);
      }
      RefreshAllFavorites();
    }
    else {
      RefreshCurrentLocation('Imperial');
    }
  });
}

function GetCurrentLocation(callback) {
  var xmlForClientConfig = new XMLHttpRequest();
  xmlForClientConfig.onload = function() {
    if (xmlForClientConfig.status === 200) {
      var clientResponse = JSON.parse(xmlForClientConfig.responseText);
      var lat = clientResponse.lat;
      var lon = clientResponse.lon;
      callback(lat, lon);
    }
  };
  xmlForClientConfig.open('GET', serviceConfig.currentLocationPath, true);
  xmlForClientConfig.send(null);
}

function GetByCoordinates(lat, lon, degree, callback) {
  const requestURL = serviceConfig.urlPrefix + 'weather?lat=' +
  lat + '&lon=' + lon + '&units=' + degree + serviceConfig.appId;
  const request = new XMLHttpRequest();
  request.open('GET', requestURL);
  request.send();
  request.onload = () => {
    if (request.status === 200) {
      var response = JSON.parse(request.responseText);
      callback(response);
    }
  };
}

function GetFiveForecast(cityId, degree, callback) {
  const requestURL = serviceConfig.urlPrefix + 'forecast?id=' +
  cityId + '&units=' + degree + serviceConfig.appId;
  const request = new XMLHttpRequest();
  request.open('GET', requestURL);
  request.send();
  request.onload = () => {
    if (request.status === 200) {
      var response = JSON.parse(request.responseText);
      callback(response);
    }
  };
}

function GetWeartherById(id, degree, callback) {
  const requestURL = serviceConfig.urlPrefix + 'weather?id=' +
   id + '&units=' + degree + serviceConfig.appId;
  const request = new XMLHttpRequest();
  request.open('GET', requestURL);
  request.send();
  request.onload = () => {
    if (request.status === 200) {
      var response = JSON.parse(request.responseText);
      callback(response);
    }
  };
}

function RefreshCurrentLocation(degree, decimalPoint = 'noDecimalPoints') {
  GetCurrentLocation((lat, lon) => {
    GetByCoordinates(lat, lon, degree, result => {
      GetFiveForecast(result.id, degree, forecastResult => {
        const myLocation = {main: result, forecast: forecastResult};
        chrome.storage.local.set({'myLocation': myLocation});
        ChangeBadge(myLocation.main.main.temp, decimalPoint);
        ChangeBrowserActionIcon(myLocation.main.weather[0].icon);
        SetTooltip(myLocation.main.main.temp, myLocation.main.weather[0].main, decimalPoint, myLocation.main.name);
      });
    });
  });
}

function RefreshDefaultLocation(degree, badgeDecimalPoint) {
  chrome.storage.local.get('defaultLocation', result => {
    if (result.defaultLocation !== undefined) {
      GetWeartherById(result.defaultLocation.main.id, degree, result => {
        GetFiveForecast(result.id, degree, forecastResult => {
          const defaultLocation = {main: result, forecast: forecastResult};
          chrome.storage.local.set({'defaultLocation': defaultLocation});
          ChangeBadge(defaultLocation.main.main.temp, badgeDecimalPoint);
          ChangeBrowserActionIcon(defaultLocation.main.weather[0].icon);
          SetTooltip(defaultLocation.main.main.temp, defaultLocation.main.weather[0].main, badgeDecimalPoint, defaultLocation.main.name);
        });
      });
    }
  });
}

function RefreshAllFavorites() {
  chrome.storage.local.get('config', configResult => {
    if (configResult.config !== undefined) {
      chrome.storage.local.get('favoriteList', result => {
        if (result.favoriteList !== undefined && result.favoriteList.length > 0) {
          result.favoriteList.forEach(p => {
            GetWeartherById(p.id, configResult.config.temperature, resultOut => {
              const indexOfItem = result.favoriteList.findIndex(q => q.id === p.id);
              result.favoriteList[indexOfItem].obj = resultOut;
              chrome.storage.local.set({'favoriteList': result.favoriteList});
            });
          });
        }
      });
    }
  });
}
