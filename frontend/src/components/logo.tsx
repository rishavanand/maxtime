const CX = 16;
const CY = 16;
const LEN = 12;
const RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const CLOCK_HANDS = new Set([300, 60]);

// Pre-compute coordinates to avoid hydration mismatch from floating point
const RAY_COORDS = RAYS.map((angle) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    angle,
    x2: Math.round((CX + LEN * Math.cos(rad)) * 1000) / 1000,
    y2: Math.round((CY + LEN * Math.sin(rad)) * 1000) / 1000,
    isHand: CLOCK_HANDS.has(angle),
  };
});

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {RAY_COORDS.filter((r) => !r.isHand).map((r) => (
        <line
          key={r.angle}
          x1={CX}
          y1={CY}
          x2={r.x2}
          y2={r.y2}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      ))}
      {RAY_COORDS.filter((r) => r.isHand).map((r) => (
        <line
          key={r.angle}
          x1={CX}
          y1={CY}
          x2={r.x2}
          y2={r.y2}
          stroke="#c2410c"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      ))}
      <circle cx={CX} cy={CY} r={2} fill="#c2410c" />
    </svg>
  );
}
