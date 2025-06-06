import React, { useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PositionGripProps {
  position: [number, number, number];
  color?: string | number;
  radius?: number;
  onDrag?: (deltaX: number, deltaZ: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const PositionGrip: React.FC<PositionGripProps> = ({
  position,
  color = 0x00b3b3, 
  radius = 0.15,
  onDrag,
  onDragStart,
  onDragEnd
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  
  // Refs pour les callbacks pour éviter les problèmes de closure
  const onDragRef = useRef(onDrag);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  
  React.useEffect(() => {
    onDragRef.current = onDrag;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  }, [onDrag, onDragStart, onDragEnd]);
  
  const { camera, raycaster } = useThree();

  // Géométrie plane carrée
  const geometry = React.useMemo(() => {
    return new THREE.PlaneGeometry(radius * 4, radius * 4);
  }, [radius]);

  // Plan horizontal pour le drag (mouvement dans le plan XZ)
  const dragPlane = React.useMemo(() => 
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]),
    [position]
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

  const handleGlobalMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    
    const currentPoint = getMousePosition(event.clientX, event.clientY);
    if (!currentPoint) return;
    
    const deltaX = currentPoint.x - dragStartRef.current.x;
    const deltaZ = currentPoint.z - dragStartRef.current.z;
    
    onDragRef.current?.(deltaX, deltaZ);
    dragStartRef.current = currentPoint;
  };

  const cleanupListeners = () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseUp = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    dragStartRef.current = null;
    setIsDragging(false);
    
    // Remettre le curseur à auto une fois le drag terminé
    document.body.style.cursor = 'auto';
    
    onDragEndRef.current?.();
          
    cleanupListeners();
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    
    const startPoint = getMousePosition(event.nativeEvent.clientX, event.nativeEvent.clientY);
    if (!startPoint) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = startPoint;
    setIsDragging(true);
    
    // Forcer le curseur à grabbing immédiatement
    document.body.style.cursor = 'grabbing';
    
    onDragStartRef.current?.();
    
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
      rotation={[-Math.PI / 2, 0, 0]}
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
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}; 