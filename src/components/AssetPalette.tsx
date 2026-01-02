import { useGameStore } from '@/store/gameStore';
import { 
  Building2, 
  Plane, 
  Ship, 
  Shield, 
  Eye, 
  Crosshair,
  Users,
  Rocket
} from 'lucide-react';
import type { BaseType } from '@/types/game';

export default function AssetPalette() {
  const { selectedTool, selectTool, hq } = useGameStore();

  const baseOptions: { type: BaseType; label: string; icon: React.ReactNode; cost: number }[] = [
    { type: 'hq', label: 'HQ', icon: <Crosshair className="w-5 h-5" />, cost: 0 },
    { type: 'army', label: 'Army', icon: <Shield className="w-5 h-5" />, cost: 500 },
    { type: 'navy', label: 'Navy', icon: <Ship className="w-5 h-5" />, cost: 600 },
    { type: 'airforce', label: 'Air', icon: <Plane className="w-5 h-5" />, cost: 700 },
    { type: 'intelligence', label: 'Intel', icon: <Eye className="w-5 h-5" />, cost: 400 },
    { type: 'missile', label: 'Missile', icon: <Rocket className="w-5 h-5" />, cost: 800 },
  ];

  const isSelected = (type: BaseType) => {
    if (!selectedTool) return false;
    if (selectedTool.type === 'hq' && type === 'hq') return true;
    if (selectedTool.type === 'base' && selectedTool.baseType === type) return true;
    return false;
  };

  const handleSelect = (type: BaseType) => {
    if (type === 'hq') {
      if (hq) return; // Already have HQ
      selectTool({ type: 'hq' });
    } else {
      selectTool({ type: 'base', baseType: type });
    }
  };

  return (
    <div className="tactical-panel w-64 flex flex-col h-full">
      <div className="tactical-header scanline">
        ASSET PALETTE
      </div>
      
      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* Bases Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            Installations
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {baseOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleSelect(option.type)}
                disabled={option.type === 'hq' && !!hq}
                className={`
                  tactical-button flex flex-col items-center gap-1 p-3 rounded border transition-all
                  ${isSelected(option.type) 
                    ? 'bg-primary/20 border-primary text-primary glow-primary' 
                    : 'bg-muted/30 border-border hover:border-primary/50 text-foreground'
                  }
                  ${option.type === 'hq' && hq ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {option.icon}
                <span className="text-xs font-mono">{option.label}</span>
                {option.cost > 0 && (
                  <span className="text-[10px] text-muted-foreground">${option.cost}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Units Section - Only show if HQ exists */}
        {hq && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3" />
              Quick Deploy
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Click a base on the map to train units
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-muted/20 rounded border border-border/50">
          <h4 className="text-xs font-mono text-primary mb-2">INSTRUCTIONS</h4>
          <ul className="text-[10px] text-muted-foreground space-y-1 font-mono">
            {!hq && (
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-accent rounded-full" />
                Select HQ and click globe to place
              </li>
            )}
            {hq && (
              <>
                <li>• Select base type to build</li>
                <li>• Click globe to place</li>
                <li>• Click base to train units</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border p-2 bg-muted/30">
        <div className="text-[10px] font-mono text-muted-foreground">
          TOOL: {selectedTool 
            ? selectedTool.type === 'hq' 
              ? 'PLACE HQ'
              : selectedTool.type === 'base'
                ? `PLACE ${selectedTool.baseType?.toUpperCase()}`
                : 'DEPLOY UNIT'
            : 'NONE'
          }
        </div>
      </div>
    </div>
  );
}
