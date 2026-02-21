export function rawToDisplay(raw: string, decimals: number): string {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return '0'
  const val = n / 10 ** decimals
  return val.toLocaleString(undefined, { maximumFractionDigits: decimals > 4 ? 4 : decimals })
}

export function parsePriceImpact(pct: string): { str: string; bad: boolean } {
  const n = parseFloat(pct)
  if (isNaN(n) || n < 0.01) return { str: '< 0.01%', bad: false }
  return { str: `${n.toFixed(2)}%`, bad: n > 2 }
}

export function getAmountFontSize(val: string): number {
  if (val.length <= 5) return 40
  if (val.length <= 7) return 34
  if (val.length <= 9) return 28
  return 24
}
