import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Group, SRGBColorSpace, Vector3 } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';

export type BolusMode = 'transparent' | 'solid' | 'exploded';
export interface CameraCommand { type: 'zoom-in' | 'zoom-out' | 'reset'; sequence: number; }
interface Props { mode: BolusMode; labels: boolean; autoRotate: boolean; temperature: number; ph: number; cameraCommand: CameraCommand; }

function Tag({ text, position }: { text: string; position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!;
    ctx.font = '600 30px Segoe UI'; canvas.width = Math.ceil(ctx.measureText(text).width + 54); canvas.height = 84;
    ctx.fillStyle = '#131b24'; ctx.fillRect(0, 0, canvas.width, 84);
    ctx.strokeStyle = '#40505d'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, canvas.width - 2, 82);
    ctx.fillStyle = '#40d9c0'; ctx.fillRect(0, 0, 5, 84);
    ctx.fillStyle = '#e7f0f5'; ctx.font = '600 30px Segoe UI'; ctx.textBaseline = 'middle'; ctx.fillText(text, 24, 42);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={position} scale={[texture.image.width * 0.0032, 0.27, 1]} renderOrder={20}><spriteMaterial map={texture} depthTest={false} depthWrite={false} /></sprite>;
}

function Capsule({ mode, labels, temperature }: Props) {
  const shell = useRef<Group>(null); const board = useRef<Group>(null); const battery = useRef<Group>(null);
  const exploded = mode === 'exploded'; const solid = mode === 'solid';
  const targets = useMemo(() => ({ shell: new Vector3(exploded ? -1.05 : 0, exploded ? 0.25 : 0, 0), board: new Vector3(exploded ? 0.25 : 0, 0, 0), battery: new Vector3(exploded ? 1.15 : 0, exploded ? -1.2 : -1.28, 0) }), [exploded]);
  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-delta * 9);
    shell.current?.position.lerp(targets.shell, blend); board.current?.position.lerp(targets.board, blend); battery.current?.position.lerp(targets.battery, blend);
  });
  return <group rotation={[0, 0, -0.065]}>
    <group ref={shell}>
      <mesh renderOrder={solid ? 0 : 5}><capsuleGeometry args={[0.58, 2.9, 12, 64]} /><meshPhysicalMaterial color={solid ? '#c2d8de' : '#bed0d7'} transparent={!solid} opacity={solid ? 1 : 0.15} roughness={solid ? 0.2 : 0.35} metalness={0} clearcoat={1} clearcoatRoughness={0.15} depthWrite={solid} /></mesh>
      {[1.45, -1.45].map(y => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={6}><torusGeometry args={[0.581, 0.009, 8, 64]} /><meshStandardMaterial color={solid ? '#8aabb4' : '#91adb5'} transparent opacity={solid ? 0.7 : 0.55} /></mesh>)}
      {labels && exploded && <Tag text="01 · Capsule shell" position={[-0.5, 1.6, 0.6]} />}
    </group>
    <group ref={board} visible={!solid}>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.63, 2.18, 0.075]} /><meshStandardMaterial color="#148754" roughness={0.65} /></mesh>
      <mesh position={[0, 0.15, -0.042]}><boxGeometry args={[0.57, 2.08, 0.008]} /><meshStandardMaterial color="#145e3b" /></mesh>
      {Array.from({ length: 9 }, (_, i) => <mesh key={`trace-${i}`} position={[-0.25 + i * 0.0625, 0.15, 0.043]}><boxGeometry args={[0.007, 2.02, 0.004]} /><meshStandardMaterial color="#c9b256" metalness={0.3} roughness={0.6} /></mesh>)}
      {Array.from({ length: 12 }, (_, i) => <group key={`pad-${i}`}>
        <mesh position={[-0.26, 1.08 - i * 0.17, 0.057]}><boxGeometry args={[0.066, 0.061, 0.016]} /><meshStandardMaterial color="#d3b468" metalness={0.65} roughness={0.4} /></mesh>
        <mesh position={[0.26, 1.08 - i * 0.17, 0.057]}><boxGeometry args={[0.066, 0.061, 0.016]} /><meshStandardMaterial color="#d3b468" metalness={0.65} roughness={0.4} /></mesh>
      </group>)}
      <mesh position={[0, 0.55, 0.082]}><boxGeometry args={[0.4, 0.43, 0.07]} /><meshStandardMaterial color="#bcc9d0" metalness={0.4} roughness={0.25} /></mesh>
      <mesh position={[0, 0.55, 0.125]}><boxGeometry args={[0.3, 0.33, 0.018]} /><meshStandardMaterial color="#25323b" roughness={0.55} /></mesh>
      <mesh position={[-0.07, -0.13, 0.097]}><boxGeometry args={[0.33, 0.27, 0.09]} /><meshStandardMaterial color="#b9c7cb" metalness={0.55} roughness={0.25} /></mesh>
      <mesh position={[-0.1, -0.68, 0.091]}><boxGeometry args={[0.15, 0.16, 0.055]} /><meshStandardMaterial color={temperature >= 40 ? '#fb7185' : '#283a43'} /></mesh>
      <mesh position={[0.19, -0.7, 0.08]}><boxGeometry args={[0.09, 0.1, 0.06]} /><meshStandardMaterial color="#284756" /></mesh>
      <mesh position={[-0.18, 1.51, 0]}><cylinderGeometry args={[0.018, 0.018, 0.65, 12]} /><meshStandardMaterial color="#bdcbd2" metalness={0.7} roughness={0.22} /></mesh>
      {labels && <>
        <Tag text="02 · Antenna" position={[0.62, 1.6, 0.4]} />
        <Tag text="03 · ESP32" position={[1.03, 0.57, 0.4]} />
        <Tag text="04 · LoRa radio" position={[-1.05, 0.08, 0.4]} />
        <Tag text="05 · Temperature sensor" position={[1.03, -0.75, 0.4]} />
      </>}
    </group>
    <group ref={battery} position={[0, -1.28, 0]} visible={!solid}>
      <mesh><cylinderGeometry args={[0.38, 0.38, 0.77, 48]} /><meshStandardMaterial color="#c0c9cd" metalness={0.45} roughness={0.28} /></mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.384, 0.384, 0.23, 48]} /><meshStandardMaterial color="#20282e" roughness={0.5} /></mesh>
      <mesh position={[0, 0.398, 0]}><cylinderGeometry args={[0.13, 0.13, 0.03, 32]} /><meshStandardMaterial color="#b69543" metalness={0.7} roughness={0.25} /></mesh>
      {labels && <Tag text="06 · Lithium battery" position={[-0.93, 0.05, 0.4]} />}
    </group>
  </group>;
}

