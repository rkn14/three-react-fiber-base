import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { PivotControls } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { EdgeResizeGrip } from './grips/EdgeResizeGrip';
import { RotationGrip } from './grips/RotationGrip';
import { SizeGrip } from './grips/SizeGrip';
import { DimensionAnnotation } from './annotations/DimensionAnnotation';
import { ManualEdges } from './ManualEdges';

interface RoofProps {
  // Position globale
  positionX?: number;
  positionZ?: number;
  
  // Rotation
  rotationY?: number;
  
  // Dimensions de base
  length?: number;
  width?: number; 
  baseHeight?: number;
  
  // Hauteur du toit
  roofHeight?: number;
  
  // Position des points du haut du toit
  ridgeOffsetX1?: number;
  ridgeOffsetZ1?: number;
  ridgeOffsetX2?: number;
  ridgeOffsetZ2?: number;
  
  // Mode édition
  showGrips?: boolean;
  showDimensions?: boolean;
  showEdges?: boolean;
  
  // Callbacks pour édition
  onDimensionsChange?: (length: number, width: number) => void;
  onPositionChange?: (positionX: number, positionZ: number) => void;
  onRoofHeightChange?: (roofHeight: number) => void;
  onBaseHeightChange?: (baseHeight: number) => void;
  onRotationChange?: (rotationY: number) => void;
  onGripInteraction?: (isActive: boolean) => void;
}

