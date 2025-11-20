export interface User {
  username: string;
  mobileNumber: string;
  token?: string;
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  status: 'success' | 'not_food' | 'error' | 'init';
  message?: string;
  food: FoodItem[];
  total: AnalysisTotals;
}

export interface HistoryRecord {
  recordId: string | number;
  timestamp: string;
  image: string; // URL
  analysis: {
    totals: AnalysisTotals;
    foodItems: FoodItem[];
  };
}

export type ViewState = 'home' | 'history';
export type AuthState = 'login' | 'register';