import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, useLoader } from "@react-three/fiber";
import { Missile3D, Interceptor3D, Explosion3D, Debris3D } from "../components/Models3D";
import * as THREE from "three";
import { C } from "../lib/constants";

// Camera controller using useThree for actual rendering camera
const InterceptCamController: React.FC<{
  camDist: number; camHeight: number; camAngle: number;
  lookY: number; shakeX: number; shakeY: number;
}> = ({ camDist, camHeight, camAngle, lookY, shakeX, shakeY }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(
    Math.sin(camAngle) * camDist + shakeX,
    camHeight + shakeY,
    Math.cos(camAngle) * camDist,
  );
  cam.lookAt(0, lookY, 0);
  cam.fov = 60;
  cam.near = 0.1;
  cam.far = 300;
  cam.updateProjectionMatrix();
  return null;
};

// ── 3D map ground ──
const MapGround: React.FC<{ groundY: number }> = ({ groundY }) => {
  const texture = useLoader(THREE.TextureLoader, staticFile("map-light.png"));
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]}>
      <planeGeometry args={[80, 45]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

// ── Spatial layout ──
// Explosion high in the sky so camera looks up with blue sky behind
const GROUND_Y = -8;
const EXPLOSION_Y = 10;
const EXPLOSION_POS: [number, number, number] = [0, EXPLOSION_Y, 0];

// ── Timing phases (in frames) ──
const PHASE = {
  missileVisible: 0,
  interceptLaunch: 0,
  impact: 128,
  debrisStart: 152,
  debrisGround: 296,
  fadeOut: 328,
};

// ── Incoming missile path ──
// Starts high above, descends to explosion point in the sky
const MISSILE_START: [number, number, number] = [12, 24, -5];

// ── Pre-computed debris data ──
const DEBRIS_COUNT = 14;
const debrisItems = Array.from({ length: DEBRIS_COUNT }).map((_, i) => ({
  velX: Math.sin(i * 2.7 + 0.5) * 0.04 + (i % 2 === 0 ? 0.01 : -0.01),
  velY: 0.02 + (i % 5) * 0.008,
  velZ: Math.cos(i * 1.9 + 0.3) * 0.035,
  rotSpeedX: 0.03 + (i % 5) * 0.015,
  rotSpeedY: 0.04 + (i % 4) * 0.012,
  rotSpeedZ: 0.02 + (i % 3) * 0.018,
  variant: (i % 3) as 0 | 1 | 2,
  onFire: i < 6,
  scale: 0.15 + (i % 4) * 0.07,
}));

// ── Interceptor configs ──
// Start positions close to ground, spread out but not too far from center
const interceptors = [
  { startX: -8, startZ: 6, delay: 0, label: "IRON DOME #1" },
  { startX: 6, startZ: 8, delay: 12, label: "IRON DOME #2" },
  { startX: -4, startZ: -5, delay: 22, label: "DAVID'S SLING" },
  { startX: 9, startZ: -3, delay: 8, label: "IRON DOME #3" },
];

export const InterceptionScene = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const impacted = frame >= PHASE.impact;
  const debrisPhase = frame >= PHASE.debrisStart;

  // ── Incoming ballistic missile ──
  const missileProgress = interpolate(frame, [PHASE.missileVisible, PHASE.impact], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const missileX = interpolate(missileProgress, [0, 1], [MISSILE_START[0], EXPLOSION_POS[0]]);
  const missileY = interpolate(missileProgress, [0, 1], [MISSILE_START[1], EXPLOSION_POS[1]]);
  const missileZ = interpolate(missileProgress, [0, 1], [MISSILE_START[2], EXPLOSION_POS[2]]);

  // ── Explosion ──
  const explosionScale = impacted
    ? interpolate(frame, [PHASE.impact, PHASE.impact + 20, PHASE.impact + 80], [0.2, 3, 5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const explosionOpacity = impacted
    ? interpolate(frame, [PHASE.impact, PHASE.impact + 10, PHASE.impact + 100], [1, 0.8, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // ── Flash ──
  const flashOpacity = impacted
    ? interpolate(frame, [PHASE.impact, PHASE.impact + 4, PHASE.impact + 20], [0, 0.9, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // ── Camera ──
  // Camera below explosion, looking UP so sky is behind the interception
  // Gradual zoom in toward the action

  const camDist = interpolate(
    frame,
    [0, PHASE.impact, PHASE.debrisStart, durationInFrames],
    [38, 18, 22, 30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  const camHeight = interpolate(
    frame,
    [0, PHASE.impact, PHASE.debrisGround, durationInFrames],
    [GROUND_Y + 6, GROUND_Y + 8, GROUND_Y + 6, GROUND_Y + 4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const camAngle = interpolate(frame, [0, durationInFrames], [0.2, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Look-at: aimed upward at explosion area, drops to track debris after impact
  const lookY = interpolate(
    frame,
    [0, PHASE.impact, PHASE.debrisStart, PHASE.debrisGround, durationInFrames],
    [EXPLOSION_Y - 2, EXPLOSION_Y, EXPLOSION_Y - 4, GROUND_Y + 4, GROUND_Y + 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  // Camera shake on impact
  const shakeIntensity = impacted ? Math.max(0, 1 - (frame - PHASE.impact) / 40) : 0;
  const shakeX = shakeIntensity * Math.sin(frame * 20) * 0.3;
  const shakeY = shakeIntensity * Math.cos(frame * 17) * 0.2;

  // Camera is controlled by InterceptCamController inside ThreeCanvas

  // ── HUD text ──
  let hudLine1 = "INCOMING BALLISTIC MISSILE DETECTED";
  let hudLine2 = "ACTIVATING AIR DEFENSE SYSTEMS...";
  let hudColor = C.hudRed;

  if (frame >= PHASE.interceptLaunch && !impacted) {
    hudLine1 = "INTERCEPTORS LAUNCHED";
    hudLine2 = "IRON DOME + DAVID'S SLING ENGAGING";
    hudColor = C.hudAmber;
  }
  if (impacted && frame < PHASE.debrisStart) {
    hudLine1 = "⚡ INTERCEPTION CONFIRMED";
    hudLine2 = "TARGET NEUTRALIZED";
    hudColor = C.hudGreen;
  }
  if (debrisPhase && frame <= PHASE.debrisGround) {
    hudLine1 = "TRACKING DEBRIS";
    hudLine2 = `${DEBRIS_COUNT} FRAGMENTS DETECTED`;
    hudColor = C.hudAmber;
  }
  if (frame > PHASE.debrisGround) {
    hudLine1 = "ALL DEBRIS GROUNDED";
    hudLine2 = "THREAT ELIMINATED";
    hudColor = C.hudGreen;
  }

  // ── Fade to black ──
  const fadeOut = interpolate(frame, [PHASE.fadeOut, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#88bbdd" }}>
      <ThreeCanvas width={width} height={height}>
        <InterceptCamController
          camDist={camDist}
          camHeight={camHeight}
          camAngle={camAngle}
          lookY={lookY}
          shakeX={shakeX}
          shakeY={shakeY}
        />
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 30, 15]} intensity={2.5} color="#fffaef" />
        <directionalLight position={[-5, 15, -10]} intensity={0.8} color="#aaccee" />
        <directionalLight position={[5, 20, 10]} intensity={1.0} />

        {/* Explosion light */}
        {impacted && explosionOpacity > 0 && (
          <pointLight
            position={EXPLOSION_POS}
            color="#ff6600"
            intensity={explosionOpacity * 25}
            distance={50}
          />
        )}

        {/* Sky sphere */}
        <mesh>
          <sphereGeometry args={[120, 16, 16]} />
          <meshBasicMaterial color="#6aafe6" side={THREE.BackSide} />
        </mesh>

        {/* 3D Map ground */}
        <MapGround groundY={GROUND_Y} />
        {/* Extended ground beyond map edges */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y - 0.01, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#c4b9a0" />
        </mesh>

        {/* City buildings clusters on ground */}
        {Array.from({ length: 30 }).map((_, i) => {
          const gx = Math.sin(i * 3.7) * 15;
          const gz = Math.cos(i * 2.3) * 15;
          const h = 0.2 + (i % 4) * 0.15;
          return (
            <mesh key={`bldg-${i}`} position={[gx, GROUND_Y + h / 2, gz]}>
              <boxGeometry args={[0.3, h, 0.3]} />
              <meshStandardMaterial color="#b0a898" />
            </mesh>
          );
        })}

        {/* ── INCOMING MISSILE ── */}
        {!impacted && (
          <group>
            {(() => {
              // Compute rotation to point nose (+Y) along travel direction
              const dx = EXPLOSION_POS[0] - MISSILE_START[0];
              const dy = EXPLOSION_POS[1] - MISSILE_START[1];
              const dz = EXPLOSION_POS[2] - MISSILE_START[2];
              const rotX = Math.atan2(dz, dy);
              const rotZ = Math.atan2(-dx, Math.sqrt(dy * dy + dz * dz));
              return (
                <Missile3D
                  position={[missileX, missileY, missileZ]}
                  rotation={[rotX, 0, rotZ]}
                  scale={0.9}
                  showFlame
                  flameScale={1.5}
                />
              );
            })()}
            {/* Missile trail */}
            {Array.from({ length: 25 }).map((_, i) => {
              const tp = Math.max(0, missileProgress - i * 0.012);
              const tx = interpolate(tp, [0, 1], [MISSILE_START[0], EXPLOSION_POS[0]]);
              const ty = interpolate(tp, [0, 1], [MISSILE_START[1], EXPLOSION_POS[1]]);
              const tz = interpolate(tp, [0, 1], [MISSILE_START[2], EXPLOSION_POS[2]]);
              return (
                <mesh key={`mtrail-${i}`} position={[tx, ty, tz]}>
                  <sphereGeometry args={[0.18 + i * 0.025, 6, 6]} />
                  <meshStandardMaterial
                    color="#ff6644"
                    emissive="#ff4422"
                    emissiveIntensity={1.5}
                    transparent
                    opacity={Math.max(0, 0.6 - i * 0.024)}
                  />
                </mesh>
              );
            })}
          </group>
        )}

        {/* ── INTERCEPTOR MISSILES ── */}
        {frame >= PHASE.interceptLaunch &&
          interceptors.map((intc, i) => {
            const t = Math.max(0, frame - PHASE.interceptLaunch - intc.delay);
            const totalTime = PHASE.impact - PHASE.interceptLaunch - intc.delay;
            const p = interpolate(t, [0, totalTime], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.quad),
            });

            if (impacted && p >= 0.9) return null;

            // Start from just above ground, rise toward explosion point
            const ix = intc.startX + (EXPLOSION_POS[0] - intc.startX) * p;
            const iy = GROUND_Y + 1 + (EXPLOSION_POS[1] - (GROUND_Y + 1)) * p;
            const iz = intc.startZ + (EXPLOSION_POS[2] - intc.startZ) * p;

            // Compute rotation to point nose (+Y) toward target
            const dirX = EXPLOSION_POS[0] - ix;
            const dirY = EXPLOSION_POS[1] - iy;
            const dirZ = EXPLOSION_POS[2] - iz;
            const iRotX = Math.atan2(dirZ, dirY);
            const iRotZ = Math.atan2(-dirX, Math.sqrt(dirY * dirY + dirZ * dirZ));

            return (
              <group key={`int-${i}`}>
                <Interceptor3D
                  position={[ix, iy, iz]}
                  rotation={[iRotX, 0, iRotZ]}
                  scale={1}
                  showFlame={!impacted}
                />
                {/* Interceptor trail */}
                {Array.from({ length: 12 }).map((_, j) => {
                  const tp2 = Math.max(0, p - j * 0.018);
                  const tjx = intc.startX + (EXPLOSION_POS[0] - intc.startX) * tp2;
                  const tjy = GROUND_Y + 1 + (EXPLOSION_POS[1] - (GROUND_Y + 1)) * tp2;
                  const tjz = intc.startZ + (EXPLOSION_POS[2] - intc.startZ) * tp2;
                  return (
                    <mesh key={`itrail-${i}-${j}`} position={[tjx, tjy, tjz]}>
                      <sphereGeometry args={[0.1, 4, 4]} />
                      <meshStandardMaterial
                        color="#88ffaa"
                        emissive="#44ff66"
                        emissiveIntensity={1.5}
                        transparent
                        opacity={Math.max(0, 0.5 - j * 0.04)}
                      />
                    </mesh>
                  );
                })}
              </group>
            );
          })}

        {/* ── EXPLOSION ── */}
        {impacted && explosionOpacity > 0 && (
          <Explosion3D
            position={EXPLOSION_POS}
            scale={explosionScale}
            opacity={explosionOpacity}
          />
        )}

        {/* ── DEBRIS FALLING ── */}
        {debrisPhase &&
          debrisItems.map((d, i) => {
            const t = frame - PHASE.debrisStart;
            const gravity = 0.002;

            // Position: from explosion point outward and downward
            let dy = EXPLOSION_POS[1] + d.velY * t - 0.5 * gravity * t * t;
            const dx = EXPLOSION_POS[0] + d.velX * t;
            const dz = EXPLOSION_POS[2] + d.velZ * t;

            const hitGround = dy <= GROUND_Y;
            if (hitGround) dy = GROUND_Y;

            const rotX = hitGround ? 0 : d.rotSpeedX * t;
            const rotY = hitGround ? 0 : d.rotSpeedY * t;
            const rotZ = hitGround ? 0 : d.rotSpeedZ * t;

            const fireActive = d.onFire && !hitGround && t < 140;

            return (
              <group key={`deb-${i}`}>
                <Debris3D
                  position={[dx, dy, dz]}
                  rotation={[rotX, rotY, rotZ]}
                  scale={d.scale}
                  variant={d.variant}
                  onFire={fireActive}
                />
                {/* Fire trail while falling */}
                {fireActive && t > 5 &&
                  Array.from({ length: 6 }).map((_, j) => {
                    const tt = t - j * 3;
                    if (tt < 0) return null;
                    const tdy = EXPLOSION_POS[1] + d.velY * tt - 0.5 * gravity * tt * tt;
                    const tdx = EXPLOSION_POS[0] + d.velX * tt;
                    const tdz = EXPLOSION_POS[2] + d.velZ * tt;
                    return (
                      <mesh key={`dtrail-${i}-${j}`} position={[tdx, tdy, tdz]}>
                        <sphereGeometry args={[0.07, 4, 4]} />
                        <meshStandardMaterial
                          color="#ff4400"
                          emissive="#ff2200"
                          emissiveIntensity={1.5}
                          transparent
                          opacity={Math.max(0, 0.35 - j * 0.06)}
                        />
                      </mesh>
                    );
                  })}
                {/* Dust puff on ground impact */}
                {hitGround &&
                  (() => {
                    // Approximate impact time using quadratic formula
                    const a = 0.5 * gravity;
                    const b = -d.velY;
                    const c2 = -(EXPLOSION_POS[1] - GROUND_Y);
                    const disc = b * b - 4 * a * c2;
                    if (disc < 0) return null;
                    const impactT = (-b + Math.sqrt(disc)) / (2 * a);
                    const sinceImpact = t - impactT;
                    if (sinceImpact < 0 || sinceImpact > 50) return null;
                    const dustScale = interpolate(sinceImpact, [0, 50], [0.1, 2], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    const dustOp = interpolate(sinceImpact, [0, 50], [0.5, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    return (
                      <mesh
                        position={[dx, GROUND_Y + 0.1, dz]}
                        scale={[dustScale, dustScale * 0.3, dustScale]}
                      >
                        <sphereGeometry args={[0.5, 6, 6]} />
                        <meshStandardMaterial color="#aa9977" transparent opacity={dustOp} />
                      </mesh>
                    );
                  })()}
              </group>
            );
          })}
      </ThreeCanvas>

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ffffff",
            opacity: flashOpacity,
          }}
        />
      )}

      {/* HUD top-left */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          fontFamily: "monospace",
          fontSize: 31,
          color: hudColor,
          textShadow: `2px 2px 4px rgba(0,0,0,0.4)`,
          lineHeight: "44px",
        }}
      >
        <div>{hudLine1}</div>
        <div style={{ fontSize: 23, opacity: 0.8 }}>{hudLine2}</div>
      </div>

      {/* Defense system labels - bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          fontFamily: "monospace",
          fontSize: 26,
          color: C.hudGreen,
          textAlign: "right",
          lineHeight: "38px",
        }}
      >
        <div>כיפת ברזל // IRON DOME</div>
        <div>קלע דוד // DAVID&apos;S SLING</div>
        {impacted && (
          <div style={{ color: C.hudGreen, marginTop: 8 }}>
            STATUS: INTERCEPTION SUCCESS ✓
          </div>
        )}
      </div>

      {/* Interceptor launch indicators */}
      {frame >= PHASE.interceptLaunch && !impacted && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 30,
            fontFamily: "monospace",
            fontSize: 21,
            color: C.interceptor,
            lineHeight: "30px",
          }}
        >
          {interceptors.map((intc, i) => {
            const launched = frame >= PHASE.interceptLaunch + intc.delay;
            return (
              <div key={i} style={{ opacity: launched ? 1 : 0.3 }}>
                {launched ? "▶" : "○"} {intc.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Debris counter */}
      {debrisPhase && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 30,
            fontFamily: "monospace",
            fontSize: 23,
            color: C.hudAmber,
          }}
        >
          ⚠ FALLING DEBRIS: {DEBRIS_COUNT} FRAGMENTS
        </div>
      )}

      {/* Fade to white */}
      {fadeOut > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ffffff",
            opacity: fadeOut,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
