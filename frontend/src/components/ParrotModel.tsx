/* eslint-disable */
import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group } from 'three';

export function ParrotModel(props: any) {
  const group = useRef<Group>(null);
  // Load the downloaded Parrot.glb from public folder
  const { scene, animations } = useGLTF('/Parrot.glb') as any;
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play the first available animation
    const actionName = Object.keys(actions)[0];
    if (actionName && actions[actionName]) {
      actions[actionName]?.play();
    }
  }, [actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      {/* We use a primitive to render the entire loaded scene directly */}
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/Parrot.glb');

