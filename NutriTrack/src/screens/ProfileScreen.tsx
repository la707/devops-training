import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useNutrition } from '../context/NutritionContext';
import { UserProfile, ActivityLevel, NutritionGoal } from '../types';
import { calculateDailyCalories, calculateMacroTargets } from '../utils/nutritionCalculator';

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; emoji: string }[] = [
  { key: 'sedentaire', label: 'Sédentaire', emoji: '🛋️' },
  { key: 'leger', label: 'Léger', emoji: '🚶' },
  { key: 'modere', label: 'Modéré', emoji: '🏃' },
  { key: 'actif', label: 'Actif', emoji: '🏋️' },
  { key: 'tres_actif', label: 'Très actif', emoji: '🔥' },
];

const GOAL_OPTIONS: { key: NutritionGoal; label: string; emoji: string; desc: string }[] = [
  { key: 'perte_poids', label: 'Perte de poids', emoji: '📉', desc: '-500 kcal/j' },
  { key: 'maintien', label: 'Maintien', emoji: '⚖️', desc: 'Équilibre' },
  { key: 'prise_masse', label: 'Prise de masse', emoji: '💪', desc: '+300 kcal/j' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, setProfile } = useNutrition();
  const p = state.profile;

  const [name, setName] = useState(p.name);
  const [age, setAge] = useState(String(p.age));
  const [weight, setWeight] = useState(String(p.weight));
  const [height, setHeight] = useState(String(p.height));
  const [gender, setGender] = useState(p.gender);
  const [activity, setActivity] = useState<ActivityLevel>(p.activityLevel);
  const [goal, setGoal] = useState<NutritionGoal>(p.goal);

  const previewCalories = React.useMemo(() => {
    const preview: UserProfile = {
      ...p,
      age: parseInt(age) || 30,
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 175,
      gender,
      activityLevel: activity,
      goal,
      dailyTargets: p.dailyTargets,
    };
    return calculateDailyCalories(preview);
  }, [age, weight, height, gender, activity, goal]);

  const handleSave = () => {
    const newProfile: UserProfile = {
      ...p,
      name: name.trim() || 'Utilisateur',
      age: parseInt(age) || 30,
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 175,
      gender,
      activityLevel: activity,
      goal,
      dailyTargets: p.dailyTargets,
    };
    setProfile(newProfile);
    Alert.alert('Profil mis à jour', `Objectif calorique : ${calculateDailyCalories(newProfile)} kcal/jour`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mon profil</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Sauver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{(name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Votre prénom"
              placeholderTextColor="#B0BCCC"
              textAlign="center"
            />
          </View>

          {/* Personal Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Âge</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
                <Text style={styles.unit}>ans</Text>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Poids</Text>
                <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                <Text style={styles.unit}>kg</Text>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Taille</Text>
                <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>

            <Text style={styles.label}>Genre</Text>
            <View style={styles.genderRow}>
              {(['homme', 'femme'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={styles.genderEmoji}>{g === 'homme' ? '👨' : '👩'}</Text>
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Niveau d'activité</Text>
            <View style={styles.optionsGrid}>
              {ACTIVITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionBtn, activity === opt.key && styles.optionBtnActive]}
                  onPress={() => setActivity(opt.key)}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionText, activity === opt.key && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Objectif</Text>
            <View style={styles.goalsRow}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.goalBtn, goal === opt.key && styles.goalBtnActive]}
                  onPress={() => setGoal(opt.key)}
                >
                  <Text style={styles.goalEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.goalLabel, goal === opt.key && styles.goalLabelActive]}>{opt.label}</Text>
                  <Text style={styles.goalDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Objectif calorique calculé</Text>
            <Text style={styles.previewValue}>{previewCalories} <Text style={styles.previewUnit}>kcal/jour</Text></Text>
            <Text style={styles.previewNote}>
              Calculé par l'équation de Mifflin-St Jeor avec ajustement selon votre objectif
            </Text>
          </View>

          <TouchableOpacity style={styles.saveFullBtn} onPress={handleSave}>
            <Text style={styles.saveFullBtnText}>💾 Enregistrer le profil</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLetter: { fontSize: 36, color: '#fff', fontWeight: '800' },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B4B',
    borderBottomWidth: 1.5,
    borderBottomColor: '#2196F3',
    paddingBottom: 4,
    minWidth: 150,
    textAlign: 'center',
  },
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B4B', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  field: { alignItems: 'center' },
  label: { fontSize: 12, color: '#8A9BB5', marginBottom: 4 },
  input: {
    backgroundColor: '#F7FAFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE8F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4B',
    textAlign: 'center',
    width: '100%',
  },
  unit: { fontSize: 11, color: '#8A9BB5', marginTop: 3 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderBtnActive: { borderColor: '#2196F3', backgroundColor: '#EBF5FD' },
  genderEmoji: { fontSize: 20 },
  genderText: { fontSize: 14, color: '#4A5B72', fontWeight: '500' },
  genderTextActive: { color: '#2196F3', fontWeight: '700' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionBtnActive: { borderColor: '#2196F3', backgroundColor: '#EBF5FD' },
  optionEmoji: { fontSize: 16 },
  optionText: { fontSize: 13, color: '#4A5B72', fontWeight: '500' },
  optionTextActive: { color: '#2196F3', fontWeight: '700' },
  goalsRow: { flexDirection: 'row', gap: 8 },
  goalBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  goalBtnActive: { borderColor: '#2196F3', backgroundColor: '#EBF5FD' },
  goalEmoji: { fontSize: 22 },
  goalLabel: { fontSize: 12, color: '#4A5B72', fontWeight: '600', textAlign: 'center' },
  goalLabelActive: { color: '#2196F3' },
  goalDesc: { fontSize: 10, color: '#8A9BB5' },
  previewCard: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  previewTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  previewValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  previewUnit: { fontSize: 16, fontWeight: '400' },
  previewNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  saveFullBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveFullBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
