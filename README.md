# OpenWeatherProxy

A small image to proxy requests to the openweather onecall api if you have ... 
  * multiple devices and want to make sure you don't exceed your free tier limits
  * the demand for getting your weather data via a GET without params

It has mainly been created for educational purposes and the devices in our "smart" homes.

You will need an api key from https://www.openweathermap.org. 

## Supported plattforms: 
  * linux/amd64
  * linux/arm64
  * linux/arm/v7 (e.g. Raspberry Pi 3)

## Run the image using 

```shell
docker run -d -p 3000:3000 -e OWP_OPEN_WEATHER_MAP_API_KEY=<apikey> -e OWP_CITY=<city> --name owp pans0n/openweatherproxy
``` 

or ...
  1. Clone the repo
  2. `cp .env.example .env`
  3. Edit your `.env`
  4. docker-compose up -d   

Test via curl \<host>:3000, e.g. `curl localhost:3000`

## Expected result:

```json
{
  "lat":51.0333,
  "lon":7,
  "timezone":"Europe/Berlin",
  "timezone_offset":3600,
  "current": {
    "dt":1614763346,"sunrise":1614751943,"sunset":1614791748,"temp":10.37,"feels_like":7.13,"pressure":1023,"humidity":51,"dew_point":0.68,"uvi":1.01,"clouds":81,"visibility":10000,"wind_speed":1.93,"wind_deg":147,"weather":
    [
      {
        "id":803,"main":"Clouds","description":"Überwiegend bewölkt","icon":"04d"
      }
    ]
  },
  "hourly":[{"dt":1614762000,"
  ...
  }
```

## If you want to build the image yourself:

Use either `build_with_docker.sh` or `docker build -t <tag> .`

## or run it on node directly:

  * `npm i`
  * `node index.js`