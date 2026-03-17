import React from "react";

// ═══════════════════════════════════════════════════════
// Ballistic Missile (Shahab/Emad-style)
// Long body, ogive warhead, stabilizer fins, engine section
// ═══════════════════════════════════════════════════════
export const Missile3D: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  glowColor?: string;
  showFlame?: boolean;
  flameScale?: number;
}> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  color = "#c8c8c0",
  glowColor = "#ff4400",
  showFlame = false,
  flameScale = 1,
}) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {/* Ogive warhead (pointed nose) */}
    <mesh position={[0, 3.2, 0]}>
      <coneGeometry args={[0.16, 1.0, 12]} />
      <meshStandardMaterial color="#888880" metalness={0.6} roughness={0.3} />
    </mesh>

    {/* Warhead-body transition ring */}
    <mesh position={[0, 2.65, 0]}>
      <cylinderGeometry args={[0.17, 0.16, 0.1, 12]} />
      <meshStandardMaterial color="#666660" metalness={0.5} roughness={0.4} />
    </mesh>

    {/* Upper body */}
    <mesh position={[0, 1.9, 0]}>
      <cylinderGeometry args={[0.17, 0.18, 1.4, 12]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
    </mesh>

    {/* Center band / separation ring */}
    <mesh position={[0, 1.15, 0]}>
      <cylinderGeometry args={[0.19, 0.19, 0.1, 12]} />
      <meshStandardMaterial color="#555550" metalness={0.6} roughness={0.3} />
    </mesh>

    {/* Lower body (fuel section) */}
    <mesh position={[0, 0.3, 0]}>
      <cylinderGeometry args={[0.18, 0.2, 1.6, 12]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
    </mesh>

    {/* Engine nozzle section */}
    <mesh position={[0, -0.6, 0]}>
      <cylinderGeometry args={[0.2, 0.22, 0.2, 12]} />
      <meshStandardMaterial color="#444440" metalness={0.7} roughness={0.2} />
    </mesh>

    {/* Nozzle bell */}
    <mesh position={[0, -0.8, 0]}>
      <cylinderGeometry args={[0.12, 0.2, 0.2, 12]} />
      <meshStandardMaterial color="#333330" metalness={0.8} roughness={0.2} />
    </mesh>

    {/* 4 stabilizer fins - larger, angled */}
    {[0, 1, 2, 3].map((i) => {
      const angle = (i * Math.PI) / 2;
      return (
        <mesh
          key={`fin-${i}`}
          position={[
            Math.sin(angle) * 0.28,
            -0.45,
            Math.cos(angle) * 0.28,
          ]}
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.02, 0.6, 0.35]} />
          <meshStandardMaterial color="#777770" metalness={0.4} roughness={0.4} />
        </mesh>
      );
    })}

    {/* Red stripe markings */}
    <mesh position={[0, 2.3, 0]}>
      <cylinderGeometry args={[0.175, 0.175, 0.06, 12]} />
      <meshStandardMaterial color="#cc2222" />
    </mesh>
    <mesh position={[0, 0.9, 0]}>
      <cylinderGeometry args={[0.195, 0.195, 0.06, 12]} />
      <meshStandardMaterial color="#cc2222" />
    </mesh>

    {/* Flame exhaust */}
    {showFlame && (
      <group position={[0, -1.0, 0]} scale={[flameScale, flameScale, flameScale]}>
        {/* Inner core - white hot */}
        <mesh>
          <coneGeometry args={[0.1, 0.6, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffff88"
            emissiveIntensity={4}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Mid flame - yellow/orange */}
        <mesh position={[0, -0.3, 0]}>
          <coneGeometry args={[0.18, 1.0, 8]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff6600"
            emissiveIntensity={3}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Outer flame - red/orange */}
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.25, 1.2, 8]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive={glowColor}
            emissiveIntensity={2}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    )}
  </group>
);

