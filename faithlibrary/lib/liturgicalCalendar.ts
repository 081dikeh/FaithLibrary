// lib/liturgicalCalendar.ts
//
// Approximates the current liturgical season so the homepage can surface
// "scores for right now" instead of a generic feed. This is a pastoral
// convenience, not a canonical liturgical authority — edge cases (moveable
// solemnities, regional calendar variations, the exact end of the Christmas
// season, etc.) are simplified. Good enough to point someone toward Advent
// hymns in Advent; not a substitute for an actual ordo.

import { LITURGICAL_SEASONS } from './categories'

export type LiturgicalSeason = typeof LITURGICAL_SEASONS[number]

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Meeus/Jones/Butcher Gregorian algorithm for the date of Easter Sunday. */
export function computeEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** First Sunday of Advent: the Sunday nearest Nov 30, i.e. 4 Sundays before
 *  the Sunday on/before Christmas. */
export function firstSundayOfAdvent(year: number): Date {
  const sundayOnOrBeforeChristmas = new Date(year, 11, 25)
  sundayOnOrBeforeChristmas.setDate(
    sundayOnOrBeforeChristmas.getDate() - sundayOnOrBeforeChristmas.getDay()
  )
  return addDays(sundayOnOrBeforeChristmas, -21)
}

/** Baptism of the Lord (approximated as the Sunday after Jan 6), which
 *  conventionally closes the Christmas season. */
function baptismOfTheLord(year: number): Date {
  const epiphany = new Date(year, 0, 6)
  const daysUntilSunday = (7 - epiphany.getDay()) % 7
  return addDays(epiphany, daysUntilSunday === 0 ? 7 : daysUntilSunday)
}

/**
 * Returns the current liturgical season for a given date (defaults to now),
 * as one of the values already used in LITURGICAL_SEASONS so it can be used
 * directly as a tag filter.
 */
export function getLiturgicalSeason(date: Date = new Date()): LiturgicalSeason {
  const year = date.getFullYear()

  const adventStart    = firstSundayOfAdvent(year)
  const christmasDay   = new Date(year, 11, 25)
  const easterThisYear = computeEasterSunday(year)
  const ashWednesday   = addDays(easterThisYear, -46)
  const palmSunday     = addDays(easterThisYear, -7)
  const pentecost      = addDays(easterThisYear, 49)
  const baptismEnd     = baptismOfTheLord(year)

  if (date >= adventStart && date < christmasDay) return 'Advent'
  if (date >= christmasDay) return 'Christmas'
  if (date < baptismEnd) return 'Christmas' // Jan 1 – Baptism of the Lord, carried over from last year's Christmas
  if (date >= ashWednesday && date < palmSunday) return 'Lent'
  if (date >= palmSunday && date < easterThisYear) return 'Holy Week'
  if (date >= easterThisYear && date < pentecost) return 'Easter'
  if (date >= pentecost && date < addDays(pentecost, 1)) return 'Pentecost'
  return 'Ordinary Time'
}
