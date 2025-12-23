
import React, { useState, useRef, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { ScenarioId } from '../types';
import { ChevronDown, Target, ShieldQuestion, User, AlertTriangle } from 'lucide-react';

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
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
        <Target className="w-3.5 h-3.5 text-blue-500" />
        Scenario Matrix
      </label>

      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${
            isOpen 
              ? 'bg-blue-600/5 border-blue-500/50' 
              : 'bg-black/40 border-white/5 hover:border-white/10'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-4 text-left">
            <div className={`p-2 rounded-lg ${activeScenario.expected_risk_level === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {activeScenario.expected_risk_level === 'High' ? <AlertTriangle className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-wider truncate max-w-[180px]">
                {activeScenario.title}
              </div>
              <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                Risk: {activeScenario.expected_risk_level}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-[#0c121d] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
              {SCENARIOS.map((s) => {
                const isActive = selectedId === s.scenario_id;
                return (
                  <button
                    key={s.scenario_id}
                    onClick={() => handleSelect(s.scenario_id)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-4 ${
                      isActive 
                        ? 'bg-blue-600/20 border border-blue-500/30' 
                        : 'bg-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {s.title}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium line-clamp-1">
                        {s.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSelector;