function Camera({ command, autoRotate }: { command: CameraCommand; autoRotate: boolean }) {
  const ref = useRef<Controls>(null); const { camera } = useThree();
  useEffect(() => {
    if (!ref.current) return;
    if (command.type === 'reset') { camera.position.set(2.7, 2.05, 8.1); ref.current.target.set(0, -0.15, 0); }
    else {
      const offset = camera.position.clone().sub(ref.current.target);
      const distance = offset.length(); const next = Math.max(4, Math.min(13, distance * (command.type === 'zoom-in' ? 0.83 : 1.2)));
      camera.position.copy(ref.current.target).add(offset.multiplyScalar(next / distance));
    }
    ref.current.update();
  }, [camera, command]);
  return <OrbitControls ref={ref} makeDefault autoRotate={autoRotate} autoRotateSpeed={0.8} enablePan={false} minDistance={4} maxDistance={13} target={[0, -0.15, 0]} />;
}

export default function BolusScene(props: Props) {
  return <Canvas dpr={[1, 1.25]} camera={{ position: [2.7, 2.05, 8.1], fov: 37 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
    <color attach="background" args={['#0e141b']} /><hemisphereLight args={['#f3fbff', '#667981', 2]} />
    <directionalLight position={[-3, 6, 5]} intensity={2.6} /><directionalLight position={[4, 3, 2]} intensity={1.3} />
    <pointLight position={[-1, 3, 4]} intensity={14} />
    <Capsule {...props} /><gridHelper args={[16, 40, '#303b45', '#25303a']} position={[0, -2.1, 0]} />
    <Camera command={props.cameraCommand} autoRotate={props.autoRotate} />
  </Canvas>;
}
