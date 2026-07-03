interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle cx="20" cy="22" r="16" stroke="#f59e0b" strokeWidth="2" />

        {/* Top stem */}
        <rect x="18.5" y="4" width="3" height="4" rx="1.5" fill="#f59e0b" />

        {/* Crown buttons */}
        <rect x="13" y="4.5" width="5" height="2.5" rx="1.25" fill="#f59e0b" />
        <rect x="22" y="4.5" width="5" height="2.5" rx="1.25" fill="#f59e0b" />

        {/* FPL text — below center */}
        <text
          x="20"
          y="31"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, Arial, sans-serif"
          letterSpacing="1"
          fill="#f59e0b"
        >
          FPL
        </text>

        {/* Hour hand — pointing to ~11 (10:58) */}
        <line x1="20" y1="22" x2="16" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

        {/* Minute hand — pointing just before 12 (58 min) */}
        <line x1="20" y1="22" x2="18" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="20" cy="22" r="2.5" fill="#f59e0b" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="font-black tracking-tight"
            style={{ fontSize: size * 0.38, color: "#ffffff", letterSpacing: "-0.02em" }}
          >
            DEADLINE
          </span>
          <span
            className="font-black tracking-tight"
            style={{ fontSize: size * 0.38, color: "#f59e0b", letterSpacing: "-0.02em" }}
          >
            DAY
          </span>
        </div>
      )}
    </div>
  );
}
