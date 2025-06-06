import React, { Suspense } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import Environment3D from './Components/Environment3D';

function App() {
  return (
    <div className="App relative w-full h-full bg-black">
      <Suspense fallback={<span>Loading... Please wait!</span>}>
        <Canvas className="w-full h-full" shadows orthographic camera={{ position: [0, 0, 0], zoom: 100 }}>      
          <Environment3D />
        </Canvas> 
      </Suspense>
    </div>
  );
}

export default App;
