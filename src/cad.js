import { drawRoundedRectangle } from "replicad";

// The replicad code! Not much there!
export function drawBox(thickness, width) {
  return drawRoundedRectangle(30, 50, 4)
    .sketchOnPlane()
    .extrude(thickness * 7)
}
