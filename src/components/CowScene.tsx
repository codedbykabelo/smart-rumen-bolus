import { Canvas } from '@react-three/fiber';
import { CowPasture } from './CowPasture';
import type { ComponentProps } from 'react';

export default function CowScene(props: ComponentProps<typeof CowPasture>) {
  return <Canvas shadows frameloop="always" dpr={[1, 1.15]}
    camera={{ position: [0, 2.9, 7.4], fov: 38, near: 0.1, far: 60 }}
    gl={{ powerPreference: 'low-power', antialias: false }}>
    <CowPasture {...props} />
  </Canvas>;
}
