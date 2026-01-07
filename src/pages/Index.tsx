import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { loadCountries } from '@/data/countries';
import AssetPalette from '@/components/AssetPalette';
import IntelPanel from '@/components/IntelPanel';
import TimeControls from '@/components/TimeControls';
import TopBar from '@/components/TopBar';
import Globe from '@/components/Globe';
import BaseDetailsPanel from '@/components/BaseDetailsPanel';
import DeploymentPanel from '@/components/DeploymentPanel';
import MissileTracker from '@/components/MissileTracker';
import UnitContextMenu from '@/components/UnitContextMenu';
import type { Unit } from '@/types/game';

export default function Index() {
  useEffect(() => {
    // Preload borders so HQ/occupation detection works immediately
    void loadCountries();
  }, []);

  const { selectedTool, placeHQ, placeBase, addLog, deployment, deployUnits, missileTargeting, fireMissile, selectedUnit, selectUnit } = useGameStore();
  const [unitMenuPosition, setUnitMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const handleGlobeClick = useCallback((lat: number, lng: number) => {
    const position = { latitude: lat, longitude: lng };

    // Close unit context menu on globe click
    if (selectedUnit) {
      selectUnit(null);
      setUnitMenuPosition(null);
    }

    // Handle missile targeting mode first
    if (missileTargeting.isActive) {
      fireMissile(position);
      return;
    }

    // Handle deployment mode
    if (deployment.isActive) {
      deployUnits(deployment.selectedUnitIds, position);
      return;
    }

    if (!selectedTool) {
      addLog('info', `Coordinates: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      return;
    }

    if (selectedTool.type === 'hq') {
      placeHQ(position);
    } else if (selectedTool.type === 'base') {
      placeBase(selectedTool.baseType!, position);
    }
  }, [selectedTool, placeHQ, placeBase, addLog, deployment, deployUnits, missileTargeting, fireMissile, selectedUnit, selectUnit]);

  const handleUnitClick = useCallback((unit: Unit, screenPosition: { x: number; y: number }) => {
    if (unit.faction === 'player') {
      selectUnit(unit);
      setUnitMenuPosition(screenPosition);
    }
  }, [selectUnit]);

  const handleCloseUnitMenu = useCallback(() => {
    selectUnit(null);
    setUnitMenuPosition(null);
  }, [selectUnit]);

  const getSelectedToolLabel = () => {
    if (!selectedTool) return null;
    if (selectedTool.type === 'hq') return 'hq';
    if (selectedTool.type === 'base') return selectedTool.baseType;
    return null;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar selectedTool={getSelectedToolLabel()} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Asset Palette */}
        <AssetPalette />

        {/* Center - Globe */}
        <div className="flex-1 relative">
          <Globe onGlobeClick={handleGlobeClick} onUnitClick={handleUnitClick} />
          
          {/* Base Details Panel */}
          <BaseDetailsPanel />
          
          {/* Deployment Panel */}
          <DeploymentPanel />
          
          {/* Missile Tracker */}
          <MissileTracker />
          
          {/* Unit Context Menu */}
          {selectedUnit && unitMenuPosition && (
            <UnitContextMenu 
              unit={selectedUnit} 
              screenPosition={unitMenuPosition} 
              onClose={handleCloseUnitMenu} 
            />
          )}
          
          {/* Coordinate Overlay */}
          <div className="absolute bottom-4 left-4 bg-background/60 backdrop-blur-xl rounded-lg px-3 py-2 border border-white/10">
            <span className="text-[10px] text-muted-foreground/70">
              {missileTargeting.isActive 
                ? '🎯 Click to select missile target' 
                : deployment.isActive 
                  ? 'Click to set deployment destination' 
                  : 'Click globe to interact'}
            </span>
          </div>
        </div>

        {/* Right Panel - Intel */}
        <IntelPanel />
      </div>

      {/* Bottom Bar - Time Controls */}
      <TimeControls />
    </div>
  );
}
