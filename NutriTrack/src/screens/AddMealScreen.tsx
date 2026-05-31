import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNutrition } from '../context/NutritionContext';
import { FoodItem, MealEntry, MealType } from '../types';
import { scaleNutrients } from '../utils/nutritionCalculator';
import { CATEGORY_LABELS, CATEGORY_EMOJIS, MEAL_TYPE_LABELS } from '../data/foodDatabase';
import NutrientBar from '../components/NutrientBar';

export default function AddMealScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { date, mealType } = route.params as { date: string; mealType: MealType };

  const { allFoods, addEntry } = useNutrition();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return allFoods.slice(0, 30);
    const q = query.toLowerCase();
    return allFoods.filter(
      (f) => f.name.toLowerCase().includes(q) || CATEGORY_LABELS[f.category]?.toLowerCase().includes(q)
    );
  }, [query, allFoods]);

  const previewNutrients = useMemo(() => {
    if (!selected) return null;
    const qty = parseFloat(quantity) || selected.servingSize;
    return scaleNutrients(selected.nutrients, qty, selected.servingSize);
  }, [selected, quantity]);

  const handleAdd = () => {
    if (!selected) return;
    const qty = parseFloat(quantity) || selected.servingSize;
    const entry: MealEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodItemId: selected.id,
      foodItem: selected,
      quantity: qty,
      mealType,
      timestamp: new Date().toISOString(),
      date,
    };
    addEntry(entry);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>‹ Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Ajouter • {MEAL_TYPE_LABELS[mealType]}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => navigation.navigate('Scan', { date, mealType })}
              >
                <Text style={styles.scanBtnText}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('AddFood')}>
                <Text style={styles.newFood}>+ Créer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un aliment..."
              placeholderTextColor="#B0BCCC"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Food List */}
          <FlatList
            data={filtered}
            keyExtractor={(f) => f.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.foodRow, selected?.id === item.id && styles.foodRowSelected]}
                onPress={() => {
                  setSelected(item);
                  setQuantity(String(item.servingSize));
                }}
              >
                <Text style={styles.foodEmoji}>{item.emoji || CATEGORY_EMOJIS[item.category] || '🍽️'}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodCategory}>
                    {CATEGORY_LABELS[item.category]} · {item.servingSize}{item.servingUnit}
                  </Text>
                </View>
                <View style={styles.calBadge}>
                  <Text style={styles.calText}>{item.nutrients.calories}</Text>
                  <Text style={styles.calUnit}>kcal</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          />

          {/* Detail panel */}
          {selected && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{selected.emoji} {selected.name}</Text>

              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantité :</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.qtyUnit}>{selected.servingUnit}</Text>
              </View>

              {previewNutrients && (
                <View style={styles.nutrientsRow}>
                  {[
                    { label: 'Calories', value: previewNutrients.calories, unit: 'kcal', color: '#2196F3' },
                    { label: 'Glucides', value: previewNutrients.carbs, unit: 'g', color: '#4CAF50' },
                    { label: 'Protéines', value: previewNutrients.proteins, unit: 'g', color: '#FF9800' },
                    { label: 'Graisses', value: previewNutrients.fats, unit: 'g', color: '#FFC107' },
                  ].map((n) => (
                    <View key={n.label} style={styles.nutrientCell}>
                      <Text style={[styles.nutrientValue, { color: n.color }]}>{Math.round(n.value)}</Text>
                      <Text style={styles.nutrientUnit}>{n.unit}</Text>
                      <Text style={styles.nutrientLabel}>{n.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Ajouter au journal</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', color: '#1A2B4B' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: { fontSize: 18 },
  newFood: { fontSize: 14, color: '#2196F3', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A2B4B' },
  clearBtn: { fontSize: 16, color: '#B0BCCC', padding: 4 },
  foodRow: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  foodRowSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#EBF5FD',
  },
  foodEmoji: { fontSize: 24 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1A2B4B' },
  foodCategory: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  calBadge: { alignItems: 'center' },
  calText: { fontSize: 16, fontWeight: '700', color: '#2196F3' },
  calUnit: { fontSize: 9, color: '#8A9BB5' },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B4B', marginBottom: 14 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  qtyLabel: { fontSize: 14, color: '#4A5B72' },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: '#2196F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4B',
    minWidth: 70,
    textAlign: 'center',
  },
  qtyUnit: { fontSize: 14, color: '#8A9BB5' },
  nutrientsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F7FAFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  nutrientCell: { alignItems: 'center' },
  nutrientValue: { fontSize: 18, fontWeight: '800' },
  nutrientUnit: { fontSize: 10, color: '#8A9BB5' },
  nutrientLabel: { fontSize: 10, color: '#8A9BB5', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
