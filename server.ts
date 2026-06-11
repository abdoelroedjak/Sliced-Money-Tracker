import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashes if key is initially absent
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not provided in environment secrets.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Buffer file to store Apple Shortcut transactions temporarily before the client fetches them.
// This design ensures absolute reliability and zero setup friction for the user.
const DATA_DIR = path.join(process.cwd(), 'data');
const SHORTCUTS_FILE = path.join(DATA_DIR, 'shortcuts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure shortcuts file exists
if (!fs.existsSync(SHORTCUTS_FILE)) {
  fs.writeFileSync(SHORTCUTS_FILE, JSON.stringify({}), 'utf-8');
}

// Get buffer transactions helper
function getShortcutData() {
  try {
    const raw = fs.readFileSync(SHORTCUTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Save buffer transactions helper
function saveShortcutData(data: any) {
  try {
    fs.writeFileSync(SHORTCUTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save shortcut transactions buffer:', err);
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * FEATURE READY: REST API Endpoint for server-side Gemini AI Spending Analysis
 * POST /api/ai-analyze
 */
app.post('/api/ai-analyze', async (req, res) => {
  try {
    const { transactions = [], budgets = [], goals = [] } = req.body;

    // Guard representing missing API keys
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        analysis: "### 💡 Tips Keuangan Sliced AI\n" +
                  "* **Hubungkan API Key**: Hubungkan kunci rahasia `GEMINI_API_KEY` Anda melalui panel Secrets AI Studio untuk mengaktifkan kecerdasan buatan sesungguhnya!\n" +
                  "* **Saran Awal**: Berdasarkan data transaksi Anda, utamakan penghematan biaya pada kategori kofian & jajan harian untuk meningkatkan rasio tabungan bulan ini!\n" +
                  "* **Target MacBook**: Rasio menabung Anda berada di jalur aman. Tetap konsisten menyisihkan sisa uang bulanan Anda."
      });
    }

    const ai = getGeminiClient();
    
    // Construct rich analysis prompt
    const prompt = `Anda adalah Sliced Money Analyst, asisten keuangan pribadi digital yang sangat cerdas, ramah, logis, dan to-the-point khas aplikasi fintech papan atas.
Berikut adalah data finansial pengguna hari ini:
- Transaksi Terbaru Kami: ${JSON.stringify(transactions.slice(0, 15))}
- Batas Anggaran Bulanan (Budget): ${JSON.stringify(budgets)}
- Target Keuangan (Goals): ${JSON.stringify(goals)}

Berikan analisis keuangan yang ringkas, kritis, dan taktis dalam bahasa Indonesia (Maksimum 3-4 poin bullet pendek saja).
Fokus pada:
1. Temuan janggal atau pemborosan terbesar (misalnya jajan kopi berlebih, pengeluaran impulsif).
2. Peringatan anggaran (apakah mendekati atau melampaui budget).
3. Langkah praktis untuk mengoptimalkan "Savings Rate" demi mencapai goals mereka dengan cepat.

Format output Anda menggunakan Markdown yang indah, rapi, dan bersih dengan bahasa yang mudah dipahami anak muda, freelancer, dan pekerja kantoran. Gunakan emoji minimal yang relevan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text || "Tidak ada analisis yang dihasilkan." });
  } catch (error: any) {
    console.error("Gemini AI Analysis failed:", error);
    res.status(500).json({ error: "Gagal memproses data dengan kecerdasan buatan: " + error.message });
  }
});

/**
 * VERY IMPORTANT Requirement: Apple Shortcut Integration Endpoint
 * POST /api/transaction
 * Supports a token (via query / header) to group transactions per user.
 * Token can be anything (e.g. user ID or alias), default is 'demo-user'.
 */
app.post('/api/transaction', (req, res) => {
  const { amount, type, category, note, date } = req.body;
  
  // Custom API Authentication token (supports standard headers or query matching Shortcuts client)
  let token = 'demo-user';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!amount || isNaN(Number(amount))) {
    return res.status(400).json({ error: 'Amount is required and must be a valid number.' });
  }

  if (!type || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense".' });
  }

  const transactionItem = {
    id: 'shortcut_' + Math.random().toString(36).substring(2, 11),
    amount: Number(amount),
    type,
    category: category || 'Other',
    note: note || '',
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  const shortcuts = getShortcutData();
  if (!shortcuts[token]) {
    shortcuts[token] = [];
  }
  shortcuts[token].push(transactionItem);
  saveShortcutData(shortcuts);

  console.log(`[iOS Shortcut] Received transaction for token [${token}]:`, transactionItem);

  res.status(201).json({
    success: true,
    message: 'Transaction received and buffered successfully.',
    transaction: transactionItem
  });
});

/**
 * Fetch buffered Apple Shortcut transactions for a user
 * GET /api/shortcuts?token=xyz
 */
app.get('/api/shortcuts', (req, res) => {
  const token = String(req.query.token || 'demo-user').trim();
  const shortcuts = getShortcutData();
  const userTransactions = shortcuts[token] || [];
  res.json({ transactions: userTransactions });
});

/**
 * Clear buffered Apple Shortcut transactions after client sync
 * DELETE /api/shortcuts?token=xyz
 */
app.delete('/api/shortcuts', (req, res) => {
  const token = String(req.query.token || 'demo-user').trim();
  const shortcuts = getShortcutData();
  if (shortcuts[token]) {
    delete shortcuts[token];
    saveShortcutData(shortcuts);
  }
  res.json({ success: true, message: `Buffered transactions cleared for token [${token}].` });
});

// Configure Vite middleware / Static client folder
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sliced Money Tracker server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
