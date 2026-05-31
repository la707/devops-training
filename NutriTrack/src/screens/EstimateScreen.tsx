import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FoodItem } from '../types';
import { FOOD_DATABASE, CATEGORY_LABELS } from '../data/foodDatabase';
import { scaleNutrients } from '../utils/nutritionCalculator';

const POPULAR_DISHES = [
  'Pizza', 'Burger', 'Sushi', 'Pâtes', 'Poulet', 'Salade',
  'Saumon', 'Riz', 'Soupe', 'Omelette',
];

export default function EstimateScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (text?: string) => {
    const q = (text ?? query).toLowerCase().trim();
    if (!q) return;
    setSearched(true);
    const found = FOOD_DATABASE.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        q.split(' ').some((word) => f.name.toLowerCase().includes(word))
    );
    setResults(found);
  };

  const handleQuickSearch = (dish: string) => {
    setQuery(dish);
    handleSearch(dish.toLowerCase());
  };

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>‹ Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Analyser un plat</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>🍽️</Text>
              <Text style={styles.heroTitle}>Calories d'un plat</Text>
              <Text style={styles.heroSub}>
                Entrez le nom d'un plat pour connaître sa valeur nutritionnelle estimée
              </Text>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.input}
                placeholder="Ex: pizza margherita, poulet grillé..."
                placeholderTextColor="#B0BCCC"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
                <Text style={styles.searchBtnText}>Analyser</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.popularTitle}>Plats populaires</Text>
            <View style={styles.chips}>
              {POPULAR_DISHES.map((d) => (
                <TouchableOpacity key={d} style={styles.chip} onPress={() => handleQuickSearch(d)}>
                  <Text style={styles.chipText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {searched && results.length === 0 && (
              <View style={styles.noResult}>
                <Text style={styles.noResultEmoji}>🤔</Text>
                <Text style={styles.noResultText}>Aucun aliment trouvé pour "{query}"</Text>
                <Text style={styles.noResultSub}>
                  Essayez un terme plus général ou ajoutez cet aliment manuellement
                </Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddFood')}>
                  <Text style={styles.addBtnText}>+ Ajouter l'aliment</Text>
                </TouchableOpacity>
              </View>
            )}

            {results.map((item) => (
              <View key={item.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultEmoji}>{item.emoji || '🍽️'}</Text>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultCategory}>
                      {CATEGORY_LABELS[item.category]} · Portion : {item.servingSize}{item.servingUnit}
                    </Text>
                  </View>
                  <View style={styles.calBox}>
                    <Text style={styles.calValue}>{item.nutrients.calories}</Text>
                    <Text style={styles.calLabel}>kcal</Text>
                  </View>
                </View>

                <View style={styles.macrosRow}>
                  {[
                    { label: 'Glucides', value: item.nutrients.carbs, color: '#4CAF50', emoji: '🌾' },
                    { label: 'Protéines', value: item.nutrients.proteins, color: '#FF9800', emoji: '🥩' },
                    { label: 'Graisses', value: item.nutrients.fats, color: '#FFC107', emoji: '🧈' },
                    ...(item.nutrients.fiber ? [{ label: 'Fibres', value: item.nutrients.fiber, color: '#9C27B0', emoji: '🌿' }] : []),
                  ].map((m) => (
                    <View key={m.label} style={styles.macroCell}>
                      <Text style={styles.macroCellEmoji}>{m.emoji}</Text>
                      <Text style={[styles.macroCellValue, { color: m.color }]}>{Math.round(m.value)}g</Text>
                      <Text style={styles.macroCellLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                {item.nutrients.sodium && item.nutrients.sodium > 0 ? (
                  <Text style={styles.extraInfo}>
                    Sodium : {item.nutrients.sodium}mg
                    {item.nutrients.cholesterol ? ` · Cholestérol : ${item.nutrients.cholesterol}mg` : ''}
                  </Text>
                ) : null}
              </View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
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
  title: { fontSize: 17, fontWeight: '700', color: '#1A2B4B' },
  scroll: { paddingHorizontal: 16 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1A2B4B', marginBottom: 6 },
  heroSub: { fontSize: 13, color: '#8A9BB5', textAlign: 'center', lineHeight: 18 },
  searchBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  input: {
    fontSize: 15,
    color: '#1A2B4B',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FD',
  },
  searchBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  popularTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5B72',
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(33,150,243,0.2)',
  },
  chipText: { fontSize: 13, color: '#2196F3', fontWeight: '500' },
  noResult: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  noResultEmoji: { fontSize: 40 },
  noResultText: { fontSize: 16, fontWeight: '600', color: '#1A2B4B' },
  noResultSub: { fontSize: 13, color: '#8A9BB5', textAlign: 'center' },
  addBtn: {
    marginTop: 8,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultEmoji: { fontSize: 28 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#1A2B4B' },
  resultCategory: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  calBox: {
    backgroundColor: '#EBF5FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  calValue: { fontSize: 22, fontWeight: '800', color: '#2196F3' },
  calLabel: { fontSize: 10, color: '#8A9BB5' },
  macrosRow: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFF',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  macroCell: { flex: 1, alignItems: 'center', gap: 2 },
  macroCellEmoji: { fontSize: 14 },
  macroCellValue: { fontSize: 14, fontWeight: '700' },
  macroCellLabel: { fontSize: 10, color: '#8A9BB5' },
  extraInfo: {
    fontSize: 11,
    color: '#8A9BB5',
    textAlign: 'center',
    marginTop: 2,
  },
});
