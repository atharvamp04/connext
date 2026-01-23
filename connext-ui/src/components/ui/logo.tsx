import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({
  size = 32,
  className,
  ...props
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* App container */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* RANGE LINES (ONLY TWO, MATCHED CURVES) */}
      <path
        d="M22 22C27 18 37 18 42 22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26 26C29.5 23.5 34.5 23.5 38 26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* LOCATION PIN */}
      <path
        d="
          M32 30
          C26.5 30 23 34.2 23 39
          C23 45.5 32 52 32 52
          C32 52 41 45.5 41 39
          C41 34.2 37.5 30 32 30
          Z
        "
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Pin center */}
      <circle
        cx="32"
        cy="39"
        r="3.8"
        fill="currentColor"
      />
    </svg>
  )
}
