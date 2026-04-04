import { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, List, RotateCcw, Activity, Loader2, Volume2, VolumeX, LogOut } from 'lucide-react';
import ChatInput from './components/ChatInput';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';

function App() {
  const [dataPayload, setDataPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  
  // Power BI features state
  const [viewMode, setViewMode] = useState('stack'); 
  const [queryHistory, setQueryHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('tab1');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  const speakInsights = (text) => {
    if (isVoiceMuted) return;
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel(); // Stop any current speech
      
      // Clean up markdown characters so it reads naturally
      const cleanText = text.replace(/[*#]/g, '').replace(/_/g, ' ');
      
      const msg = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = voices.filter(v => 
          v.name.includes('Microsoft Mark') || 
          v.name.includes('Zira') || 
          v.name.includes('David') ||
          v.name.includes('Google') ||
          v.lang.includes('en-')
      );
      if (preferredVoices.length > 0) {
          msg.voice = preferredVoices[0];
      }
      msg.rate = 1.05;
      
      window.speechSynthesis.speak(msg);
    }
  };

  const executeQuery = async (queryText) => {
    if (!queryText.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setDataPayload(null);
    
    try {
      const response = await axios.post('http://localhost:8000/chat', { query: queryText });
      const currentData = response.data;
      
      // Push string into history only if success
      setQueryHistory((prev) => {
        // Prevent duplicate consecutive entries
        if (prev.length > 0 && prev[0].text === queryText) return prev;
        return [{ id: Date.now(), text: queryText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 8);
      });
      
      setDataPayload(currentData);
      
      if (currentData.insights) {
          speakInsights(currentData.insights);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-indigo-500/30 p-4 lg:p-6 gap-4 lg:gap-6 relative">
        
       {/* Ambient Glowing Background Orbs (Optimized with Radial Gradients instead of heavy CSS blurs) */}
       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" style={{backgroundSize: '120px'}}></div>
       <div className="fixed -top-32 -left-32 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15)_0%,_transparent_70%)] pointer-events-none z-0"></div>
       <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_rgba(8,145,178,0.1)_0%,_transparent_70%)] pointer-events-none z-0"></div>
       <div className="fixed inset-0 bg-gradient-to-b from-transparent to-[#020617]/90 pointer-events-none z-0"></div>

      {/* Left Sidebar - Floating Glass Panel (Optimized blur) */}
      <div className="w-[320px] lg:w-[340px] bg-[#0F172A]/95 border border-white/10 rounded-[2rem] p-6 flex flex-col z-10 shadow-lg">
        <div className="mb-8 mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-cyan-300 tracking-tighter flex items-center gap-3">
                Talking BI <Activity size={28} className="text-cyan-400" />
              </h1>
              <p className="text-[10px] text-indigo-400/80 mt-2 uppercase tracking-[0.3em] font-bold">WELCOME BACK</p>
            </div>
        </div>

        {/* Query Time Machine Sidebar Component */}
        <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2 flex flex-col gap-4">
          
          {/* Active Status Display */}
          {(error || isLoading) && (
              <div className={`p-4 rounded-2xl border ${error ? 'bg-red-950/40 border-red-900/50' : 'bg-indigo-950/40 border-indigo-900/30'} transition-all`}>
                  {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                  {isLoading && (
                    <div className="flex flex-col items-center py-4">
                        <Loader2 className="animate-spin text-indigo-500 mb-3" size={28} />
                        <p className="text-indigo-300 text-sm font-medium animate-pulse">Running advanced heuristics...</p>
                    </div>
                  )}
              </div>
          )}

          {/* Prompt History List */}
          <div className="mt-4">
             <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 flex items-center gap-2">
                 <RotateCcw size={14}/> RECENTS
             </h3>
             {queryHistory.length === 0 ? (
                 <div className="p-5 border border-dashed border-slate-800 rounded-2xl text-center text-slate-600">
                    <p className="text-xs">No recent queries.</p>
                 </div>
             ) : (
                 <div className="flex flex-col gap-2">
                    {queryHistory.map((historyItem) => (
                        <button 
                            key={historyItem.id}
                            onClick={() => executeQuery(historyItem.text)}
                            disabled={isLoading}
                            className="text-left p-3 rounded-xl bg-slate-800/40 border border-transparent hover:border-slate-600/50 hover:bg-slate-800 transition-all group flex flex-col gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <span className="text-xs text-slate-300 group-hover:text-indigo-300 line-clamp-2 leading-relaxed">"{historyItem.text}"</span>
                            <span className="text-[10px] text-slate-600 font-mono">{historyItem.time}</span>
                        </button>
                    ))}
                 </div>
             )}
          </div>
        </div>

        {/* Dynamic Voice Module */}
        <ChatInput 
          onSend={executeQuery} 
          isSending={isLoading} 
        />
      </div>

      {/* Right Area - Canvas Wrapper */}
      <div className="flex-1 flex flex-col relative overflow-hidden z-10 rounded-[2rem] bg-[#020617]/95 border border-white/10 shadow-lg">
        
        {/* Modern Top Navigation Action Bar */}
        <header className="relative z-20 h-24 border-b border-white/5 bg-transparent px-8 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-400/70 uppercase">Uplink / <span className="text-white">Core Matrix</span></span>
                <button 
                  onClick={() => {
                      if (!isVoiceMuted && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                      }
                      setIsVoiceMuted(!isVoiceMuted);
                  }}
                  className={`p-2 rounded-full border transition-all flex items-center justify-center ${isVoiceMuted ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30'}`}
                  title={isVoiceMuted ? "Unmute Voice" : "Mute Voice"}
                >
                  {isVoiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <div className="w-px h-4 bg-white/20 mx-1"></div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className={`p-2 rounded-full border bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-red-900/40 hover:text-red-400 hover:border-red-800/50 transition-all flex items-center justify-center`}
                  title="Sever Connection (Log Out)"
                >
                  <LogOut size={14} />
                </button>
             </div>
             
             {/* Navigation Tabs - Floating HUD selector */}
             <div className="flex items-center bg-black/60 p-1.5 rounded-full border border-white/10 gap-2 mx-4 flex-1 justify-center max-w-lg shadow-md">
                 {['tab1', 'tab2', 'tab3'].map(tab => (
                     <button
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 flex-1 ${activeTab === tab ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                     >
                         {tab === 'tab1' ? 'INSIGHT 1' : tab === 'tab2' ? 'INSIGHT 2' : 'INSIGHT 3'}
                     </button>
                 ))}
             </div>

             {/* Layout View Toggle */}
             <div className="flex items-center bg-black/60 p-1.5 rounded-full border border-white/10 shadow-inner">
                 <button 
                     onClick={() => setViewMode('stack')} 
                     className={`p-2.5 rounded-full flex items-center gap-2 transition-all ${viewMode === 'stack' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                     title="Sequential View"
                 >
                     <List size={16} strokeWidth={3}/>
                 </button>
                 <button 
                     onClick={() => setViewMode('grid')} 
                     className={`p-2.5 rounded-full flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                     title="Power BI Grid View"
                 >
                     <LayoutGrid size={16} strokeWidth={3}/>
                 </button>
             </div>
        </header>

        {/* Dashboard Canvas Container */}
        <main className="flex-1 overflow-y-auto px-8 py-8 relative z-10 custom-scrollbar">
          {dataPayload && !isLoading ? (
            <Dashboard payload={dataPayload} viewMode={viewMode} activeTab={activeTab} />
          ) : (
            // Empty State Dashboard Greeting
            <div className="h-full flex flex-col items-center justify-center text-center opacity-80 animate-in fade-in duration-700">
               <div className="relative mb-8">
                   <div className="absolute inset-0 bg-indigo-500/10 rounded-full opacity-50"></div>
                   <Activity size={80} className="text-indigo-400/50 relative z-10" strokeWidth={1}/>
               </div>
               <h2 className="text-3xl font-light tracking-tight text-slate-300 mb-4">Awaiting Data Context</h2>
               <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                   Interact with the conversational assistant on the left to extract metrics, draw visual correlations, and generate complex views instantly.
               </p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

export default App;
