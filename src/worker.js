import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC, exportSTEP } from "replicad";
import { expose } from "comlink";

// We import our model as a simple function
import { drawBox } from "./cad";

// This is the logic to load the web assembly code into replicad
let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  setOC(OC);

  return true;
};
const started = init();

function createBlob(thickness) {
  // note that you might want to do some caching for more complex models
  return started.then(() => {
    return drawBox(thickness).blobSTL();
  });
}

function createMesh(thickness) {
  return started.then(() => {
    const box = drawBox(thickness);
    // This is how you get the data structure that the replica-three-helper
    // can synchronise with three BufferGeometry
    return {
      faces: box.mesh(),
      edges: box.meshEdges(),
    };
  });
}

const createStepBlob = async (thickness) => {
  await started;
  const shape = drawBox(thickness);

  // The 'wrapped' error happens because replicad expects this specific object format:
  return exportSTEP([
    {
      shape: shape,
      name: `gridfinity-base-${thickness}x${thickness}`
    }
  ]); 
};

// Update the exposed API
expose({ 
  createBlob,
  createMesh, 
  createStepBlob
});
