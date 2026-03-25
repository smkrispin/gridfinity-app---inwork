import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

// Set global default before anything else
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export default function ThreeContext({ children, ...props }) {
  // Use the system dpr but capped at 2 for performance
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

  return (
    <Suspense fallback={null}>
      <Canvas
        shadows
        orthographic 
        frameloop="always"
        dpr={dpr} // Restored to dynamic dpr for clarity on high-res screens
        
        // --- THE FIX FOR GLITCHY EDGES ---
        raycaster={{ 
          params: { 
            Line: { threshold: 3 }, // Makes edges "magnetic" within 3 units
            Mesh: {} 
          } 
        }}
        
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        performance={{ min: 0.5 }}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f5f5",
        }}
        camera={{
          position: [150, -150, 150],
          zoom: 8,
          up: [0, 0, 1],
          near: -1000,
          far: 2000,
        }}
        {...props}
      >
        {/* 42mm Major Grid Lines for Gridfinity scale */}
        <Grid
          infiniteGrid
          fadeDistance={5000}
          fadeStrength={5}
          cellSize={10}
          sectionSize={100}
          sectionColor="#424549"
          cellColor="#9ca3af"
          rotation={[Math.PI / 2, 0, 0]}
        />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={["#ff3653", "#8adb00", "#2c8fff"]}
            labelColor="black"
          />
        </GizmoHelper>

        <Environment preset="city" />
        <ambientLight intensity={1.5} />
        <pointLight position={[100, 100, 100]} intensity={2} />

        <OrbitControls
          makeDefault
          up={[0, 0, 1]}
          enableDamping={false} 
        />

        {children}
      </Canvas>
    </Suspense>
  );
}