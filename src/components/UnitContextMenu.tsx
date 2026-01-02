import { useState } from 'react';
import { X, Navigation, Home, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import type { Unit } from '@/types/game';

interface UnitContextMenuProps {
  unit: Unit;
  screenPosition: { x: number; y: number };
  onClose: () => void;
}

export default function UnitContextMenu({ unit, screenPosition, onClose }: UnitContextMenuProps) {
  const { bases, startDeployment, moveUnit } = useGameStore();
  const [showBaseList, setShowBaseList] = useState(false);

  const playerBases = bases.filter(b => b.faction === 'player');
  const parentBase = bases.find(b => b.id === unit.parentBaseId);

  const handleRedeploy = () => {
    // Start deployment mode for this single unit
    startDeployment([unit.id]);
    onClose();
  };

  const handleReturnToBase = (baseId: string) => {
    const base = bases.find(b => b.id === baseId);
    if (base) {
      moveUnit(unit.id, base.position);
      onClose();
    }
  };

  // Position the menu near the click but ensure it stays on screen
  const menuStyle = {
    left: Math.min(screenPosition.x, window.innerWidth - 250),
    top: Math.min(screenPosition.y, window.innerHeight - 300),
  };

  return (
    <div 
      className="fixed inset-0 z-50" 
      onClick={onClose}
    >
      <div 
        className="absolute bg-card border border-border rounded-lg shadow-xl w-56 overflow-hidden"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-friendly" />
            <span className="text-sm font-bold truncate">{unit.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Unit Info */}
        <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground">
          <div>Type: {unit.templateType}</div>
          <div>Status: {unit.status}</div>
          <div>Health: {unit.health}/{unit.maxHealth}</div>
        </div>

        {/* Actions */}
        <div className="p-2 space-y-1">
          {!showBaseList ? (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-9"
                onClick={handleRedeploy}
              >
                <Navigation className="w-4 h-4" />
                <span>Redeploy</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-9"
                onClick={() => setShowBaseList(true)}
              >
                <Home className="w-4 h-4" />
                <span>Return to Base</span>
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-2 py-1">Select destination:</div>
              {playerBases.map(base => (
                <Button
                  key={base.id}
                  variant="ghost"
                  className="w-full justify-start gap-2 h-8 text-xs"
                  onClick={() => handleReturnToBase(base.id)}
                >
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{base.name}</span>
                </Button>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground"
                onClick={() => setShowBaseList(false)}
              >
                ← Back
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
