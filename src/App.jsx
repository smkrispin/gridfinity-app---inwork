import React, { useState, useEffect } from "react";
import { wrap } from "comlink";
import "./app.css";

import ThreeContext from "./ThreeContext";
import ReplicadMesh from "./ReplicadMesh";

// 1. Initialize the worker connection
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
const cad = wrap(worker);

export default function App() {
  const [thickness, setThickness] = useState(1);
  const [mesh, setMesh] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // 2. Geometry Update Loop
  useEffect(() => {
    let active = true;

    // We call createMesh which returns { faces, edges }
    cad.createMesh(thickness)
      .then((m) => {
        if (active) setMesh(m);
      })
      .catch((err) => console.error("Mesh generation failed:", err));

    return () => { active = false; };
  }, [thickness]);

  // 3. Unified Export Handler
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // Logic matching your worker.js expose keys:
      // STL -> createBlob
      // STEP -> createStepBlob
      const blob = format === "stl" 
        ? await cad.createBlob(thickness) 
        : await cad.createStepBlob(thickness);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gridfinity-${thickness}x${thickness}.${format}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup to prevent memory leaks
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="app-container">
      {/* 3D STAGE */}
      <section className="viewport-container">
        <ThreeContext>
          {mesh && <ReplicadMesh faces={mesh.faces} edges={mesh.edges} />}
        </ThreeContext>
      </section>

      {/* OVERLAY UI */}
      <div className="control-panel">
        <h1>Gridfinity Forge</h1>
        
        <div className="input-group">
          <label>Size: {thickness}x{thickness}</label>
          <input
            type="range"
            min="1"
            max="6"
            step="1"
            value={thickness}
            onChange={(e) => setThickness(parseInt(e.target.value))}
          />
        </div>

        <div className="button-row">
          <button 
            className="export-button" 
            disabled={isExporting}
            onClick={() => handleExport("stl")}
          >
            {isExporting ? "..." : "STL"}
          </button>
          
          <button 
            className="export-button secondary" 
            disabled={isExporting}
            onClick={() => handleExport("step")}
          >
            {isExporting ? "..." : "STEP"}
          </button>
        </div>
      </div>
    </main>
  );
}