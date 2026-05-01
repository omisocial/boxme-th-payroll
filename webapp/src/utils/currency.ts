const LOCALE_MAP: Record<string, string> = {
  THB: 'th-TH',
  VND: 'vi-VN',
  PHP: 'en-PH',
  USD: 'en-US',
  EUR: 'en-EU',
}

export function formatCurrency(
  amount: number,
  currency: string,
  currencySymbol?: string,
  opts: { decimals?: number; compact?: boolean } = {},
): string {
  const locale = LOCALE_MAP[currency] ?? 'en-US'
  const decimals = opts.decimals ?? (currency === 'VND' ? 0 : 2)

  try {
    if (opts.compact && Math.abs(amount) >= 1_000_000) {
      const formatted = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
      return `${currencySymbol ?? currency}${formatted}`
    }

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)

    return `${currencySymbol ?? currency}${formatted}`
  } catch {
    return `${currencySymbol ?? currency}${amount.toFixed(decimals)}`
  }
}

export function formatNumber(amount: number, currency: string, decimals?: number): string {
  const locale = LOCALE_MAP[currency] ?? 'en-US'
  const dec = decimals ?? (currency === 'VND' ? 0 : 2)
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(amount)
  } catch {
    return amount.toFixed(dec)
  }
}
