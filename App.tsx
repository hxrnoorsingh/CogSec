
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Brain, ShieldAlert, RefreshCcw, Zap, Layout, 
  GraduationCap, Microscope, Fingerprint, Eye, Search, 
  Terminal, Activity, CheckCircle2, AlertTriangle,
  ClipboardList, ExternalLink, SlidersHorizontal, Layers, X, Info,
  Shield, Cpu, Box, Database, Scan
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

  const cognitiveLoad = useMemo(() => {
    const logs = activeScenario.telemetry.cognitive_state;
    if (!logs.length) return 0;
    const levelMap: Record<string, number> = { 'Low': 20, 'Medium': 50, 'High': 80, 'Very High': 95, 'Extreme': 100 };
    const values = logs.map(l => (levelMap[l.workload_level] || 50) + (l.time_pressure ? 10 : 0));
    return Math.min(100, Math.round(values.reduce((a, b) => a + b, 0) / values.length));
  }, [activeScenario]);

  const handleRunAnalysis = async () => {
    setAnalysis({ loading: true, result: null, error: null, summary: null });
    setHighlightedLog(null);
    if (window.innerWidth < 1024) setShowMobileSidebar(false);
    
    const steps = [
      'INITIALIZING NEURAL SANDBOX...',
      'PARSING COGNITIVE STREAMS...',
      'RECONSTRUCTING ATTENTIONAL PATHS...',
      'APPLYING COUNTERFACTUAL BIAS...',
      'SYNTHESIZING FORENSIC NARRATIVE...'
    ];
    
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      setProcessingStep(steps[stepIndex % steps.length]);
      stepIndex++;
    }, 1200);

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
    setTimeout(() => setHighlightedLog(null), 3000);
  };

  const renderAnalysisText = (text: string) => {
    return text.split(/(STAGE\s+\d+:|\[DESIGN-LEVEL\]|\[TRAINING-LEVEL\]|REASONING\s+LOGIC)/i).map((section, idx) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const isStage = /STAGE\s+\d+:/i.test(trimmed);
      const isDesign = /\[DESIGN-LEVEL\]/i.test(trimmed);
      const isTraining = /\[TRAINING-LEVEL\]/i.test(trimmed);
      const isLogic = /REASONING\s+LOGIC/i.test(trimmed);

      if (isStage) {
        return (
          <div key={idx} className="mt-16 mb-6 flex items-center gap-4 border-b border-blue-500/20 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-mono text-blue-400 font-bold">
              {trimmed.match(/\d+/)?.[0]}
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">{trimmed}</h2>
          </div>
        );
      }

      if (isDesign || isTraining) {
        return (
          <div key={idx} className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest mb-2 mr-2 ${isDesign ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            {isDesign ? <Layout className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {trimmed.replace(/[\[\]]/g, '')}
          </div>
        );
      }

      if (isLogic) {
        return (
          <div key={idx} className="mt-16 p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
             <div className="flex items-center gap-2 mb-4">
                <Microscope className="w-4 h-4 text-blue-400" />
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Neural Reasoning Logic</h3>
             </div>
             <p className="text-sm text-slate-400 italic leading-relaxed">{trimmed.replace(/REASONING\s+LOGIC/i, '').trim()}</p>
          </div>
        );
      }

      const paragraphs = trimmed.split('\n').filter(l => l.trim()).map((line, li) => {
        const parts = line.split(/(\[[CEI]-\d+\])/g);
        return (
          <p key={li} className="text-slate-300 leading-relaxed mb-4 last:mb-0">
            {parts.map((part, pi) => {
              const match = part.match(/^\[([CEI]-\d+)\]$/);
              if (match) {
                const id = match[1];
                return (
                  <button 
                    key={pi}
                    onClick={() => scrollToLog(id)}
                    className="mx-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono text-[10px] hover:bg-blue-500/30 transition-all align-middle"
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
    <div className="min-h-screen bg-[#020408] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Refined HUD */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-[100] px-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white">CTMA <span className="text-blue-500 font-medium">CORE</span></h1>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-white/5">
             <div className="text-right">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Scenario</div>
                <div className="text-[11px] font-bold text-slate-300">{activeScenario.title}</div>
             </div>
          </div>
          <button 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden p-2 text-slate-400"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* SIDEBAR: Controls & Data */}
        <aside className={`lg:col-span-4 space-y-8 lg:block ${showMobileSidebar ? 'fixed inset-0 z-[1000] bg-[#020408] p-6 overflow-y-auto' : 'hidden'} lg:relative lg:p-0`}>
          
          {showMobileSidebar && (
            <div className="flex justify-between items-center mb-8 lg:hidden">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">System Config</h2>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="bg-[#0a0f1a] border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Forensic Control Unit</h2>
              <Terminal className="w-4 h-4 text-slate-700" />
            </div>

            <ScenarioSelector selectedId={selectedId} onChange={setSelectedId} disabled={analysis.loading} />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Counterfactual Models</span>
                 </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(counterfactuals) as Array<keyof Counterfactuals>).map(key => (
                  <button
                    key={key}
                    onClick={() => toggleCounterfactual(key)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      counterfactuals[key] 
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-100' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className={`w-3.5 h-3.5 rounded-sm border transition-colors ${counterfactuals[key] ? 'bg-blue-500 border-blue-500' : 'border-slate-800'}`}>
                       {counterfactuals[key] && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analysis.loading}
              className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-4 transition-all ${
                analysis.loading 
                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-blue-50 hover:scale-[1.02] shadow-xl'
              }`}
            >
              {analysis.loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {analysis.loading ? 'ANALYZING...' : 'RUN FORENSIC ANALYSIS'}
            </button>
          </div>

          <TelemetryDashboard scenario={activeScenario} highlightedId={highlightedLog} />
        </aside>

        {/* ANALYSIS RESULTS */}
        <section className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
            <div className="bg-[#0a0f1a] p-8 rounded-3xl border border-white/5 shadow-xl">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-4">Failure Mode</span>
               <div className="text-xl font-bold text-white leading-tight">
                 {analysis.summary ? analysis.summary.failureMode : '---'}
               </div>
            </div>

            <div className="bg-[#0a0f1a] p-8 rounded-3xl border border-white/5 shadow-xl">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-4">Risk Level</span>
               <div className={`text-3xl font-black tracking-widest ${analysis.summary?.level === 'High' ? 'text-red-500' : analysis.summary?.level === 'Medium' ? 'text-amber-500' : analysis.summary?.level === 'Low' ? 'text-emerald-500' : 'text-slate-800'}`}>
                 {analysis.summary ? analysis.summary.level : '--'}
               </div>
            </div>

            <div className="hidden xl:flex bg-[#0a0f1a] p-8 rounded-3xl border border-white/5 shadow-xl items-center justify-center">
               <div className="text-center">
                 <Fingerprint className="w-8 h-8 text-blue-500/20 mx-auto mb-2" />
                 <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.3em]">Neural Artifact</span>
               </div>
            </div>
          </div>

          <div className="min-h-[600px] bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
            
            {!analysis.result && !analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-12 opacity-30 no-print">
                <Search className="w-16 h-16 text-slate-600 mb-6" />
                <h3 className="text-lg font-black uppercase tracking-[0.4em] text-white">System Idle</h3>
                <p className="max-w-xs text-xs font-medium text-slate-500 mt-4 leading-relaxed">
                  Select a signal profile and trigger the analysis pipeline to begin the cognitive forensic reconstruction.
                </p>
              </div>
            )}

            {analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-12">
                  <div className="w-20 h-20 border-2 border-blue-500/10 rounded-full animate-pulse" />
                  <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500">{processingStep}</h3>
              </div>
            )}

            {analysis.result && (
              <div className="p-8 md:p-16 lg:p-20">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12 relative report-header">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Forensic Output</span>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{activeScenario.title}</h2>
                  </div>
                  <div className="font-mono text-[9px] text-slate-600 space-y-1 text-right">
                    <div>SRC: {activeScenario.scenario_id.toUpperCase()}</div>
                    <div>GEN: {new Date().toISOString()}</div>
                  </div>
                </div>
                
                <article className="max-w-3xl report-narrative">
                  {renderAnalysisText(analysis.result)}
                </article>

                <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center opacity-40 no-print">
                   <button 
                    onClick={() => window.print()}
                    className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                   >
                     <ExternalLink className="w-4 h-4" /> 
                     GENERATE REPORT
                   </button>
                   <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">CTMA Forensic Engine v2.4</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 text-center mt-20 no-print">
         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[1em]">Cognitive Threat Modeling Laboratory</p>
      </footer>
    </div>
  );
};

export default App;
