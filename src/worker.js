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
  const shape = drawBox(params.thickness);
  return {
    faces: shape.mesh(),
    edges: shape.meshEdges(),
    totalVolume: measureVolume(shape).toFixed(2)
  };
};

const measureElement = async (params, type, index) => {
  await started;
  const shape = drawBox(params.thickness);
  
  if (type === "face") {
    const face = shape.faces[index];
    if (!face) return null;
    
    let radiusValue = null;
    if (face.geomType === "CYLINDRE") {
      const circularEdge = face.edges.find(e => e.geomType === "CIRCLE");
      if (circularEdge) {
        radiusValue = (Math.max(circularEdge.boundingBox.width, circularEdge.boundingBox.height) / 2).toFixed(2);
      }
    }
    return { type: face.geomType, area: measureArea(face).toFixed(2), radius: radiusValue };
  }

  if (type === "edge") {
    const edge = shape.edges[index];
    if (!edge) return null;
    let edgeRadius = edge.geomType === "CIRCLE" ? (Math.max(edge.boundingBox.width, edge.boundingBox.height) / 2).toFixed(2) : null;
    return { type: edge.geomType, length: edge.length.toFixed(2), radius: edgeRadius };
  }
  return null;
};

// THE FIX: Explicitly measure distance between two CAD entities
const getDistance = async (params, type, index1, index2) => {
  await started;
  const shape = drawBox(params.thickness);
  const el1 = type === "face" ? shape.faces[index1] : shape.edges[index1];
  const el2 = type === "face" ? shape.faces[index2] : shape.edges[index2];
  
  if (!el1 || !el2) return null;
  return measureDistanceBetween(el1, el2);
};

expose({ createMesh, measureElement, getDistance });