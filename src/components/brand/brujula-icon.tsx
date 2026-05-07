import * as React from "react";
import { cn } from "@/lib/utils";

interface BrujulaIconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  variant?: "default" | "light";
}

/**
 * Logo icon de Brújula Markets — la brújula sola.
 * `default` = fondo navy con detalles gold/cream (uso sobre fondos claros u oscuros).
 * `light` = fondo cream con detalles navy/gold (uso sobre fondos oscuros para contraste).
 */
export function BrujulaIcon({
  size = 64,
  variant = "default",
  className,
  ...props
}: BrujulaIconProps) {
  if (variant === "light") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className={cn("inline-block", className)}
        aria-label="Brújula Markets"
        {...props}
      >
        <g transform="translate(250, 250)">
          <circle cx="0" cy="0" r="230" fill="none" stroke="#FAF7F2" strokeWidth="2" opacity="0.2" />
          <circle cx="0" cy="0" r="210" fill="none" stroke="#FAF7F2" strokeWidth="1" opacity="0.25" />
          <circle cx="0" cy="0" r="195" fill="#FAF7F2" stroke="#D4A574" strokeWidth="3" />
          <g stroke="#0A2540" strokeWidth="2" opacity="0.4">
            <line x1="0" y1="-175" x2="0" y2="-160" />
            <line x1="0" y1="175" x2="0" y2="160" />
            <line x1="-175" y1="0" x2="-160" y2="0" />
            <line x1="175" y1="0" x2="160" y2="0" />
            <line x1="-124" y1="-124" x2="-112" y2="-112" />
            <line x1="124" y1="-124" x2="112" y2="-112" />
            <line x1="-124" y1="124" x2="-112" y2="112" />
            <line x1="124" y1="124" x2="112" y2="112" />
          </g>
          <text x="0" y="-130" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#0A2540" letterSpacing="3">N</text>
          <text x="130" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#0A2540" letterSpacing="3" opacity="0.5">E</text>
          <text x="0" y="146" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#0A2540" letterSpacing="3" opacity="0.5">S</text>
          <text x="-130" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#0A2540" letterSpacing="3" opacity="0.5">O</text>
          <polygon points="0,-108 14,0 0,-5 -14,0" fill="#0A2540" />
          <polygon points="0,108 14,0 0,5 -14,0" fill="#D4A574" />
          <polygon points="92,0 0,8 5,0 0,-8" fill="#0A2540" opacity="0.6" />
          <polygon points="-92,0 0,8 -5,0 0,-8" fill="#D4A574" opacity="0.7" />
          <circle cx="0" cy="0" r="11" fill="#FAF7F2" stroke="#0A2540" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="4" fill="#0A2540" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={cn("inline-block", className)}
      aria-label="Brújula Markets"
      {...props}
    >
      <g transform="translate(250, 250)">
        <circle cx="0" cy="0" r="230" fill="none" stroke="#0A2540" strokeWidth="2" opacity="0.2" />
        <circle cx="0" cy="0" r="210" fill="none" stroke="#0A2540" strokeWidth="1" opacity="0.25" />
        <circle cx="0" cy="0" r="195" fill="#0A2540" />
        <g stroke="#D4A574" strokeWidth="2" opacity="0.5">
          <line x1="0" y1="-175" x2="0" y2="-160" />
          <line x1="0" y1="175" x2="0" y2="160" />
          <line x1="-175" y1="0" x2="-160" y2="0" />
          <line x1="175" y1="0" x2="160" y2="0" />
          <line x1="-124" y1="-124" x2="-112" y2="-112" />
          <line x1="124" y1="-124" x2="112" y2="-112" />
          <line x1="-124" y1="124" x2="-112" y2="112" />
          <line x1="124" y1="124" x2="112" y2="112" />
        </g>
        <text x="0" y="-130" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#D4A574" letterSpacing="3">N</text>
        <text x="130" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#FAF7F2" letterSpacing="3" opacity="0.6">E</text>
        <text x="0" y="146" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#FAF7F2" letterSpacing="3" opacity="0.6">S</text>
        <text x="-130" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="500" fill="#FAF7F2" letterSpacing="3" opacity="0.6">O</text>
        <polygon points="0,-108 14,0 0,-5 -14,0" fill="#D4A574" />
        <polygon points="0,108 14,0 0,5 -14,0" fill="#FAF7F2" opacity="0.85" />
        <polygon points="92,0 0,8 5,0 0,-8" fill="#D4A574" opacity="0.7" />
        <polygon points="-92,0 0,8 -5,0 0,-8" fill="#FAF7F2" opacity="0.5" />
        <circle cx="0" cy="0" r="11" fill="#0A2540" stroke="#D4A574" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="4" fill="#D4A574" />
      </g>
    </svg>
  );
}
