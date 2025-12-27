import { useGameStore } from '@/store/gameStore';
import { 
  AlertTriangle, 
  Info, 
  Crosshair, 
  Factory,
  Radio
} from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function IntelPanel() {
  const { logs, hq, bases, units, resources, tick } = useGameStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-3 h-3 text-accent" />;
      case 'combat': return <Crosshair className="w-3 h-3 text-destructive" />;
      case 'intel': return <Radio className="w-3 h-3 text-primary" />;
      case 'production': return <Factory className="w-3 h-3 text-friendly" />;
      default: return <Info className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="tactical-panel w-72 flex flex-col h-full">
      <div className="tactical-header scanline">
        INTELLIGENCE FEED
      </div>

      {/* Status Overview */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Resources</div>
            <div className="text-lg font-mono text-primary">${resources.toLocaleString()}</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Tick</div>
            <div className="text-lg font-mono text-foreground">{tick}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/20 rounded p-1.5">
            <div className="text-xs font-mono text-primary">{bases.length}</div>
            <div className="text-[9px] text-muted-foreground">BASES</div>
          </div>
          <div className="bg-muted/20 rounded p-1.5">
            <div className="text-xs font-mono text-friendly">{units.length}</div>
            <div className="text-[9px] text-muted-foreground">UNITS</div>
          </div>
          <div className="bg-muted/20 rounded p-1.5">
            <div className="text-xs font-mono text-accent">{hq ? '1' : '0'}</div>
            <div className="text-[9px] text-muted-foreground">HQ</div>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono">No intel available</p>
            <p className="text-[10px]">Place HQ to begin operations</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id}
              className={`
                flex items-start gap-2 p-2 rounded text-xs font-mono
                ${log.type === 'warning' ? 'bg-accent/10 border border-accent/30' : ''}
                ${log.type === 'combat' ? 'bg-destructive/10 border border-destructive/30' : ''}
                ${log.type === 'production' ? 'bg-friendly/10 border border-friendly/30' : ''}
                ${log.type === 'info' || log.type === 'intel' ? 'bg-muted/20' : ''}
                animate-fade-in-up
              `}
            >
              {getLogIcon(log.type)}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground">T+{log.timestamp}</div>
                <div className="text-foreground break-words">{log.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Connection Status */}
      <div className="border-t border-border p-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-friendly animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground">LINK ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
