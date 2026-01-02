import { useEffect, useRef, useState, useCallback } from 'react';
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
  
  const { bases, units, territories } = useGameStore();

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
    
    // Small delay to ensure container is mounted
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

  // Auto-rotate
  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;
    
    const globe = globeRef.current;
    if (globe.controls) {
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.3;
    }
    globe.pointOfView({ altitude: 2.5 });
  }, [isLoaded, dimensions]);

  const handleGlobeClick = useCallback((coords: { lat: number; lng: number } | null, event?: MouseEvent) => {
    console.log('Globe clicked:', coords);
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  const handlePolygonClick = useCallback((polygon: any, event: MouseEvent, coords: { lat: number; lng: number }) => {
    console.log('Polygon clicked:', coords);
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      onGlobeClick(coords.lat, coords.lng);
    }
  }, [onGlobeClick]);

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'player': return 'rgba(34, 197, 94, 0.3)';
      case 'ai': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  // Prepare points data for bases and units
  const basePoints = bases.map(base => ({
    lat: base.position.latitude,
    lng: base.position.longitude,
    name: base.name,
    type: base.type,
    faction: base.faction,
    size: base.type === 'hq' ? 0.8 : 0.5,
    color: base.faction === 'player' ? '#22c55e' : base.faction === 'ai' ? '#ef4444' : '#6b7280',
    base,
  }));

  const unitPoints = units.map(unit => ({
    lat: unit.position.latitude,
    lng: unit.position.longitude,
    name: unit.templateType.substring(0, 3).toUpperCase(),
    size: 0.3,
    color: unit.faction === 'player' ? '#22c55e' : '#ef4444',
  }));

  const allPoints = [...basePoints, ...unitPoints];

  // Territory rings
  const territoryRings = territories.map(t => ({
    lat: t.position.latitude,
    lng: t.position.longitude,
    maxR: t.radius / 111, // Convert km to degrees approx
    propagationSpeed: 0,
    repeatPeriod: 0,
    color: getFactionColor(t.faction),
  }));

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
        polygonCapColor={() => 'rgba(20, 30, 45, 0.8)'}
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
        ringsData={territoryRings}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringColor="color"
        ringAltitude={0.003}
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
