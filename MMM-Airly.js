"use strict"

const pollutions = {
  airQualityIndex: {
    human: 'AQI',
    norm: 50,
    unit: '',
  },
  pm10: {
    human: 'PM10',
    norm: 50,
    unit: 'µg/m³',
  },
  pm25: {
    human: 'PM2.5',
    norm: 25,
    unit: 'µg/m³',
  }
}

Module.register('MMM-Airly', {
  defaults: {
    showDates: false,
    showDescription: true,
    showLocation: true,
    showValues: false,
    showMeteo: false,
    updateInterval: 30,
    animationSpeed: 1000,
    colors: false,
    fontSize: 100,
  },
  start: function () {
    Log.info('Starting module: ' + this.name);

    this.config.fontSize = parseInt(this.config.fontSize)

    // load data
    this.load();

    // schedule refresh
    setInterval(
      this.load.bind(this),
      this.config.updateInterval * 60 * 1000);
  },
  load: function () {
    var that = this;

    if (!this.data.address && this.config.showLocation) {
      this.sendSocketNotification('GET_LOC', { sensorID: that.config.sensorID, apiKey: that.config.apiKey });
    }

    this.sendSocketNotification('GET_DATA', { sensorID: that.config.sensorID, apiKey: that.config.apiKey })

  },
  socketNotificationReceived: function (notification, payload) {
    if (payload.sensorID === this.config.sensorID) {
      switch (notification) {
        case 'DATA':
          this.data.pollution = payload;
          this.loaded = true;
          this.updateDom(this.animationSpeed);
          break;
        case 'LOC':
          this.data.address = payload
          this.updateDom(this.animationSpeed);
          break;
        case 'ERR':
          console.log('error :(', payload)
          break;
        default:
          console.log('wrong socketNotification', notification, payload)
          break;
      }
    }
  },
  html: {
    icon: '<i class="fa fa-leaf"></i>',
    meteoIcon: '<i class="fa fa-thermometer-empty">',
    location: '<div class="xsmall">{0} {1}, {2}, {3}</div>',
    values: '({0} {1} {2}{3})',
    meteoValues: ' {0}{1}',
    quality: '<table><caption>{0}</caption><tbody style="font-size: {1}%">{2}</tbody></table>',
    qualityTr: '<tr{0}><td>{1}</td><td>{2}</td><td>{3}</td><td class="light">{4}</td><td class="light">{5}</td></tr>',
    meteoTr: '<tr><td>{0}</td><td>{1}°C</td><td>{2}%</td><td>{3}hPa</td></tr>',
  },
  getScripts: function () {
    return ['String.format.js'];
  },
  getStyles: function () {
    return [
      'font-awesome.css',
      'MMM-Airly.css',
    ];
  },
  getDom: function () {
    var wrapper = document.createElement('div');
    if (!this.config.sensorID) {
      wrapper.innerHTML = this.translate('NoSensorID') + this.name + '.';
      wrapper.className = 'dimmed light small';
    }
    else if (!this.loaded) {
      wrapper.innerHTML = this.translate('Loading');
      wrapper.className = 'dimmed light small';
    }
    else if (!this.data.pollution) {
      wrapper.innerHTML = this.translate('NoData') + this.config.pollutionType;
      wrapper.className = 'dimmed light small';
    }
    else {
      var tbody = '';
      var meteo = '';
      let pollution = this.data.pollution;
      let keys = Object.keys(pollution);

      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = pollution[key];
        if (Object.keys(pollutions).indexOf(key) > -1) {
          tbody += this.html.qualityTr.format(
            this.config.colors ? ' style="color:' + this.color(value / pollutions[key].norm) + '"' : '',
            this.html.icon,
            pollutions[key].human,
            this.config.showDescription ? this.impact(value, key) : '',
            (this.config.showValues ? this.html.values.format((Math.round(value * 10) / 10).toString().replace('.', ','), this.translate('Of'), pollutions[key].norm, pollutions[key].unit) : ''),
            ''
          )
        }

      }

      if (this.config.showMeteo) {
        let temperature = isNaN(parseFloat(pollution.temperature)) ? '-' : (Math.round(pollution.temperature * 10) / 10).toString().replace('.', ',');
        let humidity = isNaN(parseFloat(pollution.humidity)) ? '-' : (Math.round(pollution.humidity * 10) / 10).toString().replace('.', ',');
        let pressure = isNaN(parseFloat(pollution.pressure)) ? '-' : Math.round(pollution.pressure / 100).toString().replace('.', ',');

        meteo += this.html.meteoTr.format(
          this.html.meteoIcon,
          temperature,
          humidity,
          pressure,
        )
      }

      wrapper.innerHTML = this.html.quality.format(
        (this.config.showLocation && this.data.address ? this.html.location.format(this.data.address.route, this.data.address.locality, this.data.address.streetNumber, this.data.address.country) : ''),
        this.config.fontSize,
        meteo + tbody
      )
    }
    return wrapper;
  },
  getTranslations: function () {
    return {
      en: 'translations/en.json',
      pl: 'translations/pl.json'
    }
  },
  impact: function (pollution, type) {
         if (pollution < pollutions[type].norm    ) return this.translate('Good');
    else if (pollution < pollutions[type].norm * 2) return this.translate('Moderate');
    else if (pollution < pollutions[type].norm * 3) return this.translate('Low');
    else if (pollution < pollutions[type].norm * 4) return this.translate('Unhealthy');
    else if (pollution < pollutions[type].norm * 6) return this.translate('VeryUnhealthy');
    else return this.translate('Hazardous');
  },
  color: function (x) {
    //color palete from https://en.wikipedia.org/wiki/Air_quality_index#India
    return (
      '#' + [
        -13.3333 * Math.pow(x, 2) + 87.3143 * x + 120.162,                         //R https://www.wolframalpha.com/input/?i=quadratic+fit+%7B0,121%7D,%7B1,187%7D,%7B2,255%7D,%7B3,255%7D,%7B4,255%7D,%7B6,165%7D
        7.15942 * Math.pow(x, 3) - 65.911 * Math.pow(x, 2) + 114.636 * x + 177.93, //G https://www.wolframalpha.com/input/?i=cubic+fit+%7B0,188%7D,%7B10,208%7D,%7B20,207%7D,%7B30,154%7D,%7B40,14%7D,%7B60,43%7D
        4.64286 * Math.pow(x, 2) - 38.7286 * x + 107.371                           //B https://www.wolframalpha.com/input/?i=quadratic+fit+%7B0,106%7D,%7B1,76%7D,%7B2,46%7D,%7B3,37%7D,%7B4,23%7D,%7B6,43%7D
      ]
        .map(Math.round)
        .map(c => {
          if (255 < c)
            c = 255
          else if (0 > c)
            c = 0

          var hex = c.toString(16);
          return hex.length == 1 ? "0" + hex : hex;
        })
        .join('')
    );
  },
});