export const Roof: React.FC<RoofProps> = ({
  positionX = 0,
  positionZ = 0,
  rotationY = 0,
  length: initialLength = 10,
  width: initialWidth = 8,
  baseHeight = 3,
  roofHeight = 4,
  ridgeOffsetX1 = 0,
  ridgeOffsetZ1 = 0,
  ridgeOffsetX2 = 0,
  ridgeOffsetZ2 = 0,
  showGrips = false,
  showDimensions = false,
  showEdges = false,
  onDimensionsChange,
  onPositionChange,
  onRoofHeightChange,
  onBaseHeightChange,
  onRotationChange,
  onGripInteraction
}) => {
  
  // État local pour les dimensions (pour l'édition interactive)
  const [length, setLength] = useState(initialLength);
  const [width, setWidth] = useState(initialWidth);
  const [localRoofHeight, setLocalRoofHeight] = useState(roofHeight);
  const [localBaseHeight, setLocalBaseHeight] = useState(baseHeight);
  const [localRotationY, setLocalRotationY] = useState(rotationY);
  const [localPositionX, setLocalPositionX] = useState(positionX);
  const [localPositionZ, setLocalPositionZ] = useState(positionZ);
  const [isEditing, setIsEditing] = useState(false);
  
  // États pour le drag du mesh
  const [isDraggingMesh, setIsDraggingMesh] = useState(false);
  const isDraggingMeshRef = useRef(false);
  const dragStartPointRef = useRef<THREE.Vector3 | null>(null);
  
  // Références pour stocker les valeurs au début du drag
  const dragStartRef = React.useRef({
    length: 0,
    width: 0,
    roofHeight: 0,
    baseHeight: 0,
    rotationY: 0,
    positionX: 0,
    positionZ: 0
  });
  
  const { camera, raycaster } = useThree();
  
  // Synchroniser avec les props externes SEULEMENT si on n'est pas en train d'éditer
  React.useEffect(() => {
    if (!isEditing) {
      // Ne synchroniser que si les props ont réellement changé
      if (initialLength !== length) setLength(initialLength);
      if (initialWidth !== width) setWidth(initialWidth);
      if (roofHeight !== localRoofHeight) setLocalRoofHeight(roofHeight);
      if (baseHeight !== localBaseHeight) setLocalBaseHeight(baseHeight);
      if (rotationY !== localRotationY) setLocalRotationY(rotationY);
      if (positionX !== localPositionX) setLocalPositionX(positionX);
      if (positionZ !== localPositionZ) setLocalPositionZ(positionZ);
    }
  }, [initialLength, initialWidth, roofHeight, baseHeight, rotationY, positionX, positionZ, isEditing, length, width, localRoofHeight, localBaseHeight, localRotationY, localPositionX, localPositionZ]);
  
  const geometry = useMemo(() => {
    let geom = new THREE.BufferGeometry();
    
    // Définition des 10 vertices
    const vertices = new Float32Array([
      // Base au sol (4 points)
      -length/2, 0, -width/2,  // 0: coin arrière gauche
      length/2, 0, -width/2,   // 1: coin arrière droit
      length/2, 0, width/2,    // 2: coin avant droit
      -length/2, 0, width/2,   // 3: coin avant gauche
      
      // Base du toit (4 points alignés)
      -length/2, localBaseHeight, -width/2,  // 4: coin arrière gauche toit
      length/2, localBaseHeight, -width/2,   // 5: coin arrière droit toit
      length/2, localBaseHeight, width/2,    // 6: coin avant droit toit
      -length/2, localBaseHeight, width/2,   // 7: coin avant gauche toit
      
      // Faîte du toit (2 points)
      ridgeOffsetX1, localBaseHeight + localRoofHeight, ridgeOffsetZ1,  // 8: point faîte 1
      ridgeOffsetX2, localBaseHeight + localRoofHeight, ridgeOffsetZ2   // 9: point faîte 2
    ]);
    
    // Coordonnées UV pour chaque vertex
    const uvs = new Float32Array([
      // Base au sol
      0, 0,  // 0
      1, 0,  // 1
      1, 1,  // 2
      0, 1,  // 3
      
      // Base du toit
      0, 0,  // 4
      1, 0,  // 5
      1, 1,  // 6
      0, 1,  // 7
      
      // Faîte du toit
      0.5, 0.5,  // 8
      0.5, 0.5   // 9
    ]);
    
    // Définition des faces (triangles) - ordre correct pour faces extérieures
    const indices = new Uint16Array([
      // Sol de la base (2 triangles)
      0, 2, 1,  0, 3, 2,
      
      // Murs de la base (rectangles = 2 triangles chacun)
      // Mur arrière (z = -width/2)
      0, 1, 5,  0, 5, 4,
      // Mur droit (x = length/2)  
      1, 2, 6,  1, 6, 5,
      // Mur avant (z = width/2)
      2, 3, 7,  2, 7, 6,
      // Mur gauche (x = -length/2)
      3, 0, 4,  3, 4, 7,
      
      // Plafond de la base du toit (2 triangles)
      4, 5, 6,  4, 6, 7,
      
      // Les 4 pans du toit (triangles)
      // Pan arrière gauche (du coin arrière gauche au faîte 1)
      4, 8, 7,
      // Pan avant gauche (du coin avant gauche au faîte 1)  
      7, 8, 6,
      // Pan avant droit (du coin avant droit au faîte 2)
      6, 9, 5,
      // Pan arrière droit (du coin arrière droit au faîte 2)
      5, 9, 4,
      
      // Connexion entre les 2 points du faîte (triangle central)
      8, 4, 9,
      9, 6, 8
    ]);
    
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    geom = geom.toNonIndexed();
    
    // Calcul des normales après avoir défini toutes les autres attributs
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    
    return geom;
  }, [length, width, localBaseHeight, localRoofHeight, ridgeOffsetX1, ridgeOffsetZ1, ridgeOffsetX2, ridgeOffsetZ2]);

  // Gestionnaires pour les grips - avec système de delta cumulatif
  const [cumulativeDelta, setCumulativeDelta] = useState({ x: 0, z: 0, y: 0, rotation: 0 });
  
  const handleLengthLeftChange = (delta: number) => {
    const newCumulativeX = cumulativeDelta.x + delta;
    setCumulativeDelta(prev => ({ ...prev, x: newCumulativeX }));
    
    const newLength = Math.max(1, dragStartRef.current.length - newCumulativeX);
    const newPositionX = dragStartRef.current.positionX + newCumulativeX / 2;
    
    setLength(newLength);
    setLocalPositionX(newPositionX);
    onDimensionsChange?.(newLength, width);
    onPositionChange?.(newPositionX, localPositionZ);
  };

  const handleLengthRightChange = (delta: number) => {
    const newCumulativeX = cumulativeDelta.x + delta;
    setCumulativeDelta(prev => ({ ...prev, x: newCumulativeX }));
    
    const newLength = Math.max(1, dragStartRef.current.length + newCumulativeX);
    const newPositionX = dragStartRef.current.positionX + newCumulativeX / 2;
    
    setLength(newLength);
    setLocalPositionX(newPositionX);
    onDimensionsChange?.(newLength, width);
    onPositionChange?.(newPositionX, localPositionZ);
  };

  const handleWidthBackChange = (delta: number) => {
    const newCumulativeZ = cumulativeDelta.z + delta;
    setCumulativeDelta(prev => ({ ...prev, z: newCumulativeZ }));
    
    const newWidth = Math.max(1, dragStartRef.current.width - newCumulativeZ);
    const newPositionZ = dragStartRef.current.positionZ + newCumulativeZ / 2;
    
    setWidth(newWidth);
    setLocalPositionZ(newPositionZ);
    onDimensionsChange?.(length, newWidth);
    onPositionChange?.(localPositionX, newPositionZ);
  };

  const handleWidthFrontChange = (delta: number) => {
    const newCumulativeZ = cumulativeDelta.z + delta;
    setCumulativeDelta(prev => ({ ...prev, z: newCumulativeZ }));
    
    const newWidth = Math.max(1, dragStartRef.current.width + newCumulativeZ);
    const newPositionZ = dragStartRef.current.positionZ + newCumulativeZ / 2;
    
    setWidth(newWidth);
    setLocalPositionZ(newPositionZ);
    onDimensionsChange?.(length, newWidth);
    onPositionChange?.(localPositionX, newPositionZ);
  };

  const handleTopChange = (delta: number) => {
    const newCumulativeY = cumulativeDelta.y + delta;
    setCumulativeDelta(prev => ({ ...prev, y: newCumulativeY }));
    
    const newRoofHeight = Math.max(0.1, dragStartRef.current.roofHeight + newCumulativeY);
    
    setLocalRoofHeight(newRoofHeight);
    onRoofHeightChange?.(newRoofHeight);
  };

  const handleBaseHeightChange = (delta: number) => {
    const newCumulativeY = cumulativeDelta.y + delta;
    setCumulativeDelta(prev => ({ ...prev, y: newCumulativeY }));
    
    const newBaseHeight = Math.max(0.1, dragStartRef.current.baseHeight + newCumulativeY);
    
    setLocalBaseHeight(newBaseHeight);
    onBaseHeightChange?.(newBaseHeight);
  };

  const handleRotationChange = (deltaAngle: number) => {
    const newCumulativeRotation = cumulativeDelta.rotation + deltaAngle;
    setCumulativeDelta(prev => ({ ...prev, rotation: newCumulativeRotation }));
    
    const newRotationY = dragStartRef.current.rotationY - newCumulativeRotation;
    
    setLocalRotationY(newRotationY);
    onRotationChange?.(newRotationY);
  };

  const handlePositionChange = (deltaX: number, deltaZ: number) => {
    const newCumulativeX = cumulativeDelta.x + deltaX;
    const newCumulativeZ = cumulativeDelta.z + deltaZ;
    setCumulativeDelta(prev => ({ 
      ...prev, 
      x: newCumulativeX,
      z: newCumulativeZ 
    }));
    
    const newPositionX = dragStartRef.current.positionX + newCumulativeX;
    const newPositionZ = dragStartRef.current.positionZ + newCumulativeZ;
    
    setLocalPositionX(newPositionX);
    setLocalPositionZ(newPositionZ);
    onPositionChange?.(newPositionX, newPositionZ);
  };

  const handleBaseHeightScale = (matrix: THREE.Matrix4) => {
    // Extraire le scale Y de la matrice
    const scale = new THREE.Vector3();
    matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    
    // Appliquer le scale à la hauteur de base
    const newBaseHeight = Math.max(0.1, baseHeight * scale.y);
    setLocalBaseHeight(newBaseHeight);
    onBaseHeightChange?.(newBaseHeight);
  };
  
  // Gestionnaires pour le drag du mesh
  const getMousePosition = (clientX: number, clientY: number): THREE.Vector3 | null => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    
    // Plan horizontal au niveau Y = 0 pour le drag
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
      return intersectPoint;
    }
    
    return null;
  };

  const handleMeshGlobalMouseMove = (event: MouseEvent) => {
    if (!isDraggingMeshRef.current || !dragStartPointRef.current) return;
    
    const currentPoint = getMousePosition(event.clientX, event.clientY);
    if (!currentPoint) return;
    
    // Calculer le déplacement total depuis le début du drag
    const totalDeltaX = currentPoint.x - dragStartPointRef.current.x;
    const totalDeltaZ = currentPoint.z - dragStartPointRef.current.z;
    
    // Mettre à jour les positions directement basées sur la position de départ
    const newPositionX = dragStartRef.current.positionX + totalDeltaX;
    const newPositionZ = dragStartRef.current.positionZ + totalDeltaZ;
    
    setLocalPositionX(newPositionX);
    setLocalPositionZ(newPositionZ);
    onPositionChange?.(newPositionX, newPositionZ);
  };

  const cleanupMeshListeners = () => {
    window.removeEventListener('mousemove', handleMeshGlobalMouseMove);
    window.removeEventListener('mouseup', handleMeshGlobalMouseUp);
  };

  const handleMeshGlobalMouseUp = () => {
    if (!isDraggingMeshRef.current) return;
    
    isDraggingMeshRef.current = false;
    dragStartPointRef.current = null;
    setIsDraggingMesh(false);
    
    document.body.style.cursor = 'auto';
    
    handleGripEnd();
    cleanupMeshListeners();
  };

  const handleMeshPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!showGrips) return; // Seulement actif quand les grips sont visibles
    
    event.stopPropagation();
    isDraggingMeshRef.current = true;
    dragStartPointRef.current = event.point;
    setIsDraggingMesh(true);
    
    document.body.style.cursor = 'grabbing';
    
    handleGripStart();
    
    window.addEventListener('mousemove', handleMeshGlobalMouseMove);
    window.addEventListener('mouseup', handleMeshGlobalMouseUp);
  };

  const handleMeshPointerEnter = () => {
    if (showGrips && !isDraggingMesh) {
      document.body.style.cursor = 'grab';
    }
  };

  const handleMeshPointerLeave = () => {
    if (!isDraggingMesh) {
      document.body.style.cursor = 'auto';
    }
  };

  // Cleanup des listeners du mesh
  React.useEffect(() => {
    return () => {
      cleanupMeshListeners();
    };
  }, []);
  
  const handleGripStart = () => {
    // Stocker les valeurs de référence au début du drag
    dragStartRef.current = {
      length: length,
      width: width,
      roofHeight: localRoofHeight,
      baseHeight: localBaseHeight,
      rotationY: localRotationY,
      positionX: localPositionX,
      positionZ: localPositionZ
    };
    // Réinitialiser les deltas cumulatifs
    setCumulativeDelta({ x: 0, z: 0, y: 0, rotation: 0 });
    setIsEditing(true);
    onGripInteraction?.(true);
  };

  const handleGripEnd = () => {
    setIsEditing(false);
    onGripInteraction?.(false);
  };

  // Position du centre pour la rotation
  const centerPosition = useMemo(() => 
    [0, localBaseHeight, 0] as [number, number, number], // Position relative au centre du group
    [localBaseHeight]
  );

  // Positions des grips (positions relatives au centre du toit, sans rotation manuelle)
  const gripPositions = useMemo(() => ({
    // Grips pour la longueur (côtés gauche et droit)
    lengthLeft: [-length/2, localBaseHeight, 0] as [number, number, number],
    lengthRight: [length/2, localBaseHeight, 0] as [number, number, number],
    
    // Grips pour la largeur (côtés avant et arrière)
    widthBack: [0, localBaseHeight, -width/2] as [number, number, number],
    widthFront: [0, localBaseHeight, width/2] as [number, number, number],
    
    // Grip pour la hauteur (reste au centre)
    top: [0, localBaseHeight + localRoofHeight, 0] as [number, number, number],
    
    // Grip pour la position (au centre de la base)
    position: [0, 0, 0] as [number, number, number],
    
    // Grip pour la hauteur de base (au centre du côté de la base)
    topHeight: [0, localBaseHeight, 0] as [number, number, number],
    
    // Grip pour la hauteur de base (au centre du côté de la base)
    baseHeight: [length/2 + 1, localBaseHeight/2, 0] as [number, number, number],
    
    // Grips de rotation aux 4 coins de la base du toit
    rotation: [0, localBaseHeight, -width/2 - 1] as [number, number, number],
  }), [length, width, localBaseHeight, localRoofHeight]);

  // Positions des annotations de dimensions (positions relatives)
  const dimensionPositions = useMemo(() => ({
    // Longueur (côtés parallèles à l'axe X)
    lengthFront: [0, localBaseHeight, width/2] as [number, number, number],
    lengthBack: [0, localBaseHeight, -width/2] as [number, number, number],
    
    // Largeur (côtés parallèles à l'axe Z)  
    widthLeft: [-length/2, localBaseHeight, 0] as [number, number, number],
    widthRight: [length/2, localBaseHeight, 0] as [number, number, number],
  }), [length, width, localBaseHeight]);

  // Calcul des dimensions des arêtes diagonales
  const diagonalEdges = useMemo(() => {
    // Points de la base du toit
    const baseCorners = {
      backLeft: [-length/2, localBaseHeight, -width/2],
      backRight: [length/2, localBaseHeight, -width/2],
      frontRight: [length/2, localBaseHeight, width/2],
      frontLeft: [-length/2, localBaseHeight, width/2],
    };
    
    // Points du faîte
    const ridge1 = [ridgeOffsetX1, localBaseHeight + localRoofHeight, ridgeOffsetZ1];
    const ridge2 = [ridgeOffsetX2, localBaseHeight + localRoofHeight, ridgeOffsetZ2];
    
    // Calcul des 4 segments diagonaux uniquement
    const edges = [
      { from: baseCorners.backLeft, to: ridge1, name: 'backLeftToRidge1' },
      { from: baseCorners.frontLeft, to: ridge1, name: 'frontLeftToRidge1' },
      { from: baseCorners.frontRight, to: ridge2, name: 'frontRightToRidge2' },
      { from: baseCorners.backRight, to: ridge2, name: 'backRightToRidge2' },
    ];
    
    return edges.map(edge => {
      const dx = edge.to[0] - edge.from[0];
      const dy = edge.to[1] - edge.from[1];
      const dz = edge.to[2] - edge.from[2];
      
      // Longueur euclidienne du segment
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Position au milieu du segment
      const midPosition: [number, number, number] = [
        (edge.from[0] + edge.to[0]) / 2,
        (edge.from[1] + edge.to[1]) / 2,
        (edge.from[2] + edge.to[2]) / 2,
      ];
      
      // Calcul de la rotation pour aligner l'annotation le long du segment
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      const pitchAngle = Math.atan2(dy, horizontalDistance); // Angle de pente
      const yawAngle = Math.atan2(dx, dz); // Angle horizontal
      
      const rotation: [number, number, number] = [
        -pitchAngle, // Rotation autour de X pour la pente
        -yawAngle,    // Rotation autour de Y pour l'orientation horizontale
        0            // Pas de rotation autour de Z
      ];
      
      return {
        ...edge,
        length,
        midPosition,
        rotation,
      };
    });
  }, [length, width, localBaseHeight, localRoofHeight, ridgeOffsetX1, ridgeOffsetZ1, ridgeOffsetX2, ridgeOffsetZ2]);

  // Calcul séparé pour l'arête centrale du faîte
  const centralRidge = useMemo(() => {
    const ridge1 = [ridgeOffsetX1, localBaseHeight + localRoofHeight, ridgeOffsetZ1];
    const ridge2 = [ridgeOffsetX2, localBaseHeight + localRoofHeight, ridgeOffsetZ2];
    
    const dx = ridge2[0] - ridge1[0];
    const dy = ridge2[1] - ridge1[1];
    const dz = ridge2[2] - ridge1[2];
    
    // Longueur de l'arête centrale
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Position au milieu de l'arête centrale
    const midPosition: [number, number, number] = [
      (ridge1[0] + ridge2[0]) / 2,
      (ridge1[1] + ridge2[1]) / 2,
      (ridge1[2] + ridge2[2]) / 2 - 0.2,
    ];
    
    // Rotation pour aligner l'annotation le long de l'arête centrale
    const rotation: [number, number, number] = [
      -Math.PI/2, // Incliner l'annotation vers le bas
      0,     // Orientation selon la direction de l'arête
      0
    ];
    
    return {
      length,
      midPosition,
      rotation,
    };
  }, [localBaseHeight, localRoofHeight, ridgeOffsetX1, ridgeOffsetZ1, ridgeOffsetX2, ridgeOffsetZ2]);

  return (
    <group position={[localPositionX, 0, localPositionZ]} rotation={[0, localRotationY, 0]}>
      {/* Toit */}
      <mesh 
        castShadow={false}
        receiveShadow={false}
        geometry={geometry}
        onPointerDown={handleMeshPointerDown}
        onPointerEnter={handleMeshPointerEnter}
        onPointerLeave={handleMeshPointerLeave}
      >
        <meshStandardMaterial 
          transparent
          opacity={0.25}
          color={0x18FFFF} 
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>
      
      {/* Arêtes du toit */}
      {showEdges && (
        <ManualEdges
          length={length}
          width={width}
          baseHeight={localBaseHeight}
          roofHeight={localRoofHeight}
          ridgeOffsetX1={ridgeOffsetX1}
          ridgeOffsetZ1={ridgeOffsetZ1}
          ridgeOffsetX2={ridgeOffsetX2}
          ridgeOffsetZ2={ridgeOffsetZ2}
          color={0x00FFFF}
          lineWidth={8}
        />
      )}
      
      {/* Annotations de dimensions */}
      {showDimensions && (
        <>
          {/* Dimensions de longueur */}
          <DimensionAnnotation
            position={dimensionPositions.lengthFront}
            value={length}
            offset={[0, 0, -0.3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.5, 0.5, 0.5]}
          />
          <DimensionAnnotation
            position={dimensionPositions.lengthBack}
            value={length}
            offset={[0, 0, 0.3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.5, 0.5, 0.5]}
          />
          
          {/* Dimensions de largeur */}
          <DimensionAnnotation
            position={dimensionPositions.widthLeft}
            value={width}
            offset={[0.3, 0, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            scale={[0.5, 0.5, 0.5]}
          />
          <DimensionAnnotation
            position={dimensionPositions.widthRight}
            value={width}
            offset={[-0.3, 0, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            scale={[0.5, 0.5, 0.5]}
          />
          
          {/* Dimensions des arêtes diagonales */}
          {diagonalEdges.map((edge, index) => (
            <DimensionAnnotation
              key={edge.name}
              position={edge.midPosition}
              value={edge.length}
              offset={[0, 0.2, 0]}
              rotation={edge.rotation}
              scale={[0.4, 0.4, 0.4]}
              precision={2}
            />
          ))}
          
          {/* Dimension de l'arête centrale du faîte */}
          <DimensionAnnotation
            position={centralRidge.midPosition}
            value={centralRidge.length}
            offset={[0, -0.3, 0]}
            rotation={centralRidge.rotation}
            scale={[0.5, 0.5, 0.5]}
            precision={2}
          />
        </>
      )}
      
      {/* Grips d'édition */}
      {showGrips && (
        <>
          {/* Grips pour la longueur (axe X) */}
          <EdgeResizeGrip
            position={gripPositions.lengthLeft}
            axis="x"
            rotation={[0, Math.PI / 2, Math.PI / 2]}
            onDrag={handleLengthLeftChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={.5}
          />
          <EdgeResizeGrip
            position={gripPositions.lengthRight}
            axis="x"
            rotation={[0, Math.PI / 2, Math.PI / 2]}
            onDrag={handleLengthRightChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={.5}
          />
          
          {/* Grips pour la largeur (axe Z) */}
          <EdgeResizeGrip
            position={gripPositions.widthBack}
            axis="z"
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            onDrag={handleWidthBackChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={.5}
          />
          <EdgeResizeGrip
            position={gripPositions.widthFront}
            axis="z"
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            onDrag={handleWidthFrontChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={.5}
          />
          
          {/* Grips pour la hauteur de l'arrête centrale (axe Y) */}
          <SizeGrip
            position={gripPositions.topHeight}
            axis="y"
            onDrag={handleTopChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={1}
            color={0xFFA500}
          />
          
          {/* SizeGrip pour la hauteur de base (axe Y) */}
          <SizeGrip
            position={gripPositions.position}
            axis="y"
            onDrag={handleBaseHeightChange}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
            thickness={0.05}
            length={1}
            color={0xFFA500}
          />
          
          {/* Grip de position retiré - maintenant géré directement sur le mesh */}
          
          {/* Contrôleur de scale pour la hauteur de base */}
          <PivotControls
            anchor={[0, 0, 0]}
            scale={0.75}
            activeAxes={[false, true, false]}
            disableAxes
            disableSliders
            disableRotations
            onDrag={handleBaseHeightScale}
            onDragStart={handleGripStart}
            onDragEnd={handleGripEnd}
          >
            <mesh position={[0, localBaseHeight / 2, 0]} visible={false}>
              <boxGeometry args={[length, localBaseHeight, width]} />
            </mesh>
          </PivotControls>
          
          {/* Grips de rotation aux 4 coins */}
          <RotationGrip
            position={gripPositions.rotation}
            centerPosition={centerPosition}
            onRotate={handleRotationChange}
            onRotateStart={handleGripStart}
            onRotateEnd={handleGripEnd}
            radius={0.15}
          />
        </>
      )}
    </group>
  );
}


