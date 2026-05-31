export interface Nutrients {
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;
  nutrients: Nutrients;
  isCustom?: boolean;
  emoji?: string;
}

export type FoodCategory =
  | 'cereales'
  | 'viandes'
  | 'poissons'
  | 'legumes'
  | 'fruits'
  | 'produits_laitiers'
  | 'legumineuses'
  | 'matieresgrasses'
  | 'boissons'
  | 'snacks'
  | 'plats_cuisines'
  | 'autres';

export interface MealEntry {
  id: string;
  foodItemId: string;
  foodItem: FoodItem;
  quantity: number;
  mealType: MealType;
  timestamp: string;
  date: string;
}

export type MealType = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation';

export interface DayLog {
  date: string;
  entries: MealEntry[];
  totalNutrients: Nutrients;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'homme' | 'femme';
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  dailyTargets: Nutrients;
}

export type ActivityLevel =
  | 'sedentaire'
  | 'leger'
  | 'modere'
  | 'actif'
  | 'tres_actif';

export type NutritionGoal = 'perte_poids' | 'maintien' | 'prise_masse';

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  days: DayLog[];
  averageNutrients: Nutrients;
  totalNutrients: Nutrients;
}

export interface MonthlyReport {
  month: number;
  year: number;
  days: DayLog[];
  averageNutrients: Nutrients;
  totalNutrients: Nutrients;
  bestDay: DayLog | null;
}
