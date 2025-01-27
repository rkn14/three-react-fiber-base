import React, { Suspense } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <div className="App relative w-full h-full bg-black">
      <Suspense fallback={<span>Loading... Please wait!</span>}>
        <Canvas className="w-full h-full">      
          <perspectiveCamera position={[0,0,0]} />
          <mesh position={[0,0,0]} >
            <sphereGeometry />
            <meshBasicMaterial color={0xFF0000} />
          </mesh>
        </Canvas> 
      </Suspense>
    </div>
  );
}

export default App;
