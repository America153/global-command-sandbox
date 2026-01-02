import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useGameStore } from '@/store/gameStore';
import { COUNTRIES, loadCountries } from '@/data/countries';

// Configure Cesium
(window as any).CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.123/Build/Cesium/';
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6MjU5LCJpYXQiOjE2MDc1Nzg4NDF9.free_token';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
}

export default function Globe({ onGlobeClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const entityDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const countryDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const onGlobeClickRef = useRef(onGlobeClick);
  const [isLoaded, setIsLoaded] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  
  const { hq, bases, units, territories, selectBase, homeCountryId, occupiedCountryIds } = useGameStore();

  // Keep callback ref updated
  useEffect(() => {
    onGlobeClickRef.current = onGlobeClick;
  }, [onGlobeClick]);

  // Initialize Cesium viewer only once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      creditContainer: document.createElement('div'),
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
        })
      ),
    });

    // Create a data source for country borders
    const countryDataSource = new Cesium.CustomDataSource('countryBorders');
    viewer.dataSources.add(countryDataSource);
    countryDataSourceRef.current = countryDataSource;

    // Dark theme styling
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0f14');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d1117');
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;
    viewer.scene.globe.enableLighting = false;
    
    // Set initial camera position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
    });

    // Create a custom data source for game entities
    const entityDataSource = new Cesium.CustomDataSource('gameEntities');
    viewer.dataSources.add(entityDataSource);
    entityDataSourceRef.current = entityDataSource;

    viewerRef.current = viewer;
    setIsLoaded(true);

    // Click handler - use ref to always get latest callback
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      // Check if clicking on an entity first
      const picked = viewer.scene.pick(movement.position);
      if (Cesium.defined(picked) && picked.id && picked.id.properties) {
        const entityId = picked.id.properties.gameId?.getValue();
        const entityType = picked.id.properties.entityType?.getValue();
        
        if (entityType === 'base' && entityId) {
          const state = useGameStore.getState();
          const base = state.bases.find(b => b.id === entityId);
          if (base) {
            state.selectBase(base);
            return;
          }
        }
      }
      
      // Otherwise handle as globe click for placement
      const cartesian = viewer.camera.pickEllipsoid(
        movement.position,
        viewer.scene.globe.ellipsoid
      );
      
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        // Use ref to get latest callback
        onGlobeClickRef.current(lat, lng);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    handlerRef.current = handler;

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      entityDataSourceRef.current = null;
      countryDataSourceRef.current = null;
    };
  }, []);

  // Update entities when game state changes - without recreating viewer
  useEffect(() => {
    const entityDataSource = entityDataSourceRef.current;
    if (!entityDataSource || !isLoaded) return;

    // Clear only game entities, not the whole viewer
    entityDataSource.entities.removeAll();

    const getFactionColor = (faction: string) => {
      switch (faction) {
        case 'player': return Cesium.Color.fromCssColorString('#22c55e');
        case 'ai': return Cesium.Color.fromCssColorString('#ef4444');
        default: return Cesium.Color.fromCssColorString('#6b7280');
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

    // Add territory influence circles
    territories.forEach((territory) => {
      entityDataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          territory.position.longitude,
          territory.position.latitude
        ),
        ellipse: {
          semiMajorAxis: territory.radius * 1000,
          semiMinorAxis: territory.radius * 1000,
          material: getFactionColor(territory.faction).withAlpha(0.15),
          outline: true,
          outlineColor: getFactionColor(territory.faction).withAlpha(0.5),
          outlineWidth: 2,
          height: 0,
        },
      });
    });

    // Add all bases (including HQ which is in bases array)
    bases.forEach((base) => {
      const color = getFactionColor(base.faction);
      const icon = getBaseIcon(base.type);
      
      entityDataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          base.position.longitude,
          base.position.latitude,
          1000
        ),
        properties: {
          gameId: base.id,
          entityType: 'base',
        },
        point: {
          pixelSize: base.type === 'hq' ? 20 : 14,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${icon} ${base.name}`,
          font: '12px JetBrains Mono',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });

    // Add units
    units.forEach((unit) => {
      const color = getFactionColor(unit.faction);

      entityDataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          unit.position.longitude,
          unit.position.latitude,
          500
        ),
        point: {
          pixelSize: 8,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: unit.templateType.substring(0, 3).toUpperCase(),
          font: '10px JetBrains Mono',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // Draw movement line if unit is moving
      if (unit.destination) {
        entityDataSource.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              unit.position.longitude,
              unit.position.latitude,
              unit.destination.longitude,
              unit.destination.latitude,
            ]),
            width: 2,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.YELLOW,
              dashLength: 16,
            }),
          },
        });
      }
    });
  }, [hq, bases, units, territories, isLoaded]);

  // Load country data
  useEffect(() => {
    loadCountries().then(() => {
      setCountriesLoaded(true);
    });
  }, []);

  // Render country borders and territory control
  useEffect(() => {
    const countryDataSource = countryDataSourceRef.current;
    if (!countryDataSource || !isLoaded || !countriesLoaded) return;

    countryDataSource.entities.removeAll();

    const BORDER_WIDTH = 3;
    const HOME_COLOR = Cesium.Color.fromCssColorString('#3b82f6'); // Blue
    const OCCUPIED_COLOR = Cesium.Color.fromCssColorString('#ef4444'); // Red
    const NEUTRAL_COLOR = Cesium.Color.fromCssColorString('#4b5563'); // Gray

    COUNTRIES.forEach((country) => {
      try {
        let borderColor = NEUTRAL_COLOR;
        let fillColor: Cesium.Color | undefined = undefined;

        if (country.id === homeCountryId) {
          borderColor = HOME_COLOR;
          fillColor = HOME_COLOR.withAlpha(0.2);
        } else if (occupiedCountryIds.includes(country.id)) {
          borderColor = OCCUPIED_COLOR;
          fillColor = OCCUPIED_COLOR.withAlpha(0.2);
        }

        // Handle MultiPolygon - each polygon is a separate landmass
        for (const polygon of country.coordinates) {
          if (!Array.isArray(polygon) || polygon.length === 0) continue;
          
          const ring = polygon[0];
          if (!Array.isArray(ring) || ring.length < 3) continue;

          // Convert coordinates for Cesium [lng, lat] -> flat array
          const positions: number[] = [];
          for (const coord of ring) {
            if (Array.isArray(coord) && coord.length >= 2) {
              positions.push(coord[0], coord[1]);
            }
          }

          if (positions.length < 6) continue; // Need at least 3 points

          // Add polyline border for visibility
          countryDataSource.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(positions),
              width: BORDER_WIDTH,
              material: borderColor,
              clampToGround: true,
            },
          });

          // Add fill for controlled countries
          if (fillColor) {
            countryDataSource.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
                material: fillColor,
                outline: false,
                height: 0,
              },
            });
          }
        }
      } catch (e) {
        // Skip malformed country data
      }
    });
  }, [homeCountryId, occupiedCountryIds, isLoaded, countriesLoaded]);

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
