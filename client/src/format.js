// pg returns NUMERIC as a string, so convert before comparing
export function priceTier(price) {
  const n = Number(price)
  if (n === 0) return 'Free'
  if (n < 25) return '$'
  if (n < 60) return '$$'
  return '$$$'
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// e.g. "11/16", for the compact home page tiles
export function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  })
}

// Straight-line (haversine) distance in miles between two { lat, lng } points
export function milesBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

// e.g. "Sunday, November 8"
export function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// e.g. "6:00 PM – 8:00 PM"; when the event ends on another day, the end gets its date too
export function formatTimeRange(start, end) {
  const time = { hour: 'numeric', minute: '2-digit' }
  const from = new Date(start)
  const to = new Date(end)
  const endText =
    from.toDateString() === to.toDateString()
      ? to.toLocaleTimeString(undefined, time)
      : to.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          ...time,
        })
  return `${from.toLocaleTimeString(undefined, time)} – ${endText}`
}
