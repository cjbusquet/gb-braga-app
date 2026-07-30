// GBLogo — uses the real GB Braga logo image
import type { CSSProperties } from 'react';

interface GBLogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function GBLogoFull({ size = 60, className = '', style }: GBLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Gracie Barra Braga"
      width={size}
      height={size}
      className={`block shrink-0 object-contain ${className}`}
      style={style}
    />
  );
}

export function GBLogo({ size = 40, className = '', style }: GBLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="GB"
      width={size}
      height={size}
      className={`block shrink-0 object-contain ${className}`}
      style={style}
    />
  );
}

export default GBLogoFull;
