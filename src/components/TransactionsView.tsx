import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, SortAsc, ArrowDownLeft, ArrowUpRight, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import { Transaction } from '../types';

export const TransactionsView: React.FC = () => {
  const { transactions, deleteTransaction } = useApp();

  const [dateGroup, setDateGroup] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Format Helper
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Extract all categories in transactions dynamically for filtering
  const dynamicCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [transactions]);

  // DATE HELPERS
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isThisWeek = (dateStr: string) => {
    const txDate = new Date(dateStr);
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1050);
    return txDate >= oneWeekAgo && txDate <= today;
  };

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const [year, month] = dateStr.split('-');
    return Number(year) === today.getFullYear() && Number(month) === (today.getMonth() + 1);
  };

  // FILTERED & SORTED TRANSACTIONS
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by Date Group
    if (dateGroup === 'today') {
      result = result.filter(t => isToday(t.date));
    } else if (dateGroup === 'week') {
      result = result.filter(t => isThisWeek(t.date));
    } else if (dateGroup === 'month') {
      result = result.filter(t => isThisMonth(t.date));
    }

    // Filter by Search Match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) || 
        t.category.toLowerCase().includes(q)
      );
    }

    // Filter by Type
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Filter by Category
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Sort Records
    if (sortOption === 'newest') {
      result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
    } else if (sortOption === 'highest') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortOption === 'lowest') {
      result.sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [transactions, dateGroup, searchQuery, typeFilter, categoryFilter, sortOption]);

  const handleDelete = async (id: string, noteLabel: string) => {
    if (confirm(`Hapus transaksi "${noteLabel}"?`)) {
      try {
        await deleteTransaction(id);
      } catch (e) {
        console.error('Failed to delete transaction:', e);
      }
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* HEADER CONTROLS SHEET */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Riwayat Transaksi</h3>
        </div>

        {/* TIME INTERVAL RE-GROUP TABS */}
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
          {(['all', 'today', 'week', 'month'] as const).map((group) => (
            <button
              key={group}
              onClick={() => setDateGroup(group)}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                dateGroup === group
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {group === 'all' && 'Semua'}
              {group === 'today' && 'Hari Ini'}
              {group === 'week' && 'Minggu Ini'}
              {group === 'month' && 'Bulan Ini'}
            </button>
          ))}
        </div>

        {/* SEARCH BAR CONTAINER */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari jajan kopi, gaji, transport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ios-input pl-11 text-sm py-2.5"
          />
        </div>

        {/* COMPREHENSIVE FILTER / SORT PANEL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* TYPE FILTER DROPDOWN */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase px-1 flex items-center gap-1">
              <Filter size={10} /> JENIS ALIRAN
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-1 focus:ring-slate-350"
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran Only</option>
              <option value="income">Pemasukan Only</option>
            </select>
          </div>

          {/* DYNAMIC CATEGORY FILTER DROPDOWN */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase px-1 flex items-center gap-1">
              <LayoutGrid size={10} /> PILIH KATEGORI
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-1 focus:ring-slate-350"
            >
              <option value="all">Semua Kategori</option>
              {dynamicCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* ADVANCED SORT CONTROLS */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase px-1 flex items-center gap-1">
              <SortAsc size={10} /> URUTKAN DATA
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-1 focus:ring-slate-350"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Nominal Terbesar</option>
              <option value="lowest">Nominal Terkecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS LIST CONTAINER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        {processedTransactions.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
            <Calendar size={32} className="text-slate-350 stroke-[1.5]" />
            <span>Kriteria pencarian atau filter Anda tidak menemukan transaksi.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-155">
            {processedTransactions.map((tx) => {
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
                <div key={tx.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black italic text-base shrink-0 select-none ${getCatTheme()}`}
                    >
                      {tx.category.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold block text-sm text-slate-900 truncate">
                        {tx.note || tx.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-extrabold text-[9px] tracking-wide">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`font-black font-display text-sm ${
                          tx.type === 'income' ? 'text-[#22C55E]' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id, tx.note || tx.category)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
