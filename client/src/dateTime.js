// Date and time helpers for the event form's date picker and typed time field.
// Dates are "YYYY-MM-DD" strings and times are { h, m } (24-hour), so nothing depends on time zones.

const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Local-time Date from "YYYY-MM-DD" (new Date('YYYY-MM-DD') would be read as UTC)
export const fromISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "YYYY-MM-DD" -> "Mon, Nov 23, 2026"
export const formatPickedDate = (iso) =>
  fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// 18, 30 -> "6:30 PM"
export const formatTime = (h, m) =>
  `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`

// Reads what someone typed: "6pm", "6:30 pm", "630pm", "18:30", "1830", "7:05 a.m.".
// Returns null for empty text, { h, m } for a valid time, or { error } with a message to show.
export function parseTime(text) {
  const raw = text.trim()
  if (!raw) return null
  const match = /^(\d{1,2})(?::?(\d{2}))?\s*(?:([ap])\.?\s*m?\.?)?$/i.exec(raw)
  const example = 'for example 6:30 PM'
  if (!match) return { error: `Enter a time, ${example}` }

  let h = Number(match[1])
  const m = match[2] === undefined ? 0 : Number(match[2])
  const meridiem = match[3]?.toLowerCase()
  if (m > 59) return { error: `Minutes must be 00–59, ${example}` }

  if (meridiem) {
    if (h < 1 || h > 12)
      return { error: `Hours must be 1–12 with AM or PM, ${example}` }
    h = (h % 12) + (meridiem === 'p' ? 12 : 0)
  } else if (h >= 1 && h <= 12) {
    // "6" could be morning or evening, so ask instead of guessing
    return { error: `Add AM or PM, ${example}` }
  } else if (h > 23) {
    return { error: `Enter a time, ${example}` }
  }
  return { h, m }
}

// "18:30" -> { h: 18, m: 30 }
export const splitTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return { h, m }
}

export const joinDateTime = (isoDate, { h, m }) =>
  `${isoDate}T${pad(h)}:${pad(m)}`
