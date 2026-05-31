import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { format, parseISO, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNutrition } from '../context/NutritionContext';
import NutrientBar from '../components/NutrientBar';
import { getWeekRange, getMonthDays, formatShortDate } from '../utils/dateUtils';
import { Nutrients } from '../types';
import { averageNutrients, EMPTY_NUTRIENTS, addNutrients } from '../utils/nutritionCalculator';

type Period = 'jour' | 'semaine' | 'mois';

const BAR_COLORS: Record<string, string> = {
  calories: '#2196F3',
  carbs: '#4CAF50',
  proteins: '#FF9800',
  fats: '#FFC107',
};

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { state, getDayLog, getLogsBetween } = useNutrition();
  const [period, setPeriod] = useState<Period>('semaine');
  const today = state.selectedDate;

  const { days, title } = useMemo(() => {
    if (period === 'jour') {
      const log = getDayLog(today);
      return { days: [log], title: format(parseISO(today), 'd MMMM yyyy', { locale: fr }) };
    }
    if (period === 'semaine') {
      const { start, end } = getWeekRange(parseISO(today));
      return {
        days: getLogsBetween(start, end),
        title: `Semaine du ${format(parseISO(start), 'd MMM', { locale: fr })} au ${format(parseISO(end), 'd MMM', { locale: fr })}`,
      };
    }
    // month
    const monthStart = startOfMonth(parseISO(today));
    const monthEnd = endOfMonth(parseISO(today));
    return {
      days: getLogsBetween(
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      ),
      title: format(parseISO(today), 'MMMM yyyy', { locale: fr }),
    };
  }, [period, today, getDayLog, getLogsBetween]);

  const daysWithData = days.filter((d) => d.entries.length > 0);
  const totalNutrients = daysWithData.reduce<Nutrients>((acc, d) => addNutrients(acc, d.totalNutrients), EMPTY_NUTRIENTS);
  const avgNutrients = daysWithData.length > 0 ? averageNutrients(daysWithData.map((d) => d.totalNutrients)) : EMPTY_NUTRIENTS;
  const targets = state.profile.dailyTargets;

  // Bar chart data
  const chartDays = period === 'mois' ? days.slice(-14) : days;
  const maxCal = Math.max(...chartDays.map((d) => d.totalNutrients.calories), targets.calories);

  const chartWidth = 320;
  const chartHeight = 120;
  const barWidth = Math.max(10, (chartWidth - 20) / Math.max(chartDays.length, 1) - 4);

  return (
    <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Rapports</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Period Tabs */}
        <View style={styles.tabs}>
          {(['jour', 'semaine', 'mois'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.activeTab]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.tabText, period === p && styles.activeTabText]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.periodTitle}>{title}</Text>

          {/* Summary cards */}
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryEmoji}>🔥</Text>
              <Text style={styles.summaryValue}>{Math.round(period === 'jour' ? totalNutrients.calories : avgNutrients.calories)}</Text>
              <Text style={styles.summaryLabel}>{period === 'jour' ? 'kcal' : 'kcal/j moy.'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryEmoji}>📅</Text>
              <Text style={styles.summaryValue}>{daysWithData.length}</Text>
              <Text style={styles.summaryLabel}>jours trackés</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryEmoji}>🎯</Text>
              <Text style={styles.summaryValue}>
                {daysWithData.length > 0
                  ? Math.round(
                      (daysWithData.filter((d) => d.totalNutrients.calories <= targets.calories).length /
                        daysWithData.length) *
                        100
                    )
                  : 0}%
              </Text>
              <Text style={styles.summaryLabel}>dans l'objectif</Text>
            </View>
          </View>

          {/* Bar Chart */}
          {chartDays.some((d) => d.totalNutrients.calories > 0) && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Apport calorique {period === 'mois' ? '(14 derniers jours)' : ''}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Svg width={Math.max(chartWidth, chartDays.length * (barWidth + 4) + 20)} height={chartHeight + 30}>
                  {/* Target line */}
                  <Line
                    x1="10"
                    y1={chartHeight - (targets.calories / maxCal) * chartHeight}
                    x2={chartDays.length * (barWidth + 4) + 10}
                    y2={chartHeight - (targets.calories / maxCal) * chartHeight}
                    stroke="#FF9800"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  {chartDays.map((day, i) => {
                    const barH = Math.max(2, (day.totalNutrients.calories / maxCal) * chartHeight);
                    const x = 10 + i * (barWidth + 4);
                    const y = chartHeight - barH;
                    const isOverTarget = day.totalNutrients.calories > targets.calories;
                    return (
                      <G key={day.date}>
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barH}
                          rx={4}
                          fill={isOverTarget ? '#F44336' : '#2196F3'}
                          opacity={day.entries.length === 0 ? 0.2 : 0.85}
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y={chartHeight + 20}
                          fill="#8A9BB5"
                          fontSize={9}
                          textAnchor="middle"
                        >
                          {format(parseISO(day.date), 'd', { locale: fr })}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
              </ScrollView>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.legendText}>Calories</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDash, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.legendText}>Objectif ({targets.calories} kcal)</Text>
                </View>
              </View>
            </View>
          )}

          {/* Macro breakdown */}
          <View style={styles.macroCard}>
            <Text style={styles.cardTitle}>
              {period === 'jour' ? 'Nutriments du jour' : 'Moyenne des nutriments'}
            </Text>
            <NutrientBar
              label="Glucides"
              current={period === 'jour' ? totalNutrients.carbs : avgNutrients.carbs}
              target={targets.carbs}
              unit="g"
              color="#4CAF50"
            />
            <NutrientBar
              label="Protéines"
              current={period === 'jour' ? totalNutrients.proteins : avgNutrients.proteins}
              target={targets.proteins}
              unit="g"
              color="#FF9800"
            />
            <NutrientBar
              label="Graisses"
              current={period === 'jour' ? totalNutrients.fats : avgNutrients.fats}
              target={targets.fats}
              unit="g"
              color="#FFC107"
            />
            {targets.fiber && (
              <NutrientBar
                label="Fibres"
                current={period === 'jour' ? (totalNutrients.fiber || 0) : (avgNutrients.fiber || 0)}
                target={targets.fiber}
                unit="g"
                color="#9C27B0"
              />
            )}
          </View>

          {/* Total for period */}
          {period !== 'jour' && (
            <View style={styles.totalCard}>
              <Text style={styles.cardTitle}>Total sur la période</Text>
              <View style={styles.totalGrid}>
                {[
                  { label: 'Calories', value: Math.round(totalNutrients.calories), unit: 'kcal', color: '#2196F3', emoji: '🔥' },
                  { label: 'Glucides', value: Math.round(totalNutrients.carbs), unit: 'g', color: '#4CAF50', emoji: '🌾' },
                  { label: 'Protéines', value: Math.round(totalNutrients.proteins), unit: 'g', color: '#FF9800', emoji: '🥩' },
                  { label: 'Graisses', value: Math.round(totalNutrients.fats), unit: 'g', color: '#FFC107', emoji: '🧈' },
                ].map((item) => (
                  <View key={item.label} style={styles.totalCell}>
                    <Text style={styles.totalEmoji}>{item.emoji}</Text>
                    <Text style={[styles.totalValue, { color: item.color }]}>
                      {item.value} <Text style={styles.totalUnit}>{item.unit}</Text>
                    </Text>
                    <Text style={styles.totalLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: { fontSize: 14, color: '#8A9BB5', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  scroll: { paddingHorizontal: 16 },
  periodTitle: {
    fontSize: 15,
    color: '#4A5B72',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryEmoji: { fontSize: 22, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1A2B4B' },
  summaryLabel: { fontSize: 10, color: '#8A9BB5', marginTop: 2, textAlign: 'center' },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#4A5B72', marginBottom: 12 },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 14, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11, color: '#8A9BB5' },
  macroCard: {
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A2B4B', marginBottom: 14 },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  totalCell: {
    width: '47%',
    backgroundColor: '#F7FAFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  totalEmoji: { fontSize: 20, marginBottom: 4 },
  totalValue: { fontSize: 20, fontWeight: '800' },
  totalUnit: { fontSize: 12, fontWeight: '400' },
  totalLabel: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
});
