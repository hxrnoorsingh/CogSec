
import React, { useState, useMemo } from 'react';
import { 
  Brain, ShieldAlert, RefreshCcw, Layout, 
  GraduationCap, Microscope, Fingerprint, Eye, Search, 
  Terminal, CheckCircle2, AlertTriangle,
  ExternalLink, SlidersHorizontal, X, Info,
  Cpu, Scan, FileText, ChevronRight, Activity, Shield
} from 'lucide-react';
import { SCENARIOS } from './constants';
import { ScenarioId, AnalysisState, Counterfactuals } from './types';
import { runCognitiveAnalysis } from './geminiService';
import ScenarioSelector from './components/ScenarioSelector';
import TelemetryDashboard from './components/TelemetryDashboard';

const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<ScenarioId>(SCENARIOS[0].scenario_id);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [counterfactuals, setCounterfactuals] = useState<Counterfactuals>({
    reduceAlertDensity: false,
    removeUrgencyCues: false,
  });
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    result: null,
    error: null,
    summary: null,
  });
  const [processingStep, setProcessingStep] = useState<string>('');
  const [highlightedLog, setHighlightedLog] = useState<string | null>(null);

  const activeScenario = useMemo(() => 
    SCENARIOS.find(s => s.scenario_id === selectedId) || SCENARIOS[0], 
    [selectedId]
  );

  const handleRunAnalysis = async () => {
    setAnalysis({ loading: true, result: null, error: null, summary: null });
    setHighlightedLog(null);
    if (window.innerWidth < 1024) setShowMobileSidebar(false);
    
    const steps = [
      'INIT_NEURAL_SANDBOX',
      'PARSE_COG_STREAMS',
      'RECONSTRUCT_PATHS',
      'APPLY_BIAS_MODEL',
      'SYNTHESIZE_DOSSIER'
    ];
    
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      setProcessingStep(steps[stepIndex % steps.length]);
      stepIndex++;
    }, 800);

    try {
      const { text, summary } = await runCognitiveAnalysis(activeScenario, counterfactuals);
      clearInterval(stepInterval);
      setAnalysis({ loading: false, result: text, summary, error: null });
    } catch (err) {
      clearInterval(stepInterval);
      setAnalysis({ loading: false, result: null, error: (err as Error).message, summary: null });
    }
  };

  const toggleCounterfactual = (key: keyof Counterfactuals) => {
    setCounterfactuals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToLog = (id: string) => {
    setHighlightedLog(id);
    const el = document.getElementById(`log-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedLog(null), 2000);
  };

  const renderAnalysisText = (text: string) => {
    return text.split(/(STAGE\s+\d+:|\[DESIGN-LEVEL\]|\[TRAINING-LEVEL\]|REASONING\s+LOGIC:?)/i).map((section, idx) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const isStage = /STAGE\s+\d+:/i.test(trimmed);
      const isDesign = /\[DESIGN-LEVEL\]/i.test(trimmed);
      const isTraining = /\[TRAINING-LEVEL\]/i.test(trimmed);
      const isLogic = /REASONING\s+LOGIC:?/i.test(trimmed);

      if (isStage) {
        return (
          <div key={idx} className="mt-14 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/40 rounded-lg flex items-center justify-center font-mono text-blue-400 text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              {trimmed.match(/\d+/)?.[0].padStart(2, '0')}
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">{trimmed}</h2>
            <div className="flex-grow h-[1px] bg-gradient-to-r from-blue-500/40 via-blue-500/10 to-transparent" />
          </div>
        );
      }

      if (isDesign || isTraining) {
        return (
          <div key={idx} className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest mb-3 mr-3 align-middle transition-all hover:scale-105 ${isDesign ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
            {isDesign ? <Layout className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
            {trimmed.replace(/[\[\]]/g, '')}
          </div>
        );
      }

      if (isLogic) {
        return (
          <div key={idx} className="mt-20 p-8 bg-slate-900/60 border border-blue-500/10 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-700">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Cpu className="w-20 h-20 text-blue-500" /></div>
             <div className="flex items-center gap-3 mb-4">
                <Microscope className="w-4 h-4 text-blue-400" />
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Forensic Reasoning Pipeline</h3>
             </div>
             <p className="text-[13px] text-slate-400 italic leading-relaxed font-medium group-hover:text-slate-300 transition-colors">
               {trimmed.replace(/REASONING\s+LOGIC:?/i, '').trim()}
             </p>
             <div className="mt-6 flex items-center gap-3">
               <div className="h-[1px] flex-grow bg-white/5" />
               <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Logic_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
             </div>
          </div>
        );
      }

      const paragraphs = trimmed.split('\n').filter(l => l.trim()).map((line, li) => {
        const parts = line.split(/(\[[CEI]-\d+\])/g);
        return (
          <p key={li} className="text-[14px] text-slate-300/90 leading-relaxed font-medium mb-6 last:mb-0">
            {parts.map((part, pi) => {
              const match = part.match(/^\[([CEI]-\d+)\]$/);
              if (match) {
                const id = match[1];
                const type = id[0]; // C, E, or I
                const color = type === 'C' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : type === 'E' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                
                return (
                  <button 
                    key={pi}
                    onClick={() => scrollToLog(id)}
                    className={`mx-1 px-1.5 py-0 border rounded-md font-mono text-[10px] font-bold transition-all hover:scale-110 active:scale-95 align-middle ${color}`}
                  >
                    {id}
                  </button>
                );
              }
              return part;
            })}
          </p>
        );
      });

      return <div key={idx} className="mb-6">{paragraphs}</div>;
    });
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-blue-500/30">
      {/* HUD Header */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-[100] px-8 flex items-center justify-between no-print shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-9 h-9 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-lg flex items-center justify-center border border-white/10">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] font-black uppercase tracking-[0.5em] text-white">CTMA <span className="text-blue-500 font-medium tracking-normal ml-1">CORE</span></h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural_Sync: STABLE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 pr-8 border-r border-white/5">
             <div className="text-right">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active_Matrix</div>
                <div className="text-[12px] font-bold text-slate-200">{activeScenario.title}</div>
             </div>
             <div className="text-right">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Projected_Risk</div>
                <div className={`text-[12px] font-black uppercase tracking-widest ${activeScenario.expected_risk_level === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{activeScenario.expected_risk_level}</div>
             </div>
          </div>
          <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Simulation Controls */}
        <aside className={`lg:col-span-4 space-y-8 lg:block ${showMobileSidebar ? 'fixed inset-0 z-[1000] bg-[#020408] p-8 overflow-y-auto' : 'hidden'} lg:relative lg:p-0`}>
          <div className="flex justify-between items-center lg:hidden mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Session Control</h2>
            <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-white bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
          </div>

          <div className="bg-[#0a0f1a] border border-white/5 rounded-3xl p-8 space-y-8 shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="flex items-center justify-between opacity-50">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Forensics_Unit
              </h2>
            </div>

            <ScenarioSelector selectedId={selectedId} onChange={setSelectedId} disabled={analysis.loading} />

            <div className="space-y-4 pt-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-500" /> Counterfactual_Params
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(counterfactuals) as Array<keyof Counterfactuals>).map(key => (
                  <button
                    key={key}
                    onClick={() => toggleCounterfactual(key)}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      counterfactuals[key] 
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:border-white/10 hover:text-slate-400'
                    }`}
                  >
                    {key.replace(/([A-Z])/g, ' $1')}
                    <div className={`w-4 h-4 rounded-md border-2 ${counterfactuals[key] ? 'bg-blue-500 border-blue-500' : 'border-slate-800'} transition-all flex items-center justify-center`}>
                       {counterfactuals[key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analysis.loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] ${
                analysis.loading 
                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-blue-50 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] hover:shadow-blue-500/20'
              }`}
            >
              {analysis.loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              {analysis.loading ? 'ANALYZING...' : 'EXECUTE FORENSIC PIPELINE'}
            </button>
          </div>

          <TelemetryDashboard scenario={activeScenario} highlightedId={highlightedLog} />
        </aside>

        {/* Right Side: Analysis Display */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            <div className="bg-[#0a0f1a] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between h-36 group hover:border-blue-500/20 transition-all">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Primary_Failure</span>
               <div className="text-lg font-bold text-white leading-tight uppercase group-hover:text-blue-400 transition-colors">
                 {analysis.summary ? analysis.summary.failureMode : '---'}
               </div>
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                  <Activity className="w-3 h-3" /> TRACE_VALIDATED
               </div>
            </div>

            <div className="bg-[#0a0f1a] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between h-36 group hover:border-red-500/20 transition-all">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Risk_Index</span>
               <div className={`text-4xl font-black tracking-widest ${analysis.summary?.level === 'High' ? 'text-red-500' : analysis.summary?.level === 'Medium' ? 'text-amber-500' : analysis.summary?.level === 'Low' ? 'text-emerald-500' : 'text-slate-800'}`}>
                 {analysis.summary ? analysis.summary.level : '00'}
               </div>
               <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                 <Shield className="w-3 h-3" /> CORE_TOSS_RATING
               </div>
            </div>

            <div className="hidden lg:flex bg-[#0a0f1a] p-6 rounded-3xl border border-white/5 shadow-xl items-center justify-center h-36 group transition-all hover:bg-white/[0.02]">
               <div className="text-center space-y-2">
                 <Fingerprint className="w-10 h-10 text-blue-500/20 mx-auto group-hover:text-blue-400 group-hover:scale-110 transition-all duration-700" />
                 <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.4em] group-hover:text-blue-400/60">Forensic_Trace</span>
               </div>
            </div>
          </div>

          {/* Dossier Terminal */}
          <div className="min-h-[700px] bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] shadow-4xl relative overflow-hidden flex flex-col ring-1 ring-white/5">
            
            {!analysis.result && !analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center p-20 text-center opacity-30 no-print">
                <div className="relative mb-10 group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <Search className="relative w-20 h-20 text-slate-700 group-hover:text-slate-500 transition-colors duration-1000" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-[0.5em] text-white">Forensic Processor Idle</h3>
                <p className="max-w-xs text-[11px] font-bold text-slate-600 mt-6 leading-relaxed uppercase tracking-widest">
                  Ingest telemetry profile from matrix selection to begin neural reconstruction
                </p>
              </div>
            )}

            {analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                <div className="relative mb-16">
                  <div className="w-24 h-24 border-2 border-blue-500/10 rounded-full" />
                  <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Brain className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[1em] text-blue-500 animate-pulse">{processingStep}</h3>
                <div className="mt-8 flex gap-2">
                   {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/30 animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </div>
            )}

            {analysis.result && (
              <div className="p-10 md:p-16 lg:p-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                
                {/* Dossier Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-20 border-b border-white/5 pb-16 relative report-header">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Forensic_Artifact_0x{selectedId.length.toString(16).padStart(4, '0')}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">{activeScenario.title}</h2>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest italic">{activeScenario.description}</p>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between gap-10 border-b border-white/5 pb-2 mb-2">
                      <span className="font-bold">ENTITY_ID:</span> 
                      <span className="text-slate-300">{activeScenario.scenario_id.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-10">
                      <span className="font-bold">GENERATED:</span> 
                      <span className="text-slate-300">{new Date().toISOString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Dossier Narrative Content */}
                <article className="max-w-3xl mx-auto report-narrative">
                  {renderAnalysisText(analysis.result)}
                </article>

                {/* Dossier Footer */}
                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 hover:opacity-100 transition-all duration-700 no-print">
                   <button 
                    onClick={() => window.print()}
                    className="group text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] flex items-center gap-4 transition-all"
                   >
                     <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-400 transition-all">
                       <ExternalLink className="w-4 h-4 transition-transform group-hover:scale-110" /> 
                     </div>
                     GENERATE PDF EVIDENCE DOSSIER
                   </button>
                   <div className="flex items-center gap-3 text-[9px] font-black text-slate-700 uppercase tracking-[0.6em]">
                      <Scan className="w-4 h-4" /> 
                      CTS_SEC_PROTOCOL_V2.5
                   </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-16 text-center opacity-30 no-print border-t border-white/5 mt-20">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[1.5em] mb-2">Cognitive Threat Modeling Laboratory</p>
         <p className="text-[8px] font-bold text-slate-800 uppercase tracking-[0.5em]">Forensics Unit / Neural Intelligence Systems</p>
      </footer>
    </div>
  );
};

export default App;
