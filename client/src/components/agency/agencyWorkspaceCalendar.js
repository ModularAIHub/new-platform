export const CALENDAR_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const padCalendarPart = (value) => String(value).padStart(2, '0');

export const getCalendarDateKey = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${padCalendarPart(parsed.getMonth() + 1)}-${padCalendarPart(parsed.getDate())}`;
};

export const getCalendarMonthKey = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${padCalendarPart(parsed.getMonth() + 1)}`;
};

export const parseCalendarMonthKey = (value) => {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
};

export const shiftCalendarMonthKey = (value, delta) => {
  const base = parseCalendarMonthKey(value);
  return getCalendarMonthKey(new Date(base.getFullYear(), base.getMonth() + delta, 1));
};
