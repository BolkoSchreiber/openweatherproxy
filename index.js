const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");

const app = express();
const port = 3000;
const cacheFile = "cache.json";
const metaFile = "meta.json";

const maxCacheAge = parseInt(process.env.OWP_CACHE_DURATION) || 60;
const apiKey = process.env.OWP_OPEN_WEATHER_MAP_API_KEY || "";
const city = process.env.OWP_CITY || "Köln";
const units = process.env.OWP_UNITS || "metric";
const lang = process.env.OWP_LANGUAGE;
const exclude = process.env.OWP_EXCLUDE;

const mycache = new NodeCache({
  stdTTL: maxCacheAge,
  deleteOnExpire: true,
  useClones: true,
});

async function tryFetch(uri) {
  try {
    const res = await fetch(encodeURI(uri));
    
    return await res.json();
  } catch (err) {
    return err;
  }
}

async function getLatLon() {
  const json = await tryFetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
  );

  return { lat: json[0].lat, lon: json[0].lon };
}

async function getWeatherData({ lat, lon }) {
  var uri = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  uri += units ? `&units=${units}` : "";
  uri += lang ? `&lang=${lang}` : "";
  uri += exclude ? `&exclude=${exclude}` : "";

  return await tryFetch(uri);
}

app.get("/", async (req, res) => {
  if (apiKey === "") {
    res.send(
      "No Api-key definded. Please provide OWP_OPEN_WEATHER_MAP_API_KEY as environment"
    );
    return;
  }

  const locationCacheKey = "geoLocation_" + city;
  const payloadCacheKey = "payload_" + city;

  var geoLocation = mycache.get(locationCacheKey);

  if (!geoLocation || !geoLocation.lat || !geoLocation.lon) {
    console.log(
      `No cached coords found for ${city} - fetching new geo location.`
    );
    const { lat, lon } = await getLatLon();
    console.log(
      `Adding geo location for ${city} to cache. Lat: ${lat} Lon: ${lon}`
    );
    geoLocation = { lat: lat, lon: lon };
    mycache.set(locationCacheKey, geoLocation, 86400);
  }

  var payload = mycache.get(payloadCacheKey);

  if (!payload) {
    console.log(`No cached weather data found for ${city} - fetching new weather data`);
    payload = await getWeatherData(geoLocation);
    mycache.set(payloadCacheKey, payload);
  } else {
    console.log(`Sending cached weather data for ${city}`)
  }

  res.send(JSON.stringify(payload, null, '  '));
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
