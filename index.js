const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();
const port = 3000;
const cacheFile = "cache.json";
const metaFile = "meta.json";

const maxCacheAge = (parseInt(process.env.OWP_CACHE_DURATION) || 60) * 1000;
const apiKey = process.env.OWP_OPEN_WEATHER_MAP_API_KEY || '';
const city = process.env.OWP_CITY || 'Köln';
const units = process.env.OWP_UNITS || 'metric';
const lang = process.env.OWP_LANGUAGE;
const exclude = process.env.OWP_EXCLUDE;

function readMeta() {
  try {
    const rawData = fs.readFileSync(metaFile);
    const meta = JSON.parse(rawData);
    return meta;
  } catch {
    console.warn(metaFile, " not found");
    return {lat: 0, lon: 0, cacheTimeStamp: 0};
  }
}

function getCacheAge({meta}) {
    const cacheTimeStamp = Number(meta?.cacheTimeStamp ?? "0");
    const now = Date.now();
    return now - cacheTimeStamp;
}

async function tryFetch(uri) {
    try {
        const res = await fetch(encodeURI(uri));
        return await res.json();
    } catch (err) {
        return err
    }
}

async function getLatLon() {
    const json = await tryFetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);

    return {lat: json[0].lat, lon: json[0].lon}
}

async function getWeatherData({lat, lon}) {
    var uri = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`
    uri += units ? `&units=${units}` : '';
    uri += lang ? `&lang=${lang}` : '';
    uri += exclude ? `&exclude=${exclude}` : '';

    return await tryFetch(uri);
}

app.get("/", async (req, res) => {
    if (apiKey === '') {
        res.send('No Api-key definded. Please provide OWP_OPEN_WEATHER_MAP_API_KEY as environment');
        return;
    }

  const meta = readMeta();

  if (!meta || !meta.lat || !meta.lon) {
      const { lat, lon } = await getLatLon();

      meta.lat = lat
      meta.lon = lon
  }

  const cacheAge = getCacheAge({meta: meta})
  console.log("CacheAge: " + cacheAge);

  if (cacheAge > maxCacheAge) {
    console.log("Cache to old - fetching new Data...");
    const newCache = await getWeatherData(meta);
    meta.cacheTimeStamp = Date.now()
    fs.writeFileSync(metaFile, JSON.stringify(meta));
    fs.writeFileSync(cacheFile, JSON.stringify(newCache));
    
    res.send(JSON.stringify(newCache));
  } else {
    const rawData = fs.readFileSync(cacheFile);
    const cache = JSON.parse(rawData);
    res.send(JSON.stringify(cache));
  }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
