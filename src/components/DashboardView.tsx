import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Sparkles,
  Phone,
  Compass,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Check,
  Zap,
  Plus,
} from 'lucide-react';
import { Transaction } from '../types';

export const DashboardView: React.FC<{
  onOpenQuickAdd: () => void;
  setActiveTab: (tab: string) => void;
}> = ({ onOpenQuickAdd, setActiveTab }) => {
  const {
    transactions,
    budgets,
    goals,
    shortcutToken,
    pollShortcutTransactions,
    clearShortcutTransactions,
    addTransaction,
  } = useApp();

  const [shortcutBuffer, setShortcutBuffer] = useState<Omit<Transaction, 'id'>[]>([]);
  const [syncingShortcut, setSyncingShortcut] = useState(false);
  const [successSync, setSuccessSync] = useState(false);

  // Poll for iOS Shortcut transactions on dashboard mount
  useEffect(() => {
    const checkShortcuts = async () => {
      const pending = await pollShortcutTransactions();
      if (pending && pending.length > 0) {
        setShortcutBuffer(pending);
      }
    };
    
    // Initial check and regular interval polling (every 10 seconds)
    checkShortcuts();
    const interval = setInterval(checkShortcuts, 10000);
    return () => clearInterval(interval);
  }, [shortcutToken]);

  // Handle importing the shortcuts buffer
  const handleSyncShortcuts = async () => {
    if (shortcutBuffer.length === 0) return;
    setSyncingShortcut(true);
    try {
      // Add each item incrementally
      for (const item of shortcutBuffer) {
        await addTransaction(item);
      }
      // Clear the buffer in backend
      await clearShortcutTransactions();
      setShortcutBuffer([]);
      setSuccessSync(true);
      setTimeout(() => setSuccessSync(false), 3000);
    } catch (e) {
      console.error('Failed to sync shortcut transactions:', e);
    } finally {
      setSyncingShortcut(false);
    }
  };

  // CALCULATING REQUISITE METRICS
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Sum calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Savings rate calculation
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // List recent transitions
  const recentTransactions = transactions.slice(0, 4);

  // Quick budget tracking warning analysis
  const exceededBudgets = budgets.filter((b) => {
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return spent > b.amount;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* SUCCESS SYNC MICRO-MESSAGE BANNER */}
      {successSync && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 animate-slideDown">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Check size={16} className="text-emerald-600 font-bold" />
          </div>
          <div>
            <span className="font-semibold block text-sm">Shortcut Berhasil Sinkron</span>
            <span className="text-xs text-emerald-600/90">Transaksi dari iOS Shortcut telah dicatat otomatis ke riwayat Anda.</span>
          </div>
        </div>
      )}

      {/* APPLE SHORTCUT INPUT DETECTED NOTIFICATION */}
      {shortcutBuffer.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-slate-900/10 border border-white/5 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <Zap size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-semibold block text-sm font-display">Tegangan Shortcut Masuk</span>
              <span className="text-xs text-slate-300">
                Terdeteksi {shortcutBuffer.length} catatan baru via Apple Shortcuts iOS.
              </span>
            </div>
          </div>
          <button
            onClick={handleSyncShortcuts}
            disabled={syncingShortcut}
            className="px-4 py-2 bg-white text-slate-950 hover:bg-slate-50 transition rounded-xl text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
          >
            {syncingShortcut ? 'Metode Sinkron...' : 'Simpan ke Riwayat'}
          </button>
        </div>
      )}

      {/* FINANCIAL SUMMARY HIGHLIGHTS CARDS */}
      <div className="bg-[#0F172A] text-white p-8 rounded-3xl relative overflow-hidden shadow-md border border-slate-800">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-emerald-500/10 to-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">TOTAL BALANCE</span>
        <h2 className={`text-4xl sm:text-5xl font-black mt-2 tracking-tighter font-display leading-tight ${totalBalance >= 0 ? 'text-white' : 'text-red-405'}`}>
          {formatRupiah(totalBalance)}
        </h2>
        <div className="mt-4 flex items-center text-[#22C55E] space-x-1.5 font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
          <span>Sistem Pencatatan Aktif</span>
        </div>
      </div>

      {/* METRICS DIVISION GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* INCOME CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block">INCOME</span>
            <h4 className="text-xl sm:text-2xl font-black mt-1 text-[#22C55E] truncate tracking-tight">{formatRupiah(totalIncome)}</h4>
          </div>
          <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#22C55E] rounded-full" style={{ width: totalIncome > 0 ? `${Math.min(100, Math.round((totalIncome / (totalIncome + totalExpense || 1)) * 100))}%` : '0%' }}></div>
          </div>
        </div>

        {/* EXPENSE CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block">EXPENSE</span>
            <h4 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 truncate tracking-tight">{formatRupiah(totalExpense)}</h4>
          </div>
          <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-900 rounded-full" style={{ width: totalExpense > 0 ? `${Math.min(100, Math.round((totalExpense / (totalIncome + totalExpense || 1)) * 100))}%` : '0%' }}></div>
          </div>
        </div>
      </div>

      {/* SAVINGS RATE CARD */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1 animate-fadeIn">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block">SAVINGS RATE</span>
            <span className="text-xs font-black font-mono tracking-tighter text-slate-800">{savingsRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#38BDF8] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
              style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">STATUS:</span>
          <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black tracking-tight uppercase ${savingsRate >= 30 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
            {savingsRate >= 30 ? 'HEALTHY RANGE' : 'BELOW TARGET'}
          </span>
        </div>
      </div>

      {/* WARNINGS TRIGGER BANNER */}
      {exceededBudgets.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-800">
          <Compass size={18} className="mt-0.5 text-red-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block mb-0.5">Budget Warning!</span>
            Anda melebihi anggaran bulanan untuk {exceededBudgets.length} kategori:{' '}
            <span className="font-semibold">{exceededBudgets.map((b) => b.category).join(', ')}</span>.
          </div>
        </div>
      )}

      {/* QUICK FLOATING INPUT OVERVIEW TRIGGER */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={onOpenQuickAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-4.5 flex flex-col justify-between items-start text-left shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute right-3 top-3 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shrink-0">
            <Plus size={16} className="stroke-[2.5]" />
          </div>
          <span className="text-xs text-slate-400 block mb-4 uppercase tracking-widest font-semibold">CEPAT</span>
          <div>
            <h3 className="text-base font-semibold font-display">Slicing Catat</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">Input dalam 3-5 detik saja</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('shortcuts')}
          className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between items-start text-left shadow-sm transition cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute right-3 top-3 w-8 h-8 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 group-hover:scale-110 transition shrink-0">
            <Smartphone size={14} className="stroke-[2.5]" />
          </div>
          <span className="text-xs text-slate-400 block mb-4 uppercase tracking-widest font-semibold">APPLE iOS</span>
          <div>
            <h3 className="text-base font-semibold font-display">iOS Shortcut</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">Satu klik kirim dari HP</p>
          </div>
        </button>
      </div>

      {/* PRIMARY GOAL SNAP BENTO CARD */}
      {goals.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                <PiggyBank size={16} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Target Keuangan Utama</h3>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-sky-500 flex items-center gap-0.5 hover:underline"
            >
              Urus Goals <ArrowRight size={12} />
            </button>
          </div>

          {/* Primary target tracker display */}
          {(() => {
            const primaryGoal = goals[0];
            const percentage = Math.min(Math.round((primaryGoal.current / primaryGoal.target) * 100), 100);
            return (
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-800 font-display">{primaryGoal.name}</span>
                  <span className="text-xs text-slate-500">
                    {formatRupiah(primaryGoal.current)} dari {formatRupiah(primaryGoal.target)}
                  </span>
                </div>

                <div className="relative pt-1">
                  <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-medium">
                  <span>Persentase: {percentage}%</span>
                  <span>Target: {primaryGoal.targetDate || 'Tenggat Bebas'}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* RECENT TRANSACTIONS CONTAINER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg uppercase tracking-tight text-slate-900">Recent Slices</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-black text-[#38BDF8] flex items-center gap-0.5 hover:underline cursor-pointer uppercase tracking-wider"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
            <Compass size={28} className="text-slate-350 stroke-[1.5]" />
            <span>Belum ada transaksi. Tambahkan pemasukan atau pengeluaran pertama Anda!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-105">
            {recentTransactions.map((tx) => {
              const getCatTheme = () => {
                if (tx.type === 'income') return 'bg-emerald-100 text-emerald-600';
                const cat = tx.category.toLowerCase();
                if (cat.includes('food') || cat.includes('makan') || cat.includes('kopi') || cat.includes('coffee') || cat.includes('cafe')) {
                  return 'bg-orange-100 text-orange-600';
                }
                if (cat.includes('bill') || cat.includes('tagihan') || cat.includes('listrik') || cat.includes('internet')) {
                  return 'bg-blue-100 text-blue-600';
                }
                if (cat.includes('trans') || cat.includes('mobil') || cat.includes('motor') || cat.includes('ojek')) {
                  return 'bg-purple-100 text-purple-600';
                }
                return 'bg-slate-100 text-slate-600';
              };

              return (
                <div key={tx.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black italic text-base shrink-0 select-none ${getCatTheme()}`}
                    >
                      {tx.category.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold block text-sm text-slate-850 truncate">
                        {tx.note || tx.category}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium uppercase tracking-wider">
                        {tx.category} • {tx.date}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black font-display text-sm ${
                        tx.type === 'income' ? 'text-[#22C55E]' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXTRA DECAL: FOOTER SLOGAN */}
      <div className="text-center text-[10px] text-slate-400 font-mono tracking-wider font-semibold">
        SLICED MONEY TRACKER • TRACK SECONDS
      </div>
    </div>
  );
};
