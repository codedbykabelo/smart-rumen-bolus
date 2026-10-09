import { Environment, Html, OrbitControls, useAnimations, useGLTF, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { Activity } from '../types';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import {
  Box3,
  ConeGeometry,
  Group,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';

const COW_MODEL_URL = '/models/holstein-cow.glb';
const activityClipPatterns: Partial<Record<Activity, RegExp[]>> = {
  Grazing: [/graze/i, /eat/i, /feed/i],
  Walking: [/walk/i],
  Ruminating: [/ruminat/i, /chew/i, /eat/i],
  Drinking: [/drink/i, /head.?low/i],
  Resting: [/idle/i, /stand/i, /rest/i],
  'Lying down': [/lie.?down/i, /lying/i],
};

interface CowPastureProps {
  xRayView: boolean;
  showBolus: boolean;
  activity: Activity;
  onBolusClick: () => void;
}

export function CowPasture({ xRayView, showBolus, activity, onBolusClick }: CowPastureProps) {
  return (
    <>
      <color attach="background" args={['#8ec8ed']} />
      <fog attach="fog" args={['#a9d2de', 23, 60]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#e8f5ff', '#486643', 1.1]} />
      <directionalLight
        position={[-6, 11, 5]}
        intensity={2.3}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.00015}
      />

      <Suspense fallback={null}>
        <Environment files="/environment/kloofendal_48d_partly_cloudy_puresky_1k.hdr" />
      </Suspense>
      <Sky />
      <Hills />
      <Suspense fallback={<Ground />}>
        <Pasture />
      </Suspense>
      <Fence />
      <Tree position={[-4.8, 0, -3.8]} scale={1.15} />
      <Tree position={[4.4, 0, -3.6]} scale={0.9} />
      <Tree position={[4.9, 0, 3.7]} scale={1.05} />
      <Tree position={[-5.2, 0, 3.1]} scale={0.8} />
      <Bush position={[-2.9, 0, -3.4]} />
      <Bush position={[3.3, 0, -3.05]} />
      <WaterTrough position={[2.1, 0, 0.65]} />
      <CowAssetGate
        xRayView={xRayView}
        showBolus={showBolus}
        activity={activity}
        onBolusClick={onBolusClick}
      />

      <OrbitControls
        makeDefault
        target={[0, 1, 0]}
        minDistance={4.2}
        maxDistance={16}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.03}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

function CowAssetGate(props: CowPastureProps) {
  const [assetState, setAssetState] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch(COW_MODEL_URL, { method: 'HEAD' })
      .then((response) => {
        const type = response.headers.get('content-type') ?? '';
        if (!response.ok || type.includes('text/html')) {
          throw new Error('The Holstein GLB is not installed in public/models.');
        }
        if (!cancelled) setAssetState('ready');
      })
      .catch(() => {
        if (!cancelled) setAssetState('missing');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (assetState !== 'ready') return null;

  return (
    <Suspense
      fallback={
        <Html position={[0, 1.1, 0]} center distanceFactor={9}>
          <div className="scene-asset-status"><strong>Loading Holstein cow…</strong></div>
        </Html>
      }
    >
      <CowModel {...props} />
    </Suspense>
  );
}

function CowModel({ xRayView, showBolus, activity, onBolusClick }: CowPastureProps) {
  const root = useRef<Group>(null);
  const { scene, animations } = useGLTF(COW_MODEL_URL);
  const cowScene = useMemo(() => clone(scene), [scene]);
  const bounds = useMemo(() => new Box3().setFromObject(cowScene), [cowScene]);
  const size = useMemo(() => bounds.getSize(new Vector3()), [bounds]);
  const center = useMemo(() => bounds.getCenter(new Vector3()), [bounds]);
  const scale = 2.5 / Math.max(size.y, 0.001);
  const { actions } = useAnimations(animations, root);

  useEffect(() => {
    cowScene.traverse((object) => {
      if (!(object as Mesh).isMesh) return;
      const mesh = object as Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone();
    });

    return () => {
      cowScene.traverse((object) => {
        if (!(object as Mesh).isMesh) return;
        const mesh = object as Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [cowScene]);

  useEffect(() => {
    cowScene.traverse((object) => {
      if (!(object as Mesh).isMesh) return;
      const mesh = object as Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        material.transparent = xRayView;
        material.opacity = xRayView ? 0.24 : 1;
        material.depthWrite = !xRayView;
        material.needsUpdate = true;
      });
    });
  }, [cowScene, xRayView]);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    const patterns = activityClipPatterns[activity];
    if (!patterns) return;
    const clip = animations.find((candidate) => patterns.some((pattern) => pattern.test(candidate.name)));
    if (!clip) return;

    const action = actions[clip.name];
    if (!action) return;
    action.reset();
    action.enabled = true;
    action.setLoop(LoopRepeat, Infinity);
    action.setEffectiveTimeScale(activity === 'Ruminating' ? 0.42 : activity === 'Drinking' ? 0.55 : 0.8);
    action.fadeIn(0.25).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, activity, animations]);

  return (
    <group ref={root} position={[0, 0, 0]}>
      <group scale={scale} position={[-center.x, -bounds.min.y, -center.z]}>
        <primitive object={cowScene} />
      </group>
      {animations.length === 0 && (
        <Html position={[0, 2.75, 0]} center distanceFactor={9} pointerEvents="none">
          <span className="scene-label">Static model · no skeletal animation</span>
        </Html>
      )}
      {xRayView && (
        <group position={[0.05, 0.95, -0.12]}>
          <mesh position={[-0.3, 0.02, 0]}>
            <sphereGeometry args={[0.53, 28, 20]} />
            <meshStandardMaterial color="#65ad7a" emissive="#173d24" emissiveIntensity={0.25} transparent opacity={0.75} roughness={0.5} />
          </mesh>
          <mesh position={[0.19, -0.19, 0.03]}>
            <sphereGeometry args={[0.24, 24, 18]} />
            <meshStandardMaterial color="#a9d6f3" emissive="#14374e" emissiveIntensity={0.2} transparent opacity={0.84} roughness={0.4} />
          </mesh>
          <Html position={[-0.42, 0.67, 0.05]} center distanceFactor={9} pointerEvents="none">
            <span className="scene-label">Rumen</span>
          </Html>
          <Html position={[0.38, 0.17, 0.12]} center distanceFactor={9} pointerEvents="none">
            <span className="scene-label">Reticulum</span>
          </Html>
          {showBolus && (
            <group position={[0.32, -0.16, 0.25]}>
              <mesh
                rotation={[0.25, 0.2, Math.PI / 2]}
                onClick={(event) => {
                  event.stopPropagation();
                  onBolusClick();
                }}
              >
                <capsuleGeometry args={[0.06, 0.18, 8, 16]} />
                <meshStandardMaterial color="#31d4a1" emissive="#087f68" emissiveIntensity={0.8} metalness={0.25} roughness={0.3} />
              </mesh>
              <Html position={[0.05, 0.2, 0.05]} center distanceFactor={8} pointerEvents="none">
                <span className="scene-label scene-label-bolus">Smart Bolus</span>
              </Html>
            </group>
          )}
        </group>
      )}
    </group>
  );
}

function Hills() {
  return (
    <group>
      <mesh position={[-8, -1.1, -12]} scale={[10, 4.1, 3]}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshStandardMaterial color="#557847" roughness={1} />
      </mesh>
      <mesh position={[7, -1.35, -14]} scale={[12, 4.6, 3]}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshStandardMaterial color="#668651" roughness={1} />
      </mesh>
      <mesh position={[0, -1.6, -20]} scale={[20, 5, 3]}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshStandardMaterial color="#7e9860" roughness={1} />
      </mesh>
    </group>
  );
}

function Sky() {
  return (
    <group>
      <mesh scale={90} renderOrder={-2}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#66b4e7" side={1} fog={false} />
      </mesh>
      <Cloud position={[-5.8, 7.2, -9]} scale={1.15} />
      <Cloud position={[-3.7, 7.5, -9.3]} scale={0.82} />
      <Cloud position={[2.2, 8.5, -11]} scale={1.1} />
      <Cloud position={[7.4, 7.1, -7]} scale={0.75} />
    </group>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const puffs: [number, number, number, number][] = [
    [-0.8, 0, 0, 0.7],
    [-0.25, 0.28, 0, 0.9],
    [0.38, 0.14, 0, 0.78],
    [0.88, -0.05, 0, 0.58],
  ];
  return (
    <group position={position} scale={scale}>
      {puffs.map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} scale={[1.3, 0.62, 0.75]}>
          <sphereGeometry args={[radius, 12, 8]} />
          <meshBasicMaterial color="#fffdf5" />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[42, 42]} />
      <meshStandardMaterial color="#55913a" roughness={1} />
    </mesh>
  );
}

function Pasture() {
  const grass = useRef<import('three').InstancedMesh>(null);
  const [texture, roughnessMap, normalMap] = useTexture([
    '/textures/leafy_grass_diff_1k.jpg',
    '/textures/leafy_grass_rough_1k.jpg',
    '/textures/leafy_grass_nor_gl_1k.jpg',
  ]);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  roughnessMap.anisotropy = 4;
  normalMap.anisotropy = 4;
  texture.repeat.set(11, 11);
  roughnessMap.repeat.set(11, 11);
  normalMap.repeat.set(11, 11);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;
  normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
  const geometry = useMemo(() => new ConeGeometry(0.014, 0.12, 3), []);
  const material = useMemo(() => new MeshStandardMaterial({ color: '#456d31', roughness: 1 }), []);
  const blades = 1400;

  useEffect(() => {
    if (!grass.current) return;
    const helper = new Object3D();
    let seed = 92073;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < blades; index += 1) {
      const x = (random() - 0.5) * 18;
      const z = (random() - 0.5) * 15;
      helper.position.set(x, 0.06, z);
      helper.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.13);
      const scale = 0.45 + random() * 0.55;
      helper.scale.set(scale, scale, scale);
      helper.updateMatrix();
      grass.current.setMatrixAt(index, helper.matrix);
    }
    grass.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42, 1, 1]} />
        <meshStandardMaterial map={texture} roughnessMap={roughnessMap} normalMap={normalMap} color="#55913a" roughness={1} normalScale={[0.28, 0.28]} />
      </mesh>
      <instancedMesh ref={grass} args={[geometry, material, blades]} castShadow />
    </>
  );
}

function Fence() {
  const posts: [number, number][] = [
    [-6, -4.6], [-3, -4.6], [0, -4.6], [3, -4.6], [6, -4.6],
    [-6, 4.6], [-3, 4.6], [0, 4.6], [3, 4.6], [6, 4.6],
    [-6, -1.5], [-6, 1.5], [6, -1.5], [6, 1.5],
  ];
  const rails: { position: [number, number, number]; length: number; rotationY?: number }[] = [
    { position: [0, 0.6, -4.6], length: 12 },
    { position: [0, 0.23, -4.6], length: 12 },
    { position: [0, 0.6, 4.6], length: 12 },
    { position: [0, 0.23, 4.6], length: 12 },
    { position: [-6, 0.6, 0], length: 9.2, rotationY: Math.PI / 2 },
    { position: [-6, 0.23, 0], length: 9.2, rotationY: Math.PI / 2 },
    { position: [6, 0.6, 0], length: 9.2, rotationY: Math.PI / 2 },
    { position: [6, 0.23, 0], length: 9.2, rotationY: Math.PI / 2 },
  ];
  const timber = useMemo(() => new MeshStandardMaterial({ color: '#765334', roughness: 0.95 }), []);

  return (
    <group>
      {posts.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.55, z]} castShadow material={timber}>
          <cylinderGeometry args={[0.065, 0.085, 1.1, 6]} />
        </mesh>
      ))}
      {rails.map((rail, index) => (
        <mesh key={index} position={rail.position} rotation={[0, rail.rotationY ?? 0, 0]} castShadow material={timber}>
          <boxGeometry args={[rail.length, 0.12, 0.09]} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.6, 7]} />
        <meshStandardMaterial color="#67452e" roughness={1} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.92, 16, 12]} />
        <meshStandardMaterial color="#477344" roughness={1} />
      </mesh>
      <mesh position={[-0.42, 1.67, 0.18]} castShadow>
        <sphereGeometry args={[0.55, 14, 10]} />
        <meshStandardMaterial color="#5d8549" roughness={1} />
      </mesh>
      <mesh position={[0.44, 1.76, -0.15]} castShadow>
        <sphereGeometry args={[0.58, 14, 10]} />
        <meshStandardMaterial color="#3f6d40" roughness={1} />
      </mesh>
    </group>
  );
}

function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.35, 0, 0.34].map((x, index) => (
        <mesh key={x} position={[x, 0.38 + (index % 2) * 0.08, 0]} scale={[0.72, 0.62, 0.66]} castShadow>
          <sphereGeometry args={[0.5, 12, 8]} />
          <meshStandardMaterial color={index % 2 ? '#62884e' : '#527947'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function WaterTrough({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.23, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.46, 0.52]} />
        <meshStandardMaterial color="#71848a" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[1.17, 0.025, 0.36]} />
        <meshStandardMaterial color="#527c83" metalness={0.25} roughness={0.2} />
      </mesh>
      {[-0.47, 0.47].map((x) => (
        <mesh key={x} position={[x, -0.05, 0]} castShadow>
          <boxGeometry args={[0.07, 0.32, 0.43]} />
          <meshStandardMaterial color="#4d5a56" roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}
