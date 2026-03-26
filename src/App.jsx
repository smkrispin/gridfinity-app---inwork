import React, { useState, useEffect, useCallback } from "react";
import { wrap } from "comlink";
import "./app.css";
import ThreeContext from "./ThreeContext";
import ReplicadMesh from "./ReplicadMesh";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
const cad = wrap(worker);

export default function App() {
  const [params, setParams] = useState({
    length: 2,
    width: 2,
    height: 6,
  });
  const [mesh, setMesh] = useState(null);
  const [mode, setMode] = useState("face");
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [selectionData, setSelectionData] = useState([]);
  const [trueDistance, setTrueDistance] = useState(null);

  // Update mesh and CLEAR selections on dimension change
  useEffect(() => {
    cad.createMesh(params).then(setMesh);
    setSelectedIndices([]);
    setSelectionData([]);
    setTrueDistance(null);
  }, [params]);

  // Clear selections when switching modes
  useEffect(() => {
    setSelectedIndices([]);
    setSelectionData([]);
    setTrueDistance(null);
  }, [mode]);

  const handleSelection = useCallback(
    async (index) => {
      const newIndices = selectedIndices.includes(index)
        ? selectedIndices.filter((i) => i !== index)
        : [...selectedIndices, index].slice(-2);

      setSelectedIndices(newIndices);

      const results = await Promise.all(
        newIndices.map((idx) => cad.measureElement(params, mode, idx)),
      );
      setSelectionData(results.filter((r) => r !== null));

      if (newIndices.length === 2) {
        const dist = await cad.getDistance(
          params,
          mode,
          newIndices[0],
          newIndices[1],
        );
        setTrueDistance(dist);
      } else {
        setTrueDistance(null);
      }
    },
    [params, selectedIndices, mode],
  );

  return (
    <div className="app-wrapper">
      {/* 1. BACKGROUND VIEWPORT */}
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

      {/* 2. LEFT SIDEBAR: PARAMETERS */}
      <aside className="ui-panel ui-left">
        <div className="glass-card">
          <header>
            <h1>Gridfinity CAD</h1>
          </header>

          <section className="parameter-sliders">
            {/* LENGTH SLIDER */}
            <div className="slider-group">
              <div className="slider-label">
                <label>LENGTH</label>
                <span>{params.length}U</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={params.length}
                onChange={(e) =>
                  setParams({ ...params, length: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* WIDTH SLIDER */}
            <div className="slider-group">
              <div className="slider-label">
                <label>WIDTH</label>
                <span>{params.width}U</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={params.width}
                onChange={(e) =>
                  setParams({ ...params, width: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* HEIGHT SLIDER */}
            <div className="slider-group">
              <div className="slider-label">
                <label>HEIGHT</label>
                <span>{params.height}U</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={params.height}
                onChange={(e) =>
                  setParams({ ...params, height: parseFloat(e.target.value) })
                }
              />
            </div>
          </section>
        </div>
      </aside>

      {/* 3. RIGHT SIDEBAR: INSPECTOR */}
      <aside className="ui-panel ui-right">
        <div className="glass-card">
          <div className="inspector">
            <h3>Inspector</h3>
            <div className="toggle-group">
              <button
                className={mode === "face" ? "active" : ""}
                onClick={() => setMode("face")}
              >
                Faces
              </button>
              <button
                className={mode === "edge" ? "active" : ""}
                onClick={() => setMode("edge")}
              >
                Edges
              </button>
            </div>

            {selectedIndices.length > 0 ? (
              <>
                {selectionData.map((d, i) => (
                  <div
                    key={i}
                    className="stat-card"
                    style={{ borderLeftColor: i === 0 ? "#3b82f6" : "#f472b6" }}
                  >
                    <p className="label">
                      {d.type} #{d.index}
                    </p>

                    <div className="data-grid">
                      {/* 1. Primary Measurement */}
                      <div style={{ marginBottom: "4px" }}>
                        <span
                          style={{
                            color: "#999",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          {mode === "face" ? "AREA: " : "LENGTH: "}
                        </span>
                        <span style={{ fontWeight: "600" }}>
                          {mode === "face" ? `${d.area} mm²` : `${d.length} mm`}
                        </span>
                      </div>

                      {/* 2. Radius/Diameter */}
                      {d.radius && (
                        <div style={{ marginBottom: "4px" }}>
                          <span
                            style={{
                              color: "#999",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            RADIUS:{" "}
                          </span>
                          <span style={{ fontWeight: "600" }}>
                            {d.radius} mm
                          </span>
                        </div>
                      )}

                      {/* 3. Vector Readout (The part that was crashing) */}
                      <div
                        className="vector-readout"
                        style={{
                          marginTop: "8px",
                          borderTop: "1px solid #eee",
                          paddingTop: "8px",
                        }}
                      >
                        {/* Guard for Center */}
                        {d.center && (
                          <p
                            style={{
                              margin: "2px 0",
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                            }}
                          >
                            <span
                              style={{
                                color: "#999",
                                width: "65px",
                                display: "inline-block",
                              }}
                            >
                              Center:
                            </span>
                            [{d.center.join(", ")}]
                          </p>
                        )}

                        {/* Guard for Normal (Face mode) or Tangent (Edge mode) */}
                        {((mode === "face" && d.normal) ||
                          (mode === "edge" && d.direction)) && (
                          <p
                            style={{
                              margin: "2px 0",
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                            }}
                          >
                            <span
                              style={{
                                color: "#999",
                                width: "65px",
                                display: "inline-block",
                              }}
                            >
                              {mode === "face" ? "Normal:" : "Tangent:"}
                            </span>
                            [
                            {(mode === "face" ? d.normal : d.direction).join(
                              ", ",
                            )}
                            ]
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {trueDistance !== null && (
                  <div className="distance-box">
                    <p>CAD Distance:</p>
                    <h2>{trueDistance.toFixed(3)}mm</h2>
                  </div>
                )}

                <button
                  className="clear-btn"
                  onClick={() => setSelectedIndices([])}
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <p className="hint" style={{ marginTop: "20px" }}>
                Select {mode}s to measure
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
