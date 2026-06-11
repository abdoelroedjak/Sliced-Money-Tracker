import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, Plus, Tag, AlignLeft, Percent } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, customCategories, addCustomCategory } = useApp();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-set first category on type change
  useEffect(() => {
    const list = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
    const customs = customCategories.filter(c => c.type === type);
    if (customs.length > 0) {
      setCategory(customs[0].name);
    } else if (list.length > 0) {
      setCategory(list[0].name);
    }
  }, [type, customCategories, isOpen]);

  if (!isOpen) return null;

  // Amount Presets for rapid tapping (Rp in Thousands)
  const presets = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleAddPreset = (value: number) => {
    const current = Number(amountStr) || 0;
    setAmountStr(String(current + value));
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCustomCategory(newCatName.trim(), type);
      setCategory(newCatName.trim());
      setNewCatName('');
      setShowAddCat(false);
    } catch (err) {
      console.error('Failed to create custom category:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amountStr);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Silakan masukkan jumlah nominal transaksi!');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: parsedAmount,
        type,
        category,
        note: note.trim(),
        date
      });
      // Reset
      setAmountStr('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine defaults and custom categories
  const categoriesList = [
    ...(type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES).map(c => c.name),
    ...customCategories.filter(c => c.type === type).map(c => c.name)
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal content sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative bg-white w-full max-w-lg rounded-t-[30px] sm:rounded-[26px] p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
        >
          {/* Draggable indicator indicator */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

          {/* Close trigger & Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-800 font-display">Catat Sliced Money</h3>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 flex-1">
            {/* TYPE TOGGLE (INCOME vs EXPENSE) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl relative">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-xl font-medium text-sm transition-all relative z-10 cursor-pointer ${
                  type === 'expense' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-xl font-medium text-sm transition-all relative z-10 cursor-pointer ${
                  type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* AMOUNT INPUT CARD */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 relative">
              <span className="text-xs font-semibold text-slate-400">NOMINAL SALDO</span>
              <div className="flex items-center gap-1.5 relative">
                <span className="text-xl font-semibold text-slate-500">Rp</span>
                <input
                  type="number"
                  pattern="\d*"
                  required
                  autoFocus
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-transparent border-none text-2xl font-bold font-display text-slate-900 focus:outline-none placeholder-slate-300"
                />
              </div>

              {/* Instant Preset Buttons Grid */}
              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-100/60 font-mono text-xs">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddPreset(val)}
                    className="py-1.5 bg-white border border-slate-150 rounded-xl hover:bg-slate-100 transition font-medium text-slate-600 shadow-sm cursor-pointer"
                  >
                    +{val >= 100000 ? `${val / 1000}k` : `${val / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* CATEGORY GRID LIST */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-400">KATEGORI</span>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-xs text-emerald-500 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={14} /> + Kategori Baru
                </button>
              </div>

              {/* Inline category input form */}
              {showAddCat && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex gap-2 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Nama kategori..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-slate-450"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    className="px-4 py-1.5 bg-slate-950 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              )}

              {/* Scrollable Categories Map */}
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                {categoriesList.map((catName) => {
                  const isSelected = category === catName;
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setCategory(catName)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? type === 'expense'
                            ? 'bg-slate-900 border border-slate-900 text-white shadow-sm'
                            : 'bg-emerald-500 border border-emerald-500 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Tag size={12} className={isSelected ? 'stroke-[2.5]' : ''} />
                      <span>{catName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DATE AND NOTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Date selection */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 px-1">TANGGAL</span>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar size={15} />
                  </span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full ios-input pl-10 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Notes selection */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 px-1">CATATAN (OPSIONAL)</span>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <AlignLeft size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Beli Americano kopi..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full ios-input pl-10 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ios-btn-primary flex items-center justify-center py-3.5 gap-2 mt-4 text-base cursor-pointer shadow-lg ${
                type === 'expense' ? 'shadow-slate-950/20' : 'bg-emerald-500 active:bg-emerald-600 shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <span className="border-2 border-white/30 border-t-white w-5 h-5 rounded-full animate-spin"></span>
              ) : (
                <span>Simpan Transaksi</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
