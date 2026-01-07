import { forwardRef, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { 
  Pause, 
  Play, 
  FastForward,
  RotateCcw,
  Zap,
  Clock
} from 'lucide-react';

const TimeControls = forwardRef<HTMLDivElement>(function TimeControls(_, ref) {
  const { speed, setSpeed, runTick, resetGame, tick, hq } = useGameStore();
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }

    if (speed > 0 && hq) {
      const interval = 1000 / speed;
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
    { value: 0, icon: <Pause className="w-3.5 h-3.5" />, label: 'Pause' },
    { value: 1, icon: <Play className="w-3.5 h-3.5" />, label: '1×' },
    { value: 2, icon: <FastForward className="w-3.5 h-3.5" />, label: '2×' },
    { value: 4, icon: <Zap className="w-3.5 h-3.5" />, label: '4×' },
  ];

  return (
    <div className="bg-background/80 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Time display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wide">Time</span>
          </div>
          <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
            T+{String(tick).padStart(6, '0')}
          </div>
        </div>

        {/* Center: Speed controls */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSpeed(option.value)}
              disabled={!hq && option.value > 0}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all duration-150
                ${speed === option.value 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/10'
                }
                ${!hq && option.value > 0 ? 'opacity-30 cursor-not-allowed' : ''}
              `}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Reset and status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Reset game? All progress will be lost.')) {
                resetGame();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${speed > 0 && hq ? 'bg-friendly' : 'bg-muted-foreground/40'}`} />
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
              {!hq ? 'Awaiting HQ' : speed === 0 ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TimeControls;
