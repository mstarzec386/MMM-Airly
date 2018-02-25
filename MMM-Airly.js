"use strict"

var pollutionTypeH = {
    pm10: 'PM10',
    pm25: 'PM2.5'
}
var pollutionNorm = {
    pm10: 50,
    pm25: 25
}
var units = {
    pm10: 'µg/m³',
    pm25: 'µg/m³',
    pressure: 'hPa',
    humidity: '%',
    temperature: '°C'
}

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
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
    start: function(){
        Log.info('Starting module: ' + this.name);

        this.config.pollutionTypeH = pollutionTypeH
        this.config.pollutionNorm = pollutionNorm
        this.config.units = units

        this.config.fontSize = parseInt(this.config.fontSize)

        // load data
        this.load();

        // schedule refresh
        setInterval(
            this.load.bind(this),
            this.config.updateInterval * 60 * 1000);
    },
    load: function(){
        var that = this;

        if(!this.data.address && this.config.showLocation) {
            this.sendSocketNotification('GET_LOC', {sensorID: that.config.sensorID, apiKey: that.config.apiKey});
        }

        this.sendSocketNotification('GET_DATA', {sensorID: that.config.sensorID, apiKey: that.config.apiKey})

    },
    socketNotificationReceived: function (notification, payload) {
        var that = this;
        switch (notification) {
            case 'DATA':
                that.data.pollution = payload;
                that.loaded = true;
                that.updateDom(that.animationSpeed);
                break;
            case 'LOC':
                that.data.address = payload
                that.updateDom(that.animationSpeed);
                break;
            case 'ERR':
                console.log('error :(', payload)
                break;
            default:
                console.log ('wrong socketNotification', notification, payload)
                break;
        }
    },
    html: {
        icon: '<i class="fa fa-leaf"></i>',
        meteoIcon: '<i class="fas fa-thermometer-empty">',
        location: '<div class="xsmall">{0} {1}, {2}, {3}</div>',
        values: '({0} {1} {2}{3})',
        meteoValues: ' {0}{1}',
        quality: '<table><caption>{0}</caption><tbody style="font-size: {1}%">{2}</tbody></table>',
        qualityTr: '<tr{0}><td>{1}</td><td>{2}</td><td>{3}</td><td class="light">{4}</td><td class="light">{5}</td></tr>',
        meteoTr: '<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>',
    },
    getScripts: function() {
        return ['String.format.js'];
    },
    getStyles: function() {
        return [
            'https://use.fontawesome.com/releases/v5.0.6/css/all.css',
            'StyleSheet.css',
        ];
    },
    getDom: function() {
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

                if (['pm10', 'pm25'].indexOf(key) > -1) {
                    tbody += this.html.qualityTr.format(
                        this.config.colors ? ' style="color:' + this.color(value / this.config.pollutionNorm[key]) + '"' : '',
                        this.html.icon,
                        this.config.pollutionTypeH[key],
                        this.config.showDescription ? this.impact(value, key) : '',
                        (this.config.showValues ? this.html.values.format((Math.round(value * 10) / 10).toString().replace('.', ','), this.translate('Of'), this.config.pollutionNorm[key], this.config.units[key]) : ''),
                        ''
                    )
                }

            }

            if (this.config.showMeteo) {
                let temperature = pollution.temperature;
                let humidity = pollution.humidity;
                let pressure = pollution.pressure;

                meteo += this.html.meteoTr.format(
                    this.html.meteoIcon,
                    this.html.meteoValues.format((Math.round(temperature * 10) / 10).toString().replace('.', ','), this.config.units['temperature']),
                    this.html.meteoValues.format((Math.round(humidity * 10) / 10).toString().replace('.', ','), this.config.units['humidity']),
                    this.html.meteoValues.format(Math.round(pressure / 100).toString().replace('.', ','), this.config.units['pressure'])
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
    getTranslations: function() {
        return {
            en: 'translations/en.json',
            pl: 'translations/pl.json'
        }
    },
    impact: function(pollution, type) {
        if(pollution < this.config.pollutionNorm[type])     return this.translate('Good');
        else if(pollution < this.config.pollutionNorm[type] * 2) return this.translate('Moderate');
        else if(pollution < this.config.pollutionNorm[type] * 3) return this.translate('Low');
        else if(pollution < this.config.pollutionNorm[type] * 4) return this.translate('Unhealthy');
        else if(pollution < this.config.pollutionNorm[type] * 6) return this.translate('VeryUnhealthy');
        else                                                     return this.translate('Hazardous');
    },
    compare: function(a, b) {
        if (a.value / pollutionNorm[a.key] < b.value / pollutionNorm[b.key])
            return 1;
        else if (a.value / pollutionNorm[a.key] > b.value / pollutionNorm[b.key])
            return -1;
        else
            return 0;
    },
    color: function (x) {
        //color palete from https://en.wikipedia.org/wiki/Air_quality_index#india
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
