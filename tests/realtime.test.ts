import { describe, test, expect } from '@jest/globals'
import { computeTimeOfDay, daySeconds } from '../src/conversions'

function makeTime(hours:number, minutes:number, seconds = 0) {
    // return Date.UTC(2022, 1, 1, hours, minutes, seconds)
    return new Date(2022, 1, 1, hours, minutes, seconds).getTime()
}

describe('day seconds', () => {
    test('zero', () => {
        expect(daySeconds(0)).toBe(0)   
    })
    test('noon someday', () => {
        const date = Date.UTC(2023, 2, 20, 12, 0)
        expect(daySeconds(date)).toBe(12 * 60 * 60)
    })
    test('date part is ignored', () => {
        const t1 = Date.UTC(2017, 11, 3, 13, 45, 34)
        const t2 = Date.UTC(2022, 6, 15, 13, 45, 34)
        expect(daySeconds(t1)).toEqual(daySeconds(t2))
    })
    test.each([[10,4], [15,43]])('some other times', (hours, minutes) =>{
        expect(daySeconds(makeTime(hours, minutes))).toBe(hours * 60 * 60 + minutes * 60)
    })
})

describe('compute time symmetrical', () => {
    const sunrise = makeTime(5, 0) // should even out and make ticks symmetrical
    const sunset = makeTime(18,0)
    test.each([
        [makeTime(0,0), 18000], 
        [makeTime(6, 0), 0],
        [makeTime(5,0), 23000],
        [makeTime(7,30), 1500]
    ])('compute', (now, expected) => {
        expect(computeTimeOfDay(now, sunrise, sunset)).toEqual(expected)
    })
    
})

describe('compute time some real times', () => {
    const timezone = -18000 // weather API claims times are UTC but are actually adjusted by timezone (or I'm misunderstanding something else)
    const sunrise = (1676806575 + timezone) * 1000 // from sample API call
    const sunset = (1676845274 + timezone) * 1000
    test.each([
        [makeTime(0,0), 21750], 
        [makeTime(7, 37, 12), 0],
        [makeTime(6, 36, 15), 23000],
        [makeTime(9, 30), 2273]
    ])('compute', (now, expected) => {
        expect(computeTimeOfDay(now, sunrise, sunset)).toEqual(expected)
    })
})