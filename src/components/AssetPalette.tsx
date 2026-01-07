import { useGameStore } from '@/store/gameStore';
import { 
  Building2, 
  Plane, 
  Ship, 
  Shield, 
  Eye, 
  Crosshair,
  Rocket,
  ChevronRight
} from 'lucide-react';
import type { BaseType } from '@/types/game';

export default function AssetPalette() {
  const { selectedTool, selectTool, hq } = useGameStore();

  const baseOptions: { type: BaseType; label: string; icon: React.ReactNode; cost: number }[] = [
    { type: 'hq', label: 'HQ', icon: <Crosshair className="w-4 h-4" />, cost: 0 },
    { type: 'army', label: 'Army', icon: <Shield className="w-4 h-4" />, cost: 500 },
    { type: 'navy', label: 'Navy', icon: <Ship className="w-4 h-4" />, cost: 600 },
    { type: 'airforce', label: 'Air', icon: <Plane className="w-4 h-4" />, cost: 700 },
    { type: 'intelligence', label: 'Intel', icon: <Eye className="w-4 h-4" />, cost: 400 },
    { type: 'missile', label: 'Missile', icon: <Rocket className="w-4 h-4" />, cost: 800 },
  ];

  const isSelected = (type: BaseType) => {
    if (!selectedTool) return false;
    if (selectedTool.type === 'hq' && type === 'hq') return true;
    if (selectedTool.type === 'base' && selectedTool.baseType === type) return true;
    return false;
  };

  const handleSelect = (type: BaseType) => {
    if (type === 'hq') {
      if (hq) return;
      selectTool({ type: 'hq' });
    } else {
      selectTool({ type: 'base', baseType: type });
    }
  };

  return (
    <div className="w-56 flex flex-col h-full bg-background/60 backdrop-blur-xl border-r border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide text-foreground/90">ASSETS</span>
        </div>
      </div>
      
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {/* Grid of installation buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          {baseOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              disabled={option.type === 'hq' && !!hq}
              className={`
                relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg transition-all duration-200
                ${isSelected(option.type) 
                  ? 'bg-primary/20 ring-1 ring-primary text-primary shadow-[0_0_12px_rgba(34,197,94,0.2)]' 
                  : 'bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground'
                }
                ${option.type === 'hq' && hq ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {option.icon}
              <span className="text-[10px] font-medium">{option.label}</span>
              {option.cost > 0 && (
                <span className="text-[9px] text-muted-foreground/70">${option.cost}</span>
              )}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-auto p-2.5 bg-white/5 rounded-lg border border-white/5">
          <div className="space-y-1.5">
            {!hq ? (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <ChevronRight className="w-3 h-3 text-accent" />
                <span>Select HQ and click globe</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <ChevronRight className="w-3 h-3 text-primary/60" />
                  <span>Select base type to build</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <ChevronRight className="w-3 h-3 text-primary/60" />
                  <span>Click base to train units</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active tool indicator */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">Tool</span>
          <span className="text-[10px] font-medium text-foreground/80">
            {selectedTool 
              ? selectedTool.type === 'hq' 
                ? 'Place HQ'
                : selectedTool.type === 'base'
                  ? `Place ${selectedTool.baseType}`
                  : 'Deploy'
              : 'None'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
