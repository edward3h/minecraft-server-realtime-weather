import { variables } from "@minecraft/server-admin";
// import { sample } from "./sample";
import { http, HttpResponse } from "@minecraft/server-net";

export enum WeatherType {
    clear = 'clear',
    rain = 'rain',
    thunder = 'thunder'
}

export interface WeatherResponse {
    weatherType: WeatherType;
    sunrise: number;
    sunset: number;
}

const lat = variables.get("weatherLat");
const lon = variables.get("weatherLon");
const appid = variables.get("weatherApiKey");
console.warn("variables", lat, lon, appid);


// const lat = "42.434870";
// const lon = "-71.182602";
// const appid = "8366d69a38b339d427376c8a2e83347b";

/**
 * ref: https://openweathermap.org/weather-conditions
 * @param id 
 */
export function weatherTypeFromId(id:number):WeatherType {
    switch (Math.floor(id / 100)) {
        case 2: return WeatherType.thunder
        case 3: // fall through
        case 5: // fall through
        case 6: return WeatherType.rain // or snow
        default: return WeatherType.clear
    }
}
// ref: https://openweathermap.org/current

async function doRequest(): Promise<HttpResponse> {
    return http.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appid}`);
}


export async function getWeather(): Promise<WeatherResponse> {
    console.warn("begin weather request");
    const response = await doRequest();
    console.warn("weather response", response);
    const currentWeather = JSON.parse(response.body)
    const sunrise = (currentWeather.sys.sunrise) * 1000 
    const sunset = (currentWeather.sys.sunset) * 1000
    const weatherId = currentWeather.weather[0].id
    const weatherType = weatherTypeFromId(weatherId)
    return {weatherType, sunrise, sunset};
}