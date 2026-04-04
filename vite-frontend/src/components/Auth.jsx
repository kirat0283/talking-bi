import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registration successful! Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Navigation handled automatically by session state listener in App.jsx
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#020617] text-slate-50 relative overflow-hidden font-sans selection:bg-indigo-500/30">
        
       {/* Ambient Glowing Background Orbs */}
       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" style={{backgroundSize: '120px'}}></div>
       <div className="fixed -top-32 -left-32 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15)_0%,_transparent_70%)] pointer-events-none z-0"></div>
       <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_rgba(8,145,178,0.1)_0%,_transparent_70%)] pointer-events-none z-0"></div>
       
       <div className="w-[460px] md:w-[520px] bg-[#0F172A]/80 backdrop-blur-2xl border border-indigo-500/30 rounded-[2.5rem] p-12 flex flex-col z-10 shadow-[0_0_60px_rgba(79,70,229,0.15)] relative overflow-hidden group">
          
          <div className="absolute inset-2 border-[2px] border-white/5 rounded-[2rem] pointer-events-none z-0"></div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.25)_0%,_transparent_70%)] pointer-events-none rounded-tr-[2.5rem] transition-transform duration-1000 group-hover:scale-125"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.15)_0%,_transparent_70%)] pointer-events-none rounded-bl-[2.5rem] transition-transform duration-1000 group-hover:scale-125"></div>
          
          <div className="mb-12 text-center relative z-10">
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-cyan-200 to-cyan-400 tracking-tighter flex items-center justify-center gap-3 drop-shadow-lg">
                Talking BI <Activity size={36} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </h1>
              <p className="text-xs text-indigo-400 mt-4 uppercase tracking-[0.4em] font-black drop-shadow-sm flex items-center justify-center gap-2">
                 <span className="w-4 h-[1px] bg-indigo-500/50"></span>
                 WELCOME
                 <span className="w-4 h-[1px] bg-indigo-500/50"></span>
              </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-6 relative z-10">
              
              {message && <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center rounded-xl font-mono">{message}</div>}
              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center rounded-xl font-mono">{error}</div>}
              
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail size={18} className="text-indigo-500 group-focus-within:text-cyan-400 transition-colors drop-shadow-sm" />
                  </div>
                  <input
                    type="email"
                    placeholder="IDENTIFIER (EMAIL)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-indigo-900/50 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-mono tracking-[0.15em] text-cyan-50 placeholder-indigo-900/80 focus:outline-none focus:border-cyan-400/60 focus:bg-black/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
                  />
              </div>

              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock size={18} className="text-indigo-500 group-focus-within:text-cyan-400 transition-colors drop-shadow-sm" />
                  </div>
                  <input
                    type="password"
                    placeholder="PASSPHRASE"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-indigo-900/50 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-mono tracking-[0.15em] text-cyan-50 placeholder-indigo-900/80 focus:outline-none focus:border-cyan-400/60 focus:bg-black/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
                  />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-indigo-600/20 border border-indigo-500/60 hover:bg-indigo-500/40 text-indigo-200 py-5 rounded-[1.5rem] text-xs font-black tracking-[0.25em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] border-t-indigo-400/80 disabled:opacity-50"
              >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : (
                      <>
                        {isSignUp ? 'SIGN UP' : 'LOG IN'} <ArrowRight size={18} strokeWidth={3}/>
                      </>
                  )}
              </button>
          </form>

          <div className="mt-10 text-center relative z-10 w-full flex flex-col items-center gap-4">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                className="text-[11px] uppercase font-bold tracking-[0.2em] text-slate-400 hover:text-cyan-300 transition-colors bg-white/5 py-2 px-6 rounded-full border border-white/10 hover:border-cyan-500/30 w-max"
                type="button"
              >
                {isSignUp ? 'CANCEL SIGN UP / LOG IN' : 'NOT A MEMBER? / SIGN UP'}
              </button>
          </div>
       </div>
    </div>
  );
}
