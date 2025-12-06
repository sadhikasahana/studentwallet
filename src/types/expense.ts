export type ExpenseCategory = 
  | "food" 
  | "stationary" 
  | "clothes" 
  | "medicines" 
  | "transport" 
  | "entertainment"
  | "other";

export type AlertType = "budget_exceeded" | "suspicious_spending" | "excess_spending";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  isSuspicious?: boolean;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  limit: number;
  spent: number;
  icon: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  category?: ExpenseCategory;
  amount?: number;
  timestamp: string;
  read: boolean;
}
