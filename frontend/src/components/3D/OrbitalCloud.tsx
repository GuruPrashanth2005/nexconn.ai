
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateSOrbital, generatePOrbital, generateDOrbital } from '../../utils/orbitalMath';

interface OrbitalCloudProps {
  n: number;
  subshells: { l: string; count: number }[];
  scale?: number;
}

const SUBSHELL_COLORS: Record<string, string> = {
  's': '#ef4444', // Red
  'p': '#3b82f6', // Blue
  'd': '#eab308', // Yellow
  'f': '#a855f7', // Purple
};

export const OrbitalCloud: React.FC<OrbitalCloudProps> = ({ n, subshells, scale = 1.0 }) => {
  const points = useMemo(() => {
    const allPoints: Float32Array[] = [];
    const allColors: Float32Array[] = [];
    
    // Scale down the overall cloud slightly so it fits well within the atom
    const baseScale = scale * 0.4;
    
    // Calculate total points based on number of electrons in this shell
    const basePointsPerElectron = 1500; // Total ~10k - 50k points

    subshells.forEach(sub => {
      const colorHex = SUBSHELL_COLORS[sub.l] || '#ffffff';
      const color = new THREE.Color(colorHex);
      
      const pointCount = sub.count * basePointsPerElectron;
      let pts: Float32Array;
      
      if (sub.l === 's') {
        pts = generateSOrbital(n, pointCount, baseScale * 0.6);
      } else if (sub.l === 'p') {
        // Distribute among x, y, z
        const ptsX = generatePOrbital(n, Math.floor(pointCount / 3), baseScale * 0.8, 'x');
        const ptsY = generatePOrbital(n, Math.floor(pointCount / 3), baseScale * 0.8, 'y');
        const ptsZ = generatePOrbital(n, Math.floor(pointCount / 3), baseScale * 0.8, 'z');
        
        pts = new Float32Array(ptsX.length + ptsY.length + ptsZ.length);
        pts.set(ptsX, 0);
        pts.set(ptsY, ptsX.length);
        pts.set(ptsZ, ptsX.length + ptsY.length);
      } else if (sub.l === 'd') {
        // Distribute among 5 variants
        const ptsList = [];
        let totalLen = 0;
        for (let i = 0; i < 5; i++) {
          const p = generateDOrbital(n, Math.floor(pointCount / 5), baseScale * 1.0, i);
          ptsList.push(p);
          totalLen += p.length;
        }
        pts = new Float32Array(totalLen);
        let offset = 0;
        ptsList.forEach(p => {
          pts.set(p, offset);
          offset += p.length;
        });
      } else {
        // Fallback to s-orbital for f (or implement f later)
        pts = generateSOrbital(n, pointCount, baseScale * 1.5);
      }
      
      const cols = new Float32Array(pts.length);
      for (let i = 0; i < pts.length; i += 3) {
        cols[i] = color.r;
        cols[i+1] = color.g;
        cols[i+2] = color.b;
      }
      
      allPoints.push(pts);
      allColors.push(cols);
    });
    
    // Combine all
    const totalLen = allPoints.reduce((acc, p) => acc + p.length, 0);
    const combinedPts = new Float32Array(totalLen);
    const combinedCols = new Float32Array(totalLen);
    
    let offset = 0;
    allPoints.forEach(p => {
      combinedPts.set(p, offset);
      offset += p.length;
    });
    
    offset = 0;
    allColors.forEach(c => {
      combinedCols.set(c, offset);
      offset += c.length;
    });
    
    return { positions: combinedPts, colors: combinedCols };
  }, [n, subshells, scale]);

  const { positions, colors } = points;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(0), 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[new Float32Array(0), 4]}
          count={colors.length / 4}
          array={colors}
          itemSize={4}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.03} 
        vertexColors={true}
        transparent={true}
        opacity={0.4}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
