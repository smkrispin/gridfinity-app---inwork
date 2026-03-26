import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC, measureArea, measureVolume, measureDistanceBetween } from "replicad";
import { expose } from "comlink";
import { drawBox } from "./cad";

let loaded = false;
const init = async () => {
  if (loaded) return true;
  const OC = await opencascade({ locateFile: () => opencascadeWasm });
  setOC(OC);
  loaded = true;
  return true;
};
const started = init();

const createMesh = async (params) => {
  await started;
  const shape = drawBox(params);
  return {
    faces: shape.mesh(),
    edges: shape.meshEdges(),
    totalVolume: measureVolume(shape).toFixed(2)
  };
};

const measureElement = async (params, type, index) => {
  await started;
  const shape = drawBox(params);
  
  if (type === "face") {
    const face = shape.faces[index];
    if (!face) return null;
    
    return { 
      index, // Renamed from faceIndex to index
      type: face.geomType,
      area: measureArea(face).toFixed(2), 
      center: face.center.toTuple().map(v => v.toFixed(2)), 
      normal: face.normalAt().toTuple().map(v => v.toFixed(2)),
      radius: face.geomType === "CYLINDRE" ? 
        Math.max(face.edges.find(e => e.geomType === "CIRCLE")?.boundingBox.width || 0).toFixed(2) : null
    };
  }

  if (type === "edge") {
    const edge = shape.edges[index];
    if (!edge) return null;

    const centerArr = edge.pointAt(0.5).toTuple(); 
    const tangentArr = edge.tangentAt(0.5).toTuple(); 

    let edgeDim = edge.geomType === "CIRCLE" 
      ? Math.max(edge.boundingBox.width, edge.boundingBox.height).toFixed(2) 
      : null;

    return { 
      index, // Standardized as index
      type: edge.geomType, 
      length: edge.length.toFixed(2),
      radius: edgeDim,
      center: centerArr.map(v => v.toFixed(2)), 
      direction: tangentArr.map(v => v.toFixed(2)) 
    };
  }
  return null;
};

const getDistance = async (params, type, index1, index2) => {
  await started;
  const shape = drawBox(params);
  const el1 = type === "face" ? shape.faces[index1] : shape.edges[index1];
  const el2 = type === "face" ? shape.faces[index2] : shape.edges[index2];
  if (!el1 || !el2) return null;
  return measureDistanceBetween(el1, el2);
};

expose({ createMesh, measureElement, getDistance });