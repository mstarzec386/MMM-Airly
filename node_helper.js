const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived(notification, payload) {
    var that = this;

    switch (notification) {
      case 'GET_DATA':
        request({
	    url: payload.latitude && payload.longitude ?
		`https://airapi.airly.eu/v2/measurements/point?lat=${payload.latitude}&lng=${payload.longitude}&indexType=AIRLY_CAQI&indexPollutant=PM&includeWind=true` :
		`https://airapi.airly.eu/v2/measurements/installation?installationId=${payload.sensorID}&indexType=AIRLY_CAQI&indexPollutant=PM&includeWind=true`,
	    headers: {
		'Accept': 'application/json',
		'apikey': payload.apiKey
	    }
	}, function(error, response, body) {
            if (error) {
              console.error('GET_DATA error:', error.message);

              return that.sendSocketNotification('ERR', {
                type: 'request error',
                msg: error,
              });
            }

            if (response.statusCode != 200) {
              console.error('GET_DATA wrong status code:', response.statusCode);

              return that.sendSocketNotification('ERR', {
                type: 'request statusCode',
                msg: response && response.statusCode,
              });
            }

            if (!error & (response.statusCode == 200)) {
              let data;

              try {
                data = JSON.parse(body);
              } catch (e) {
                console.error('GET_DATA json parse:', e.message);

                return that.sendSocketNotification('ERR', {
                  type: 'request error',
                  msg: error,
                });
              }

              that.sendSocketNotification(
                'DATA',
                translateMeasurementsFromV2(data)
              );
            }
          }
        );
        break;
      case 'GET_LOC':
        request(
   	payload.longitude && payload.longitude ?
	    {
		url: `https://nominatim.airly.org/reverse?format=json&lat=${payload.latitude}&lon=${payload.longitude}`,
		headers: {
		    'Accept': 'application/json'
		}
	    } :
	    {
		url: `https://airapi.airly.eu/v2/installations/${payload.sensorID}`,
		headers: {
		    'Accept': 'application/json',
		    'apikey': payload.apiKey
		}
	    },
          function(error, response, body) {
            if (error) {
              console.error('GET_LOC error:', error.message);

              return that.sendSocketNotification('ERR', {
                type: 'request error',
                msg: error,
              });
            }

            if (response.statusCode != 200) {
              console.error('GET_LOC wrong status code:', response.statusCode);

              return that.sendSocketNotification('ERR', {
                type: 'request statusCode',
                msg: response && response.statusCode,
              });
            }

            if (!error & (response.statusCode == 200)) {
              let data;

              try {
                data = JSON.parse(body);
              } catch (e) {
                console.error('GET_LOC json parse error:', e.message);

                return that.sendSocketNotification('ERR', {
                  type: 'request error',
                  msg: error,
                });
              }

              that.sendSocketNotification('LOC', data.address);
            }
          }
        );

        break;
    }
  },
});

function translateMeasurementsFromV2(data) {
  var v1 = {};

  if (!data.current) {
    return v1;
  }

  var current = data.current;


  if (current.values && Array.isArray(current.values)) {
    current.values.forEach(function(value) {
      v1[value.name.toLowerCase()] = value.value;
    });
  }

  if (current.indexes && Array.isArray(current.indexes)) {
    current.indexes.forEach(function(value) {
      v1[value.name.toLowerCase()] = value.value;
      v1[value.name.toLowerCase() + '_color'] = value.color.toLowerCase();
      v1[value.name.toLowerCase() + '_advice'] = value.advice;
      v1[value.name.toLowerCase() + '_description'] = value.description;
    });
  }

  if (current.standards && Array.isArray(current.standards)) {
	  current.standards.forEach(function(value) {
		  v1[value.pollutant.toLowerCase() + '_standard'] = value.limit;
	  });
  }

  return v1;
}
