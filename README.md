# MagicMirrorModule-Airly

[MagicMirror Project on Github](https://github.com/MichMich/MagicMirror) | [Airly] (https://airly.eu)

## Usage 

To use this module, go to the *modules* subfolder of your mirror and clone this repository.
Go into `MMM-Airly` folder
Run `npm install`

### Configuration

To run the module, you need to add the following data to your config.js file.

```
{
  module: 'MMM-Airly',
  position: 'top_center', // you may choose any location
  config: {
    sensorID: 2878, // the sensor ID to check the pollution for
    apiKey: 'xyz', // Airly apiKey
    showLocation: true,
    showValues: true,
    showMeteo: true,
    colors: false
  }
}
```
### SensorID
Go to your station at [Airly](https://map.airly.eu/pl/)
Use the ID from URL (digits in query string id=XXXX).
For example https://map.airly.eu/pl/#latitude=49.69678&longitude=18.99732&id=2878 would be:
```
  sensorID: 2878
```

### ApiKey
Go to Airly website (https://map.airly.eu/pl/) and turn on developers tools.
Click on any sensor and check network tab in developers tools.
There should be a request to Airly API with ApiKey in query string.

For example Request URL: https://airapi.airly.eu/v1//sensorsWithWios/current?southwestLat=50.05844384071677&southwestLong=19.88460435485831&northeastLat=50.077230559338965&northeastLong=20.00820054626456&apikey=fae55480ef384880871f8b40e77bbef9 would be:
```
  apiKey: fae55480ef384880871f8b40e77bbef9
```
Or you can use curl script:
```
$ curl -X GET 'https://map.airly.eu/js/all.min.js?v=0.1.95' 2>&1 |grep -i apikey | sed 's/.*\("apikey=[^"]*"\).*/\1/'
"apikey=fae55480ef384880871f8b40e77bbef9"
```

You may want to set the following options in the config section as well:

| Option |  Description | 
|---|---|
| `sensorID` | The ID for sensor you want to show the air quality.<br><br>This is **REQUIRED**. | 
| `apiKey` | The Api Key to get data.<br><br>This is **REQUIRED**. | 
| `showDescription` | Toggle description printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `true` |
| `showLocation` | Toggle location printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `true` |
| `showMeteo` | Toggle meteo printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `false` |
| `showValues` | Toggle values printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `false` | 
| `showCaqi` | Toggle CAQI index and advice printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `true` | 
| `animationSpeed` | Speed of the update animation. (Milliseconds)<br><br>**Possible values:** `0` to `5000`<br>**Default value:** `1000` (1 second) | 
| `colors` | Makes pollution colorful<br><br>**Possible values:** `true` or `false`<br>**Default value:** `false` | 
| `fontSize` | Sets the base font-size to a percent of the default value<br><br>**Default value:** `100` | 
| `lang` | Change the language<br><br>**Possible values:** `en` or `pl` | 
| `updateInterval` | How often does the content needs to be fetched? (Minutes)<br><br>**Possible values:** `1` to `144`<br>**Default value:** `30` (30 minutes) | 

### Known Issues
