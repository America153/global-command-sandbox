import { forwardRef, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { 
  AlertTriangle, 
  Info, 
  Crosshair, 
  Factory,
  Radio,
  Navigation,
  TrendingUp
} from 'lucide-react';

const IntelPanel = forwardRef<HTMLDivElement>(function IntelPanel(_, ref) {
  const { logs, hq, bases, units, resources, tick, aiEnemy } = useGameStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const hasIntelBase = bases.some((b) => b.type === 'intelligence' && b.faction === 'player');
  const visibleEnemyBases = aiEnemy.bases.filter((base) => aiEnemy.revealedBases.includes(base.id));
  const visibleEnemyUnits = hasIntelBase ? aiEnemy.units : [];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-3 h-3 text-accent" />;
      case 'combat': return <Crosshair className="w-3 h-3 text-destructive" />;
      case 'intel': return <Radio className="w-3 h-3 text-primary" />;
      case 'production': return <Factory className="w-3 h-3 text-friendly" />;
      case 'movement': return <Navigation className="w-3 h-3 text-primary" />;
      default: return <Info className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getAlertBadgeColor = (level: string) => {
    switch (level) {
      case 'peace': return 'bg-friendly/20 text-friendly border-friendly/30';
      case 'vigilant': return 'bg-accent/20 text-accent border-accent/30';
      case 'hostile': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'war': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="w-64 flex flex-col h-full bg-background/60 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground/90">INTEL</span>
          </div>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getAlertBadgeColor(aiEnemy.alertLevel)}`}>
            {aiEnemy.alertLevel}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-3 border-b border-white/10">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-sm font-semibold text-primary">${resources >= 1000 ? `${(resources/1000).toFixed(1)}k` : resources}</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase">Funds</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-sm font-semibold text-foreground">{bases.length}</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase">Bases</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-sm font-semibold text-friendly">{units.length}</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase">Units</div>
          </div>
        </div>

        {/* Enemy Intel Row */}
        <div className="flex gap-1.5 mt-1.5">
          <div className="flex-1 bg-destructive/10 rounded-lg p-2 flex items-center justify-between">
            <span className="text-[8px] text-muted-foreground/70 uppercase">Enemy Bases</span>
            <span className="text-[10px] font-semibold text-destructive">{visibleEnemyBases.length}/{aiEnemy.bases.length}</span>
          </div>
          <div className={`flex-1 ${hasIntelBase ? 'bg-primary/10' : 'bg-white/5'} rounded-lg p-2 flex items-center justify-between`}>
            <span className="text-[8px] text-muted-foreground/70 uppercase">Units</span>
            <span className={`text-[10px] font-semibold ${hasIntelBase ? 'text-primary' : 'text-muted-foreground/50'}`}>
              {hasIntelBase ? visibleEnemyUnits.length : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/50">
            <Radio className="w-6 h-6 mb-2 opacity-30" />
            <p className="text-[10px]">No intel available</p>
            <p className="text-[9px]">Place HQ to begin</p>
          </div>
        ) : (
          logs.slice(-50).map((log) => (
            <div 
              key={log.id}
              className={`
                flex items-start gap-1.5 p-1.5 rounded-md text-[9px]
                ${log.type === 'warning' ? 'bg-accent/10 border-l-2 border-accent' : ''}
                ${log.type === 'combat' ? 'bg-destructive/10 border-l-2 border-destructive' : ''}
                ${log.type === 'production' ? 'bg-friendly/10 border-l-2 border-friendly' : ''}
                ${log.type === 'info' || log.type === 'intel' || log.type === 'movement' ? 'bg-white/5' : ''}
              `}
            >
              {getLogIcon(log.type)}
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-muted-foreground/50">T+{log.timestamp}</div>
                <div className="text-foreground/80 break-words leading-tight">{log.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-friendly animate-pulse" />
            <span className="text-[9px] text-muted-foreground/60">T+{String(tick).padStart(5, '0')}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] text-muted-foreground/60">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default IntelPanel;
