export const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

export const fmtDateTime = (iso?: string | null) =>
  `${fmtDate(iso)} • ${fmtTime(iso)}`;

export function toIsoForTodayOrTomorrow(
  base: Date,
  h: number,
  m: number,
  after?: Date
) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  if (after && d <= after) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}
