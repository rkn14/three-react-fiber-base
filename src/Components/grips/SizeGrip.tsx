import React, { useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SizeGripProps {
  position: [number, number, number];
  axis: 'x' | 'z' | 'y';
  rotation?: [number, number, number];
  color?: string | number;
  thickness?: number;
  length?: number;
  onDrag?: (delta: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const SizeGrip: React.FC<SizeGripProps> = ({
  position,
  axis,
  rotation = [0, 0, 0],
  color = 0x00b3b3, 
  thickness = 0.05,
  length = .5,
  onDrag,
  onDragStart,
  onDragEnd
}) => {
  
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

  // Géométrie selon l'axe
  const geometry = React.useMemo(() => {
    return new THREE.CylinderGeometry(thickness, thickness, length, 8);
  }, [thickness, length]);

  // Créer un plan invisible pour le drag selon l'axe
  const dragPlane = React.useMemo(() => {
    if (axis === 'x' || axis === 'z') {
      // Plan perpendiculaire à l'axe Y pour le drag en X ou Z
      return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    } else {
      // Plan perpendiculaire à l'axe Z pour le drag en Y
      return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    }
  }, [axis]);

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
    
    // calcul du delta selon l'axe
    let delta = 0;
    
    if (axis === 'x') {
      delta = currentPoint.x - dragStartRef.current.x;
    } else if (axis === 'z') {
      delta = currentPoint.z - dragStartRef.current.z;
    } else if (axis === 'y') {
      delta = currentPoint.y - dragStartRef.current.y;
    }
    
    onDragRef.current?.(delta);
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
    isDraggingRef.current = true;
    dragStartRef.current = event.point;
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

  // Cursor during drag
  React.useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (isHovered) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [isDragging, isHovered]);

  // events Cleanup
  React.useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, []);

  return (
    <group
      position={position}
      rotation={rotation}
    >
      {/* Ligne selon l'axe */}
      <mesh
        geometry={geometry}
        rotation={
          axis === 'x' 
            ? [0, 0, Math.PI / 2]  // Rotation pour aligner sur l'axe X
            : axis === 'z' 
            ? [Math.PI / 2, 0, 0]  // Rotation pour aligner sur l'axe Z
            : [0, 0, 0]            // Pas de rotation pour l'axe Y (défaut du cylindre)
        }
        position={
          axis === 'x' 
            ? [length / 2, 0, 0]   // Décaler la ligne le long de l'axe X
            : axis === 'z' 
            ? [0, 0, length / 2]   // Décaler la ligne le long de l'axe Z
            : [0, length / 2, 0]   // Décaler la ligne le long de l'axe Y
        }
      >
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={isHovered || isDragging ? 0.9 : 0.7}
          depthTest={false}
        />
      </mesh>

      {/* Sphère à l'extrémité comme poignée */}
      <mesh
        position={
          axis === 'x' 
            ? [length, 0, 0]       // Position à l'extrémité de l'axe X
            : axis === 'z' 
            ? [0, 0, length]       // Position à l'extrémité de l'axe Z
            : [0, length, 0]       // Position à l'extrémité de l'axe Y
        }
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[thickness * 2, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={isHovered || isDragging ? 1 : 0.8}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}; 