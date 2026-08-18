/**
 * formatTime — shared timestamp formatter for SessionDetailPage components.
 * Simple UTC formatter (no Intl dependencies).
 */
export function formatTime(iso: string): string {
  const date = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${month} ${day}, ${year} ${hours}:${minutes}`
}