import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalysisView } from './components/AnalysisView';
import { BudgetAndGoalsView } from './components/BudgetAndGoalsView';
import { ShortcutsView } from './components/ShortcutsView';
import { QuickAddModal } from './components/QuickAddModal';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Settings,
  LogOut,
  Plus,
  Compass,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function ApplicationLayout() {
  const { user, logout, isFirebaseActive } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Redirection map for quick view navigation
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onOpenQuickAdd={() => setIsQuickAddOpen(true)} setActiveTab={setActiveTab} />;
      case 'history':
        return <TransactionsView />;
      case 'analysis':
        return <AnalysisView />;
      case 'budgets':
        return <BudgetAndGoalsView />;
      case 'shortcuts':
        return <ShortcutsView />;
      default:
        return <DashboardView onOpenQuickAdd={() => setIsQuickAddOpen(true)} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden">
      {/* 1. STICKY TOP APP HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-250 flex items-center justify-between px-5 py-3.5 w-full max-w-7xl mx-auto">
        <div className="flex flex-col select-none">
          <h1 className="text-2xl font-black font-display tracking-tighter italic leading-none text-slate-900">
            SLICED<span className="text-sky-400">.</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-slate-400 mt-0.5 leading-none">
            Money Tracker
          </p>
        </div>

        {/* Profiles sync highlights & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right leading-none">
            <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px]" title={user?.email}>
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">
              {isFirebaseActive ? 'Firebase Sync' : 'Local Sandbox'}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-405 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
            title="Keluar Akun"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 2. CORE VIEW SCROLLBOARD CONTAINER */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4.5 pt-5 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeInOut' }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. FLOAT FLOATING IOS STYLE BOTTOM DOCK */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-lg shadow-slate-950/5 p-2 rounded-full w-[90%] max-w-md flex items-center justify-between text-slate-405">
        
        {/* Dashboard index */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition cursor-pointer relative ${
            activeTab === 'dashboard' ? 'text-slate-900 font-semibold' : 'hover:text-slate-700'
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'stroke-[2.2]' : ''} />
          <span className="text-[9px] font-medium mt-0.5 hidden xs:block">Ringkasan</span>
        </button>

        {/* Ledger history */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition cursor-pointer relative ${
            activeTab === 'history' ? 'text-slate-900 font-semibold' : 'hover:text-slate-700'
          }`}
        >
          <Receipt size={20} className={activeTab === 'history' ? 'stroke-[2.2]' : ''} />
          <span className="text-[9px] font-medium mt-0.5 hidden xs:block">Riwayat</span>
        </button>

        {/* FLOATING ACTION ENTRY CENTER TRIGGER BUTTON */}
        <div className="relative">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-13 h-13 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-md shadow-slate-950/20 active:scale-95 transition-all transform cursor-pointer -translate-y-5"
            title="Catat Transaksi"
          >
            <Plus size={24} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Analytics charts */}
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition cursor-pointer relative ${
            activeTab === 'analysis' ? 'text-slate-900 font-semibold' : 'hover:text-slate-700'
          }`}
        >
          <PieChart size={20} className={activeTab === 'analysis' ? 'stroke-[2.2]' : ''} />
          <span className="text-[9px] font-medium mt-0.5 hidden xs:block">Analisis AI</span>
        </button>

        {/* Budget rules */}
        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition cursor-pointer relative ${
            activeTab === 'budgets' ? 'text-slate-900 font-semibold' : 'hover:text-slate-700'
          }`}
        >
          <Target size={20} className={activeTab === 'budgets' ? 'stroke-[2.2]' : ''} />
          <span className="text-[9px] font-medium mt-0.5 hidden xs:block">Anggaran</span>
        </button>

      </nav>

      {/* QUICK FLOATING INPUT MODAL */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthGateEvaluator />
    </AppProvider>
  );
}

// Inner evaluator that ensures correct tokenized view distribution
function AuthGateEvaluator() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-4 border-slate-250 border-t-slate-950 w-10 h-10 rounded-full animate-spin" />
          <span className="text-xs font-semibold font-display tracking-widest text-slate-400 uppercase">Mempersiapkan Sliced...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <ApplicationLayout />;
}
