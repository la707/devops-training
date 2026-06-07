import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const formatDisplayDate = (date: Date): string =>
  format(date, 'd MMMM yyyy', { locale: fr });

export const formatDayShort = (date: Date): string =>
  format(date, 'EEE', { locale: fr }).charAt(0).toUpperCase();

export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getMonthDays = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const isSameDateStr = (dateStr1: string, dateStr2: string): boolean => {
  try {
    return isSameDay(parseISO(dateStr1), parseISO(dateStr2));
  } catch {
    return false;
  }
};

export const getWeekRange = (date: Date): { start: string; end: string } => ({
  start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
});

export const getMonthName = (date: Date): string =>
  format(date, 'MMMM yyyy', { locale: fr });

export const getDayName = (date: Date): string =>
  format(date, 'EEEE', { locale: fr });

export const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

export const formatShortDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: fr });
  } catch {
    return dateStr;
  }
};
