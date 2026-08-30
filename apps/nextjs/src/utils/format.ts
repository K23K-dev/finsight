/** Defaults to USD without fractional digits or compact notation. */
export function formatCurrency(
  amount: number,
  options?: {
    decimals?: boolean;
    compact?: boolean;
    currency?: string;
  },
): string {
  const { decimals = false, compact = false, currency = "USD" } = options ?? {};

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
    ...(compact && { notation: "compact" }),
  }).format(amount);
}

export function formatSignedCurrency(
  amount: number,
  options?: {
    decimals?: boolean;
    currency?: string;
  },
): string {
  const { decimals = false, currency = "USD" } = options ?? {};
  const formatted = formatCurrency(Math.abs(amount), {
    currency,
    decimals,
  });
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/** Defaults to a short date such as "Jan 15, 2025". */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options ?? defaultOptions);
}
