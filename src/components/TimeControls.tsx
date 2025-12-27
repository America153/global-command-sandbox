import { useGameStore } from '@/store/gameStore';
import { useEffect, useRef } from 'react';
import { 
  Pause, 
  Play, 
  FastForward,
  RotateCcw,
  Zap
} from 'lucide-react';

export default function TimeControls() {
  const { speed, setSpeed, runTick, resetGame, tick, hq } = useGameStore();
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game loop
  useEffect(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }

    if (speed > 0 && hq) {
      const interval = 1000 / speed; // Faster interval at higher speeds
      tickIntervalRef.current = setInterval(() => {
        runTick();
      }, interval);
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [speed, runTick, hq]);

  const speedOptions = [
    { value: 0, icon: <Pause className="w-4 h-4" />, label: 'PAUSE' },
    { value: 1, icon: <Play className="w-4 h-4" />, label: '1X' },
    { value: 2, icon: <FastForward className="w-4 h-4" />, label: '2X' },
    { value: 4, icon: <Zap className="w-4 h-4" />, label: '4X' },
  ];

  return (
    <div className="tactical-panel">
      <div className="flex items-center gap-4 px-4 py-2">
        {/* Time Display */}
        <div className="flex items-center gap-3 border-r border-border pr-4">
          <div className="text-xs font-mono text-muted-foreground">TIME</div>
          <div className="font-mono text-lg text-primary tabular-nums min-w-[80px]">
            T+{String(tick).padStart(6, '0')}
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSpeed(option.value)}
              disabled={!hq && option.value > 0}
              className={`
                tactical-button flex items-center gap-1 px-3 py-1.5 rounded transition-all
                ${speed === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/30 text-foreground hover:bg-muted/50'
                }
                ${!hq && option.value > 0 ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {option.icon}
              <span className="text-xs font-mono hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="border-l border-border h-6" />

        {/* Reset Button */}
        <button
          onClick={() => {
            if (confirm('Reset game? All progress will be lost.')) {
              resetGame();
            }
          }}
          className="tactical-button flex items-center gap-2 px-3 py-1.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs font-mono hidden sm:inline">RESET</span>
        </button>

        {/* Status Indicator */}
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${speed > 0 && hq ? 'bg-friendly animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-xs font-mono text-muted-foreground">
            {!hq ? 'AWAITING HQ' : speed === 0 ? 'PAUSED' : 'RUNNING'}
          </span>
        </div>
      </div>
    </div>
  );
}
