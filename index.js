const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");

const app = express();

const port = parseInt(process.env.OWP_PORT) || 3000;
const maxCacheAge = parseInt(process.env.OWP_CACHE_DURATION) || 60;
const apiKey = process.env.OWP_OPEN_WEATHER_MAP_API_KEY || "";
const city = process.env.OWP_CITY || "Köln";
const units = process.env.OWP_UNITS || "metric";
const lang = process.env.OWP_LANGUAGE;
const exclude = process.env.OWP_EXCLUDE;

const mycache = new NodeCache({
  stdTTL: maxCacheAge,
  deleteOnExpire: true,
  useClones: false,
});

const checkStatus = async res => {
	if (res.ok) {
		return res;
	} else {
    var errorJson = await res.json()
		throw new Error(`HTTP Error Response: ${res.status} ${res.statusText} <br> Message from openweathermap.org: ${errorJson.message}`);
	}
}

async function tryFetch(uri) {
  try {
    const res = await fetch(encodeURI(uri));
    await checkStatus(res)    
    return {json: await res.json()};
  } catch (err) {
    return {err: err.message};
  }
}

async function getLatLon() {
  const {err, json} = await tryFetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
  );

  if (!err) {
    return { lat: json[0].lat, lon: json[0].lon };
  }
  return {err: err}
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
    const { err, lat, lon } = await getLatLon();
    if (!err) {
    console.log(
      `Adding geo location for ${city} to cache. Lat: ${lat} Lon: ${lon}`
    );
    geoLocation = { lat: lat, lon: lon };
    mycache.set(locationCacheKey, geoLocation, 86400);
    }
    else {
      console.log(err);
      res.send(err);
      return;
    }
  }

  var payload = mycache.get(payloadCacheKey);

  if (!payload) {
    console.log(`No cached weather data found for ${city} - fetching new weather data`);
    var {err, json} = await getWeatherData(geoLocation);
    if (!err) {
      payload = json
      mycache.set(payloadCacheKey, payload);
    } else {
      console.log(err)
      res.send(err);
      return;
    }
  } else {
    console.log(`Sending cached weather data for ${city}`)
  }

  res.send(JSON.stringify(payload, null, '  '));
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
