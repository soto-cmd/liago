/** Next scheduled monthly payment after the sale date, in Paraguay local time. */
export function nextMonthlyPaymentDate(soldAt: string, paymentDay: number): string | null {
  if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) return null;
  const date = new Date(soldAt);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = number("year");
  const month = number("month");
  const day = number("day");
  if (!year || !month || !day) return null;
  let dueYear = year;
  let dueMonth = month;
  const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (Math.min(paymentDay, lastDay(year, month)) <= day) {
    dueMonth += 1;
    if (dueMonth === 13) { dueMonth = 1; dueYear += 1; }
  }
  const dueDay = Math.min(paymentDay, lastDay(dueYear, dueMonth));
  return [String(dueDay).padStart(2, "0"), String(dueMonth).padStart(2, "0"), String(dueYear)].join("/");
}
