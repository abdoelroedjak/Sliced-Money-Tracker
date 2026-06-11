import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, HAS_REAL_FIREBASE } from './firebase';
import { Transaction, Budget, FinancialGoal, CustomCategory } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default Categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'Utensils', color: 'bg-orange-100 text-orange-600' },
  { name: 'Coffee', icon: 'Coffee', color: 'bg-amber-100 text-amber-700' },
  { name: 'Transport', icon: 'Car', color: 'bg-blue-100 text-blue-600' },
  { name: 'Shopping', icon: 'ShoppingBag', color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Bills', icon: 'Receipt', color: 'bg-red-100 text-red-600' },
  { name: 'Entertainment', icon: 'Sparkles', color: 'bg-purple-100 text-purple-600' },
  { name: 'Health', icon: 'HeartPulse', color: 'bg-pink-100 text-pink-600' },
  { name: 'Education', icon: 'BookOpen', color: 'bg-teal-100 text-teal-600' },
  { name: 'Other', icon: 'CircleHelp', color: 'bg-slate-100 text-slate-600' }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Wallet', color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Freelance', icon: 'Briefcase', color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Business', icon: 'Store', color: 'bg-sky-100 text-sky-600' },
  { name: 'Investment', icon: 'TrendingUp', color: 'bg-violet-100 text-violet-600' },
  { name: 'Other', icon: 'Coins', color: 'bg-slate-100 text-slate-600' }
];

// Helper to test connection
export async function testFirestoreConnection() {
  if (!HAS_REAL_FIREBASE) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Local Storage Fallback Data Keys
const LOCAL_TX_KEY = 'sliced_money_transactions';
const LOCAL_BUDGET_KEY = 'sliced_money_budgets';
const LOCAL_GOAL_KEY = 'sliced_money_goals';
const LOCAL_CAT_KEY = 'sliced_money_categories';

// UTILS FOR LOCAL STORAGE
const getLocalData = <T>(key: string, init: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return init;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return init;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const shouldUseFirebase = (userId: string): boolean => {
  return HAS_REAL_FIREBASE && !!userId && !userId.startsWith('local_user_') && userId !== 'local-demo-user';
};

// STORAGE SERVICE INTEGRATOR
export const storageService = {
  // TRANSACTIONS
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/transactions`;
      try {
        const q = query(collection(db, path), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    return getLocalData<Transaction[]>(`${LOCAL_TX_KEY}_${userId}`, []);
  },

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
    const id = tx.id || Math.random().toString(36).substring(2, 11);
    const newTx: Transaction = {
      ...tx,
      id,
      createdAt: tx.createdAt || new Date().toISOString()
    };

    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/transactions`;
      try {
        await setDoc(doc(db, path, id), newTx);
        return newTx;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
      }
    }

    const current = getLocalData<Transaction[]>(`${LOCAL_TX_KEY}_${userId}`, []);
    const updated = [newTx, ...current].sort((a, b) => b.date.localeCompare(a.date));
    setLocalData(`${LOCAL_TX_KEY}_${userId}`, updated);
    return newTx;
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/transactions`;
      try {
        await deleteDoc(doc(db, path, txId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/${txId}`);
      }
    }

    const current = getLocalData<Transaction[]>(`${LOCAL_TX_KEY}_${userId}`, []);
    const updated = current.filter(t => t.id !== txId);
    setLocalData(`${LOCAL_TX_KEY}_${userId}`, updated);
  },

  // BUDGETS
  async getBudgets(userId: string): Promise<Budget[]> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/budgets`;
      try {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map(d => d.data() as Budget);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    return getLocalData<Budget[]>(`${LOCAL_BUDGET_KEY}_${userId}`, []);
  },

  async saveBudget(userId: string, budget: Budget): Promise<Budget> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/budgets`;
      // Firestore path variables must be clean. category is our document key
      const cleanDocId = encodeURIComponent(budget.category).replace(/\./g, '%2E');
      try {
        await setDoc(doc(db, path, cleanDocId), budget);
        return budget;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${cleanDocId}`);
      }
    }

    const current = getLocalData<Budget[]>(`${LOCAL_BUDGET_KEY}_${userId}`, []);
    const filtered = current.filter(b => b.category !== budget.category);
    const updated = [...filtered, budget];
    setLocalData(`${LOCAL_BUDGET_KEY}_${userId}`, updated);
    return budget;
  },

  async deleteBudget(userId: string, category: string): Promise<void> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/budgets`;
      const cleanDocId = encodeURIComponent(category).replace(/\./g, '%2E');
      try {
        await deleteDoc(doc(db, path, cleanDocId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/${cleanDocId}`);
      }
    }

    const current = getLocalData<Budget[]>(`${LOCAL_BUDGET_KEY}_${userId}`, []);
    const updated = current.filter(b => b.category !== category);
    setLocalData(`${LOCAL_BUDGET_KEY}_${userId}`, updated);
  },

  // FINANCIAL GOALS
  async getGoals(userId: string): Promise<FinancialGoal[]> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/goals`;
      try {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialGoal));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    return getLocalData<FinancialGoal[]>(`${LOCAL_GOAL_KEY}_${userId}`, []);
  },

  async saveGoal(userId: string, goal: FinancialGoal): Promise<FinancialGoal> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/goals`;
      try {
        await setDoc(doc(db, path, goal.id), goal);
        return goal;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${goal.id}`);
      }
    }

    const current = getLocalData<FinancialGoal[]>(`${LOCAL_GOAL_KEY}_${userId}`, []);
    const filtered = current.filter(g => g.id !== goal.id);
    const updated = [...filtered, goal];
    setLocalData(`${LOCAL_GOAL_KEY}_${userId}`, updated);
    return goal;
  },

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/goals`;
      try {
        await deleteDoc(doc(db, path, goalId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/${goalId}`);
      }
    }

    const current = getLocalData<FinancialGoal[]>(`${LOCAL_GOAL_KEY}_${userId}`, []);
    const updated = current.filter(g => g.id !== goalId);
    setLocalData(`${LOCAL_GOAL_KEY}_${userId}`, updated);
  },

  // CUSTOM CATEGORIES
  async getCustomCategories(userId: string): Promise<CustomCategory[]> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/categories`;
      try {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomCategory));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    return getLocalData<CustomCategory[]>(`${LOCAL_CAT_KEY}_${userId}`, []);
  },

  async addCustomCategory(userId: string, cat: CustomCategory): Promise<CustomCategory> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/categories`;
      try {
        await setDoc(doc(db, path, cat.id), cat);
        return cat;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${cat.id}`);
      }
    }

    const current = getLocalData<CustomCategory[]>(`${LOCAL_CAT_KEY}_${userId}`, []);
    const updated = [...current, cat];
    setLocalData(`${LOCAL_CAT_KEY}_${userId}`, updated);
    return cat;
  },

  async deleteCustomCategory(userId: string, catId: string): Promise<void> {
    if (shouldUseFirebase(userId)) {
      const path = `users/${userId}/categories`;
      try {
        await deleteDoc(doc(db, path, catId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/${catId}`);
      }
    }

    const current = getLocalData<CustomCategory[]>(`${LOCAL_CAT_KEY}_${userId}`, []);
    const updated = current.filter(c => c.id !== catId);
    setLocalData(`${LOCAL_CAT_KEY}_${userId}`, updated);
  }
};
