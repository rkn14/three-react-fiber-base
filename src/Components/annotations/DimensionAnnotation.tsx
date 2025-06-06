import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';

interface DimensionAnnotationProps {
  position: [number, number, number];
  value: number;
  unit?: string;
  offset?: [number, number, number];
  precision?: number;
  scale?: [number, number, number];
  rotation?: [number, number, number];
  style?: React.CSSProperties;
}

export const DimensionAnnotation: React.FC<DimensionAnnotationProps> = ({
  position,
  value,
  unit = 'm',
  offset = [0, 0, 0],
  precision = 1,
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  style = {}
}) => {
  
  const formattedValue = useMemo(() => value.toFixed(precision), [value, precision]);
  
  const defaultStyle: React.CSSProperties = useMemo(() => ({
    background: 'rgba(0, 0, 0, 0)',
    textShadow: '0 0 3px black',
    color: '#FFFFFF',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    border: '0px solid #00FFFF',
    textAlign: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
    minWidth: '40px',
    whiteSpace: 'nowrap',
    ...style
  }), [style]);

  const offsetPosition: [number, number, number] = useMemo(() => [
    position[0] + offset[0],
    position[1] + offset[1],
    position[2] + offset[2]
  ], [position, offset]);

  return (
    <Html
      position={offsetPosition}
      center
      distanceFactor={10}
      occlude={false}
      transform={true}
      scale={scale}
      rotation={rotation}
    >
      <div style={defaultStyle}>
        {formattedValue}{unit}
      </div>
    </Html>
  );
}; 