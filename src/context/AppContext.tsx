import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, HAS_REAL_FIREBASE } from '../lib/firebase';
import { storageService } from '../lib/storage';
import { Transaction, Budget, FinancialGoal, CustomCategory, UserProfile } from '../types';

interface AppContextType {
  user: any | null;
  loading: boolean;
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  customCategories: CustomCategory[];
  shortcutToken: string;
  isFirebaseActive: boolean;
  
  // Authentication
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  // Transactions Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budgets Actions
  saveBudget: (category: string, amount: number) => Promise<Budget>;
  deleteBudget: (category: string) => Promise<void>;

  // Goals Actions
  saveGoal: (name: string, target: number, current: number, targetDate: string, id?: string) => Promise<FinancialGoal>;
  deleteGoal: (id: string) => Promise<void>;

  // Custom Categories
  addCustomCategory: (name: string, type: 'income' | 'expense') => Promise<CustomCategory>;
  deleteCustomCategory: (id: string) => Promise<void>;

  // Shortcuts Integration
  pollShortcutTransactions: () => Promise<Omit<Transaction, 'id'>[]>;
  clearShortcutTransactions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [shortcutToken, setShortcutToken] = useState<string>('');

  // Local fallback user management
  const [localUser, setLocalUser] = useState<any | null>(() => {
    const raw = localStorage.getItem('sliced_money_local_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Track the actual running environment
  const isFirebaseActive = HAS_REAL_FIREBASE;

  // Listen to Auth state changes
  useEffect(() => {
    if (isFirebaseActive) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // Clear any local user to avoid session conflict when successfully logged in with Firebase
          localStorage.removeItem('sliced_money_local_user');
          setLocalUser(null);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          });
        } else {
          // Fallback to local offline saved user if present
          if (localUser) {
            setUser(localUser);
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Offline fallback auth state check
      if (localUser) {
        setUser(localUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [isFirebaseActive, localUser]);

  // Load user data whenever active user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setCustomCategories([]);
        setShortcutToken('');
        return;
      }

      const uid = user.uid || 'local-demo-user';
      try {
        const [txs, bgs, gls, cats] = await Promise.all([
          storageService.getTransactions(uid),
          storageService.getBudgets(uid),
          storageService.getGoals(uid),
          storageService.getCustomCategories(uid)
        ]);

        setTransactions(txs || []);
        setBudgets(bgs || []);
        setGoals(gls || []);
        setCustomCategories(cats || []);
        
        // Generate a clean shortcut pairing token (UID or custom slug key)
        const token = uid.substring(0, 10).toLowerCase();
        setShortcutToken(token);
      } catch (err) {
        console.error('Failed to load user financial records:', err);
      }
    };

    loadUserData();
  }, [user]);

  // Authentication logic
  const login = async (email: string, pass: string) => {
    if (isFirebaseActive) {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        console.warn("Firebase Auth Login failed, checking local fallback:", err);
        const isOptNotAllowed = err.code === 'auth/operation-not-allowed' || 
                                err.message?.includes('operation-not-allowed') || 
                                err.message?.includes('configuration-not-found');
        if (isOptNotAllowed) {
          const rawUsers = localStorage.getItem('sliced_money_local_users');
          const users = rawUsers ? JSON.parse(rawUsers) : {};
          
          if (users[email] && users[email].password === pass) {
            const fakeUser = {
              uid: 'local_user_' + email.replace(/[^a-zA-Z0-9]/g, ''),
              email: email,
              displayName: email.split('@')[0]
            };
            localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
            setLocalUser(fakeUser);
            setUser(fakeUser);
          } else if (users[email] && users[email].password !== pass) {
            throw new Error('Email atau password salah! (Local Offline)');
          } else {
            // Auto register & login local user on the fly for smooth testing
            users[email] = { email, password: pass };
            localStorage.setItem('sliced_money_local_users', JSON.stringify(users));
            const fakeUser = {
              uid: 'local_user_' + email.replace(/[^a-zA-Z0-9]/g, ''),
              email: email,
              displayName: email.split('@')[0]
            };
            localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
            setLocalUser(fakeUser);
            setUser(fakeUser);
          }
        } else {
          throw err;
        }
      }
    } else {
      // Local check
      const rawUsers = localStorage.getItem('sliced_money_local_users');
      const users = rawUsers ? JSON.parse(rawUsers) : {};
      
      if (users[email] && users[email].password === pass) {
        const fakeUser = {
          uid: 'local_user_' + email.replace(/[^a-zA-Z0-9]/g, ''),
          email: email,
          displayName: email.split('@')[0]
        };
        localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
        setLocalUser(fakeUser);
      } else {
        throw new Error('Email atau password salah! Hubungkan Firebase untuk pendaftaran multi-user asli.');
      }
    }
  };

