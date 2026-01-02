import { useGameStore } from '@/store/gameStore';
import { Target } from 'lucide-react';

interface TopBarProps {
  selectedTool: string | null;
}

export default function TopBar({ selectedTool }: TopBarProps) {
  const { resources, hq, selectedEntity } = useGameStore();

  return (
    <div className="tactical-panel">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider">GLOBAL BATTLESPACE</h1>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Sandbox v0.1</div>
          </div>
        </div>

        {/* Center Status */}
        <div className="flex items-center gap-6">
          {selectedTool && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded border border-primary/50">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-mono text-primary">
                {selectedTool === 'hq' ? 'PLACING HQ' : `PLACING ${selectedTool.toUpperCase()}`}
              </span>
            </div>
          )}
          
          {!selectedTool && !hq && (
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 rounded border border-accent/50">
              <span className="text-[10px] font-mono text-accent">
                SELECT HQ FROM PALETTE → CLICK GLOBE
              </span>
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Resources</div>
            <div className="text-lg font-mono font-bold text-primary">${resources.toLocaleString()}</div>
          </div>
          
          {hq && (
            <div className="flex items-center gap-1 text-xs font-mono text-friendly">
              <div className="w-2 h-2 rounded-full bg-friendly" />
              HQ ONLINE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
