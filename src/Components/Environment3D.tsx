import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import React, { useState } from 'react';
import { Roof } from './Roof';


function Environment3D() {
  const [roofDimensions, setRoofDimensions] = useState({
    length: 6,
    width: 4
  });

  const [roofHeight, setRoofHeight] = useState(2);
  const [roofRotation, setRoofRotation] = useState(0);
  const [roofPosition, setRoofPosition] = useState({
    positionX: 0,
    positionZ: 0
  });

  const [isUsingGrip, setIsUsingGrip] = useState(false);

  const handleDimensionsChange = (length: number, width: number) => {
    setRoofDimensions({ length, width });
    console.log('Nouvelles dimensions:', { length, width });
  };

  const handleRoofHeightChange = (height: number) => {
    setRoofHeight(height);
    console.log('Nouvelle hauteur du toit:', height);
  };

  const handleRotationChange = (rotationY: number) => {
    setRoofRotation(rotationY);
    console.log('Nouvelle rotation du toit:', rotationY);
  };

  const handlePositionChange = (positionX: number, positionZ: number) => {
    setRoofPosition({ positionX, positionZ });
    console.log('Nouvelle position:', { positionX, positionZ });
  };

  const handleGripInteraction = (isActive: boolean) => {
    setIsUsingGrip(isActive);
  };

  return (
    <>
        <PerspectiveCamera 
          makeDefault
          position={[10, 10, 10]}
          near={0.01}
          far={1000}
        />
        <OrbitControls 
          enabled={!isUsingGrip}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
        />
        <directionalLight position={[50,100,50]} intensity={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001}/>
        <ambientLight intensity={0.5}/>

        {/* Ground */}
        <mesh receiveShadow position={[0,0,0]} rotation-x={-Math.PI/2} scale={[100,100,100]} visible={true}>
            <planeGeometry />
            <meshStandardMaterial color={0xCCCCCC} side={2} />
        </mesh>

        {/* Roof avec grips */}
        <Roof 
          width={roofDimensions.width} 
          length={roofDimensions.length} 
          baseHeight={3.5} 
          roofHeight={roofHeight} 
          positionX={roofPosition.positionX} 
          positionZ={roofPosition.positionZ} 
          rotationY={roofRotation} 
          ridgeOffsetX1={-1} 
          ridgeOffsetZ1={0} 
          ridgeOffsetX2={1} 
          ridgeOffsetZ2={0}
          showGrips={true}
          showDimensions={true}
          showEdges={true}
          onDimensionsChange={handleDimensionsChange}
          onRoofHeightChange={handleRoofHeightChange}
          onRotationChange={handleRotationChange}
          onPositionChange={handlePositionChange}
          onGripInteraction={handleGripInteraction}
        />

    </>
  );
}

export default Environment3D;
