import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useNutrition } from '../context/NutritionContext';
import { FoodItem, FoodCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from '../data/foodDatabase';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FoodCategory[];
const EMOJIS = ['🍽️','🥗','🍕','🍔','🍣','🍚','🥩','🐟','🥦','🍎','🥛','🫘','🍞','🥜','☕','🧁'];

export default function AddFoodScreen() {
  const navigation = useNavigation<any>();
  const { addCustomFood } = useNutrition();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('plats_cuisines');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [emoji, setEmoji] = useState('🍽️');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [proteins, setProteins] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (!calories || !carbs || !proteins || !fats) {
      Alert.alert('Erreur', 'Calories, glucides, protéines et graisses sont obligatoires');
      return;
    }

    const food: FoodItem = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      category,
      servingSize: parseFloat(servingSize) || 100,
      servingUnit: servingUnit.trim() || 'g',
      emoji,
      isCustom: true,
      nutrients: {
        calories: parseFloat(calories) || 0,
        carbs: parseFloat(carbs) || 0,
        proteins: parseFloat(proteins) || 0,
        fats: parseFloat(fats) || 0,
        fiber: parseFloat(fiber) || 0,
        sodium: parseFloat(sodium) || 0,
      },
    };

    addCustomFood(food);
    Alert.alert('Succès', `"${food.name}" ajouté à votre base de données !`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const Field = ({ label, value, onChange, placeholder, keyboardType = 'numeric' as any, optional = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: any; optional?: boolean }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{optional && <Text style={styles.optional}> (optionnel)</Text>}
      </Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#B0BCCC"
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>‹ Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Nouvel aliment</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveBtn}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Emoji + Name */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations générales</Text>

              <View style={styles.emojiNameRow}>
                <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Text style={styles.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom de l'aliment *"
                  placeholderTextColor="#B0BCCC"
                  keyboardType="default"
                />
              </View>

              {showEmojiPicker && (
                <View style={styles.emojiGrid}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.emojiOption, emoji === e && styles.emojiOptionSelected]}
                      onPress={() => { setEmoji(e); setShowEmojiPicker(false); }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Category */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, category === cat && styles.catChipSelected]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={styles.catChipEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                      <Text style={[styles.catChipText, category === cat && styles.catChipTextSelected]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Serving */}
              <View style={styles.servingRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Taille de portion *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={servingSize}
                    onChangeText={setServingSize}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#B0BCCC"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Unité *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={servingUnit}
                    onChangeText={setServingUnit}
                    placeholder="g, ml, pièce..."
                    placeholderTextColor="#B0BCCC"
                    keyboardType="default"
                  />
                </View>
              </View>
            </View>

            {/* Nutrients */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
              <Text style={styles.sectionSubtitle}>Pour {servingSize || '100'}{servingUnit || 'g'}</Text>

              <View style={styles.nutrientGrid}>
                <View style={[styles.nutrientField, { borderColor: '#2196F3' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#2196F3' }]}>🔥 Calories *</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>kcal</Text>
                </View>
                <View style={[styles.nutrientField, { borderColor: '#4CAF50' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#4CAF50' }]}>🌾 Glucides *</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>g</Text>
                </View>
                <View style={[styles.nutrientField, { borderColor: '#FF9800' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#FF9800' }]}>🥩 Protéines *</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={proteins}
                    onChangeText={setProteins}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>g</Text>
                </View>
                <View style={[styles.nutrientField, { borderColor: '#FFC107' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#FFC107' }]}>🧈 Graisses *</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={fats}
                    onChangeText={setFats}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>g</Text>
                </View>
                <View style={[styles.nutrientField, { borderColor: '#9C27B0' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#9C27B0' }]}>🌿 Fibres</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={fiber}
                    onChangeText={setFiber}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>g</Text>
                </View>
                <View style={[styles.nutrientField, { borderColor: '#607D8B' }]}>
                  <Text style={[styles.nutrientFieldLabel, { color: '#607D8B' }]}>🧂 Sodium</Text>
                  <TextInput
                    style={styles.nutrientInput}
                    value={sodium}
                    onChangeText={setSodium}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#B0BCCC"
                  />
                  <Text style={styles.nutrientUnit}>mg</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSave}>
              <Text style={styles.saveFullBtnText}>💾 Enregistrer l'aliment</Text>
            </TouchableOpacity>

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
  saveBtn: { fontSize: 16, color: '#2196F3', fontWeight: '700' },
  scroll: { paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B4B', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#8A9BB5', marginBottom: 12 },
  emojiNameRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  emojiBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2196F3',
  },
  emojiBtnText: { fontSize: 24 },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: '#2196F3',
  },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, color: '#4A5B72', fontWeight: '500', marginBottom: 4 },
  optional: { color: '#B0BCCC', fontWeight: '400' },
  fieldInput: {
    backgroundColor: '#F7FAFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE8F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A2B4B',
  },
  servingRow: { flexDirection: 'row', gap: 12 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: 'rgba(33,150,243,0.2)',
  },
  catChipSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: 12, color: '#4A5B72', fontWeight: '500' },
  catChipTextSelected: { color: '#fff' },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nutrientField: {
    width: '47%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    backgroundColor: '#FAFCFF',
  },
  nutrientFieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  nutrientInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2B4B',
    paddingVertical: 2,
  },
  nutrientUnit: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  saveFullBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveFullBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
