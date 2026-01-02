import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Target, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiplomacyPanel from '@/components/DiplomacyPanel';

interface TopBarProps {
  selectedTool: string | null;
}

export default function TopBar({ selectedTool }: TopBarProps) {
  const { resources, hq, diplomacy } = useGameStore();
  const [showDiplomacy, setShowDiplomacy] = useState(false);

  const atWarCount = Object.values(diplomacy.relations).filter(r => r.status === 'war').length;

  return (
    <>
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

            {/* Diplomacy Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowDiplomacy(true)}
            >
              <Handshake className="w-4 h-4" />
              <span className="text-xs">Diplomacy</span>
              {atWarCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded">
                  {atWarCount} WAR
                </span>
              )}
            </Button>
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

      {/* Diplomacy Panel Modal */}
      {showDiplomacy && <DiplomacyPanel onClose={() => setShowDiplomacy(false)} />}
    </>
  );
}
