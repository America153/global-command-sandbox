import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import { useGameStore } from '@/store/gameStore';
import { MISSILE_TEMPLATES } from '@/types/game';
import type { Unit } from '@/types/game';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
  onUnitClick?: (unit: Unit, screenPosition: { x: number; y: number }) => void;
}

export default function Globe({ onGlobeClick, onUnitClick }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countriesData, setCountriesData] = useState<any>({ features: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { bases, units, territories, homeCountryId, occupiedCountryIds, capturedCountryIds, struckCountryIds, missilesInFlight, explosions, aiEnemy } = useGameStore();
  
  const hasIntelBase = useMemo(() => bases.some(b => b.type === 'intelligence' && b.faction === 'player'), [bases]);
  
  const visibleEnemyBases = useMemo(() => 
    aiEnemy.bases.filter(base => aiEnemy.revealedBases.includes(base.id)),
    [aiEnemy.bases, aiEnemy.revealedBases]
  );
  
  const visibleEnemyUnits = useMemo(() => 
    hasIntelBase ? aiEnemy.units : [],
    [hasIntelBase, aiEnemy.units]
  );

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

  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;
    
    const globe = globeRef.current;
    if (globe.controls) {
      globe.controls().autoRotate = false;
      globe.controls().enableDamping = true;
      globe.controls().dampingFactor = 0.1;
    }
    globe.pointOfView({ altitude: 2.2 });
  }, [isLoaded, dimensions]);

  const handleGlobeClick = useCallback((coords: { lat: number; lng: number } | null, event?: MouseEvent) => {
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  const handlePolygonClick = useCallback((polygon: any, event: MouseEvent, coords: { lat: number; lng: number }) => {
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  const getPolygonColor = useCallback((feature: any) => {
    const rawId = feature?.id ?? feature?.properties?.id;
    const countryId = rawId != null ? String(rawId) : null;
    
    if (countryId && capturedCountryIds.includes(countryId)) {
      return 'hsla(142, 70%, 45%, 0.6)';
    }
    
    if (countryId && homeCountryId && countryId === String(homeCountryId)) {
      return 'hsla(142, 70%, 50%, 0.5)';
    }
    
    if (countryId && struckCountryIds.includes(countryId)) {
      return 'hsla(0, 80%, 50%, 0.65)';
    }

    if (countryId && occupiedCountryIds.includes(countryId)) {
      return 'hsla(0, 70%, 45%, 0.5)';
    }

    return 'hsla(220, 20%, 18%, 0.7)';
  }, [homeCountryId, occupiedCountryIds, capturedCountryIds, struckCountryIds]);

  const getBaseIcon = (type: string) => {
    switch (type) {
      case 'hq': return '◉';
      case 'army': return '▣';
      case 'navy': return '◈';
      case 'airforce': return '△';
      case 'intelligence': return '◎';
      case 'missile': return '◆';
      default: return '●';
    }
  };

  const baseLabels = useMemo(() => {
    const allBases = [...bases, ...visibleEnemyBases];
    return allBases.map(base => ({
      lat: base.position.latitude,
      lng: base.position.longitude,
      text: `${getBaseIcon(base.type)} ${base.name}`,
      color: base.faction === 'player' ? '#4ade80' : '#f87171',
      size: base.type === 'hq' ? 0.55 : 0.4,
      base,
    }));
  }, [bases, visibleEnemyBases]);

  const unitLabels = useMemo(() => {
    const allUnits = [...units, ...visibleEnemyUnits];
    return allUnits.map(unit => ({
      lat: unit.position.latitude,
      lng: unit.position.longitude,
      text: `● ${unit.templateType.substring(0, 3).toUpperCase()}`,
      color: unit.faction === 'player' ? '#e2e8f0' : '#fca5a5',
      size: 0.4,
      unit: unit,
    }));
  }, [units, visibleEnemyUnits]);

  const allLabels = useMemo(() => [...baseLabels, ...unitLabels], [baseLabels, unitLabels]);

  const movementArcs = useMemo(() => units
    .filter(unit => unit.status === 'moving' && unit.destination)
    .map(unit => ({
      startLat: unit.position.latitude,
      startLng: unit.position.longitude,
      endLat: unit.destination!.latitude,
      endLng: unit.destination!.longitude,
      color: unit.faction === 'player' ? ['#4ade80', '#86efac'] : ['#f87171', '#fca5a5'],
      name: unit.name,
    })), [units]);

  const missileArcs = useMemo(() => missilesInFlight.map(missile => ({
    startLat: missile.startPosition.latitude,
    startLng: missile.startPosition.longitude,
    endLat: missile.targetPosition.latitude,
    endLng: missile.targetPosition.longitude,
    color: ['#ef4444', '#f97316', '#eab308'],
    name: `${MISSILE_TEMPLATES[missile.missileType]?.name || 'Missile'} → Target`,
    stroke: 1.5,
    dashLength: 0.5,
    dashGap: 0.15,
    dashAnimateTime: 400,
  })), [missilesInFlight]);

  const allArcs = useMemo(() => [...movementArcs, ...missileArcs], [movementArcs, missileArcs]);

  const explosionRings = useMemo(() => explosions.map(explosion => ({
    lat: explosion.position.latitude,
    lng: explosion.position.longitude,
    maxR: 2.5,
    propagationSpeed: 2.5,
    repeatPeriod: 800,
    color: () => 'rgba(251, 146, 60, 0.7)',
  })), [explosions]);

  const explosionPoints = useMemo(() => explosions.map(explosion => ({
    lat: explosion.position.latitude,
    lng: explosion.position.longitude,
    size: 1.5,
    color: '#fb923c',
  })), [explosions]);

  if (!isLoaded || dimensions.width === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-[#080c10]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground/60 text-xs tracking-wide">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050810]">
      <GlobeGL
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="/globe/earth-blue-marble.jpg"
        backgroundImageUrl="/globe/night-sky.png"
        bumpImageUrl="/globe/earth-topology.png"
        polygonsData={countriesData.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(30, 45, 70, 0.3)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.15)'}
        polygonAltitude={0.005}
        onPolygonClick={handlePolygonClick}
        labelsData={allLabels}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelColor="color"
        labelSize="size"
        labelAltitude={0.008}
        labelDotRadius={0.3}
        labelResolution={2}
        onLabelClick={(label: any, event: MouseEvent) => {
          if (label.base) {
            useGameStore.getState().selectBase(label.base);
          } else if (label.unit && onUnitClick) {
            onUnitClick(label.unit, { x: event.clientX, y: event.clientY });
          }
        }}
        onGlobeClick={handleGlobeClick}
        arcsData={allArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={(d: any) => d.dashLength || 0.35}
        arcDashGap={(d: any) => d.dashGap || 0.2}
        arcDashAnimateTime={(d: any) => d.dashAnimateTime || 1200}
        arcStroke={(d: any) => d.stroke || 0.4}
        arcAltitudeAutoScale={0.35}
        arcLabel={(d: any) => `<div style="font-family: system-ui; font-size: 11px; background: rgba(0,0,0,0.85); padding: 5px 8px; border-radius: 6px; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.1);">${d.name}</div>`}
        ringsData={explosionRings}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        ringAltitude={0.012}
        pointsData={explosionPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.015}
        pointRadius="size"
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.18}
      />
    </div>
  );
}
