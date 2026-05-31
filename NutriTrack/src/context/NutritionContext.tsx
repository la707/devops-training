import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, DayLog, UserProfile, FoodItem, Nutrients, NutritionGoal } from '../types';
import { addNutrients, EMPTY_NUTRIENTS, scaleNutrients, calculateDailyCalories, calculateMacroTargets } from '../utils/nutritionCalculator';
import { formatDate } from '../utils/dateUtils';
import { FOOD_DATABASE } from '../data/foodDatabase';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Utilisateur',
  age: 30,
  weight: 70,
  height: 175,
  gender: 'homme',
  activityLevel: 'modere',
  goal: 'maintien',
  dailyTargets: {
    calories: 2000,
    carbs: 250,
    proteins: 125,
    fats: 56,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
    cholesterol: 300,
  },
};

interface State {
  logs: Record<string, DayLog>;
  profile: UserProfile;
  customFoods: FoodItem[];
  selectedDate: string;
}

type Action =
  | { type: 'ADD_ENTRY'; entry: MealEntry }
  | { type: 'REMOVE_ENTRY'; date: string; entryId: string }
  | { type: 'SET_PROFILE'; profile: UserProfile }
  | { type: 'SET_SELECTED_DATE'; date: string }
  | { type: 'ADD_CUSTOM_FOOD'; food: FoodItem }
  | { type: 'REMOVE_CUSTOM_FOOD'; foodId: string }
  | { type: 'LOAD_STATE'; state: Partial<State> };

const computeDayLog = (date: string, entries: MealEntry[]): DayLog => ({
  date,
  entries,
  totalNutrients: entries.reduce<Nutrients>(
    (acc, e) => addNutrients(acc, scaleNutrients(e.foodItem.nutrients, e.quantity, e.foodItem.servingSize)),
    EMPTY_NUTRIENTS
  ),
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ENTRY': {
      const { date } = action.entry;
      const existing = state.logs[date]?.entries || [];
      const entries = [...existing, action.entry];
      return {
        ...state,
        logs: { ...state.logs, [date]: computeDayLog(date, entries) },
      };
    }
    case 'REMOVE_ENTRY': {
      const existing = state.logs[action.date]?.entries || [];
      const entries = existing.filter((e) => e.id !== action.entryId);
      return {
        ...state,
        logs: { ...state.logs, [action.date]: computeDayLog(action.date, entries) },
      };
    }
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };
    case 'ADD_CUSTOM_FOOD':
      return { ...state, customFoods: [...state.customFoods, action.food] };
    case 'REMOVE_CUSTOM_FOOD':
      return { ...state, customFoods: state.customFoods.filter((f) => f.id !== action.foodId) };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
};

interface NutritionContextValue {
  state: State;
  allFoods: FoodItem[];
  addEntry: (entry: MealEntry) => void;
  removeEntry: (date: string, entryId: string) => void;
  setProfile: (profile: UserProfile) => void;
  setSelectedDate: (date: string) => void;
  addCustomFood: (food: FoodItem) => void;
  removeCustomFood: (foodId: string) => void;
  getDayLog: (date: string) => DayLog;
  getLogsBetween: (startDate: string, endDate: string) => DayLog[];
}

const NutritionContext = createContext<NutritionContextValue | null>(null);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    logs: {},
    profile: DEFAULT_PROFILE,
    customFoods: [],
    selectedDate: formatDate(new Date()),
  });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('@nutrition_logs'),
      AsyncStorage.getItem('@nutrition_profile'),
      AsyncStorage.getItem('@custom_foods'),
    ]).then(([logsRaw, profileRaw, foodsRaw]) => {
      const partial: Partial<State> = {};
      try { if (logsRaw) partial.logs = JSON.parse(logsRaw); } catch {}
      try { if (profileRaw) partial.profile = JSON.parse(profileRaw); } catch {}
      try { if (foodsRaw) partial.customFoods = JSON.parse(foodsRaw); } catch {}
      if (Object.keys(partial).length > 0) dispatch({ type: 'LOAD_STATE', state: partial });
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@nutrition_logs', JSON.stringify(state.logs));
  }, [state.logs]);

  useEffect(() => {
    AsyncStorage.setItem('@nutrition_profile', JSON.stringify(state.profile));
  }, [state.profile]);

  useEffect(() => {
    AsyncStorage.setItem('@custom_foods', JSON.stringify(state.customFoods));
  }, [state.customFoods]);

  const allFoods = [...FOOD_DATABASE, ...state.customFoods];

  const addEntry = useCallback((entry: MealEntry) => dispatch({ type: 'ADD_ENTRY', entry }), []);
  const removeEntry = useCallback((date: string, entryId: string) => dispatch({ type: 'REMOVE_ENTRY', date, entryId }), []);
  const setProfile = useCallback((profile: UserProfile) => {
    const calories = calculateDailyCalories(profile);
    const macros = calculateMacroTargets(calories, profile.goal);
    dispatch({
      type: 'SET_PROFILE',
      profile: {
        ...profile,
        dailyTargets: {
          calories,
          carbs: macros.carbs,
          proteins: macros.proteins,
          fats: macros.fats,
          fiber: 25,
          sugar: 50,
          sodium: 2300,
          cholesterol: 300,
        },
      },
    });
  }, []);
  const setSelectedDate = useCallback((date: string) => dispatch({ type: 'SET_SELECTED_DATE', date }), []);
  const addCustomFood = useCallback((food: FoodItem) => dispatch({ type: 'ADD_CUSTOM_FOOD', food }), []);
  const removeCustomFood = useCallback((foodId: string) => dispatch({ type: 'REMOVE_CUSTOM_FOOD', foodId }), []);

  const getDayLog = useCallback(
    (date: string): DayLog =>
      state.logs[date] || { date, entries: [], totalNutrients: EMPTY_NUTRIENTS },
    [state.logs]
  );

  const getLogsBetween = useCallback(
    (startDate: string, endDate: string): DayLog[] => {
      const result: DayLog[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        result.push(getDayLog(dateStr));
      }
      return result;
    },
    [getDayLog]
  );

  return (
    <NutritionContext.Provider
      value={{ state, allFoods, addEntry, removeEntry, setProfile, setSelectedDate, addCustomFood, removeCustomFood, getDayLog, getLogsBetween }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = (): NutritionContextValue => {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition must be used within NutritionProvider');
  return ctx;
};
