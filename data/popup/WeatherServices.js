/* globals serviceConfig */
'use strict';

var WeatherServices = {
  GetWeartherFor: (query, degree, callback) => {
    const requestURL = serviceConfig.urlPrefix + 'weather?q=' + query +
     '&units=' + degree + serviceConfig.appId;
    const request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.send();
    request.onload = () => {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText);
        callback(response);
      }
    };
  },
  GetWeartherById: (id, degree, callback) => {
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
  },
  GetByCoordinates: (lat, lon, degree, callback) => {
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
  },
  GetFiveForecast: (cityId, degree, callback) => {
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
  },
  FindCity: (cityName, degree, callback) => {
    const requestURL = serviceConfig.urlPrefix + 'find?q=' +
     cityName + '&units=' + degree + '&type=like' + serviceConfig.appId;
    const request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.send();
    request.onload = () => {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText);
        callback(response);
      }
    };
  },
  GetCurrentLocation: callback => {
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
};
