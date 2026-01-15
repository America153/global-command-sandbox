import { useEffect, useRef, useMemo, useCallback } from 'react';
import { Viewer, Entity, PolylineGraphics, CesiumComponentRef } from 'resium';
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Color,
  Ion,
  ScreenSpaceEventType,
  defined,
  Cartographic,
  Math as CesiumMath,
  VerticalOrigin,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  HeightReference,
} from 'cesium';
import { useGameStore } from '@/store/gameStore';
import { MISSILE_TEMPLATES } from '@/types/game';
import type { Unit } from '@/types/game';

// Set Cesium Ion access token (default public token)
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MjQ2ZmJlNS1mYTUwLTQ0NGItODY5NS1lODJhNmUxYmI3NTEiLCJpZCI6MjU5LCJpYXQiOjE3Mzc0MjA3MTN9.lqVu8HuX5hHpXb7P2dlFjCJ8zKBxsXQzs3R5BkXDFH0';

interface GlobeProps {
  onGlobeClick: (lat: number, lng: number) => void;
  onUnitClick?: (unit: Unit, screenPosition: { x: number; y: number }) => void;
}

export default function Globe({ onGlobeClick, onUnitClick }: GlobeProps) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  
  const { bases, units, homeCountryId, occupiedCountryIds, capturedCountryIds, struckCountryIds, missilesInFlight, explosions, aiEnemy } = useGameStore();
  
  const hasIntelBase = useMemo(() => bases.some(b => b.type === 'intelligence' && b.faction === 'player'), [bases]);
  
  const visibleEnemyBases = useMemo(() => 
    aiEnemy.bases.filter(base => aiEnemy.revealedBases.includes(base.id)),
    [aiEnemy.bases, aiEnemy.revealedBases]
  );
  
  const visibleEnemyUnits = useMemo(() => 
    hasIntelBase ? aiEnemy.units : [],
    [hasIntelBase, aiEnemy.units]
  );

  // Set up click handler
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const handler = viewer.screenSpaceEventHandler;
    
    handler.setInputAction((movement: { position: Cartesian3 }) => {
      const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        const lat = CesiumMath.toDegrees(cartographic.latitude);
        const lng = CesiumMath.toDegrees(cartographic.longitude);
        onGlobeClick(lat, lng);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    };
  }, [onGlobeClick]);

  // Set initial camera position
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(0, 20, 25000000),
    });
  }, []);

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

  const getBaseColor = (faction: string) => {
    return faction === 'player' ? Color.fromCssColorString('#4ade80') : Color.fromCssColorString('#f87171');
  };

  const getUnitColor = (faction: string) => {
    return faction === 'player' ? Color.fromCssColorString('#e2e8f0') : Color.fromCssColorString('#fca5a5');
  };

  const allBases = useMemo(() => [...bases, ...visibleEnemyBases], [bases, visibleEnemyBases]);
  const allUnits = useMemo(() => [...units, ...visibleEnemyUnits], [units, visibleEnemyUnits]);

  const movementArcs = useMemo(() => units
    .filter(unit => unit.status === 'moving' && unit.destination)
    .map(unit => ({
      id: unit.id,
      positions: [
        unit.position.longitude, unit.position.latitude, 50000,
        unit.destination!.longitude, unit.destination!.latitude, 50000,
      ],
      color: unit.faction === 'player' ? Color.fromCssColorString('#4ade80').withAlpha(0.7) : Color.fromCssColorString('#f87171').withAlpha(0.7),
    })), [units]);

  const missileArcs = useMemo(() => missilesInFlight.map(missile => ({
    id: missile.id,
    positions: [
      missile.startPosition.longitude, missile.startPosition.latitude, 100000,
      missile.targetPosition.longitude, missile.targetPosition.latitude, 100000,
    ],
    color: Color.fromCssColorString('#ef4444').withAlpha(0.9),
  })), [missilesInFlight]);

  return (
    <div className="relative w-full h-full bg-[#050810]">
      <Viewer
        ref={viewerRef}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        navigationHelpButton={false}
        infoBox={false}
        fullscreenButton={false}
        vrButton={false}
        creditContainer={document.createElement('div')}
        scene3DOnly={true}
        skyBox={false}
        terrainProvider={undefined}
      >
        {/* Render bases */}
        {allBases.map(base => (
          <Entity
            key={base.id}
            position={Cartesian3.fromDegrees(base.position.longitude, base.position.latitude, 1000)}
            point={{
              pixelSize: base.type === 'hq' ? 14 : 10,
              color: getBaseColor(base.faction),
              outlineColor: Color.WHITE,
              outlineWidth: 2,
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            }}
            label={{
              text: `${getBaseIcon(base.type)} ${base.name}`,
              font: '12px sans-serif',
              style: LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Color.BLACK,
              fillColor: getBaseColor(base.faction),
              verticalOrigin: VerticalOrigin.BOTTOM,
              horizontalOrigin: HorizontalOrigin.CENTER,
              pixelOffset: new Cartesian3(0, -20, 0) as any,
              scaleByDistance: new NearFarScalar(1e6, 1.2, 1e8, 0.4),
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            }}
            properties={{ base }}
          />
        ))}

        {/* Render units */}
        {allUnits.map(unit => (
          <Entity
            key={unit.id}
            position={Cartesian3.fromDegrees(unit.position.longitude, unit.position.latitude, 500)}
            point={{
              pixelSize: 8,
              color: getUnitColor(unit.faction),
              outlineColor: Color.BLACK,
              outlineWidth: 1,
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            }}
            label={{
              text: `● ${unit.templateType.substring(0, 3).toUpperCase()}`,
              font: '10px sans-serif',
              style: LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 1,
              outlineColor: Color.BLACK,
              fillColor: getUnitColor(unit.faction),
              verticalOrigin: VerticalOrigin.BOTTOM,
              horizontalOrigin: HorizontalOrigin.CENTER,
              pixelOffset: new Cartesian3(0, -15, 0) as any,
              scaleByDistance: new NearFarScalar(1e5, 1.0, 1e7, 0.3),
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            }}
            properties={{ unit }}
          />
        ))}

        {/* Movement arcs */}
        {movementArcs.map(arc => (
          <Entity key={`move-${arc.id}`}>
            <PolylineGraphics
              positions={Cartesian3.fromDegreesArrayHeights(arc.positions)}
              width={2}
              material={arc.color}
              arcType={1}
            />
          </Entity>
        ))}

        {/* Missile arcs */}
        {missileArcs.map(arc => (
          <Entity key={`missile-${arc.id}`}>
            <PolylineGraphics
              positions={Cartesian3.fromDegreesArrayHeights(arc.positions)}
              width={3}
              material={arc.color}
              arcType={1}
            />
          </Entity>
        ))}

        {/* Explosions */}
        {explosions.map(explosion => (
          <Entity
            key={explosion.id}
            position={Cartesian3.fromDegrees(explosion.position.longitude, explosion.position.latitude, 2000)}
            point={{
              pixelSize: 20,
              color: Color.fromCssColorString('#fb923c').withAlpha(0.8),
              outlineColor: Color.fromCssColorString('#ef4444'),
              outlineWidth: 4,
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            }}
          />
        ))}
      </Viewer>
    </div>
  );
}
