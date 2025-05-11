"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  Instances,
  Instance,
  Text,
} from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { InstancedMesh, Mesh } from "three";

//Globe setting
const GLOBE_RADIUS = 2;
const POINT_RADIUS = 0.03;
const NUM_POINTS = 30;
const BUTTON_DISPLAY_DURATION = 1000;

//Rotating Globe
export function Globe() {
  const router = useRouter();

  //Imperative roation of globes with point
  const globeRef = useRef<Mesh>(null);
  const pointsRef = useRef<InstancedMesh>(null);

  // User rotation track variables
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  // Automatic rotation tracking
  const [isRotating, setIsRotating] = useState(true);

  // Evenly distribute 30 days with 360 degrees globe

  const pointPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const phi = Math.acos(-1 + (2 * i) / NUM_POINTS);
      const theta = Math.sqrt(NUM_POINTS * Math.PI) * phi;
      const x = GLOBE_RADIUS * Math.cos(theta) * Math.sin(phi);
      const y = GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi);
      const z = GLOBE_RADIUS * Math.cos(phi);
      positions.push(new THREE.Vector3(x, y, z));
    }
    return positions;
  }, []);

  // Continue rotation logic
  useFrame((state) => {
    if (isRotating) {
      const t = state.clock.getElapsedTime();
      if (globeRef.current) globeRef.current.rotation.y = t * 0.1;
      if (pointsRef.current) pointsRef.current.rotation.y = t * 0.1;
    }
  });

  // If mouse hover

  const handleHover = useCallback(
    (idx: number | null) => {
      setHoverIndex(idx);
      setIsRotating(idx === null && clickedIndex === null);
    },
    [clickedIndex]
  );

  // If click any point on the globe

  const handleClick = useCallback(
    (idx: number) => {
      setClickedIndex(idx);
      setIsRotating(false);
      router.push(`/day-${idx + 1}`);
      setTimeout(() => {
        setClickedIndex(null);
        setIsRotating(true);
      }, BUTTON_DISPLAY_DURATION);
    },
    [router]
  );

  useEffect(() => {
    if (clickedIndex !== null) {
      const timer = setTimeout(() => {
        setClickedIndex(null);
        setIsRotating(true);
      }, BUTTON_DISPLAY_DURATION);
      return () => clearTimeout(timer);
    }
  }, [clickedIndex]);

  // Main rendering logic of globe

  return (
    <group scale={[0.9, 0.9, 0.9]}>
      <Sphere ref={globeRef} args={[GLOBE_RADIUS, 64, 64]}>
        <meshStandardMaterial color="#ffffff" wireframe />
      </Sphere>
      <Instances limit={NUM_POINTS} ref={pointsRef}>
        <sphereGeometry args={[POINT_RADIUS, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
        {pointPositions.map((position, index) => (
          <group key={index}>
            <Instance
              position={position.toArray() as [number, number, number]}
              onClick={() => handleClick(index)}
              onPointerOver={() => handleHover(index)}
              onPointerOut={() => handleHover(null)}
            />
            <Text
              position={[position.x * 1.1, position.y * 1.1, position.z * 1.1]}
              fontSize={0.1}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {`Day ${index + 1}`}
            </Text>
          </group>
        ))}
      </Instances>
    </group>
  );
}

/// Main application here
export default function Home() {
  // Always show the globe
  const [showGlobe, setShowGlobe] = useState(true);
  return (
    <main className="bg-black">
      <section className="relative w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            showGlobe ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Canvas
            className="w-full h-full"
            camera={{ position: [0, 0, 5], fov: 45 }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Globe />
              <OrbitControls enableZoom={true} enablePan={false} />
            </Suspense>
          </Canvas>
        </div>
      </section>
    </main>
  );
}
