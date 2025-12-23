
import React, { useState, useMemo } from 'react';
import { 
  Brain, ShieldAlert, RefreshCcw, Layout, 
  GraduationCap, Microscope, Fingerprint, Eye, Search, 
  Terminal, CheckCircle2, AlertTriangle,
  ExternalLink, SlidersHorizontal, X, Info,
  Cpu, Scan, FileText, ChevronRight
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
          <div key={idx} className="mt-12 mb-6 flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md font-mono text-blue-400 text-xs font-bold">
              {trimmed.match(/\d+/)?.[0].padStart(2, '0')}
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{trimmed}</h2>
            <div className="flex-grow h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
          </div>
        );
      }

      if (isDesign || isTraining) {
        return (
          <span key={idx} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest mr-2 align-middle ${isDesign ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            {isDesign ? <Layout className="w-2.5 h-2.5" /> : <GraduationCap className="w-2.5 h-2.5" />}
            {trimmed.replace(/[\[\]]/g, '')}
          </span>
        );
      }

      if (isLogic) {
        return (
          <div key={idx} className="mt-16 p-6 bg-slate-900/40 border border-blue-500/10 rounded-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Cpu className="w-12 h-12" /></div>
             <div className="flex items-center gap-2 mb-3">
                <Microscope className="w-3.5 h-3.5 text-blue-400" />
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Logic Disclosure</h3>
             </div>
             <p className="text-xs text-slate-400 italic leading-relaxed group-hover:text-slate-300 transition-colors">{trimmed.replace(/REASONING\s+LOGIC:?/i, '').trim()}</p>
          </div>
        );
      }

      const paragraphs = trimmed.split('\n').filter(l => l.trim()).map((line, li) => {
        const parts = line.split(/(\[[CEI]-\d+\])/g);
        return (
          <p key={li} className="text-[13px] text-slate-300 leading-relaxed mb-4 last:mb-0">
            {parts.map((part, pi) => {
              const match = part.match(/^\[([CEI]-\d+)\]$/);
              if (match) {
                const id = match[1];
                return (
                  <button 
                    key={pi}
                    onClick={() => scrollToLog(id)}
                    className="mx-0.5 px-1.5 py-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono text-[9px] hover:bg-blue-500/20 transition-all align-middle"
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

      return <div key={idx} className="mb-4">{paragraphs}</div>;
    });
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-blue-500/30">
      {/* Refined Header */}
      <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-[100] px-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">CTMA <span className="text-blue-500 font-medium tracking-normal ml-1">v2.5</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Neural Link Active</span>
          </div>
          <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Panel */}
        <aside className={`lg:col-span-4 space-y-6 lg:block ${showMobileSidebar ? 'fixed inset-0 z-[1000] bg-[#020408] p-6 overflow-y-auto' : 'hidden'} lg:relative lg:p-0`}>
          <div className="flex justify-between items-center lg:hidden mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-white">System Configuration</h2>
            <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="bg-[#0a0f1a] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between opacity-50">
              <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" /> Processor_Control
              </h2>
            </div>

            <ScenarioSelector selectedId={selectedId} onChange={setSelectedId} disabled={analysis.loading} />

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Counterfactual assumptions
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(counterfactuals) as Array<keyof Counterfactuals>).map(key => (
                  <button
                    key={key}
                    onClick={() => toggleCounterfactual(key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      counterfactuals[key] 
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:border-white/10 hover:text-slate-400'
                    }`}
                  >
                    {key.replace(/([A-Z])/g, ' $1')}
                    <div className={`w-3 h-3 rounded-sm border ${counterfactuals[key] ? 'bg-blue-500 border-blue-500' : 'border-slate-800'} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analysis.loading}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all ${
                analysis.loading 
                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-blue-50 active:scale-95 shadow-lg'
              }`}
            >
              {analysis.loading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {analysis.loading ? 'Processing...' : 'Execute forensic pipe'}
            </button>
          </div>

          <TelemetryDashboard scenario={activeScenario} highlightedId={highlightedLog} />
        </aside>

        {/* Right Report Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
            <div className="bg-[#0a0f1a] p-5 rounded-2xl border border-white/5 flex flex-col justify-center gap-1">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inferred Failure</span>
               <div className="text-sm font-bold text-white uppercase">{analysis.summary ? analysis.summary.failureMode : '---'}</div>
            </div>
            <div className="bg-[#0a0f1a] p-5 rounded-2xl border border-white/5 flex flex-col justify-center gap-1">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Risk Index</span>
               <div className={`text-xl font-black uppercase tracking-widest ${analysis.summary?.level === 'High' ? 'text-red-500' : analysis.summary?.level === 'Medium' ? 'text-amber-500' : analysis.summary?.level === 'Low' ? 'text-emerald-500' : 'text-slate-800'}`}>
                 {analysis.summary ? analysis.summary.level : '--'}
               </div>
            </div>
          </div>

          <div className="min-h-[600px] bg-[#0a0f1a] border border-white/5 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
            {!analysis.result && !analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center opacity-20">
                <Search className="w-12 h-12 mb-4" />
                <h3 className="text-xs font-black uppercase tracking-[0.5em]">Sandbox Idle</h3>
                <p className="text-[10px] mt-2 font-medium">Load telemetry profile to begin reconstruction</p>
              </div>
            )}

            {analysis.loading && (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="w-10 h-10 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-6" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">{processingStep}</h3>
              </div>
            )}

            {analysis.result && (
              <div className="p-8 md:p-12 lg:p-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-12 border-b border-white/5 pb-8 relative report-header">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic Dossier_Output</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{activeScenario.title}</h2>
                  </div>
                  <div className="font-mono text-[9px] text-slate-600 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2"><span>SOURCE:</span> <span className="text-slate-400">{activeScenario.scenario_id.toUpperCase()}</span></div>
                    <div className="flex items-center gap-2"><span>TIMESTAMP:</span> <span className="text-slate-400">{new Date().toLocaleTimeString()}</span></div>
                  </div>
                </div>
                
                <article className="max-w-2xl mx-auto report-narrative">
                  {renderAnalysisText(analysis.result)}
                </article>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-50 hover:opacity-100 transition-opacity no-print">
                   <button onClick={() => window.print()} className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
                     <ExternalLink className="w-3.5 h-3.5" /> Generate PDF Evidence
                   </button>
                   <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
                      <Scan className="w-3 h-3" /> CTMA_SEC_PROTOCOL_V2
                   </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 text-center opacity-30 no-print">
         <p className="text-[8px] font-black uppercase tracking-[0.8em]">Cognitive threat modeling Laboratory / Forensics unit</p>
      </footer>
    </div>
  );
};

export default App;