  const register = async (email: string, pass: string) => {
    if (isFirebaseActive) {
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        console.warn("Firebase Auth Register failed, checking local fallback:", err);
        const isOptNotAllowed = err.code === 'auth/operation-not-allowed' || 
                                err.message?.includes('operation-not-allowed') || 
                                err.message?.includes('configuration-not-found');
        if (isOptNotAllowed) {
          const rawUsers = localStorage.getItem('sliced_money_local_users');
          const users = rawUsers ? JSON.parse(rawUsers) : {};
          
          if (users[email]) {
            throw new Error('Email ini sudah terdaftar offline.');
          }

          users[email] = { email, password: pass };
          localStorage.setItem('sliced_money_local_users', JSON.stringify(users));

          const fakeUser = {
            uid: 'local_user_' + email.replace(/[^a-zA-Z0-9]/g, ''),
            email: email,
            displayName: email.split('@')[0]
          };
          localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
          setLocalUser(fakeUser);
          setUser(fakeUser);
        } else {
          throw err;
        }
      }
    } else {
      // Local registry
      const rawUsers = localStorage.getItem('sliced_money_local_users');
      const users = rawUsers ? JSON.parse(rawUsers) : {};
      
      if (users[email]) {
        throw new Error('Email ini sudah terdaftar.');
      }

      users[email] = { email, password: pass };
      localStorage.setItem('sliced_money_local_users', JSON.stringify(users));

      const fakeUser = {
        uid: 'local_user_' + email.replace(/[^a-zA-Z0-9]/g, ''),
        email: email,
        displayName: email.split('@')[0]
      };
      localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
      setLocalUser(fakeUser);
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseActive) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err: any) {
        console.error("Google login failed:", err);
        throw err;
      }
    } else {
      const fakeUser = {
        uid: 'local_user_google_mock',
        email: 'google_mock_user@gmail.com',
        displayName: 'Google User'
      };
      localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
      setLocalUser(fakeUser);
      setUser(fakeUser);
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseActive) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Local alert message simulation
      alert(`[Simulasi Reset] Link pemulihan password telah dikirim ke email: ${email}`);
    }
  };

  const logout = async () => {
    if (isFirebaseActive) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Firebase signOut error", err);
      }
    }
    localStorage.removeItem('sliced_money_local_user');
    setLocalUser(null);
    setUser(null);
  };

  // Transactions CRUD
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const uid = user?.uid || 'local-demo-user';
    const added = await storageService.addTransaction(uid, {
      ...tx,
      createdAt: new Date().toISOString()
    });
    setTransactions(prev => [added, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    return added;
  };

  const deleteTransaction = async (id: string) => {
    const uid = user?.uid || 'local-demo-user';
    await storageService.deleteTransaction(uid, id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Budgets CRUD
  const saveBudget = async (category: string, amount: number) => {
    const uid = user?.uid || 'local-demo-user';
    const newBudget: Budget = { category, amount };
    const saved = await storageService.saveBudget(uid, newBudget);
    setBudgets(prev => {
      const filtered = prev.filter(b => b.category !== category);
      return [...filtered, saved];
    });
    return saved;
  };

  const deleteBudget = async (category: string) => {
    const uid = user?.uid || 'local-demo-user';
    await storageService.deleteBudget(uid, category);
    setBudgets(prev => prev.filter(b => b.category !== category));
  };

  // Goals CRUD
  const saveGoal = async (name: string, target: number, current: number, targetDate: string, id?: string) => {
    const uid = user?.uid || 'local-demo-user';
    const goalId = id || 'goal_' + Math.random().toString(36).substring(2, 11);
    const newGoal: FinancialGoal = {
      id: goalId,
      name,
      target,
      current,
      targetDate,
      createdAt: new Date().toISOString()
    };
    const saved = await storageService.saveGoal(uid, newGoal);
    setGoals(prev => {
      const filtered = prev.filter(g => g.id !== goalId);
      return [...filtered, saved];
    });
    return saved;
  };

  const deleteGoal = async (id: string) => {
    const uid = user?.uid || 'local-demo-user';
    await storageService.deleteGoal(uid, id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Custom Categories CRUD
  const addCustomCategory = async (name: string, type: 'income' | 'expense') => {
    const uid = user?.uid || 'local-demo-user';
    const id = 'cat_' + Math.random().toString(36).substring(2, 11);
    const newCat: CustomCategory = { id, name, type };
    const saved = await storageService.addCustomCategory(uid, newCat);
    setCustomCategories(prev => [...prev, saved]);
    return saved;
  };

  const deleteCustomCategory = async (id: string) => {
    const uid = user?.uid || 'local-demo-user';
    await storageService.deleteCustomCategory(uid, id);
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  // Polling incoming shortcut transactions
  const pollShortcutTransactions = async (): Promise<Omit<Transaction, 'id'>[]> => {
    if (!shortcutToken) return [];
    try {
      const res = await fetch(`/api/shortcuts?token=${shortcutToken}`);
      const data = await res.json();
      return data.transactions || [];
    } catch (e) {
      console.error('Error polling shortcut transactions:', e);
      return [];
    }
  };

  const clearShortcutTransactions = async () => {
    if (!shortcutToken) return;
    try {
      await fetch(`/api/shortcuts?token=${shortcutToken}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing shortcut buffer:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        transactions,
        budgets,
        goals,
        customCategories,
        shortcutToken,
        isFirebaseActive,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        logout,
        addTransaction,
        deleteTransaction,
        saveBudget,
        deleteBudget,
        saveGoal,
        deleteGoal,
        addCustomCategory,
        deleteCustomCategory,
        pollShortcutTransactions,
        clearShortcutTransactions
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
