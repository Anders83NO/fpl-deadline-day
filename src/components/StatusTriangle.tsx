// Shared status triangle used across the site
// yellow = doubtful (d), red = injured/unavailable (i/u)

export function StatusTriangle({ color, size = 14 }: { color: "yellow" | "red"; size?: number }) {
  const fill = color === "yellow" ? "#f59e0b" : "#ef4444";
  const textColor = color === "yellow" ? "#000" : "#fff";
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <polygon points="7,1 13,13 1,13" fill={fill} />
      <text x="7" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill={textColor}>!</text>
    </svg>
  );
}
