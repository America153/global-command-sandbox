import { forwardRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Rocket, Target } from 'lucide-react';
import { MISSILE_TEMPLATES } from '@/types/game';

const MissileTracker = forwardRef<HTMLDivElement>(function MissileTracker(_, ref) {
  const { missilesInFlight, tick } = useGameStore();

  if (missilesInFlight.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 w-64 tactical-panel z-50">
      <div className="tactical-header flex items-center gap-2">
        <Rocket className="w-4 h-4 text-destructive" />
        MISSILES IN FLIGHT ({missilesInFlight.length})
      </div>
      
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {missilesInFlight.map((missile) => {
          const template = MISSILE_TEMPLATES[missile.missileType];
          const totalFlightTicks = missile.arrivalTick - missile.launchTick;
          const ticksRemaining = Math.max(0, missile.arrivalTick - tick);
          const progress = ((totalFlightTicks - ticksRemaining) / totalFlightTicks) * 100;
          const secondsRemaining = Math.ceil(ticksRemaining / 10);
          
          return (
            <div 
              key={missile.id} 
              className="bg-destructive/10 border border-destructive/30 rounded p-2 space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-destructive flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  {template.name}
                </span>
                <span className="font-mono text-destructive text-[10px]">
                  T-{secondsRemaining}s
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Target className="w-3 h-3" />
                <span>
                  {missile.targetPosition.latitude.toFixed(2)}°, {missile.targetPosition.longitude.toFixed(2)}°
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-destructive to-orange-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Impact warning when close */}
              {secondsRemaining <= 3 && (
                <div className="text-[8px] text-destructive font-mono text-center">
                  ⚠️ IMPACT IMMINENT ⚠️
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default MissileTracker;
