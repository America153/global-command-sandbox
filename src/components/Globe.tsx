import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import { useGameStore } from '@/store/gameStore';
import { MISSILE_TEMPLATES } from '@/types/game';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
}

export default function Globe({ onGlobeClick }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countriesData, setCountriesData] = useState<any>({ features: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { bases, units, territories, homeCountryId, occupiedCountryIds, struckCountryIds, missilesInFlight, explosions, aiEnemy } = useGameStore();
  
  // Check if player has intel capability for enemy unit visibility
  const hasIntelBase = useMemo(() => bases.some(b => b.type === 'intelligence' && b.faction === 'player'), [bases]);
  
  // Compute visible enemy entities based on revealed bases and intel capability
  const visibleEnemyBases = useMemo(() => 
    aiEnemy.bases.filter(base => aiEnemy.revealedBases.includes(base.id)),
    [aiEnemy.bases, aiEnemy.revealedBases]
  );
  
  const visibleEnemyUnits = useMemo(() => 
    hasIntelBase ? aiEnemy.units : [],
    [hasIntelBase, aiEnemy.units]
  );

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 100);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Load countries GeoJSON
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        import('topojson-client').then(topojson => {
          const geojson = topojson.feature(topology, topology.objects.countries);
          setCountriesData(geojson);
          setIsLoaded(true);
        });
      })
      .catch(console.error);
  }, []);

  // Setup globe (no auto-rotate)
  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;
    
    const globe = globeRef.current;
    if (globe.controls) {
      globe.controls().autoRotate = false;
    }
    globe.pointOfView({ altitude: 2.5 });
  }, [isLoaded, dimensions]);

  // Click handler for globe
  const handleGlobeClick = useCallback((coords: { lat: number; lng: number } | null, event?: MouseEvent) => {
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  // Click handler for polygons (countries)
  const handlePolygonClick = useCallback((polygon: any, event: MouseEvent, coords: { lat: number; lng: number }) => {
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  // Get country color based on control
  const getPolygonColor = useCallback((feature: any) => {
    const rawId = feature?.id ?? feature?.properties?.id;
    const countryId = rawId != null ? String(rawId) : null;

    // NOTE: use legacy hsla() syntax because react-globe.gl's color parser
    // doesn't fully support the newer "hsl(... / a)" CSS format.
    
    // Struck countries are bright red
    if (countryId && struckCountryIds.includes(countryId)) {
      return 'hsla(0, 100%, 50%, 0.7)'; // Bright red for missile struck
    }

    if (countryId && homeCountryId && countryId === String(homeCountryId)) {
      return 'hsla(217, 91%, 60%, 0.55)'; // Blue for HQ country
    }

    if (countryId && occupiedCountryIds.includes(countryId)) {
      return 'hsla(0, 84%, 60%, 0.55)'; // Red for crossed/occupied
    }

    return 'hsla(215, 28%, 17%, 0.85)'; // Default dark
  }, [homeCountryId, occupiedCountryIds, struckCountryIds]);

  // Get base icon based on type
  const getBaseIcon = (type: string) => {
    switch (type) {
      case 'hq': return '⊕';
      case 'army': return '🛡';
      case 'navy': return '⚓';
      case 'airforce': return '✈';
      case 'intelligence': return '👁';
      case 'missile': return '🚀';
      default: return '●';
    }
  };
  // Flat labels for player bases (rendered on globe surface)
  const baseLabels = useMemo(() => {
    const allBases = [...bases, ...visibleEnemyBases];
    return allBases.map(base => ({
      lat: base.position.latitude,
      lng: base.position.longitude,
      text: `${getBaseIcon(base.type)} ${base.name}`,
      color: base.faction === 'player' ? '#22c55e' : '#ef4444',
      size: base.type === 'hq' ? 0.6 : 0.4,
      base,
    }));
  }, [bases, visibleEnemyBases]);

  // Flat labels for units - player units always visible, enemy units only with intel
  const unitLabels = useMemo(() => {
    const allUnits = [...units, ...visibleEnemyUnits];
    return allUnits.map(unit => ({
      lat: unit.position.latitude,
      lng: unit.position.longitude,
      text: `◆ ${unit.templateType.substring(0, 3).toUpperCase()}`,
      color: unit.faction === 'player' ? '#ffffff' : '#ff6666',
      size: 1.2,
    }));
  }, [units, visibleEnemyUnits]);

  const allLabels = useMemo(() => [...baseLabels, ...unitLabels], [baseLabels, unitLabels]);

  // Movement arcs for units with destinations
  const movementArcs = useMemo(() => units
    .filter(unit => unit.status === 'moving' && unit.destination)
    .map(unit => ({
      startLat: unit.position.latitude,
      startLng: unit.position.longitude,
      endLat: unit.destination!.latitude,
      endLng: unit.destination!.longitude,
      color: unit.faction === 'player' ? ['#22c55e', '#86efac'] : ['#ef4444', '#fca5a5'],
      name: unit.name,
    })), [units]);

  // Missile arcs - more visible with thicker stroke and brighter colors
  const missileArcs = useMemo(() => missilesInFlight.map(missile => ({
    startLat: missile.startPosition.latitude,
    startLng: missile.startPosition.longitude,
    endLat: missile.targetPosition.latitude,
    endLng: missile.targetPosition.longitude,
    color: ['#ff0000', '#ffff00', '#ff6600'],
    name: `🚀 ${MISSILE_TEMPLATES[missile.missileType]?.name || 'Missile'} → Target`,
    stroke: 2,
    dashLength: 0.6,
    dashGap: 0.1,
    dashAnimateTime: 500,
  })), [missilesInFlight]);

  const allArcs = useMemo(() => [...movementArcs, ...missileArcs], [movementArcs, missileArcs]);

  // Explosion rings (animated growing circles)
  const explosionRings = useMemo(() => explosions.map(explosion => ({
    lat: explosion.position.latitude,
    lng: explosion.position.longitude,
    maxR: 3,
    propagationSpeed: 2,
    repeatPeriod: 1000,
    color: () => 'rgba(255, 100, 0, 0.8)',
  })), [explosions]);

  // Explosion points (bright center points)
  const explosionPoints = useMemo(() => explosions.map(explosion => ({
    lat: explosion.position.latitude,
    lng: explosion.position.longitude,
    size: 2,
    color: '#ff4400',
  })), [explosions]);

  if (!isLoaded || dimensions.width === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-mono text-sm">INITIALIZING BATTLESPACE...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0f14]">
      <GlobeGL
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        polygonsData={countriesData.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(40, 60, 90, 0.4)'}
        polygonStrokeColor={() => '#ffffff'}
        polygonAltitude={0.006}
        onPolygonClick={handlePolygonClick}
        labelsData={allLabels}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelColor="color"
        labelSize="size"
        labelAltitude={0.01}
        labelDotRadius={0.4}
        labelResolution={3}
        onLabelClick={(label: any) => {
          if (label.base) {
            useGameStore.getState().selectBase(label.base);
          }
        }}
        onGlobeClick={handleGlobeClick}
        arcsData={allArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={(d: any) => d.dashLength || 0.4}
        arcDashGap={(d: any) => d.dashGap || 0.2}
        arcDashAnimateTime={(d: any) => d.dashAnimateTime || 1500}
        arcStroke={(d: any) => d.stroke || 0.5}
        arcAltitudeAutoScale={0.4}
        arcLabel={(d: any) => `<div style="font-family: monospace; background: rgba(0,0,0,0.9); padding: 6px 10px; border-radius: 4px; color: ${d.stroke ? '#ff4444' : 'white'}; border: 1px solid ${d.stroke ? '#ff4444' : '#333'};">${d.name}</div>`}
        ringsData={explosionRings}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        ringAltitude={0.015}
        pointsData={explosionPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius="size"
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
