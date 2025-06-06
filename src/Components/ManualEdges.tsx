import React, { useMemo } from 'react';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { extend } from '@react-three/fiber';

// Étendre R3F avec les composants de ligne
extend({ Line2, LineMaterial, LineGeometry });

// Déclarations TypeScript pour R3F
declare global {
  namespace JSX {
    interface IntrinsicElements {
      line2: any;
      lineMaterial: any;
      lineGeometry: any;
    }
  }
}

interface ManualEdgesProps {
  length: number;
  width: number;
  baseHeight: number;
  roofHeight: number;
  ridgeOffsetX1: number;
  ridgeOffsetZ1: number;
  ridgeOffsetX2: number;
  ridgeOffsetZ2: number;
  color?: string | number;
  lineWidth?: number;
  visible?: boolean;
}

export const ManualEdges: React.FC<ManualEdgesProps> = ({
  length,
  width,
  baseHeight,
  roofHeight,
  ridgeOffsetX1,
  ridgeOffsetZ1,
  ridgeOffsetX2,
  ridgeOffsetZ2,
  color = 0x00FFFF,
  lineWidth = 2,
  visible = true
}) => {

  // points clés
  const points = useMemo(() => ({
    // Base du toit (rectangle au niveau baseHeight)
    p4: [-length/2, baseHeight, -width/2],  // coin arrière gauche
    p5: [length/2, baseHeight, -width/2],   // coin arrière droit
    p6: [length/2, baseHeight, width/2],    // coin avant droit
    p7: [-length/2, baseHeight, width/2],   // coin avant gauche    
    // Arrête centrale
    p8: [ridgeOffsetX1, baseHeight + roofHeight, ridgeOffsetZ1],
    p9: [ridgeOffsetX2, baseHeight + roofHeight, ridgeOffsetZ2]
  }), [length, width, baseHeight, roofHeight, ridgeOffsetX1, ridgeOffsetZ1, ridgeOffsetX2, ridgeOffsetZ2]);


  const createLineGeometry = (p1: number[], p2: number[]) => {
    const lineGeom = new LineGeometry();
    const positions = new Float32Array([...p1, ...p2]);
    lineGeom.setPositions(positions);
    return lineGeom;
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Contour de la base du toit */}
      <line2 geometry={createLineGeometry(points.p4, points.p5)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
      <line2 geometry={createLineGeometry(points.p5, points.p6)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
      <line2 geometry={createLineGeometry(points.p6, points.p7)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
      <line2 geometry={createLineGeometry(points.p7, points.p4)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>

      {/* Contour supérieur du toit */}
      <line2 geometry={createLineGeometry(points.p4, points.p8)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
      <line2 geometry={createLineGeometry(points.p8, points.p7)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>

      <line2 geometry={createLineGeometry(points.p9, points.p6)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
      <line2 geometry={createLineGeometry(points.p5, points.p9)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>

      {/* Arrête centrale */}
      <line2 geometry={createLineGeometry(points.p8, points.p9)}>
        <lineMaterial color={color} linewidth={lineWidth} resolution={[window.innerWidth, window.innerHeight]} />
      </line2>
    </>
  );
}; 