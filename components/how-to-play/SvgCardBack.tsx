type SvgCardBackProps = {
  small?: boolean;
};

export default function SvgCardBack({ small }: SvgCardBackProps) {
  const sizeClass = small ? "w-12" : "w-20";

  return (
    <div class={`${sizeClass}`}>
      <svg
        viewBox="0 0 100 140"
        xmlns="http://www.w3.org/2000/svg"
        style="width: 100%; height: auto; display: block;"
      >
        {/* Card background */}
        <rect
          x="1"
          y="1"
          width="98"
          height="138"
          rx="2"
          fill="#2a2520"
          stroke="#3d3428"
          stroke-width="3"
        />

        {/* Geometric pattern - diamond grid */}
        <g stroke="#c8841d" stroke-width="0.8" opacity="0.5">
          {/* Horizontal lines */}
          <line x1="8" y1="20" x2="92" y2="20" />
          <line x1="8" y1="40" x2="92" y2="40" />
          <line x1="8" y1="60" x2="92" y2="60" />
          <line x1="8" y1="80" x2="92" y2="80" />
          <line x1="8" y1="100" x2="92" y2="100" />
          <line x1="8" y1="120" x2="92" y2="120" />
          {/* Vertical lines */}
          <line x1="20" y1="8" x2="20" y2="132" />
          <line x1="40" y1="8" x2="40" y2="132" />
          <line x1="60" y1="8" x2="60" y2="132" />
          <line x1="80" y1="8" x2="80" y2="132" />
          {/* Diagonal lines */}
          <line x1="8" y1="8" x2="92" y2="132" />
          <line x1="92" y1="8" x2="8" y2="132" />
        </g>

        {/* Center diamond ornament */}
        <polygon
          points="50,45 70,70 50,95 30,70"
          fill="none"
          stroke="#c8841d"
          stroke-width="1.5"
          opacity="0.7"
        />

        {/* Inner diamond */}
        <polygon
          points="50,55 62,70 50,85 38,70"
          fill="#c8841d"
          opacity="0.3"
        />

        {/* Border inner frame */}
        <rect
          x="6"
          y="6"
          width="88"
          height="128"
          rx="1"
          fill="none"
          stroke="#3d3428"
          stroke-width="1"
        />
      </svg>
    </div>
  );
}
