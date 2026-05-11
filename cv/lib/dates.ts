const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(date: string | undefined | null): string {
  if (!date) return "Present";
  const trimmed = String(date).trim();
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${year}`;
  }
  return trimmed;
}

export function formatYear(date: string | undefined | null): string {
  if (!date) return "Present";
  const match = String(date)
    .trim()
    .match(/^(\d{4})/);
  return match ? match[1]! : String(date);
}
