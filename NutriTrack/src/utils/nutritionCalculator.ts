import { Nutrients, UserProfile, ActivityLevel, NutritionGoal } from '../types';

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  carbs: 0,
  proteins: 0,
  fats: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  cholesterol: 0,
};

export const addNutrients = (a: Nutrients, b: Nutrients): Nutrients => ({
  calories: a.calories + b.calories,
  carbs: a.carbs + b.carbs,
  proteins: a.proteins + b.proteins,
  fats: a.fats + b.fats,
  fiber: (a.fiber || 0) + (b.fiber || 0),
  sugar: (a.sugar || 0) + (b.sugar || 0),
  sodium: (a.sodium || 0) + (b.sodium || 0),
  cholesterol: (a.cholesterol || 0) + (b.cholesterol || 0),
});

export const scaleNutrients = (nutrients: Nutrients, quantity: number, servingSize: number): Nutrients => {
  const ratio = quantity / servingSize;
  return {
    calories: Math.round(nutrients.calories * ratio),
    carbs: Math.round(nutrients.carbs * ratio * 10) / 10,
    proteins: Math.round(nutrients.proteins * ratio * 10) / 10,
    fats: Math.round(nutrients.fats * ratio * 10) / 10,
    fiber: Math.round((nutrients.fiber || 0) * ratio * 10) / 10,
    sugar: Math.round((nutrients.sugar || 0) * ratio * 10) / 10,
    sodium: Math.round((nutrients.sodium || 0) * ratio),
    cholesterol: Math.round((nutrients.cholesterol || 0) * ratio),
  };
};

export const averageNutrients = (nutrientsList: Nutrients[]): Nutrients => {
  if (nutrientsList.length === 0) return EMPTY_NUTRIENTS;
  const total = nutrientsList.reduce(addNutrients, EMPTY_NUTRIENTS);
  const count = nutrientsList.length;
  return {
    calories: Math.round(total.calories / count),
    carbs: Math.round((total.carbs / count) * 10) / 10,
    proteins: Math.round((total.proteins / count) * 10) / 10,
    fats: Math.round((total.fats / count) * 10) / 10,
    fiber: Math.round(((total.fiber || 0) / count) * 10) / 10,
    sugar: Math.round(((total.sugar || 0) / count) * 10) / 10,
    sodium: Math.round((total.sodium || 0) / count),
    cholesterol: Math.round((total.cholesterol || 0) / count),
  };
};

const BMR_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

export const calculateDailyCalories = (profile: UserProfile): number => {
  // Mifflin-St Jeor equation
  let bmr: number;
  if (profile.gender === 'homme') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const tdee = bmr * BMR_ACTIVITY_MULTIPLIERS[profile.activityLevel];

  const goalAdjustments: Record<NutritionGoal, number> = {
    perte_poids: -500,
    maintien: 0,
    prise_masse: +300,
  };

  return Math.round(tdee + goalAdjustments[profile.goal]);
};

export const calculateMacroTargets = (calories: number, goal: NutritionGoal): { carbs: number; proteins: number; fats: number } => {
  const ratios: Record<NutritionGoal, { carbs: number; proteins: number; fats: number }> = {
    perte_poids: { carbs: 0.35, proteins: 0.40, fats: 0.25 },
    maintien: { carbs: 0.50, proteins: 0.25, fats: 0.25 },
    prise_masse: { carbs: 0.45, proteins: 0.30, fats: 0.25 },
  };

  const r = ratios[goal];
  return {
    carbs: Math.round((calories * r.carbs) / 4),
    proteins: Math.round((calories * r.proteins) / 4),
    fats: Math.round((calories * r.fats) / 9),
  };
};

export const getProgressColor = (current: number, target: number): string => {
  const ratio = current / target;
  if (ratio < 0.5) return '#4CAF50';
  if (ratio < 0.85) return '#2196F3';
  if (ratio < 1.0) return '#FF9800';
  return '#F44336';
};

export const getNutrientScore = (nutrients: Nutrients, targets: Nutrients): number => {
  const calScore = Math.min(nutrients.calories / targets.calories, 1);
  const carbScore = Math.min(nutrients.carbs / targets.carbs, 1);
  const protScore = Math.min(nutrients.proteins / targets.proteins, 1);
  const fatScore = Math.min(nutrients.fats / targets.fats, 1);
  return Math.round(((calScore + carbScore + protScore + fatScore) / 4) * 100);
};
