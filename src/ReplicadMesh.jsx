import React, { useRef, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { syncFaces } from "replicad-threejs-helper";

const syncEdgesManual = (geometry, edgesData) => {
  if (!edgesData || !edgesData.lines) return;
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(edgesData.lines, 3),
  );
  geometry.clearGroups();
  if (edgesData.edgeGroups) {
    edgesData.edgeGroups.forEach((g) => geometry.addGroup(g.start, g.count));
  }
  geometry.computeBoundingSphere();
};

export default function ReplicadMesh({
  faces,
  edges,
  mode,
  selectedIndices,
  onSelect,
}) {
  const { invalidate, raycaster } = useThree();

  const bodyGeom = useRef(new THREE.BufferGeometry());
  const edgeGeom = useRef(new THREE.BufferGeometry());
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useLayoutEffect(() => {
    // High sensitivity for edge selection
    raycaster.params.Line.threshold = 0.6;
  }, [raycaster]);

  useLayoutEffect(() => {
    if (!faces || !edges) return;
    syncFaces(bodyGeom.current, faces);
    syncEdgesManual(edgeGeom.current, edges);
    invalidate();
  }, [faces, edges, invalidate]);

  const getGroupIndex = (intersect) => {
    const vertexIdx =
      mode === "face" ? intersect.faceIndex * 3 : intersect.index;
    if (vertexIdx === undefined) return null;

    const target = mode === "face" ? bodyGeom.current : edgeGeom.current;
    return target.groups.findIndex(
      (g) => vertexIdx >= g.start && vertexIdx < g.start + g.count,
    );
  };

  const HighlightLayer = ({
    index,
    color,
    opacity = 1,
    linewidth = 4,
    renderOrder = 5,
  }) => {
    const isFace = mode === "face";
    const sourceGeom = isFace ? bodyGeom.current : edgeGeom.current;
    const group = sourceGeom.groups[index];
    if (!group) return null;

    const geometryProps = {
      index: sourceGeom.index || null,
      attributes: { position: sourceGeom.attributes.position },
      drawRange: { start: group.start, count: group.count },
    };

    return isFace ? (
      <mesh renderOrder={renderOrder}>
        <bufferGeometry attach="geometry" {...geometryProps} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          depthTest={false}
        />
      </mesh>
    ) : (
      <lineSegments renderOrder={renderOrder}>
        <bufferGeometry attach="geometry" {...geometryProps} />
        <lineBasicMaterial
          color={color}
          linewidth={linewidth}
          transparent
          opacity={opacity}
          depthTest={false}
        />
      </lineSegments>
    );
  };

  return (
    <group
      onPointerOut={() => {
        setHoveredIdx(null);
        invalidate();
      }}
    >
      {/* 1. SOLID BODY */}
      <mesh
        geometry={bodyGeom.current}
        onPointerMove={(e) => {
          if (mode !== "face") return;
          e.stopPropagation();
          const idx = getGroupIndex(e);
          if (idx !== hoveredIdx) {
            setHoveredIdx(idx);
            invalidate();
          }
        }}
        onClick={(e) => {
          if (mode !== "face") return;
          e.stopPropagation();
          const idx = getGroupIndex(e);
          if (idx !== null) onSelect(idx);
        }}
      >
        <meshStandardMaterial
          color="#5a8296"
          polygonOffset
          polygonOffsetFactor={1}
          // Set these to keep the bin solid
          transparent={false}
          opacity={1}
        />
      </mesh>

      {/* 2. BASE WIREFRAME - Interactive Layer */}
      <lineSegments
        geometry={edgeGeom.current}
        onPointerMove={(e) => {
          if (mode !== "edge") return;
          e.stopPropagation();
          const idx = getGroupIndex(e);
          if (idx !== hoveredIdx) {
            setHoveredIdx(idx);
            invalidate();
          }
        }}
        onClick={(e) => {
          if (mode !== "edge") return;
          e.stopPropagation();
          const idx = getGroupIndex(e);
          if (idx !== null) onSelect(idx);
        }}
      >
        <lineBasicMaterial
          color={mode === "edge" ? "#888888" : "black"}
          transparent
          opacity={mode === "edge" ? 0.4 : 0.3}
          linewidth={1}
        />
      </lineSegments>

      {/* 3. HOVER HIGHLIGHT */}
      {hoveredIdx !== null && (
        <HighlightLayer
          index={hoveredIdx}
          color="white"
          opacity={0.8}
          linewidth={4}
          renderOrder={10}
        />
      )}

      {/* 4. SELECTION HIGHLIGHTS */}
      {selectedIndices[0] !== undefined && (
        <HighlightLayer
          index={selectedIndices[0]}
          color="#3b82f6"
          opacity={1}
          linewidth={6}
          renderOrder={20}
        />
      )}
      {selectedIndices[1] !== undefined && (
        <HighlightLayer
          index={selectedIndices[1]}
          color="#f472b6"
          opacity={1}
          linewidth={6}
          renderOrder={20}
        />
      )}
    </group>
  );
}
