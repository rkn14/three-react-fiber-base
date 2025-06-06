import React, { useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface RotationGripProps {
  position: [number, number, number];
  centerPosition: [number, number, number]; // Position du centre de rotation
  color?: string | number;
  radius?: number;
  onRotate?: (deltaAngle: number) => void;
  onRotateStart?: () => void;
  onRotateEnd?: () => void;
}

export const RotationGrip: React.FC<RotationGripProps> = ({
  position,
  centerPosition,
  color = 0x00b3b3, 
  radius = 0.1,
  onRotate,
  onRotateStart,
  onRotateEnd
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef<number>(0);
  
  // Refs pour les callbacks pour éviter les problèmes de closure
  const onRotateRef = useRef(onRotate);
  const onRotateStartRef = useRef(onRotateStart);
  const onRotateEndRef = useRef(onRotateEnd);
  
  React.useEffect(() => {
    onRotateRef.current = onRotate;
    onRotateStartRef.current = onRotateStart;
    onRotateEndRef.current = onRotateEnd;
  }, [onRotate, onRotateStart, onRotateEnd]);
  
  const { camera, raycaster } = useThree();

  // Géométrie sphérique
  const geometry = React.useMemo(() => {
    return new THREE.SphereGeometry(radius, 16, 16);
  }, [radius]);

  // Plan horizontal pour le drag (rotation autour de Y)
  const dragPlane = React.useMemo(() => 
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -centerPosition[1]),
    [centerPosition]
  );

  const getMousePosition = (clientX: number, clientY: number): THREE.Vector3 | null => {
    const canvas = document.querySelector('canvas');
    if (!canvas || !dragPlane) return null;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
      return intersectPoint;
    }
    
    return null;
  };

  const calculateAngle = (point: THREE.Vector3): number => {
    // Calculer l'angle par rapport au centre
    const dx = point.x - centerPosition[0];
    const dz = point.z - centerPosition[2];
    return Math.atan2(dz, dx);
  };

  const handleGlobalMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const currentPoint = getMousePosition(event.clientX, event.clientY);
    if (!currentPoint) return;
    
    const currentAngle = calculateAngle(currentPoint);
    const deltaAngle = currentAngle - lastAngleRef.current;
    
    // Normaliser le delta pour éviter les sauts de -π à π
    let normalizedDelta = deltaAngle;
    if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI;
    if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI;
    
    onRotateRef.current?.(normalizedDelta);
    lastAngleRef.current = currentAngle;
  };

  const cleanupListeners = () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseUp = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    lastAngleRef.current = 0;
    setIsDragging(false);
    
    // Remettre le curseur à auto une fois le drag terminé
    document.body.style.cursor = 'auto';
    
    onRotateEndRef.current?.();
          
    cleanupListeners();
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    
    const startPoint = getMousePosition(event.nativeEvent.clientX, event.nativeEvent.clientY);
    if (!startPoint) return;
    
    isDraggingRef.current = true;
    lastAngleRef.current = calculateAngle(startPoint);
    setIsDragging(true);
    
    // Forcer le curseur à grabbing immédiatement
    document.body.style.cursor = 'grabbing';
    
    onRotateStartRef.current?.();
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    document.body.style.cursor = 'grab';
  };

  const handlePointerLeave = () => {
    // Ne changer le curseur que si on n'est pas en train de draguer
    if (!isDragging) {
      setIsHovered(false);
      document.body.style.cursor = 'auto';
    }
  };

  // Gestion du curseur pendant le drag
  React.useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (isHovered) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [isDragging, isHovered]);

  // Cleanup sur unmount
  React.useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <meshBasicMaterial 
        color={color}
        transparent
        opacity={isHovered || isDragging ? 1 : 0.8}
        depthTest={false}
      />
    </mesh>
  );
}; 