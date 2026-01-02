import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BASE_CONFIG, UNIT_TEMPLATES } from '@/types/game';
import type { UnitType, BaseType, Unit } from '@/types/game';
import { X, Users, Crosshair, Shield, Ship, Plane, Eye, CheckSquare, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
// Map base types to allowed unit types
const ALLOWED_UNITS: Record<BaseType, UnitType[]> = {
  hq: ['infantry', 'armor', 'engineer', 'intel_team'],
  army: ['infantry', 'armor', 'artillery', 'air_defense', 'engineer', 'special_forces'],
  navy: ['destroyer', 'carrier', 'submarine', 'frigate', 'amphibious'],
  airforce: ['fighter', 'bomber', 'transport', 'helicopter', 'drone'],
  intelligence: ['cyber_team', 'intel_team', 'special_forces', 'drone'],
};

export default function BaseDetailsPanel() {
  const { selectedBase, selectBase, produceUnit, resources, units, addLog, startDeployment } = useGameStore();
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

  if (!selectedBase) return null;

  const baseDef = BASE_CONFIG[selectedBase.type];
  const stationedUnits = units.filter(u => u.parentBaseId === selectedBase.id);
  const allowedUnits = ALLOWED_UNITS[selectedBase.type] || [];

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const selectAllUnits = () => {
    setSelectedUnits(new Set(stationedUnits.map(u => u.id)));
  };

  const clearSelection = () => {
    setSelectedUnits(new Set());
  };

  const createTaskForce = () => {
    if (selectedUnits.size === 0) {
      toast.error('Select at least one unit to create a task force');
      return;
    }
    const taskForceName = `Task Force ${Math.floor(Math.random() * 900) + 100}`;
    addLog('combat', `${taskForceName} created with ${selectedUnits.size} units at ${selectedBase.name}`);
    toast.success(`${taskForceName} created with ${selectedUnits.size} units`);
    setSelectedUnits(new Set());
  };

  const handleDeployment = () => {
    if (selectedUnits.size === 0) {
      toast.error('Select at least one unit to deploy');
      return;
    }
    startDeployment(Array.from(selectedUnits));
    toast.info('Click on the globe to set deployment destination');
    setSelectedUnits(new Set());
  };

  const getBaseIcon = () => {
    switch (selectedBase.type) {
      case 'hq': return <Crosshair className="w-6 h-6" />;
      case 'army': return <Shield className="w-6 h-6" />;
      case 'navy': return <Ship className="w-6 h-6" />;
      case 'airforce': return <Plane className="w-6 h-6" />;
      case 'intelligence': return <Eye className="w-6 h-6" />;
    }
  };

  const handleProduction = (unitType: UnitType) => {
    produceUnit(selectedBase.id, unitType);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[500px] max-w-[90vw] tactical-panel z-50">
      {/* Header */}
      <div className="tactical-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getBaseIcon()}
          <span>{selectedBase.name}</span>
        </div>
        <button
          onClick={() => selectBase(null)}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Health:</span>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={(selectedBase.health / selectedBase.maxHealth) * 100} className="h-2" />
              <span className="font-mono text-xs">{selectedBase.health}/{selectedBase.maxHealth}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Influence Radius:</span>
            <span className="font-mono ml-2">{selectedBase.influenceRadius}km</span>
          </div>
        </div>

        {/* Stationed Units */}
        {stationedUnits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3" />
                Stationed Units ({stationedUnits.length})
              </h4>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAllUnits} className="text-primary hover:underline">Select All</button>
                <button onClick={clearSelection} className="text-muted-foreground hover:underline">Clear</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {stationedUnits.map((unit) => {
                const isSelected = selectedUnits.has(unit.id);
                return (
                  <button
                    key={unit.id}
                    onClick={() => toggleUnitSelection(unit.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                      isSelected 
                        ? 'bg-primary/30 border border-primary' 
                        : 'bg-muted/30 border border-transparent hover:border-muted-foreground/50'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    {unit.templateType}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Train Units */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Train Units
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {allowedUnits.map((unitType) => {
              const unitDef = UNIT_TEMPLATES[unitType];
              if (!unitDef) return null;
              const canAfford = resources >= unitDef.cost;
              
              return (
                <button
                  key={unitType}
                  onClick={() => handleProduction(unitType)}
                  disabled={!canAfford}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded border transition-all text-xs
                    ${canAfford 
                      ? 'bg-muted/30 border-border hover:border-primary hover:bg-primary/10' 
                      : 'bg-muted/10 border-border/50 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="font-mono">{unitDef.name}</span>
                  <span className="text-[10px] text-muted-foreground">${unitDef.cost}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {stationedUnits.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`py-2 px-4 rounded font-mono text-sm transition-colors ${
                  selectedUnits.size > 0
                    ? 'bg-primary/20 border border-primary text-primary hover:bg-primary/30'
                    : 'bg-muted/20 border border-muted text-muted-foreground cursor-not-allowed'
                }`}
                onClick={createTaskForce}
                disabled={selectedUnits.size === 0}
              >
                TASK FORCE {selectedUnits.size > 0 && `(${selectedUnits.size})`}
              </button>
              <button
                className={`py-2 px-4 rounded font-mono text-sm transition-colors ${
                  selectedUnits.size > 0
                    ? 'bg-destructive/20 border border-destructive text-destructive hover:bg-destructive/30'
                    : 'bg-muted/20 border border-muted text-muted-foreground cursor-not-allowed'
                }`}
                onClick={handleDeployment}
                disabled={selectedUnits.size === 0}
              >
                DEPLOY {selectedUnits.size > 0 && `(${selectedUnits.size})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
