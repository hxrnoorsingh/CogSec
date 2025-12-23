
import React, { useMemo } from 'react';
import { ScenarioBundle } from '../types';
import { Activity, MousePointer2, AlertCircle, Zap, Scan, Layers } from 'lucide-react';

interface Props {
  scenario: ScenarioBundle;
  highlightedId?: string | null;
}

const TelemetryDashboard: React.FC<Props> = ({ scenario, highlightedId }) => {
  const timeline = useMemo(() => {
    const all = [
      ...scenario.telemetry.cognitive_state.map((t, i) => ({ ...t, stream: 'C', id: `C-${i}` })),
      ...scenario.telemetry.environment.map((t, i) => ({ ...t, stream: 'E', id: `E-${i}` })),
      ...scenario.telemetry.interaction.map((t, i) => ({ ...t, stream: 'I', id: `I-${i}` }))
    ];
    return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [scenario]);

  return (
    <div className="bg-[#0a0f1a] rounded-2xl overflow-hidden border border-white/5 shadow-lg flex flex-col">
      <div className="bg-white/[0.02] px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Scan className="w-3.5 h-3.5 text-blue-500" />
          Data_Stream
        </h3>
        <div className="flex gap-2.5 text-[7px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-amber-500/80">COG</span>
          <span className="flex items-center gap-1 text-blue-500/80">SYS</span>
          <span className="flex items-center gap-1 text-emerald-500/80">USR</span>
        </div>
      </div>

      <div className="p-3 max-h-[360px] overflow-y-auto space-y-1.5 custom-scrollbar">
        {timeline.map((event) => {
          const isHighlighted = highlightedId === event.id;
          const isHighPressure = event.time_pressure || event.severity === 'high_urgency' || event.warning_ignored;
          
          const colorClass = event.stream === 'C' ? 'border-amber-500/10' : event.stream === 'E' ? 'border-blue-500/10' : 'border-emerald-500/10';
          const bgClass = event.stream === 'C' ? 'bg-amber-500/[0.03]' : event.stream === 'E' ? 'bg-blue-500/[0.03]' : 'bg-emerald-500/[0.03]';
          const icon = event.stream === 'C' ? <Activity className="w-2.5 h-2.5 text-amber-500" /> : event.stream === 'E' ? <AlertCircle className="w-2.5 h-2.5 text-blue-500" /> : <MousePointer2 className="w-2.5 h-2.5 text-emerald-500" />;

          return (
            <div 
              key={event.id}
              id={`log-${event.id}`}
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-300 ${isHighlighted ? 'ring-1 ring-blue-500 bg-blue-500/10 border-blue-500 scale-[1.01]' : `${colorClass} ${bgClass} hover:border-white/10`}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-mono text-slate-600">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {isHighPressure && <Zap className="w-2 h-2 text-red-500 animate-pulse" />}
                </div>
                <div className="text-[10px] text-slate-300 font-bold uppercase truncate tracking-tight">
                  {event.event_type || event.workload_level || 'Trace'}
                </div>
              </div>
              <div className="text-[8px] font-mono text-slate-700 bg-black/20 px-1 rounded self-center">
                {event.id}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-5 py-2.5 border-t border-white/5 bg-black/20 text-[7px] font-black text-slate-700 uppercase tracking-widest flex justify-between">
         <div className="flex items-center gap-1.5"><Layers className="w-2.5 h-2.5" /> Ground Truth Ready</div>
         <span>v1.0.4</span>
      </div>
    </div>
  );
};

export default TelemetryDashboard;
