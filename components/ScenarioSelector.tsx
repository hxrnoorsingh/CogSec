
import React, { useState, useRef, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { ScenarioId } from '../types';
import { ChevronDown, Target, User, AlertTriangle } from 'lucide-react';

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
    <div className="space-y-2.5" ref={containerRef}>
      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 px-1">
        <Target className="w-3 h-3 text-blue-500" /> Matrix Selection
      </label>

      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
            isOpen 
              ? 'bg-blue-600/5 border-blue-500/40' 
              : 'bg-black/40 border-white/5 hover:border-white/10'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3.5 text-left min-w-0">
            <div className={`p-2 rounded-lg ${activeScenario.expected_risk_level === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {activeScenario.expected_risk_level === 'High' ? <AlertTriangle className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                {activeScenario.title}
              </div>
              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                Risk_Factor: {activeScenario.expected_risk_level}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-[#0c121d] border border-white/10 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-1">
              {SCENARIOS.map((s) => {
                const isActive = selectedId === s.scenario_id;
                return (
                  <button
                    key={s.scenario_id}
                    onClick={() => handleSelect(s.scenario_id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-4 ${
                      isActive 
                        ? 'bg-blue-500/10 border border-blue-500/20' 
                        : 'bg-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex-grow min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wider text-white mb-0.5">
                        {s.title}
                      </div>
                      <p className="text-[8px] text-slate-600 font-medium line-clamp-1">
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
