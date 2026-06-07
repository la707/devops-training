import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { parseISO, isToday } from 'date-fns';
import { getWeekDays, formatDate, formatDayShort } from '../utils/dateUtils';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  logDates?: string[];
}

const CalendarStrip: React.FC<Props> = ({ selectedDate, onSelectDate, logDates = [] }) => {
  const selected = parseISO(selectedDate);
  const weekDays = getWeekDays(selected);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {weekDays.map((day) => {
        const dateStr = formatDate(day);
        const isSelected = dateStr === selectedDate;
        const hasLog = logDates.includes(dateStr);
        const todayDay = isToday(day);

        return (
          <TouchableOpacity
            key={dateStr}
            style={[styles.dayCell, isSelected && styles.selectedCell]}
            onPress={() => onSelectDate(dateStr)}
          >
            <Text style={[styles.dayLetter, isSelected && styles.selectedText]}>
              {formatDayShort(day)}
            </Text>
            <Text style={[styles.dayNumber, isSelected && styles.selectedText, todayDay && !isSelected && styles.todayNumber]}>
              {day.getDate()}
            </Text>
            {hasLog && !isSelected && <View style={styles.dot} />}
            {isSelected && <View style={styles.dotSelected} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 6,
  },
  dayCell: {
    width: 46,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(33,150,243,0.15)',
  },
  selectedCell: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayLetter: {
    fontSize: 11,
    color: '#8A9BB5',
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4B',
  },
  todayNumber: {
    color: '#2196F3',
  },
  selectedText: {
    color: '#fff',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FF9800',
    marginTop: 3,
  },
  dotSelected: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },
});

export default CalendarStrip;
