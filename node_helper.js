const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
    socketNotificationReceived(notification, payload) {
        var that = this;

        switch(notification) {
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

                        that.sendSocketNotification('DATA', data.currentMeasurements)
                    }
                });
                break;
            case 'GET_LOC':
                request('https://airapi.airly.eu/v1//sensors/' + payload.sensorID + '?apikey=' + payload.apiKey, function (error, response, body) {
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

                        that.sendSocketNotification('LOC', data.address);
                    }
                });

                break;
        }
    }
});

var nowcast = function(values, pollutionType) {
    var len = 'O3' == pollutionType ? 8 : 12
    var pollutions = []
    for (let pol of values) {
        if (pol[1]) {
            pollutions.push(pol[1])
            if (pollutions.length >= len) {
                break
            }
        }
    }

    // math from: https://en.wikipedia.org/wiki/NowCast_(air_quality_index)
    var w = Math.min(...pollutions) / Math.max(...pollutions)

    if (1 == w) {
        return pollutions[0]
    }

    if (pollutionType != 'O3') {
        w = w > .5 ? w : .5

        if (.5 == w) {
            var ncl = 0
            for (i = 0; i < pollutions.length; i++) {
                ncl += Math.pow(.5, i + 1) * pollutions[i];
            }
            return (ncl);
        }
    }
    var ncl = 0, ncm = 0
    for (i = 0; i < pollutions.length; i++) {
        ncl += Math.pow(w, i) * pollutions[i];
        ncm += Math.pow(w, i)
    }
    return (ncl / ncm);
}
