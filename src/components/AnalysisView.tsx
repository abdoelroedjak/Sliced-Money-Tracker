import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Brain,
  AlertCircle,
  TrendingDown,
  Percent,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AnalysisView: React.FC = () => {
  const { transactions, budgets, goals } = useApp();

  const [aiOpinion, setAiOpinion] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Financial Formatter
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // CALCULATIONS
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  // Spending by Category allocations
  const spendingByCategory = useMemo(() => {
    const catMap: { [key: string]: number } = {};
    let totalExpense = 0;

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      });

    return Object.keys(catMap)
      .map(name => ({
        name,
        amount: catMap[name],
        percentage: totalExpense > 0 ? Math.round((catMap[name] / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Monthly breakdown trend calculations (Last 5 active days for sparkline polyline drawing)
  const trendData = useMemo(() => {
    const dailyMap: { [key: string]: { income: number; expense: number } } = {};
    
    // Aggregate last 10 transactions dates
    transactions.slice(0, 15).forEach(t => {
      if (!dailyMap[t.date]) {
        dailyMap[t.date] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyMap[t.date].income += t.amount;
      } else {
        dailyMap[t.date].expense += t.amount;
      }
    });

    const sortedDates = Object.keys(dailyMap).sort();
    return sortedDates.map(date => ({
      date,
      ...dailyMap[date]
    }));
  }, [transactions]);

  // CALL GEMINI AI SERVICE ON SERVER
  const getAiSpendingAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, budgets, goals })
      });
      const data = await res.json();
      if (data.analysis) {
        setAiOpinion(data.analysis);
      } else if (data.error) {
        setAiOpinion(`### ⚠️ Gagal Menganalisis\n${data.error}`);
      }
    } catch (e: any) {
      setAiOpinion(`### ⚠️ Gagal melakukan audit\nTerjadi hambatan koneksi jaringan: ${e.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  // Simple High-Fidelity Markdown Parser for UI representation
  const renderParsedMarkdown = (md: string) => {
    if (!md) return null;
    
    const lines = md.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={index} className="text-base font-bold text-slate-900 mt-4 mb-2 font-display">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-900 mt-5 mb-2 font-display border-b border-slate-100 pb-1">
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      
      // Bullet Items
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = trimmed.replace(/^[\*\-]\s*/, '');
        // Highlight bold **text**
        const cleanContent = content.split('**').map((tok, i) => {
          if (i % 2 === 1) return <strong key={i} className="text-slate-950 font-bold">{tok}</strong>;
          return tok;
        });
        return (
          <li key={index} className="text-xs text-slate-600 list-disc ml-4 my-1.5 leading-relaxed">
            {cleanContent}
          </li>
        );
      }

      // Normal paragraphs
      if (trimmed.length > 0) {
        const cleanContent = trimmed.split('**').map((tok, i) => {
          if (i % 2 === 1) return <strong key={i} className="text-slate-950 font-semibold">{tok}</strong>;
          return tok;
        });
        return <p key={index} className="text-xs text-slate-600 hover:text-slate-800 transition leading-relaxed my-2">{cleanContent}</p>;
      }

      return <div key={index} className="h-1.5" />;
    });
  };

  // Generating coordinates for sparkline polylines
  const sparklinePoints = useMemo(() => {
    if (trendData.length < 2) return '';
    const width = 360;
    const height = 100;
    const padding = 10;
    
    const maxVal = Math.max(...trendData.map(d => Math.max(d.income, d.expense)), 10000);
    const xStep = (width - padding * 2) / (trendData.length - 1);
    
    return trendData.map((d, index) => {
      const x = padding + index * xStep;
      // Invert Y axes for standard graph coordinates
      const y = height - padding - ((d.expense / maxVal) * (height - padding * 2));
      return `${x},${y}`;
    }).join(' ');
  }, [trendData]);

  return (
    <div className="space-y-6 pb-24">
      {/* SECTION INCOME VS EXPENSE COMPARISON */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">ALOKASI KAS (INCOME VS EXPENSE)</h3>
        </div>

        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span className="text-emerald-500">Pemasukan ({totals.income > 0 ? Math.round((totals.income / (totals.income + totals.expense || 1)) * 100) : 0}%)</span>
          <span className="text-[#0F172A] font-extrabold font-display">Pengeluaran ({totals.expense > 0 ? Math.round((totals.expense / (totals.income + totals.expense || 1)) * 100) : 0}%)</span>
        </div>

        {/* Compound horizontal bento bar */}
        <div className="w-full bg-slate-105 h-5 rounded-full overflow-hidden flex shadow-inner">
          {totals.income > 0 || totals.expense > 0 ? (
            <>
              <div
                style={{ width: `${(totals.income / (totals.income + totals.expense || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${(totals.expense / (totals.income + totals.expense || 1)) * 100}%` }}
                className="bg-slate-900 h-full transition-all duration-300"
              />
            </>
          ) : (
            <div className="bg-slate-205 w-full h-full" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center py-2 bg-slate-50 rounded-2xl">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">TOTAL MASUK</span>
            <span className="text-sm font-bold text-emerald-500 font-display mt-1 block">
              {formatRupiah(totals.income)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">TOTAL KELUAR</span>
            <span className="text-sm font-bold text-slate-900 font-display mt-1 block">
              {formatRupiah(totals.expense)}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED CATEGORIES BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">DISTRIBUSI BEBAN KATEGORI</h3>
        </div>

        {spendingByCategory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
            <Compass size={24} className="text-slate-350" />
            <span>Belum ada beban pengeluaran tercatat untuk distribusi data.</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {spendingByCategory.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-slate-700">{item.name}</span>
                  <div className="space-x-1.5">
                    <span className="text-slate-900 font-display">{formatRupiah(item.amount)}</span>
                    <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="bg-slate-900 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERACTIVE TREND GRAPH CHART */}
      {trendData.length >= 2 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 pb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">TREN FLUKTUASI HARIAN</h3>
          </div>
          <div className="relative pt-2">
            {/* Draw sparkline using SVG and Tailwind */}
            <svg viewBox="0 0 360 100" className="w-full h-24 stroke-sky-500 fill-none overflow-visible">
              <polyline
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
              {/* Highlight Nodes */}
              {trendData.map((d, index) => {
                const width = 360;
                const height = 100;
                const padding = 10;
                const maxVal = Math.max(...trendData.map(val => Math.max(val.income, val.expense)), 10000);
                const xStep = (width - padding * 2) / (trendData.length - 1);
                const x = padding + index * xStep;
                const y = height - padding - ((d.expense / maxVal) * (height - padding * 2));
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-sky-500 stroke-white stroke-2"
                  />
                );
              })}
            </svg>
            
            {/* Legend dates */}
            <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold mt-2">
              <span>{trendData[0].date}</span>
              <span>Tren Pengeluaran</span>
              <span>{trendData[trendData.length - 1].date}</span>
            </div>
          </div>
        </div>
      )}

      {/* PRE-COMMITTED SLICED AI FINANCIAL ANALYST */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Spark decoration */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-2.5 mb-4 relative z-10">
          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <Brain size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display">Sliced AI Spend Analyst</h3>
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Kecerdasan Buatan Aktif</span>
          </div>
        </div>

        {aiOpinion ? (
          <div className="p-4 bg-slate-900/80 border border-slate-800/60 rounded-2xl relative z-10 max-h-[300px] overflow-y-auto">
            {renderParsedMarkdown(aiOpinion)}
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed mb-5 relative z-10">
            Minta Sliced AI untuk mengaudit rincian belanja, efisiensi anggaran bulanan Anda, dan peluang mempercepat target pencapaian tabungan Anda.
          </p>
        )}

        <button
          onClick={getAiSpendingAnalysis}
          disabled={loadingAi}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/15 cursor-pointer disabled:opacity-50"
        >
          {loadingAi ? (
            <span className="border-2 border-white/30 border-t-white w-4 h-4 rounded-full animate-spin"></span>
          ) : (
            <>
              <Sparkles size={14} className="stroke-[2.5]" />
              <span>{aiOpinion ? 'Ulangi Analisis Sliced AI' : 'Mulai Analisis AI Sekarang'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
