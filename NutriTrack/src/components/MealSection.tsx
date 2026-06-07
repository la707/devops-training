import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MealEntry, MealType } from '../types';
import { scaleNutrients } from '../utils/nutritionCalculator';
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS } from '../data/foodDatabase';

interface Props {
  mealType: MealType;
  entries: MealEntry[];
  onAdd: (mealType: MealType) => void;
  onRemove: (entryId: string) => void;
}

const MealSection: React.FC<Props> = ({ mealType, entries, onAdd, onRemove }) => {
  const mealEntries = entries.filter((e) => e.mealType === mealType);
  const totalCalories = mealEntries.reduce((sum, e) => {
    const n = scaleNutrients(e.foodItem.nutrients, e.quantity, e.foodItem.servingSize);
    return sum + n.calories;
  }, 0);

  const handleLongPress = (entry: MealEntry) => {
    Alert.alert('Supprimer', `Supprimer "${entry.foodItem.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onRemove(entry.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{MEAL_TYPE_EMOJIS[mealType]}</Text>
          <Text style={styles.title}>{MEAL_TYPE_LABELS[mealType]}</Text>
        </View>
        <View style={styles.rightRow}>
          {totalCalories > 0 && (
            <Text style={styles.calories}>{Math.round(totalCalories)} kcal</Text>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(mealType)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mealEntries.map((entry) => {
        const n = scaleNutrients(entry.foodItem.nutrients, entry.quantity, entry.foodItem.servingSize);
        return (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryRow}
            onLongPress={() => handleLongPress(entry)}
            delayLongPress={500}
          >
            <Text style={styles.entryEmoji}>{entry.foodItem.emoji || '🍽️'}</Text>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName} numberOfLines={1}>{entry.foodItem.name}</Text>
              <Text style={styles.entryQty}>{entry.quantity}{entry.foodItem.servingUnit}</Text>
            </View>
            <Text style={styles.entryCals}>{Math.round(n.calories)} kcal</Text>
          </TouchableOpacity>
        );
      })}

      {mealEntries.length === 0 && (
        <TouchableOpacity style={styles.emptyRow} onPress={() => onAdd(mealType)}>
          <Text style={styles.emptyText}>Ajouter un aliment...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B4B',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calories: {
    fontSize: 13,
    color: '#8A9BB5',
    fontWeight: '500',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 18,
    color: '#2196F3',
    lineHeight: 20,
    fontWeight: '600',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FA',
    gap: 10,
  },
  entryEmoji: {
    fontSize: 20,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    color: '#1A2B4B',
    fontWeight: '500',
  },
  entryQty: {
    fontSize: 11,
    color: '#8A9BB5',
    marginTop: 1,
  },
  entryCals: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FA',
  },
  emptyText: {
    fontSize: 13,
    color: '#B0BCCC',
    fontStyle: 'italic',
  },
});

export default MealSection;
