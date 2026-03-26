import { drawRoundedRectangle } from "replicad";

// The replicad code! Not much there!
export const drawBox = (params) => {
  const { length, width, height } = params;

  

  return drawRoundedRectangle(((length * 42.5) - 0.5), ((width * 42) - 0.5), 3.75)
    .sketchOnPlane()
    .extrude((height * 7) - 4.75)
}
