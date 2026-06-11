export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  category: string;
  amount: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
  createdAt: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface UserProfile {
  email: string;
  shortcutToken?: string;
}
