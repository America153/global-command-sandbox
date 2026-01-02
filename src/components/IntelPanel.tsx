import { forwardRef, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { 
  AlertTriangle, 
  Info, 
  Crosshair, 
  Factory,
  Radio,
  Navigation
} from 'lucide-react';

const IntelPanel = forwardRef<HTMLDivElement>(function IntelPanel(_, ref) {
  const { logs, hq, bases, units, resources, tick, aiEnemy } = useGameStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Check if player has intel capability
  const hasIntelBase = bases.some((b) => b.type === 'intelligence' && b.faction === 'player');
  
  // Compute visible enemy entities reactively
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

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'peace': return 'text-friendly';
      case 'vigilant': return 'text-accent';
      case 'hostile': return 'text-orange-500';
      case 'war': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="tactical-panel w-72 flex flex-col h-full">
      <div className="tactical-header scanline">
        INTELLIGENCE FEED
      </div>

      {/* Enemy Intel Section */}
      <div className="p-3 border-b border-border space-y-2 bg-destructive/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Enemy Status</span>
          <span className={`text-xs font-mono font-bold uppercase ${getAlertLevelColor(aiEnemy.alertLevel)}`}>
            {aiEnemy.alertLevel}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-destructive/10 rounded p-1.5">
            <div className="text-xs font-mono text-destructive">{visibleEnemyBases.length}/{aiEnemy.bases.length}</div>
            <div className="text-[9px] text-muted-foreground">BASES KNOWN</div>
          </div>
          <div className={`${hasIntelBase ? 'bg-primary/10' : 'bg-muted/20'} rounded p-1.5`}>
            <div className={`text-xs font-mono ${hasIntelBase ? 'text-primary' : 'text-muted-foreground'}`}>
              {hasIntelBase ? visibleEnemyUnits.length : '???'}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {hasIntelBase ? 'UNITS TRACKED' : 'NEED INTEL BASE'}
            </div>
          </div>
        </div>
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
                flex items-start gap-1 p-1.5 rounded text-[10px] font-mono
                ${log.type === 'warning' ? 'bg-accent/10 border border-accent/30' : ''}
                ${log.type === 'combat' ? 'bg-destructive/10 border border-destructive/30' : ''}
                ${log.type === 'production' ? 'bg-friendly/10 border border-friendly/30' : ''}
                ${log.type === 'info' || log.type === 'intel' || log.type === 'movement' ? 'bg-muted/20' : ''}
              `}
            >
              {getLogIcon(log.type)}
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-muted-foreground">T+{log.timestamp}</div>
                <div className="text-foreground break-words text-[9px]">{log.message}</div>
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
            <div className="w-2 h-2 rounded-full bg-friendly" />
            <span className="text-[10px] font-mono text-muted-foreground">LINK ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
});

export default IntelPanel;
