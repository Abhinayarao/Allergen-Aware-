interface ShieldUtensilIconProps {
  className?: string;
  size?: number;
}

export function ShieldUtensilIcon({ className = '', size = 24 }: ShieldUtensilIconProps) {
  // Scale factor for scan frame corners relative to icon size
  const cornerSize = size * 0.2;
  const cornerOffset = size * 0.05;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Shape */}
      <path
        d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
        fill="#4CAF50"
        stroke="#4CAF50"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Spoon Icon (centered on shield) */}
      <g transform="translate(12, 12)">
        {/* Spoon handle */}
        <path
          d="M0 1.5 L0 6"
          stroke="white"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        
        {/* Spoon bowl (ellipse) */}
        <ellipse
          cx="0"
          cy="-1"
          rx="1.8"
          ry="2.5"
          fill="white"
          stroke="white"
          strokeWidth="0.8"
        />
      </g>
      
      {/* Scanning Frame Corners - Tech Blue #00BCD4 */}
      {/* Top-left corner */}
      <g>
        <path
          d="M2 2 L2 6"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M2 2 L6 2"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      
      {/* Top-right corner */}
      <g>
        <path
          d="M22 2 L22 6"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M22 2 L18 2"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      
      {/* Bottom-left corner */}
      <g>
        <path
          d="M2 22 L2 18"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M2 22 L6 22"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      
      {/* Bottom-right corner */}
      <g>
        <path
          d="M22 22 L22 18"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M22 22 L18 22"
          stroke="#00BCD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
