export function fmtTHB(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n) + ' ฿'
}
export function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
export function fmtDate(s: string): string {
  if (!s) return ''
  return s
}
