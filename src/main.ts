import { world, system, TicksPerSecond, WeatherChangeEvent } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { computeTimeOfDay } from "./conversions";
import { getWeather, WeatherType } from "./weatherApi";

const updateTicks = TicksPerSecond * 20 // 20 seconds. Need to run fairly often because minecraft sunset is normally only 50s
const updateWeatherTime = 1000 * 60 * (variables.get("updateWeatherMinutes") || 10);
const enableDebug = variables.get("debug");
let sunrise: number
let sunset: number
let lastApiTime = 0
let lastWeather = WeatherType.clear

function weatherChanged(event:WeatherChangeEvent) {
    if (event.lightning) {
        lastWeather = WeatherType.thunder
    } else if (event.raining) {
        lastWeather = WeatherType.rain
    } else {
        lastWeather = WeatherType.clear
    }
    debug(`weatherChanged ${lastWeather}`)
}

async function runWeatherUpdate() {
  try {
    const weather = await getWeather();
    sunrise = weather.sunrise;
    sunset = weather.sunset;
    const { weatherType } = weather;
    if (weatherType != lastWeather) {
        world.getDimension('overworld').runCommandAsync(`weather ${weatherType}`)
    }
    debug(`Got weather ${weatherType}`);
  } catch(err) {
    console.warn("Error getting weather", err);
  }
}

function debug(message:string) {
  if (enableDebug) {
    world.say(`Debug: ${message}`)
  }
}

function runTimeUpdate() {
    const ticks = Math.floor(computeTimeOfDay(Date.now(), sunrise, sunset, debug))
    // console.warn("runTimeUpdate ticks", ticks)
    world.getDimension('overworld').runCommandAsync(`time set ${ticks}`)
    // world.setTime(ticks)
}

async function runUpdates() {    

  try {
    // console.warn("runUpdates")
    if (Date.now() > (lastApiTime + updateWeatherTime)) {
        lastApiTime = Date.now()
        await runWeatherUpdate()
    }
    
  } catch (e) {
    console.warn("Script error, weather update: " + e);
  }

  try {
    runTimeUpdate()
  } catch (e) {
    console.warn("Script error, time update: " + e);
  }
}

world.getDimension('overworld').runCommandAsync('gamerule dodaylightcycle false').then(() => 
world.getDimension('overworld').runCommandAsync('gamerule doweathercycle false')).then(
  runUpdates
  ).then(() => {
  world.events.weatherChange.subscribe(weatherChanged);
  system.runSchedule(runUpdates, updateTicks);
})