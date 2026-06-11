import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  Copy,
  Check,
  Play,
  Terminal,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ShortcutsView: React.FC = () => {
  const { shortcutToken } = useApp();

  const [copied, setCopied] = useState(false);
  const [methodCopied, setMethodCopied] = useState(false);

  // Simulation parameters for Shortcut REST API
  const [simAmount, setSimAmount] = useState('25000');
  const [simType, setSimType] = useState<'expense' | 'income'>('expense');
  const [simCategory, setSimCategory] = useState('coffee');
  const [simNote, setSimNote] = useState('Americano');
  const [simDate, setSimDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [simResponse, setSimResponse] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const shortcutUrl = `${window.location.origin}/api/transaction?token=${shortcutToken}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePost = async () => {
    setSimulating(true);
    setSimResponse(null);
    try {
      const res = await fetch(`/api/transaction?token=${shortcutToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(simAmount),
          type: simType,
          category: simCategory,
          note: simNote,
          date: simDate
        })
      });
      const data = await res.json();
      setSimResponse(data);
    } catch (e: any) {
      setSimResponse({ error: e.message || 'Koneksi error simulasi.' });
    } finally {
      setSimulating(false);
    }
  };

  const sampleJson = `{
  "amount": ${simAmount || 25000},
  "type": "${simType}",
  "category": "${simCategory}",
  "note": "${simNote}",
  "date": "${simDate}"
}`;

  return (
    <div className="space-y-6 pb-24">
      {/* TOKEN AND ENDPOINT SHEET */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">APPLE SHORTCUTS INTEGRATION (iOS)</h3>
        </div>

        <div className="p-4.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider leading-none">URL ENDPOINT PENGHUBUNG</span>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={shortcutUrl}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-600 outline-none"
              />
              <button
                onClick={() => copyToClipboard(shortcutUrl)}
                className="p-3 bg-slate-950 text-white hover:bg-slate-850 rounded-xl transition shrink-0 cursor-pointer"
                title="Salin Link"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-150/60 pt-3">
            <span>Kredensial Token Anda</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
              {shortcutToken}
            </span>
          </div>
        </div>

        {/* STEP BY STEP GUIDELINES */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase">Integrasi 5 Detik Dengan Pintasan iOS</h4>
          
          <div className="space-y-3.5 text-xs text-slate-600 pl-1">
            <div className="flex gap-2.5">
              <span className="w-5 h-5 bg-slate-900 border border-slate-900 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">1</span>
              <p>Buka aplikasi **Pintasan (Shortcuts)** di iPhone atau iPad Anda.</p>
            </div>

            <div className="flex gap-2.5">
              <span className="w-5 h-5 bg-slate-905 text-slate-900 border border-slate-150 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">2</span>
              <p>Tambahkan Pintasan Baru dengan nama **"Sliced Money"**.</p>
            </div>

            <div className="flex gap-2.5">
              <span className="w-5 h-5 bg-slate-905 text-slate-900 border border-slate-150 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">3</span>
              <p>Gunakan aksi **Isi Konten URL (Get Contents of URL)**, tempel Endpoint alamat di atas, dan rubah metode menjadi **POST**.</p>
            </div>

            <div className="flex gap-2.5">
              <span className="w-5 h-5 bg-slate-905 text-slate-900 border border-slate-150 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">4</span>
              <p>Tambahkan Headers: `Content-Type: application/json` dan atur Request Body dalam parameter model JSON.</p>
            </div>

            <div className="flex gap-2.5">
              <span className="w-5 h-5 bg-slate-905 text-slate-900 border border-slate-150 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">5</span>
              <p>Selesai! Anda tinggal tap shortcut di homescreen atau panggil lewat Siri untuk mencatat instan kapan pun di mana pun!</p>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SHOTCUT API SIMULATOR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">SIMULASI APPLE SHORTCUTS POST CLIENT</h3>
        </div>

        <p className="text-xs text-slate-400">
          Gunakan panel di bawah untuk mensimulasikan pemanggilan REST API dari Apple Pintasan iOS guna membuktikan integritas backend Sliced Money secara lokal!
        </p>

        {/* INPUT SIM GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-400">AMOUNT (NOMINAL)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-400">TYPE (TIPE)</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="expense">expense (Pengeluaran)</option>
              <option value="income">income (Pemasukan)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-400">CATEGORY (KATEGORI)</label>
            <input
              type="text"
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-400">NOTE (CATATAN)</label>
            <input
              type="text"
              value={simNote}
              onChange={(e) => setSimNote(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* CODE BLOCKS DIVISION OVERLAY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {/* JSON PAYLOAD CODE */}
          <div className="space-y-1.5 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">PAYLOAD BODY (JSON)</span>
            <pre className="flex-1 bg-slate-900 text-slate-400 rounded-2xl p-3.5 text-[10px] font-mono whitespace-pre overflow-x-auto border border-slate-800">
              {sampleJson}
            </pre>
          </div>

          {/* SIMULATION RESPONSE JSON */}
          <div className="space-y-1.5 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">SERVER RESPONSE (JSON)</span>
            <pre className="flex-1 bg-slate-900 text-emerald-400 rounded-2xl p-3.5 text-[10px] font-mono whitespace-pre overflow-x-auto min-h-[140px] border border-slate-800">
              {simulating ? 'Menunggu response API server...' : simResponse ? JSON.stringify(simResponse, null, 2) : 'Klik Terbangkan POST untuk memulai simulasi.'}
            </pre>
          </div>
        </div>

        <button
          onClick={handleSimulatePost}
          disabled={simulating}
          className="w-full py-3 bg-slate-950 hover:bg-slate-850 active:bg-slate-900 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Play size={14} className="fill-white" />
          <span>{simulating ? 'Mengirim Data...' : 'Kirim Simulasi POST Payload'}</span>
        </button>
      </div>
    </div>
  );
};
