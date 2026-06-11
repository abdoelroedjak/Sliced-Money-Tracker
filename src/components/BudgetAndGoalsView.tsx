import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_EXPENSE_CATEGORIES } from '../lib/storage';
import {
  TrendingUp,
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const BudgetAndGoalsView: React.FC = () => {
  const {
    transactions,
    budgets,
    saveBudget,
    deleteBudget,
    goals,
    saveGoal,
    deleteGoal,
    customCategories,
  } = useApp();

  // Create Budget Form States
  const [budgetCat, setBudgetCat] = useState('Food');
  const [budgetAmt, setBudgetAmt] = useState('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Create Goal Form States
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Formats Helper
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // EXTRACT DYNAMIC EXPENDITURES PER CATEGORY (FOR PROGRESS INSETS)
  const categorySpentMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  // COMBINE DEFAULT EXPENSE AND CUSTOM EXPENSE FOR DROPDOWNS
  const availableCategoriesForBudget = useMemo(() => {
    const defaults = DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name);
    const customs = customCategories.filter((c) => c.type === 'expense').map((c) => c.name);
    return Array.from(new Set([...defaults, ...customs]));
  }, [customCategories]);

  // Submit Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = Number(budgetAmt);
    if (!parsedAmt || parsedAmt <= 0) {
      alert('Jumlah anggaran harus lebih dari 0.');
      return;
    }

    try {
      await saveBudget(budgetCat, parsedAmt);
      setBudgetAmt('');
      setShowBudgetForm(false);
    } catch (err) {
      console.error('Failed to save category budget limit:', err);
    }
  };

  // Submit Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = Number(goalTarget);
    const parsedCurrent = Number(goalCurrent || '0');

    if (!goalName.trim()) {
      alert('Nama target goals wajib diisi!');
      return;
    }
    if (!parsedTarget || parsedTarget <= 0) {
      alert('Target nominal harus lebih besar dari 0.');
      return;
    }

    try {
      await saveGoal(goalName.trim(), parsedTarget, parsedCurrent, goalDate);
      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalDate('');
      setShowGoalForm(false);
    } catch (err) {
      console.error('Failed to create savings goal target:', err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. SECTION MONTHLY SPENDING BUDGETS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">ANGGARAN KATEGORI BULANAN</h3>
          </div>
          <button
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="px-3 py-1.5 bg-[#0F172A] text-white hover:bg-slate-800 transition rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer uppercase tracking-wider"
          >
            <Plus size={14} /> Atur Anggaran
          </button>
        </div>

        {/* Dynamic Budget Add Input Form */}
        {showBudgetForm && (
          <form onSubmit={handleSaveBudget} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5 animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Input Anggaran Bulanan</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">PILIH KATEGORI</label>
                <select
                  value={budgetCat}
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  {availableCategoriesForBudget.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">BATAS NOMINAL (RP)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1500000"
                  value={budgetAmt}
                  onChange={(e) => setAmountSafeInput(e.target.value, setBudgetAmt)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-805 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowBudgetForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-150 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Simpan Limit
              </button>
            </div>
          </form>
        )}

        {/* Budgets list tracking */}
        {budgets.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Belum ada anggaran kategori ditentukan bulan ini. Atur budget Anda untuk memantau penghematan belanja!
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const spent = categorySpentMap[budget.category] || 0;
              const percentage = Math.round((spent / budget.amount) * 100);
              const exceeded = spent > budget.amount;

              return (
                <div key={budget.category} className="group border-b border-slate-100 last:border-b-0 pb-3 last:pb-0 space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{budget.category}</span>
                      {exceeded && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-extrabold flex items-center gap-0.5 animate-pulse uppercase">
                          <AlertTriangle size={10} /> Lebih Budget
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500">
                        <strong className="text-slate-800 font-display">{formatRupiah(spent)}</strong> /{' '}
                        {formatRupiah(budget.amount)}
                      </span>
                      <button
                        onClick={() => deleteBudget(budget.category)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2.5 flex rounded-full bg-slate-100">
                      <div
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          exceeded ? 'bg-red-500' : percentage >= 85 ? 'bg-amber-400' : 'bg-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
                    <span>Terpakai: {percentage}%</span>
                    <span>Tersisa: {exceeded ? 'Rp 0' : formatRupiah(budget.amount - spent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SECTION FINANCIAL GOALS TARGETS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">TARGET SAVINGS GOALS</h3>
          </div>
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="px-3 py-1.5 bg-[#0F172A] text-white hover:bg-slate-800 transition rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer uppercase tracking-wider"
          >
            <Plus size={14} /> Buat Target Baru
          </button>
        </div>

        {/* Dynamic Add Goal Input Form */}
        {showGoalForm && (
          <form onSubmit={handleSaveGoal} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Input Tabungan Baru</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">NAMA FINANCIAL GOALS</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MacBook Air M4"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">TARGET NOMINAL (RP)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 18000000"
                  value={goalTarget}
                  onChange={(e) => setAmountSafeInput(e.target.value, setGoalTarget)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">SALDO AWAL SAAT INI (RP)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={goalCurrent}
                  onChange={(e) => setAmountSafeInput(e.target.value, setGoalCurrent)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">TENGGAT ESTIMASI (OPSIONAL DATE)</label>
                <input
                  type="date"
                  placeholder="Pilih Tanggal"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-150 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Simpan Target
              </button>
            </div>
          </form>
        )}

        {/* Goals progress cards */}
        {goals.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Belum ada target tabungan dikonfigurasikan saat ini. Impikan goals-mu sekarang!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const remains = Math.max(goal.target - goal.current, 0);
              const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              
              const isGoalAchieved = goal.current >= goal.target;

              return (
                <div key={goal.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 group relative hover:border-slate-350 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none" role="img" aria-label="Target">
                        {isGoalAchieved ? '🏆' : '💻'}
                      </span>
                      <div className="leading-tight">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">TARGET GOAL</span>
                        <span className="font-black text-slate-900 font-display text-base block">{goal.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-500 p-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className="text-slate-800">{formatRupiah(goal.current)}</span>
                      <span className="text-slate-400">{formatRupiah(goal.target)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isGoalAchieved 
                            ? 'bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                            : 'bg-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Estimated parameters */}
                  <div className="p-3 bg-[#F1F5F9] rounded-2xl border-2 border-dashed border-slate-200 space-y-1 text-[11px] text-slate-500 leading-tight">
                    <div className="flex justify-between font-bold">
                      <span>Progres Tabungan</span>
                      <span className="font-black text-slate-900">{percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sisa Kekurangan</span>
                      <span className="font-extrabold text-slate-800">{formatRupiah(remains)}</span>
                    </div>
                    {!isGoalAchieved && remains > 0 && (
                      <div className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-tighter italic mt-1.5 pt-1.5 border-t border-slate-200">
                        * Est: Menabung {formatRupiah(Math.ceil(remains / 10))} / Hari (Simulasi 10 hari)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Sanitizer safety helper to protect amount strings from formatting crash
  function setAmountSafeInput(val: string, setter: (val: string) => void) {
    if (val === '' || /^\d+$/.test(val)) {
      setter(val);
    }
  }
};
