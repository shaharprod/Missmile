import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Missile3D, Launcher3D } from "../components/Models3D";
import * as THREE from "three";
import { C } from "../lib/constants";

// Phase timing
const ERECT_START = 28;
const ERECT_END = 60;
const IGNITION = 68;
const LIFTOFF = 76;
const ZOOM_OUT_START = 96;

const LAUNCHER_SCALE = 1.8;

// Inner component that controls the camera via useThree
const CameraController: React.FC<{
  camDist: number;
  camY: number;
  camAngle: number;
  lookY: number;
  fov: number;
  shakeX: number;
  shakeY: number;
}> = ({ camDist, camY, camAngle, lookY, fov, shakeX, shakeY }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(
    Math.sin(camAngle) * camDist + shakeX,
    camY + shakeY,
    Math.cos(camAngle) * camDist,
  );
  cam.lookAt(0, lookY, 0);
  cam.fov = fov;
  cam.near = 0.1;
  cam.far = 200;
  cam.updateProjectionMatrix();
  return null;
};

export const LaunchScene = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const launched = frame >= LIFTOFF;

  const erectorAngle = interpolate(frame, [ERECT_START, ERECT_END], [0.2, Math.PI / 2], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const missileY = launched
    ? interpolate(frame, [LIFTOFF, LIFTOFF + 30, durationInFrames], [3.5 * LAUNCHER_SCALE, 8, 35], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 3.5 * LAUNCHER_SCALE;

  const flameActive = frame >= IGNITION;
  const flameScale = flameActive
    ? interpolate(frame, [IGNITION, IGNITION + 5, LIFTOFF, durationInFrames], [0.1, 0.8, 1.5, 1.2], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Camera - ~20m away, zooms out to ~45m
  const camDist = interpolate(
    frame,
    [0, ERECT_START, ERECT_END, IGNITION, LIFTOFF, ZOOM_OUT_START, durationInFrames],
    [16, 16, 18, 19, 20, 25, 45],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  const camY = interpolate(
    frame,
    [0, ERECT_START, ERECT_END, IGNITION, LIFTOFF, ZOOM_OUT_START, durationInFrames],
    [3, 3, 5, 6, 7, 12, 25],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  const camAngle = interpolate(
    frame,
    [0, ERECT_START, ERECT_END, IGNITION, durationInFrames],
    [0.7, 0.7, 0.4, 0.25, 0.1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const lookY = interpolate(
    frame,
    [0, ERECT_START, ERECT_END, IGNITION, ZOOM_OUT_START, durationInFrames],
    [0.8, 0.8, 2.5, 3.5, 5, Math.min(missileY * 0.35, 15)],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const fov = interpolate(
    frame,
    [0, ERECT_START, ERECT_END, IGNITION, ZOOM_OUT_START, durationInFrames],
    [40, 40, 42, 44, 46, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  let shakeX = 0;
  let shakeY = 0;
  if (frame >= IGNITION && frame < IGNITION + 40) {
    const t = (frame - IGNITION) / 40;
    const intensity = frame < LIFTOFF ? 0.06 : 0.15 * (1 - t);
    shakeX = intensity * Math.sin(frame * 18);
    shakeY = intensity * Math.cos(frame * 14);
  }

  const flashOpacity =
    frame >= IGNITION
      ? interpolate(frame, [IGNITION, IGNITION + 3, IGNITION + 12], [0, 0.5, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const liftoffFlash =
    frame >= LIFTOFF
      ? interpolate(frame, [LIFTOFF, LIFTOFF + 2, LIFTOFF + 10], [0, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  let hudPhase = "SURVEILLANCE MODE";
  let hudDetail = "TEHRAN, IRAN // 35.689°N 51.389°E";
  if (frame >= ERECT_START && frame < IGNITION) {
    hudPhase = "⚠ LAUNCHER ERECTING";
    hudDetail = "BALLISTIC MISSILE PREPARATION DETECTED";
  } else if (frame >= IGNITION && frame < LIFTOFF) {
    hudPhase = "⚠ ENGINE IGNITION";
    hudDetail = "LAUNCH IMMINENT";
  } else if (frame >= LIFTOFF) {
    hudPhase = "🚀 MISSILE LAUNCHED";
    hudDetail = "BALLISTIC TRAJECTORY // TRACKING...";
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#88bbdd" }}>
      <ThreeCanvas width={width} height={height}>
        {/* Camera controller using useThree - this is the REAL camera */}
        <CameraController
          camDist={camDist}
          camY={camY}
          camAngle={camAngle}
          lookY={lookY}
          fov={fov}
          shakeX={shakeX}
          shakeY={shakeY}
        />

        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 10, 6]} intensity={2.5} color="#fffaef" />
        <directionalLight position={[-3, 6, -4]} intensity={1.0} color="#aaccee" />
        <directionalLight position={[0, 3, -8]} intensity={0.8} color="#aabbcc" />
        <pointLight position={[8, 12, 10]} intensity={9.0} color="#ffe0c0" distance={50} />
        <pointLight position={[-5, 6, 8]} intensity={6.0} color="#ffffff" distance={40} />
        <pointLight position={[0, 3, 8]} intensity={4.5} color="#ffffff" distance={30} />
        <pointLight position={[5, 2, -6]} intensity={3.0} color="#aabbdd" distance={25} />

        {flameActive && (
          <>
            <pointLight position={[0, missileY - 1.5, -0.5]} color="#ff5500" intensity={flameScale * 12} distance={30} />
            <pointLight position={[0, 1, -0.5]} color="#ff4400" intensity={flameScale * 8} distance={15} />
          </>
        )}

        {/* Sky */}
        <mesh>
          <sphereGeometry args={[80, 16, 16]} />
          <meshBasicMaterial color="#6aafe6" side={THREE.BackSide} />
        </mesh>

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#c4a878" roughness={0.9} />
        </mesh>

        {/* Ground details */}
        {Array.from({ length: 20 }).map((_, i) => {
          const gx = Math.sin(i * 4.7) * 8;
          const gz = Math.cos(i * 3.2) * 8;
          return (
            <mesh key={`rock-${i}`} position={[gx, 0.02, gz]} rotation={[-Math.PI / 2, 0, i]}>
              <circleGeometry args={[0.3 + (i % 3) * 0.2, 6]} />
              <meshStandardMaterial color="#a89060" roughness={1} />
            </mesh>
          );
        })}

        {/* Concrete launch pad */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.5]}>
          <planeGeometry args={[6, 8]} />
          <meshStandardMaterial color="#b0b0a0" roughness={0.8} />
        </mesh>

        {/* LAUNCHER */}
        <group scale={[LAUNCHER_SCALE, LAUNCHER_SCALE, LAUNCHER_SCALE]}>
          <Launcher3D position={[0, 0, 0]} launchAngle={erectorAngle} />
        </group>

        {/* MISSILE after liftoff */}
        {launched && (
          <Missile3D
            position={[0, missileY, -0.5 * LAUNCHER_SCALE]}
            rotation={[0, 0, 0]}
            scale={0.9}
            showFlame
            flameScale={flameScale}
          />
        )}

        {/* Missile on erector before liftoff */}
        {!launched && frame >= ERECT_START && (
          <group
            position={[0, 0.6 * LAUNCHER_SCALE, -0.5 * LAUNCHER_SCALE]}
            rotation={[-(Math.PI / 2 - erectorAngle), 0, 0]}
          >
            <Missile3D
              position={[0, 1.8 * LAUNCHER_SCALE, 0]}
              rotation={[0, 0, 0]}
              scale={0.7}
              showFlame={flameActive}
              flameScale={flameScale}
            />
          </group>
        )}

        {/* Smoke trail */}
        {launched &&
          Array.from({ length: Math.min(frame - LIFTOFF, 50) }).map((_, i) => {
            const t = i / Math.max(1, frame - LIFTOFF);
            const trailY = 3.5 * LAUNCHER_SCALE + (missileY - 3.5 * LAUNCHER_SCALE) * t;
            const drift = Math.sin(i * 0.35) * 0.15 * (1 - t);
            const age = i / 50;
            return (
              <mesh key={`smoke-${i}`} position={[drift, trailY, -0.5 * LAUNCHER_SCALE + drift * 0.25]}>
                <sphereGeometry args={[0.1 + age * 0.8, 8, 8]} />
                <meshStandardMaterial color="#aaa899" transparent opacity={Math.max(0, 0.55 - age * 0.9)} />
              </mesh>
            );
          })}

        {/* Dust cloud on liftoff */}
        {launched && frame < LIFTOFF + 60 && (
          <group position={[0, 0.05, -0.5 * LAUNCHER_SCALE]}>
            {Array.from({ length: 12 }).map((_, i) => {
              const t = (frame - LIFTOFF) / 60;
              const angle = (i / 12) * Math.PI * 2;
              const r = t * 5;
              return (
                <mesh key={`dust-${i}`} position={[Math.sin(angle) * r, 0.1 + t * 1.2, Math.cos(angle) * r]}>
                  <sphereGeometry args={[0.35 + t * 0.8, 6, 6]} />
                  <meshStandardMaterial color="#998877" transparent opacity={Math.max(0, 0.5 - t * 0.6)} />
                </mesh>
              );
            })}
          </group>
        )}

        {/* Ignition smoke */}
        {flameActive && !launched && (
          <group position={[0, 0.3, -0.5 * LAUNCHER_SCALE]}>
            {Array.from({ length: 8 }).map((_, i) => {
              const t = (frame - IGNITION) / (LIFTOFF - IGNITION);
              const angle = (i / 8) * Math.PI * 2;
              const r = t * 2;
              return (
                <mesh key={`ign-smoke-${i}`} position={[Math.sin(angle) * r, t * 0.6, Math.cos(angle) * r]}>
                  <sphereGeometry args={[0.25 + t * 0.5, 6, 6]} />
                  <meshStandardMaterial color="#887766" transparent opacity={Math.max(0, 0.6 - t * 0.4)} />
                </mesh>
              );
            })}
          </group>
        )}
      </ThreeCanvas>

      {flashOpacity > 0 && (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#ff6600", opacity: flashOpacity }} />
      )}
      {liftoffFlash > 0 && (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffaa00", opacity: liftoffFlash }} />
      )}

      <div
        style={{
          position: "absolute", bottom: 40, left: 40,
          fontFamily: "monospace", fontSize: 31,
          color: frame >= IGNITION ? C.hudRed : C.hudAmber,
          textShadow: `2px 2px 4px rgba(0,0,0,0.5)`,
          lineHeight: "42px",
        }}
      >
        <div>{hudPhase}</div>
        <div style={{ fontSize: 21, opacity: 0.7 }}>{hudDetail}</div>
      </div>

      <div
        style={{
          position: "absolute", top: 30, right: 30,
          fontFamily: "monospace", fontSize: 21,
          color: C.hudGreen, opacity: 0.6, textAlign: "right", lineHeight: "30px",
        }}
      >
        <div>CAM: SATELLITE FEED</div>
        <div>LOC: TEHRAN REGION</div>
        <div>ALT: 350km ORBIT</div>
      </div>

      <div
        style={{
          position: "absolute", top: 30, left: 40,
          fontFamily: "monospace", fontSize: 18,
          color: C.hudGreen, opacity: 0.5,
        }}
      >
        T{launched ? "+" : "-"}{Math.abs(((frame - LIFTOFF) / 30)).toFixed(1)}s
      </div>
    </AbsoluteFill>
  );
};
