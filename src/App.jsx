import React, { useState, useEffect, useCallback } from "react";
import { wrap } from "comlink";
import "./app.css";
import ThreeContext from "./ThreeContext";
import ReplicadMesh from "./ReplicadMesh";

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
const cad = wrap(worker);

export default function App() {
  const [params, setParams] = useState({ thickness: 1 });
  const [mesh, setMesh] = useState(null);
  const [mode, setMode] = useState("face");
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [selectionData, setSelectionData] = useState([]);
  const [trueDistance, setTrueDistance] = useState(null);

  useEffect(() => {
    cad.createMesh(params).then(setMesh);
  }, [params]);

  useEffect(() => {
    setSelectedIndices([]);
    setSelectionData([]);
    setTrueDistance(null);
  }, [mode]);

  const handleSelection = useCallback(async (index) => {
    const newIndices = selectedIndices.includes(index) 
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index].slice(-2);

    setSelectedIndices(newIndices);
    
    // 1. Measure individual elements
    const results = await Promise.all(newIndices.map(idx => cad.measureElement(params, mode, idx)));
    setSelectionData(results.filter(r => r !== null));

    // 2. Measure distance if 2 are selected
    if (newIndices.length === 2) {
      const dist = await cad.getDistance(params, mode, newIndices[0], newIndices[1]);
      setTrueDistance(dist);
    } else {
      setTrueDistance(null);
    }
  }, [params, selectedIndices, mode]);

  return (
    <div className="app-wrapper">
      <div className="viewport-fixed">
        <ThreeContext>
          {mesh && (
            <ReplicadMesh 
              faces={mesh.faces} 
              edges={mesh.edges} 
              mode={mode} 
              selectedIndices={selectedIndices} 
              onSelect={handleSelection} 
            />
          )}
        </ThreeContext>
      </div>

      <div className="ui-overlay">
        <div className="control-panel">
          <header>
            <h1>Gridfinity CAD</h1>
            <div className="toggle-group">
              <button className={mode === 'face' ? 'active' : ''} onClick={() => setMode('face')}>Faces</button>
              <button className={mode === 'edge' ? 'active' : ''} onClick={() => setMode('edge')}>Edges</button>
            </div>
          </header>

          <div className="inspector">
            {selectedIndices.length > 0 ? (
              <>
                {selectionData.map((d, i) => (
                  <div key={i} className="stat-card" style={{ borderLeftColor: i === 0 ? '#3b82f6' : '#f472b6' }}>
                    <p className="label">{d.type}</p>
                    {d.radius && <p className="radius-val">Radius: **{d.radius} mm**</p>}
                    <p>{mode === 'face' ? `Area: ${d.area} mm²` : `Length: ${d.length} mm`}</p>
                  </div>
                ))}

                {/* THE UI FIX: Displaying the distance between the two selections */}
                {trueDistance !== null && (
                  <div className="distance-box">
                    <p>True CAD Clearance:</p>
                    <h2>{trueDistance.toFixed(3)} mm</h2>
                  </div>
                )}

                <button className="clear-btn" onClick={() => setSelectedIndices([])}>Clear All</button>
              </>
            ) : (
              <p className="hint">Select two {mode}s to measure distance</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}