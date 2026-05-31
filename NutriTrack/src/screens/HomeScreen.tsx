import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNutrition } from '../context/NutritionContext';
import CalendarStrip from '../components/CalendarStrip';
import CircularProgress from '../components/CircularProgress';
import MacroRing from '../components/MacroRing';
import MealSection from '../components/MealSection';
import { MealType } from '../types';
import { formatDate } from '../utils/dateUtils';

const MEAL_TYPES: MealType[] = ['petit_dejeuner', 'dejeuner', 'collation', 'diner'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state, getDayLog, setSelectedDate, removeEntry } = useNutrition();
  const { selectedDate, profile, logs } = state;

  const dayLog = getDayLog(selectedDate);
  const targets = profile.dailyTargets;
  const total = dayLog.totalNutrients;
  const remaining = Math.max(targets.calories - total.calories, 0);
  const calorieProgress = Math.min(total.calories / targets.calories, 1);

  const logDates = useMemo(() => Object.keys(logs).filter((d) => logs[d].entries.length > 0), [logs]);

  const displayDate = useMemo(() => {
    try {
      const today = formatDate(new Date());
      if (selectedDate === today) return "Aujourd'hui";
      return format(parseISO(selectedDate), 'd MMMM', { locale: fr });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleAddMeal = (mealType: MealType) => {
    navigation.navigate('AddMeal', { date: selectedDate, mealType });
  };

  const handleRemove = (entryId: string) => {
    removeEntry(selectedDate, entryId);
  };

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>NutriTrack</Text>
              <Text style={styles.dateLabel}>{displayDate} ▾</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} logDates={logDates} />

          {/* Daily Budget */}
          <View style={styles.budgetCard}>
            <Text style={styles.sectionTitle}>Budget quotidien</Text>
            <TouchableOpacity style={styles.modifyBtn} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.modifyText}>✏️ Modifier</Text>
            </TouchableOpacity>

            <View style={styles.budgetContent}>
              {/* Big Circle */}
              <View style={styles.circleWrapper}>
                <CircularProgress
                  size={150}
                  strokeWidth={10}
                  progress={calorieProgress}
                  color={calorieProgress > 0.95 ? '#F44336' : '#2196F3'}
                  bgColor="#E8F4FD"
                >
                  <View style={styles.circleCenter}>
                    <Text style={styles.remainingLabel}>Restant</Text>
                    <Text style={styles.remainingValue}>{remaining}</Text>
                    <Text style={styles.remainingUnit}>kcal</Text>
                  </View>
                </CircularProgress>
                <Text style={styles.objectifText}>Objectif {targets.calories} kcal</Text>
              </View>

              {/* Macros */}
              <View style={styles.macrosList}>
                <MacroRing label="Glucides" current={total.carbs} target={targets.carbs} unit="g" color="#4CAF50" emoji="🌾" />
                <View style={styles.macroDivider} />
                <MacroRing label="Protéines" current={total.proteins} target={targets.proteins} unit="g" color="#FF9800" emoji="🥩" />
                <View style={styles.macroDivider} />
                <MacroRing label="Graisses" current={total.fats} target={targets.fats} unit="g" color="#FFC107" emoji="🧀" />
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <TouchableOpacity style={styles.reportBanner} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.reportIcon}>📊</Text>
            <Text style={styles.reportText}>Bilan quotidien</Text>
            <View style={styles.reportBadge}><Text style={styles.reportBadgeText}>Voir tout</Text></View>
            <Text style={styles.reportArrow}>›</Text>
          </TouchableOpacity>

          {/* Calorie estimator banner */}
          <TouchableOpacity style={styles.estimateBanner} onPress={() => navigation.navigate('Estimate')}>
            <View style={styles.estimateText}>
              <Text style={styles.estimateTitle}>Analyser un plat</Text>
              <Text style={styles.estimateSubtitle}>Saisissez un nom de plat pour obtenir ses calories</Text>
              <View style={styles.estimateBtn}>
                <Text style={styles.estimateBtnText}>Essayer →</Text>
              </View>
            </View>
            <Text style={styles.estimateEmoji}>🍽️</Text>
          </TouchableOpacity>

          {/* Meals */}
          <View style={styles.mealsHeader}>
            <Text style={styles.sectionTitle}>Apport</Text>
            <Text style={styles.totalCals}>🔥 {Math.round(total.calories)} kcal</Text>
          </View>

          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={dayLog.entries}
              onAdd={handleAddMeal}
              onRemove={handleRemove}
            />
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* FAB Scanner — comme WiseMeal */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Scan', { date: selectedDate })}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>📷</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A2B4B',
  },
  dateLabel: {
    fontSize: 14,
    color: '#8A9BB5',
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  budgetCard: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B4B',
  },
  modifyBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modifyText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  budgetContent: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  circleWrapper: {
    alignItems: 'center',
  },
  circleCenter: {
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 11,
    color: '#8A9BB5',
    marginBottom: 2,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A2B4B',
    lineHeight: 36,
  },
  remainingUnit: {
    fontSize: 13,
    color: '#8A9BB5',
  },
  objectifText: {
    fontSize: 11,
    color: '#8A9BB5',
    marginTop: 8,
  },
  macrosList: {
    flex: 1,
    justifyContent: 'center',
  },
  macroDivider: {
    height: 1,
    backgroundColor: '#F0F4FA',
    marginVertical: 2,
  },
  reportBanner: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  reportIcon: { fontSize: 20 },
  reportText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
  },
  reportBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportBadgeText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
  },
  reportArrow: {
    fontSize: 20,
    color: '#2196F3',
  },
  estimateBanner: {
    backgroundColor: '#1A2B4B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  estimateText: { flex: 1 },
  estimateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  estimateSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  estimateBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  estimateBtnText: {
    color: '#1A2B4B',
    fontSize: 13,
    fontWeight: '700',
  },
  estimateEmoji: {
    fontSize: 40,
    marginLeft: 8,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalCals: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 26,
  },
});
