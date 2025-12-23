
import React, { useState, useRef, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { ScenarioId } from '../types';
import { ChevronDown, Target, User, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

interface Props {
  selectedId: ScenarioId;
  onChange: (id: ScenarioId) => void;
  disabled?: boolean;
}

const ScenarioSelector: React.FC<Props> = ({ selectedId, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScenario = SCENARIOS.find(s => s.scenario_id === selectedId) || SCENARIOS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: ScenarioId) => {
    if (disabled) return;
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
        <Target className="w-3.5 h-3.5 text-blue-500" /> Primary_Matrix_Sync
      </label>

      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
            isOpen 
              ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' 
              : 'bg-black/40 border-white/5 hover:border-white/20'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-4 text-left min-w-0">
            <div className={`p-2.5 rounded-xl transition-colors duration-500 ${activeScenario.expected_risk_level === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {activeScenario.expected_risk_level === 'High' ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-white uppercase tracking-wider truncate">
                {activeScenario.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${activeScenario.expected_risk_level === 'High' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Risk_Class: {activeScenario.expected_risk_level}
                </div>
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-600 transition-all duration-500 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 z-[200] bg-[#0c121d] border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] p-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5 backdrop-blur-3xl">
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1.5 p-1">
              {SCENARIOS.map((s) => {
                const isActive = selectedId === s.scenario_id;
                const isHigh = s.expected_risk_level === 'High';

                return (
                  <button
                    key={s.scenario_id}
                    onClick={() => handleSelect(s.scenario_id)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-4 border ${
                      isActive 
                        ? 'bg-blue-500/15 border-blue-500/30' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.05] hover:border-white/5'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg ${isHigh ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                       {isHigh ? <AlertTriangle className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {s.title}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium line-clamp-2 leading-relaxed italic">
                        {s.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 px-4 pb-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] flex justify-between">
              <span>Core_Catalog</span>
              <span className="text-blue-500/50">{SCENARIOS.length} Sources Ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSelector;
