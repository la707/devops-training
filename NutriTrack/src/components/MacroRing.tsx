import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircularProgress from './CircularProgress';

interface Props {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  emoji: string;
}

const MacroRing: React.FC<Props> = ({ label, current, target, unit, color, emoji }) => {
  const progress = target > 0 ? current / target : 0;

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.current}>
          <Text style={[styles.currentValue, { color }]}>{Math.round(current)}</Text>
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <CircularProgress size={44} strokeWidth={4} progress={progress} color={color} bgColor="#EEF2F8">
        <Text style={styles.emoji}>{emoji}</Text>
      </CircularProgress>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textBlock: {
    flex: 1,
  },
  current: {
    fontSize: 14,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  target: {
    fontSize: 12,
    color: '#8A9BB5',
  },
  label: {
    fontSize: 12,
    color: '#8A9BB5',
    marginTop: 1,
  },
  emoji: {
    fontSize: 16,
  },
});

export default MacroRing;
