import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Mail, Lock, User, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle, resetPassword, isFirebaseActive } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!email || !email.includes('@')) {
      setErrorCode('Silakan masukkan alamat email yang valid.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setErrorCode('Password wajib diisi.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorCode('Konfirmasi password tidak cocok.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setErrorCode('Password minimal harus 6 karakter.');
      return;
    }

    setWorking(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password);
        setSuccessMessage('Pendaftaran berhasil! Menyambungkan sesi...');
      } else {
        await resetPassword(email);
        setSuccessMessage('Instruksi pemulihan telah dikirim ke email Anda.');
      }
    } catch (err: any) {
      setErrorCode(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setWorking(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorCode(null);
    setSuccessMessage(null);
    setWorking(true);
    try {
      await loginWithGoogle();
      setSuccessMessage('Berhasil menyambungkan sesi Google...');
    } catch (err: any) {
      console.error(err);
      setErrorCode(err.message || 'Gagal masuk menggunakan akun Google Anda.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background highlights */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse delay-75"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black font-display tracking-tighter italic leading-none text-slate-900">
            SLICED<span className="text-sky-400">.</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-2 leading-none mb-4">
            Money Tracker
          </p>
          <p className="text-slate-400 text-xs italic tracking-widest uppercase font-bold">Track money in seconds.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Form Heading */}
              <h2 className="text-xl font-semibold text-slate-800 mb-6 font-display">
                {mode === 'login' && 'Selamat Datang Kembali'}
                {mode === 'register' && 'Buat Akun Baru'}
                {mode === 'forgot' && 'Lupa Password'}
              </h2>

              {/* Status Banner */}
              {!isFirebaseActive && (
                <div className="mb-4 bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-800">
                  <Info size={16} className="mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Offline Fallback Active</span>
                    Sistem Firebase belum dikonfigurasikan. Kami mengaktifkan mode Local-Persistence instan agar web app tetap bisa dicoba penuh sekarang.
                  </div>
                </div>
              )}

              {/* Feedback Alerts */}
              {errorCode && (
                <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3.5 text-xs flex flex-col gap-2 border border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{errorCode}</span>
                  </div>
                  {isFirebaseActive && (
                    <div className="mt-2 pt-2 border-t border-red-100 text-[11px] text-slate-600 space-y-2 leading-normal">
                      {errorCode.toLowerCase().includes('unauthorized-domain') ? (
                        <div className="bg-amber-50 p-3 rounded-xl text-amber-900 border border-amber-100 space-y-1.5">
                          <p className="font-bold text-xs text-amber-800 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                            Cara Mengatasi Domain Tidak Terdaftar di Firebase:
                          </p>
                          <p className="text-[10.5px] text-amber-850">
                            Firebase melarang login dari domain sebelum didaftarkan demi keamanan. Silakan:
                          </p>
                          <ol className="list-decimal pl-4.5 space-y-1 text-[10.5px] text-slate-700">
                            <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold underline">Firebase Console</a></li>
                            <li>Masuk ke proyek Anda, klik menu <strong>Build &gt; Authentication</strong></li>
                            <li>Pilih tab <strong>Settings</strong> di atas</li>
                            <li>Scroll ke bawah ke bagian <strong>Authorized domains</strong> (Domain resmi)</li>
                            <li>Klik <strong>Add domain</strong> (Tambahkan domain)</li>
                            <li>Masukkan <strong><code>sliced-money-tracker.vercel.app</code></strong> (tanpa https) lalu simpan</li>
                          </ol>
                        </div>
                      ) : (
                        <p>
                          <strong>Tip:</strong> Bila error disebabkan oleh provider <em>Email/Password</em> yang belum diaktifkan di Firebase Console, atau kendala jaringan, Anda dapat melewati ini dengan mode offline lokal.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const rawUsers = localStorage.getItem('sliced_money_local_users');
                            const users = rawUsers ? JSON.parse(rawUsers) : {};
                            
                            const cleanEmail = email.trim() || 'user.offline@gmail.com';
                            const cleanPassword = password || '123456';

                            if (mode === 'register') {
                              if (users[cleanEmail]) {
                                setErrorCode('Email offline ini sudah terdaftar.');
                                return;
                              }
                              users[cleanEmail] = { email: cleanEmail, password: cleanPassword };
                              localStorage.setItem('sliced_money_local_users', JSON.stringify(users));
                            }
                            
                            const fakeUser = {
                              uid: 'local_user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, ''),
                              email: cleanEmail,
                              displayName: cleanEmail.split('@')[0]
                            };
                            localStorage.setItem('sliced_money_local_user', JSON.stringify(fakeUser));
                            window.location.reload();
                          } catch (e: any) {
                            setErrorCode(e.message || 'Gagal beralih ke mode offline.');
                          }
                        }}
                        className="w-full py-2 bg-[#0F172A] text-white font-bold rounded-lg text-center hover:bg-slate-800 transition cursor-pointer text-[10px] uppercase tracking-wider"
                      >
                        Gunakan Akun Lokal (Offline)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 bg-emerald-50 text-emerald-700 rounded-xl p-3 text-xs border border-emerald-100">
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1 px-1">Email</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full ios-input pl-11"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </span>
                  </div>
                </div>

                {/* Password Input */}
                {mode !== 'forgot' && (
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-1 px-1">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full ios-input pl-11"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
                        <Lock size={18} />
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password Input */}
                {mode === 'register' && (
                  <div className="flex flex-col animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-500 mb-1 px-1">Ulangi Password</label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full ios-input pl-11"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </span>
                    </div>
                  </div>
                )}

                {/* Forgot Link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorCode(null); }}
                      className="text-xs text-sky-500 hover:underline font-medium"
                    >
                      Lupa password?
                    </button>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={working}
                  className="w-full ios-btn-primary flex items-center justify-center py-3.5 gap-2 mt-2 shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {working ? (
                    <span className="border-2 border-white/30 border-t-white w-5 h-5 rounded-full animate-spin"></span>
                  ) : (
                    <span>
                      {mode === 'login' && 'Masuk Sekarang'}
                      {mode === 'register' && 'Daftar Akun'}
                      {mode === 'forgot' && 'Kirim Link Reset'}
                    </span>
                  )}
                </button>

                {/* Divider "atau" */}
                {mode !== 'forgot' && (
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-wider">atau</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>
                )}

                {/* Google Sign In option */}
                {mode !== 'forgot' && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={working}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer shadow-sm hover:shadow active:scale-[0.98] uppercase tracking-wider"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{mode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
                  </button>
                )}
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Bottom toggle controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center text-center">
            {mode === 'login' && (
              <p className="text-xs text-slate-500">
                Belum punya akun?{' '}
                <button
                  onClick={() => { setMode('register'); setErrorCode(null); }}
                  className="font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  Daftar gratis
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-xs text-slate-500">
                Sudah punya akun?{' '}
                <button
                  onClick={() => { setMode('login'); setErrorCode(null); }}
                  className="font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  Login di sini
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setErrorCode(null); }}
                className="text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
              >
                Kembali ke halaman login
              </button>
            )}
          </div>
        </div>

        {/* Integration Instructions Alert */}
        {!isFirebaseActive && mode === 'register' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[11px] flex gap-2">
            <Info size={14} className="shrink-0 text-blue-500" />
            <span>
              <strong>Tip:</strong> Dalam mode Local-Persistence, pendaftaran Anda disimpan langsung di browser komputer ini untuk simulasi cepat tanpa menunggu database internet.
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
