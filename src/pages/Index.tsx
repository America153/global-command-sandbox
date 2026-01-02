import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { loadCountries } from '@/data/countries';
import AssetPalette from '@/components/AssetPalette';
import IntelPanel from '@/components/IntelPanel';
import TimeControls from '@/components/TimeControls';
import TopBar from '@/components/TopBar';
import Globe from '@/components/Globe';
import BaseDetailsPanel from '@/components/BaseDetailsPanel';
import DeploymentPanel from '@/components/DeploymentPanel';

export default function Index() {
  useEffect(() => {
    // Preload borders so HQ/occupation detection works immediately
    void loadCountries();
  }, []);

  const { selectedTool, placeHQ, placeBase, addLog, deployment, deployUnits } = useGameStore();

  const handleGlobeClick = useCallback((lat: number, lng: number) => {
    const position = { latitude: lat, longitude: lng };

    // Handle deployment mode first
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
  }, [selectedTool, placeHQ, placeBase, addLog, deployment, deployUnits]);

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
          <Globe onGlobeClick={handleGlobeClick} />
          
          {/* Base Details Panel */}
          <BaseDetailsPanel />
          
          {/* Deployment Panel */}
          <DeploymentPanel />
          
          {/* Coordinate Overlay */}
          <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded px-3 py-1.5 border border-border">
            <span className="text-xs font-mono text-muted-foreground">
              {deployment.isActive ? 'Click to set deployment destination' : 'Click globe to interact'}
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
