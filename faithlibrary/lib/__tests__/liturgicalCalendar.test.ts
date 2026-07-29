import { describe, it, expect } from 'vitest'
import { computeEasterSunday, firstSundayOfAdvent, getLiturgicalSeason } from '@/lib/liturgicalCalendar'

describe('computeEasterSunday', () => {
  it('matches well-known Easter dates', () => {
    expect(computeEasterSunday(2024)).toEqual(new Date(2024, 2, 31)) // March 31, 2024
    expect(computeEasterSunday(2025)).toEqual(new Date(2025, 3, 20)) // April 20, 2025
  })
})

describe('firstSundayOfAdvent', () => {
  it('always falls between Nov 27 and Dec 3, and is always a Sunday', () => {
    for (const year of [2024, 2025, 2026, 2027, 2028, 2030]) {
      const advent = firstSundayOfAdvent(year)
      expect(advent.getDay()).toBe(0) // Sunday
      expect(advent.getMonth() === 10 || advent.getMonth() === 11).toBe(true) // Nov or Dec
      if (advent.getMonth() === 10) expect(advent.getDate()).toBeGreaterThanOrEqual(27)
      if (advent.getMonth() === 11) expect(advent.getDate()).toBeLessThanOrEqual(3)
    }
  })
})

describe('getLiturgicalSeason', () => {
  it('identifies Christmas Day', () => {
    expect(getLiturgicalSeason(new Date(2026, 11, 25))).toBe('Christmas')
  })

  it('treats early January as Christmas season (carried over from the prior year)', () => {
    expect(getLiturgicalSeason(new Date(2026, 0, 1))).toBe('Christmas')
  })

  it('identifies Easter Sunday itself', () => {
    expect(getLiturgicalSeason(computeEasterSunday(2025))).toBe('Easter')
  })

  it('identifies Palm Sunday as Holy Week', () => {
    const palmSunday = new Date(computeEasterSunday(2025))
    palmSunday.setDate(palmSunday.getDate() - 7)
    expect(getLiturgicalSeason(palmSunday)).toBe('Holy Week')
  })

  it('treats midsummer as Ordinary Time regardless of year (no moveable season ever reaches July)', () => {
    expect(getLiturgicalSeason(new Date(2025, 6, 15))).toBe('Ordinary Time')
    expect(getLiturgicalSeason(new Date(2026, 6, 15))).toBe('Ordinary Time')
  })

  it('defaults to the current date when none is passed', () => {
    expect(() => getLiturgicalSeason()).not.toThrow()
  })
})
