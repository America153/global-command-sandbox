import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import { useGameStore } from '@/store/gameStore';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
}

export default function Globe({ onGlobeClick }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countriesData, setCountriesData] = useState<any>({ features: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { bases, units, territories, homeCountryId, occupiedCountryIds } = useGameStore();

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

    if (countryId && homeCountryId && countryId === String(homeCountryId)) {
      return 'hsl(217 91% 60% / 0.55)'; // Blue for HQ country
    }

    if (countryId && occupiedCountryIds.includes(countryId)) {
      return 'hsl(0 84% 60% / 0.55)'; // Red for crossed/occupied
    }

    return 'hsl(215 28% 17% / 0.85)'; // Default dark
  }, [homeCountryId, occupiedCountryIds]);

  // Prepare points data for bases and units
  const basePoints = useMemo(() => bases.map(base => ({
    lat: base.position.latitude,
    lng: base.position.longitude,
    name: base.name,
    type: base.type,
    faction: base.faction,
    size: base.type === 'hq' ? 0.8 : 0.5,
    color: base.faction === 'player' ? '#22c55e' : base.faction === 'ai' ? '#ef4444' : '#6b7280',
    base,
  })), [bases]);

  const unitPoints = useMemo(() => units.map(unit => ({
    lat: unit.position.latitude,
    lng: unit.position.longitude,
    name: unit.templateType.substring(0, 3).toUpperCase(),
    size: 0.3,
    color: unit.faction === 'player' ? '#22c55e' : '#ef4444',
  })), [units]);

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

  const allPoints = useMemo(() => [...basePoints, ...unitPoints], [basePoints, unitPoints]);

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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countriesData.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(40, 60, 90, 0.4)'}
        polygonStrokeColor={() => '#ffffff'}
        polygonAltitude={0.006}
        onPolygonClick={handlePolygonClick}
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius="size"
        pointLabel={(d: any) => `<div style="font-family: monospace; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px; color: white;">${d.name}</div>`}
        onGlobeClick={handleGlobeClick}
        onPointClick={(point: any) => {
          if (point.base) {
            useGameStore.getState().selectBase(point.base);
          }
        }}
        arcsData={movementArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.3}
        arcLabel={(d: any) => `<div style="font-family: monospace; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px; color: white;">Moving: ${d.name}</div>`}
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