// ═══════════════════════════════════════════════════════
// TEL - Transporter Erector Launcher
// Military truck with erectable launch tube
// ═══════════════════════════════════════════════════════
export const Launcher3D: React.FC<{
  position?: [number, number, number];
  launchAngle: number;
}> = ({ position = [0, 0, 0], launchAngle }) => (
  <group position={position}>
    {/* Main chassis - military truck */}
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[1.6, 0.35, 4.5]} />
      <meshStandardMaterial color="#7a8a60" emissive="#222211" emissiveIntensity={0.15} metalness={0.3} roughness={0.7} />
    </mesh>

    {/* Red side marking stripe - left */}
    <mesh position={[-0.81, 0.42, -0.3]}>
      <boxGeometry args={[0.01, 0.12, 1.8]} />
      <meshStandardMaterial color="#cc2222" emissive="#881111" emissiveIntensity={0.3} />
    </mesh>
    {/* Red side marking stripe - right */}
    <mesh position={[0.81, 0.42, -0.3]}>
      <boxGeometry args={[0.01, 0.12, 1.8]} />
      <meshStandardMaterial color="#cc2222" emissive="#881111" emissiveIntensity={0.3} />
    </mesh>

    {/* Chassis undercarriage */}
    <mesh position={[0, 0.18, 0]}>
      <boxGeometry args={[1.3, 0.15, 4.2]} />
      <meshStandardMaterial color="#4a5a3a" emissive="#111108" emissiveIntensity={0.1} metalness={0.4} roughness={0.6} />
    </mesh>

    {/* 8 wheels (4 axles) */}
    {[-1.5, -0.6, 0.3, 1.2].map((z) =>
      [-0.75, 0.75].map((x) => (
        <group key={`w-${z}-${x}`} position={[x, 0.12, z]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          {/* Hub */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.6} />
          </mesh>
        </group>
      )),
    )}

    {/* Cab (front) */}
    <mesh position={[0, 0.8, 1.7]}>
      <boxGeometry args={[1.5, 0.65, 1.0]} />
      <meshStandardMaterial color="#7a8a60" emissive="#222211" emissiveIntensity={0.15} metalness={0.3} roughness={0.7} />
    </mesh>
    {/* Windshield */}
    <mesh position={[0, 0.95, 2.21]}>
      <boxGeometry args={[1.2, 0.3, 0.02]} />
      <meshStandardMaterial color="#1a3a5a" metalness={0.7} roughness={0.1} />
    </mesh>
    {/* Headlight left */}
    <mesh position={[-0.45, 0.7, 2.21]}>
      <boxGeometry args={[0.18, 0.1, 0.02]} />
      <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={2} />
    </mesh>
    {/* Headlight right */}
    <mesh position={[0.45, 0.7, 2.21]}>
      <boxGeometry args={[0.18, 0.1, 0.02]} />
      <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={2} />
    </mesh>

    {/* Hydraulic support legs */}
    {[-0.65, 0.65].map((x) => (
      <mesh key={`leg-${x}`} position={[x, 0.15, -1.5]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <meshStandardMaterial color="#444444" metalness={0.5} />
      </mesh>
    ))}
    {/* Leg pads on ground */}
    {[-0.65, 0.65].map((x) => (
      <mesh key={`pad-${x}`} position={[x, 0.01, -1.5]}>
        <boxGeometry args={[0.3, 0.02, 0.3]} />
        <meshStandardMaterial color="#333333" metalness={0.5} />
      </mesh>
    ))}

    {/* Erector arm pivot + launch tube */}
    <group position={[0, 0.6, -0.5]} rotation={[-(Math.PI / 2 - launchAngle), 0, 0]}>
      {/* Erector rail */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.3, 3.8, 0.25]} />
        <meshStandardMaterial color="#6a7a52" emissive="#181808" emissiveIntensity={0.1} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Launch tube */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 3.5, 12]} />
        <meshStandardMaterial color="#7a8a62" emissive="#181808" emissiveIntensity={0.1} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Tube cap rings */}
      {[-0.5, 0.5, 1.5].map((y) => (
        <mesh key={`ring-${y}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 12]} />
          <meshStandardMaterial color="#3a4a30" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>

    {/* Equipment boxes on chassis */}
    <mesh position={[-0.55, 0.7, 0.5]}>
      <boxGeometry args={[0.4, 0.25, 0.6]} />
      <meshStandardMaterial color="#4a5a3a" metalness={0.3} roughness={0.7} />
    </mesh>
    <mesh position={[0.55, 0.7, 0.5]}>
      <boxGeometry args={[0.4, 0.25, 0.6]} />
      <meshStandardMaterial color="#4a5a3a" metalness={0.3} roughness={0.7} />
    </mesh>
  </group>
);

// ═══════════════════════════════════════════════════════
// Interceptor missile (Tamir / Stunner style)
// Smaller, sleeker, with distinct nose seeker
// ═══════════════════════════════════════════════════════
export const Interceptor3D: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  showFlame?: boolean;
}> = ({ position, rotation = [0, 0, 0], scale = 0.6, showFlame = true }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {/* Seeker nose (dark) */}
    <mesh position={[0, 1.5, 0]}>
      <coneGeometry args={[0.05, 0.4, 8]} />
      <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.2} />
    </mesh>
    {/* Body */}
    <mesh position={[0, 0.7, 0]}>
      <cylinderGeometry args={[0.06, 0.07, 1.4, 8]} />
      <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.3} />
    </mesh>
    {/* Mid section (electronics) */}
    <mesh position={[0, 0.3, 0]}>
      <cylinderGeometry args={[0.075, 0.075, 0.15, 8]} />
      <meshStandardMaterial color="#aaaaaa" metalness={0.4} roughness={0.4} />
    </mesh>
    {/* Motor section */}
    <mesh position={[0, -0.2, 0]}>
      <cylinderGeometry args={[0.07, 0.065, 0.6, 8]} />
      <meshStandardMaterial color="#cccccc" metalness={0.4} roughness={0.4} />
    </mesh>
    {/* 4 control fins */}
    {[0, 1, 2, 3].map((i) => (
      <mesh
        key={`ifin-${i}`}
        position={[
          Math.sin((i * Math.PI) / 2) * 0.12,
          -0.15,
          Math.cos((i * Math.PI) / 2) * 0.12,
        ]}
        rotation={[0, (i * Math.PI) / 2, 0]}
      >
        <boxGeometry args={[0.015, 0.3, 0.14]} />
        <meshStandardMaterial color="#999999" metalness={0.5} roughness={0.4} />
      </mesh>
    ))}
    {/* Flame */}
    {showFlame && (
      <group position={[0, -0.55, 0]}>
        <mesh>
          <coneGeometry args={[0.06, 0.4, 6]} />
          <meshStandardMaterial
            color="#aaffcc"
            emissive="#44ff88"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <coneGeometry args={[0.04, 0.3, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#88ffbb"
            emissiveIntensity={4}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    )}
  </group>
);

// ═══════════════════════════════════════════════════════
// Explosion - multi-layered with spark particles
// ═══════════════════════════════════════════════════════
export const Explosion3D: React.FC<{
  position: [number, number, number];
  scale: number;
  opacity: number;
}> = ({ position, scale, opacity }) => (
  <group position={position}>
    {/* Core flash - white hot */}
    <mesh scale={[scale * 0.4, scale * 0.4, scale * 0.4]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffaa"
        emissiveIntensity={6}
        transparent
        opacity={opacity}
      />
    </mesh>
    {/* Inner fireball */}
    <mesh scale={[scale * 0.7, scale * 0.65, scale * 0.7]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="#ffaa00"
        emissive="#ff8800"
        emissiveIntensity={3}
        transparent
        opacity={opacity * 0.8}
      />
    </mesh>
    {/* Outer fireball */}
    <mesh scale={[scale, scale * 0.85, scale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="#ff4400"
        emissive="#ff2200"
        emissiveIntensity={2}
        transparent
        opacity={opacity * 0.5}
      />
    </mesh>
    {/* Smoke shell */}
    <mesh scale={[scale * 1.2, scale * 1.1, scale * 1.2]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#332200"
        transparent
        opacity={opacity * 0.3}
      />
    </mesh>
    {/* Shockwave ring */}
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[scale * 1.8, scale * 1.8, 0.05]}>
      <torusGeometry args={[1, 0.08, 8, 32]} />
      <meshStandardMaterial
        color="#ffaa44"
        emissive="#ff8800"
        emissiveIntensity={2}
        transparent
        opacity={opacity * 0.35}
      />
    </mesh>
    {/* Spark particles */}
    {Array.from({ length: 12 }).map((_, i) => {
      const theta = (i / 12) * Math.PI * 2;
      const phi = (i * 1.618) % Math.PI;
      const r = scale * 0.8;
      return (
        <mesh
          key={`spark-${i}`}
          position={[
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta),
          ]}
        >
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ffaa00"
            emissiveIntensity={4}
            transparent
            opacity={opacity * 0.8}
          />
        </mesh>
      );
    })}
  </group>
);

// ═══════════════════════════════════════════════════════
// Debris fragment
// ═══════════════════════════════════════════════════════
export const Debris3D: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  variant: number;
  onFire?: boolean;
}> = ({ position, rotation, scale = 0.15, variant, onFire = false }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {variant === 0 && (
      <mesh>
        <boxGeometry args={[1, 0.4, 0.7]} />
        <meshStandardMaterial color="#555550" metalness={0.5} roughness={0.5} />
      </mesh>
    )}
    {variant === 1 && (
      <mesh>
        <cylinderGeometry args={[0.15, 0.25, 1.2, 6]} />
        <meshStandardMaterial color="#666660" metalness={0.4} roughness={0.6} />
      </mesh>
    )}
    {variant === 2 && (
      <mesh>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#4a4a45" metalness={0.5} roughness={0.5} />
      </mesh>
    )}
    {onFire && (
      <>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={3}
            transparent
            opacity={0.7}
          />
        </mesh>
        <pointLight position={[0, 0.3, 0]} color="#ff4400" intensity={2} distance={3} />
      </>
    )}
  </group>
);
