export const MONTHS = ["Sept", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"];

// Fait correspondre le mois calendaire réel (0=janvier..11=décembre) à
// l'index dans l'année scolaire (0=Septembre..10=Juillet).
export function getCurrentMonthIndex(date = new Date()) {
  const m = date.getMonth();
  const map = { 8: 0, 9: 1, 10: 2, 11: 3, 0: 4, 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10 };
  return m in map ? map[m] : 10; // août (7) → traité comme fin d'année scolaire
}

export function isSameDay(iso, ref = new Date()) {
  const d = new Date(iso);
  return d.toDateString() === ref.toDateString();
}

export function isSameWeek(iso, ref = new Date()) {
  const d = new Date(iso);
  const start = new Date(ref);
  start.setDate(ref.getDate() - ref.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export function isSameMonth(iso, ref = new Date()) {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}
