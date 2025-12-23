
import React, { useMemo } from 'react';
import { ScenarioBundle } from '../types';
import { Activity, MousePointer2, AlertCircle, Zap, Scan, Layers, Database } from 'lucide-react';

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
    <div className="bg-[#0a0f1a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col group/dashboard">
      <div className="bg-white/[0.02] px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Scan className="w-3.5 h-3.5 text-blue-500" />
            Neural_Telemetry_Stream
          </h3>
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Ground_Truth_Sync: Active</span>
        </div>
        <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-amber-500/60"><div className="w-1 h-1 rounded-full bg-amber-500"/> COG</span>
          <span className="flex items-center gap-1.5 text-blue-500/60"><div className="w-1 h-1 rounded-full bg-blue-500"/> SYS</span>
          <span className="flex items-center gap-1.5 text-emerald-500/60"><div className="w-1 h-1 rounded-full bg-emerald-500"/> USR</span>
        </div>
      </div>

      <div className="p-3 max-h-[420px] overflow-y-auto space-y-2 custom-scrollbar bg-black/20">
        {timeline.map((event) => {
          const isHighlighted = highlightedId === event.id;
          const isHighPressure = event.time_pressure || event.severity === 'high_urgency' || event.warning_ignored || event.severity === 'critical' || event.severity === 'high';
          
          const colorClass = event.stream === 'C' ? 'border-amber-500/20' : event.stream === 'E' ? 'border-blue-500/20' : 'border-emerald-500/20';
          const accentColor = event.stream === 'C' ? 'text-amber-500' : event.stream === 'E' ? 'text-blue-500' : 'text-emerald-500';
          const bgClass = event.stream === 'C' ? 'bg-amber-500/[0.03]' : event.stream === 'E' ? 'bg-blue-500/[0.03]' : 'bg-emerald-500/[0.03]';
          const icon = event.stream === 'C' ? <Activity className="w-3 h-3" /> : event.stream === 'E' ? <AlertCircle className="w-3 h-3" /> : <MousePointer2 className="w-3 h-3" />;

          // Extract relevant data points for the detail string
          const details = Object.entries(event)
            .filter(([k]) => !['timestamp', 'stream', 'id', 'event_type', 'workload_level'].includes(k))
            .map(([k, v]) => `${k}:${v}`)
            .join(' | ');

          return (
            <div 
              key={event.id}
              id={`log-${event.id}`}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 relative overflow-hidden group/item ${
                isHighlighted 
                  ? 'ring-2 ring-blue-500 bg-blue-500/20 border-blue-500 scale-[1.02] z-10 shadow-[0_0_25px_rgba(59,130,246,0.3)]' 
                  : `${colorClass} ${bgClass} hover:border-white/20 hover:bg-white/[0.05]`
              }`}
            >
              {isHighPressure && (
                <div className="absolute top-0 right-0 p-1.5">
                  <Zap className="w-2.5 h-2.5 text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                </div>
              )}
              
              <div className={`flex-shrink-0 mt-0.5 ${accentColor} opacity-70 group-hover/item:opacity-100 transition-opacity`}>
                {icon}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-500 font-medium group-hover/item:text-slate-300 transition-colors">
                    {/* Fixed fractionalSecondDigits type error by casting options to any */}
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 } as any)}
                  </span>
                  <div className={`px-1.5 py-0.5 rounded-md bg-black/40 border border-white/5 font-mono text-[8px] font-bold ${accentColor}`}>
                    {event.id}
                  </div>
                </div>
                
                <div className="text-[11px] text-slate-200 font-bold uppercase tracking-tight mb-1 group-hover/item:text-white transition-colors">
                  {event.event_type || event.workload_level || 'Trace_Pulse'}
                </div>

                {details && (
                  <div className="text-[9px] font-mono text-slate-500 leading-tight group-hover/item:text-slate-400 transition-colors truncate group-hover/item:whitespace-normal">
                    {details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-5 py-3 border-t border-white/5 bg-black/40 text-[8px] font-black text-slate-600 uppercase tracking-widest flex justify-between items-center">
         <div className="flex items-center gap-2">
           <Database className="w-3 h-3 text-blue-500/50" />
           <span>Data_Integrity: 100%</span>
         </div>
         <div className="flex items-center gap-1.5">
           <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
           <span>CTS_Engine_v1.2.0</span>
         </div>
      </div>
    </div>
  );
};

export default TelemetryDashboard;
