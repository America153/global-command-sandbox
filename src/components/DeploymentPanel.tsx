import { useGameStore } from '@/store/gameStore';
import { X, Navigation, AlertCircle } from 'lucide-react';

export default function DeploymentPanel() {
  const { deployment, cancelDeployment, units } = useGameStore();

  if (!deployment.isActive) return null;

  const selectedUnits = units.filter(u => deployment.selectedUnitIds.includes(u.id));

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] max-w-[90vw] tactical-panel z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="tactical-header flex items-center justify-between bg-destructive/20 border-b border-destructive">
        <div className="flex items-center gap-2 text-destructive">
          <Navigation className="w-5 h-5" />
          <span className="font-mono uppercase tracking-wider">Deployment Mode</span>
        </div>
        <button
          onClick={cancelDeployment}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Click anywhere on the globe</p>
            <p className="text-muted-foreground">to deploy selected units to that location</p>
          </div>
        </div>

        {/* Selected Units */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Deploying {selectedUnits.length} Units
          </h4>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {selectedUnits.map((unit) => (
              <span
                key={unit.id}
                className="px-2 py-1 bg-destructive/20 border border-destructive/30 rounded text-xs font-mono"
              >
                {unit.name}
              </span>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={cancelDeployment}
          className="w-full py-2 px-4 bg-muted/30 border border-border text-muted-foreground rounded font-mono text-sm hover:bg-muted/50 transition-colors"
        >
          CANCEL DEPLOYMENT
        </button>
      </div>
    </div>
  );
}