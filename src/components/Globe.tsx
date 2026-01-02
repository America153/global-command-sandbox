import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGameStore } from '@/store/gameStore';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
}

export default function Globe({ onGlobeClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onGlobeClickRef = useRef(onGlobeClick);
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('mapbox_token') || '';
  });
  
  const { bases, units, territories } = useGameStore();

  // Keep callback ref updated
  useEffect(() => {
    onGlobeClickRef.current = onGlobeClick;
  }, [onGlobeClick]);

  // Initialize Mapbox viewer
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;
    
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 0,
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.on('style.load', () => {
      // Add atmosphere and fog for globe effect
      map.setFog({
        color: 'rgb(10, 15, 20)',
        'high-color': 'rgb(20, 30, 50)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(5, 10, 15)',
        'star-intensity': 0.6,
      });

      // Style country borders with white lines
      map.addLayer({
        id: 'country-borders',
        type: 'line',
        source: 'composite',
        'source-layer': 'admin',
        filter: ['==', ['get', 'admin_level'], 0],
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
          'line-opacity': 0.6,
        },
      });

      setIsLoaded(true);
    });

    // Click handler
    map.on('click', (e) => {
      onGlobeClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    // Slow rotation
    const secondsPerRevolution = 240;
    let userInteracting = false;

    function spinGlobe() {
      if (!mapRef.current) return;
      const zoom = mapRef.current.getZoom();
      if (!userInteracting && zoom < 5) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > 3) {
          const zoomDif = (5 - zoom) / 2;
          distancePerSecond *= zoomDif;
        }
        const center = mapRef.current.getCenter();
        center.lng -= distancePerSecond;
        mapRef.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.on('mousedown', () => { userInteracting = true; });
    map.on('dragstart', () => { userInteracting = true; });
    map.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.on('moveend', spinGlobe);
    
    map.on('load', spinGlobe);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  // Update markers when game state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const getFactionColor = (faction: string) => {
      switch (faction) {
        case 'player': return '#22c55e';
        case 'ai': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const getBaseIcon = (type: string): string => {
      switch (type) {
        case 'hq': return '⊕';
        case 'army': return '🛡';
        case 'navy': return '⚓';
        case 'airforce': return '✈';
        case 'intelligence': return '👁';
        default: return '●';
      }
    };

    // Add territory circles as layers if not exist
    territories.forEach((territory, idx) => {
      const sourceId = `territory-${idx}`;
      const layerId = `territory-layer-${idx}`;
      
      if (map.getSource(sourceId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }

      const center = [territory.position.longitude, territory.position.latitude];
      const radiusInKm = territory.radius;
      const points = 64;
      const coords: [number, number][] = [];
      
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dx = radiusInKm * Math.cos(angle);
        const dy = radiusInKm * Math.sin(angle);
        const lat = territory.position.latitude + (dy / 111);
        const lng = territory.position.longitude + (dx / (111 * Math.cos(territory.position.latitude * Math.PI / 180)));
        coords.push([lng, lat]);
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [coords],
          },
        },
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': getFactionColor(territory.faction),
          'fill-opacity': 0.15,
        },
      });
    });

    // Add base markers
    bases.forEach((base) => {
      const color = getFactionColor(base.faction);
      const icon = getBaseIcon(base.type);
      
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center';
      el.innerHTML = `
        <div style="
          width: ${base.type === 'hq' ? '20px' : '14px'};
          height: ${base.type === 'hq' ? '20px' : '14px'};
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
        "></div>
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: white;
          text-shadow: 0 0 3px black, 0 0 3px black;
          margin-top: 2px;
          white-space: nowrap;
        ">${icon} ${base.name}</div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = useGameStore.getState();
        state.selectBase(base);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([base.position.longitude, base.position.latitude])
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    // Add unit markers
    units.forEach((unit) => {
      const color = getFactionColor(unit.faction);
      
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 8px;
          height: 8px;
          background: ${color};
          border: 1px solid white;
          border-radius: 50%;
        "></div>
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: white;
          text-shadow: 0 0 2px black;
          text-align: center;
        ">${unit.templateType.substring(0, 3).toUpperCase()}</div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([unit.position.longitude, unit.position.latitude])
        .addTo(map);
      
      markersRef.current.push(marker);
    });
  }, [bases, units, territories, isLoaded]);

  // Token input if not set
  if (!accessToken) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 p-6 max-w-md">
          <h2 className="text-xl font-mono text-foreground">Mapbox Token Required</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your Mapbox public token to enable the globe. Get one at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <input
            type="text"
            placeholder="pk.eyJ..."
            className="w-full px-3 py-2 bg-muted border border-border rounded font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value.startsWith('pk.')) {
                  localStorage.setItem('mapbox_token', value);
                  setAccessToken(value);
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Press Enter to save</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-mono text-sm">INITIALIZING BATTLESPACE...</p>
          </div>
        </div>
      )}
    </div>
  );
}
