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
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}
