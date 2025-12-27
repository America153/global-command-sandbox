import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useGameStore } from '@/store/gameStore';

// Configure Cesium
(window as any).CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.123/Build/Cesium/';
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6MjU5LCJpYXQiOjE2MDc1Nzg4NDF9.free_token';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
}

export default function Globe({ onGlobeClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { hq, bases, units, territories } = useGameStore();

  // Initialize Cesium viewer
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

    // Dark theme styling
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0f14');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d1117');
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;
    
    // Enable lighting for realistic globe
    viewer.scene.globe.enableLighting = false;
    
    // Set initial camera position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
    });

    // Handle click events
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      const cartesian = viewer.camera.pickEllipsoid(
        movement.position,
        viewer.scene.globe.ellipsoid
      );
      
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        onGlobeClick(lat, lng);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    setIsLoaded(true);

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onGlobeClick]);

  // Update entities when game state changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isLoaded) return;

    // Clear existing entities
    viewer.entities.removeAll();

    // Add territory influence circles
    territories.forEach((territory) => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          territory.position.longitude,
          territory.position.latitude
        ),
        ellipse: {
          semiMajorAxis: territory.radius * 1000,
          semiMinorAxis: territory.radius * 1000,
          material: Cesium.Color.fromCssColorString(
            territory.faction === 'player' 
              ? 'rgba(61, 90, 61, 0.3)' 
              : 'rgba(201, 68, 68, 0.3)'
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(
            territory.faction === 'player' 
              ? 'rgba(61, 90, 61, 0.8)' 
              : 'rgba(201, 68, 68, 0.8)'
          ),
          outlineWidth: 2,
          height: 0,
        },
      });
    });

    // Add bases
    bases.forEach((base) => {
      const color = base.faction === 'player' 
        ? Cesium.Color.fromCssColorString('#4a90d9')
        : Cesium.Color.fromCssColorString('#c94444');
      
      const symbol = base.type === 'hq' ? '⬟' : 
                     base.type === 'army' ? '◆' :
                     base.type === 'navy' ? '◇' :
                     base.type === 'airforce' ? '△' : '○';

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          base.position.longitude,
          base.position.latitude,
          1000
        ),
        point: {
          pixelSize: base.type === 'hq' ? 20 : 14,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: base.name,
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
      const color = unit.faction === 'player' 
        ? Cesium.Color.fromCssColorString('#5cb85c')
        : Cesium.Color.fromCssColorString('#d9534f');

      viewer.entities.add({
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
      });

      // Draw movement line if unit is moving
      if (unit.destination) {
        viewer.entities.add({
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
