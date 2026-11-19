/* eslint-disable */
import * as THREE from 'three';

// Fast random number generator
let seed = 12345;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Spherical to Cartesian
function sphericalToCartesian(r: number, theta: number, phi: number, out: THREE.Vector3) {
  out.x = r * Math.sin(theta) * Math.cos(phi);
  out.y = r * Math.sin(theta) * Math.sin(phi);
  out.z = r * Math.cos(theta);
  return out;
}

// Generate points for s-orbital (spherical)
export function generateSOrbital(n: number, count: number, scale: number = 1) {
  const points: Float32Array = new Float32Array(count * 3);
  let idx = 0;
  const vec = new THREE.Vector3();
  
  for (let i = 0; i < count; i++) {
    let r = 0;
    while (true) {
      r = random() * 4 * n; 
      const probability = Math.exp(-r / n) * (r * r); 
      if (random() * n * n < probability) break;
    }
    
    const theta = Math.acos(2 * random() - 1);
    const phi = 2 * Math.PI * random();
    
    sphericalToCartesian(r * scale, theta, phi, vec);
    points[idx++] = vec.x;
    points[idx++] = vec.y;
    points[idx++] = vec.z;
  }
  
  return points;
}

// Generate points for p-orbital (dumbbell)
export function generatePOrbital(n: number, count: number, scale: number = 1, axis: 'x' | 'y' | 'z' = 'z') {
  const points: Float32Array = new Float32Array(count * 3);
  let idx = 0;
  const vec = new THREE.Vector3();
  
  for (let i = 0; i < count; i++) {
    let r = 0;
    let theta = 0;
    while (true) {
      r = random() * 5 * n;
      theta = Math.acos(2 * random() - 1);
      
      const radialProb = (r * r) * Math.exp(-r / n);
      const angularProb = Math.pow(Math.cos(theta), 2);
      
      const probability = radialProb * angularProb;
      if (random() * (n * n) < probability) break;
    }
    
    const phi = 2 * Math.PI * random();
    
    sphericalToCartesian(r * scale, theta, phi, vec);
    
    if (axis === 'x') {
      points[idx++] = vec.z; points[idx++] = vec.y; points[idx++] = vec.x;
    } else if (axis === 'y') {
      points[idx++] = vec.x; points[idx++] = vec.z; points[idx++] = vec.y;
    } else {
      points[idx++] = vec.x; points[idx++] = vec.y; points[idx++] = vec.z;
    }
  }
  
  return points;
}

// Generate points for d-orbital (cloverleaf)
export function generateDOrbital(n: number, count: number, scale: number = 1, variant: number = 0) {
  const points: Float32Array = new Float32Array(count * 3);
  let idx = 0;
  const vec = new THREE.Vector3();
  
  for (let i = 0; i < count; i++) {
    let r = 0;
    let theta = 0;
    let phi = 0;
    while (true) {
      r = random() * 6 * n;
      theta = Math.acos(2 * random() - 1);
      phi = 2 * Math.PI * random();
      
      const radialProb = Math.pow(r, 4) * Math.exp(-r / n);
      let angularProb = 0;
      
      if (variant === 0) {
        angularProb = Math.pow(3 * Math.pow(Math.cos(theta), 2) - 1, 2);
      } else {
        angularProb = Math.pow(Math.sin(theta), 4) * Math.pow(Math.sin(2 * phi), 2);
      }
      
      const probability = radialProb * angularProb;
      if (random() * (n * n * 5) < probability) break;
    }
    
    sphericalToCartesian(r * scale, theta, phi, vec);
    
    if (variant === 1) { // xy
      points[idx++] = vec.x; points[idx++] = vec.y; points[idx++] = vec.z;
    } else if (variant === 2) { // xz
      points[idx++] = vec.x; points[idx++] = vec.z; points[idx++] = vec.y;
    } else if (variant === 3) { // yz
      points[idx++] = vec.z; points[idx++] = vec.y; points[idx++] = vec.x;
    } else if (variant === 4) { // x^2 - y^2
      points[idx++] = vec.x * 0.707 - vec.y * 0.707;
      points[idx++] = vec.x * 0.707 + vec.y * 0.707;
      points[idx++] = vec.z;
    } else { // z^2
      points[idx++] = vec.x; points[idx++] = vec.y; points[idx++] = vec.z;
    }
  }
  
  return points;
}

// Generate points for Hybrid Orbitals (sp, sp2, sp3)
export function generateHybridOrbital(type: 'sp' | 'sp2' | 'sp3', count: number, scale: number = 1, dir: THREE.Vector3 = new THREE.Vector3(0, 0, 1)) {
  const points: Float32Array = new Float32Array(count * 3);
  let idx = 0;
  const vec = new THREE.Vector3();
  
  // Create rotation matrix to align the lobe with the given direction vector
  const defaultDir = new THREE.Vector3(0, 0, 1);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir.clone().normalize());
  
  for (let i = 0; i < count; i++) {
    let r = 0;
    let theta = 0;
    let phi = 0;
    while (true) {
      r = random() * 4;
      theta = Math.acos(2 * random() - 1);
      phi = 2 * Math.PI * random();
      
      // Approximate radial probability for n=2 hybrid
      const radialProb = (r * r) * Math.exp(-r);
      
      // Angular probability creating a major front lobe and minor back lobe
      let s_coef, p_coef;
      if (type === 'sp') { s_coef = 1; p_coef = 1; }
      else if (type === 'sp2') { s_coef = 1; p_coef = Math.sqrt(2); }
      else { s_coef = 1; p_coef = Math.sqrt(3); } // sp3
      
      // The wavefunction is a mix of s (spherical) and pz (cos(theta))
      // Psi = s_coef + p_coef * cos(theta)
      const angularProb = Math.pow(s_coef + p_coef * Math.cos(theta), 2);
      
      const probability = radialProb * angularProb;
      if (random() * 10 < probability) break;
    }
    
    sphericalToCartesian(r * scale * 2.0, theta, phi, vec);
    
    // Rotate to the correct axis
    vec.applyQuaternion(quaternion);
    
    points[idx++] = vec.x;
    points[idx++] = vec.y;
    points[idx++] = vec.z;
  }
  
  return points;
}

