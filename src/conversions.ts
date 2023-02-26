export const secondsInDay = 24 * 60 * 60

/**
 * Convert JS time to seconds since midnight
 * 
 * @param time Javascript Epoch time
 */
export function daySeconds(time:number): number {
    try {
        const date = new Date(time)
        return date.getUTCHours() * 60 * 60
            + date.getUTCMinutes() * 60
            + date.getUTCSeconds()
    } catch(e) {
        console.warn("Error in daySeconds", e)
    }
    return 0
}

function pad(v:number):string {
    let s = v.toString()
    if (s.length == 1) {
        s = "0" + s
    }
    return s
}

export function debugDS(timeDS:number): string {
    const hours = Math.floor(timeDS / (60 * 60))
    const minutes = Math.floor((timeDS % (60 * 60) / 60))
    const seconds = Math.floor(timeDS % 60)
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}


/**
 * Minecraft ref: https://minecraft.fandom.com/wiki/Daylight_cycle
 * All times are in UTC: we only care about relative times so timezone does not matter.
 * 24 hours maps to 24,000 minecraft ticks. Have to adjust scales to adapt for changing sunrise and sunset times in the real world.
 * Ticks from sunrise to sunset is 1,000 (sunrise length) + 12,000 (daytime length) = 13,000. Sunset to sunrise is the remaining 11,000, 1,000 for sunset, 10,000 for nighttime.
 * Assume that sunrise and sunset each last for the same duration.
 * 0 ticks is the start of daytime.
*/
export function computeTimeOfDay(now:number, sunrise:number, sunset:number, debugCallback: (message:string) => void) {
    const nowDS = daySeconds(now)
    // console.assert(nowDS > 0, "Expected now to be greater than zero")
    const sunriseDS = daySeconds(sunrise)
    const sunsetDS = daySeconds(sunset)
    // console.assert(sunriseDS < sunsetDS, "Expected sunrise to be less than sunset")
    const splitDayLength = sunsetDS - sunriseDS
    const daytimeLength = splitDayLength * 12 / 13
    const nighttimeLength = (secondsInDay - splitDayLength) * 10 / 11
    const sssrLength = (secondsInDay - daytimeLength - nighttimeLength) / 2
    const daytimeStart = sunriseDS + sssrLength
    const nighttimeStart = sunsetDS + sssrLength
    debugCallback(`time now ${debugDS(nowDS)}`)
    debugCallback(`daytime ${debugDS(daytimeStart)}, sunset ${debugDS(sunsetDS)}, nighttime ${debugDS(nighttimeStart)}, sunrise ${debugDS(sunriseDS)}`)

    if (nowDS >= daytimeStart && nowDS < sunsetDS) {
        // it is daytime
        return Math.floor((nowDS - daytimeStart) * 12000 / daytimeLength)
    } else if (nowDS >= sunsetDS && nowDS < nighttimeStart) {
        // it is sunset
        return Math.floor((nowDS - sunsetDS) * 1000 / sssrLength + 12000)
    } else if (nowDS >= sunriseDS && nowDS < daytimeStart) {
        // it is sunrise
        return Math.floor((nowDS - sunriseDS) * 1000 / sssrLength + 23000)
    } else {
        // it is nighttime
        let ticks = (nowDS - nighttimeStart) * 10000 / nighttimeLength + 13000
        if (ticks < 13000) {
            ticks += 24000
        }
        return Math.floor(ticks)
    }
}
