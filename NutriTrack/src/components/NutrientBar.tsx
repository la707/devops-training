import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const NutrientBar: React.FC<Props> = ({ label, current, target, unit, color }) => {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color, fontWeight: '700' }}>{Math.round(current)}</Text>
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.trackBg}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#4A5B72',
    fontWeight: '500',
  },
  values: {
    fontSize: 13,
  },
  target: {
    color: '#8A9BB5',
  },
  trackBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEF2F8',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default NutrientBar;
