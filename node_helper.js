
﻿const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived(notification, payload) {
    var that = this;

    switch (notification) {
      case 'GET_DATA':
        request('https://airapi.airly.eu/v1/sensor/measurements?sensorId=' + payload.sensorID + '&historyHours=1&historyResolutionHours=1&apikey=' + payload.apiKey, function (error, response, body) {
          if (error) {
            that.sendSocketNotification('ERR', { type: 'request error', msg: error });
          }

          if (response.statusCode != 200) {
            that.sendSocketNotification('ERR', { type: 'request statusCode', msg: response && response.statusCode });
          }

          if (!error & response.statusCode == 200) {
            let data;

            try {
              data = JSON.parse(body);
            } catch (e) {
              return that.sendSocketNotification('ERR', { type: 'request error', msg: error });
            }

            data.currentMeasurements.sensorID = payload.sensorID;

            that.sendSocketNotification('DATA', data.currentMeasurements)
          }
        });
        break;
      case 'GET_LOC':
        request('https://airapi.airly.eu/v1//sensors/' + payload.sensorID + '?apikey=' + payload.apiKey, function (error, response, body) {
          if (error) {
            return that.sendSocketNotification('ERR', { type: 'request error', msg: error });
          }

          if (response.statusCode != 200) {
            return that.sendSocketNotification('ERR', { type: 'request statusCode', msg: response && response.statusCode });
          }

          if (!error & response.statusCode == 200) {
            let data;

            try {
              data = JSON.parse(body);
            } catch (e) {
              return that.sendSocketNotification('ERR', { type: 'request error', msg: error });
            }

            data.address.sensorID = payload.sensorID;

            return that.sendSocketNotification('LOC', data.address);
          }
        });

        break;
    }
  }
});
