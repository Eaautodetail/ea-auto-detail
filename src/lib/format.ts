const sekFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

/** Formaterar ett belopp i hela kronor, t.ex. 349 → "349 kr". */
export function formatSEK(amount: number): string {
  return sekFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Formaterar ett ISO-datum (ÅÅÅÅ-MM-DD) som t.ex. "måndag 12 oktober 2026". */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return dateFormatter.format(new Date(y, m - 1, d));
}
