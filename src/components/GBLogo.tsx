// GBLogo — uses the real GB Braga logo image
import React from 'react';

interface GBLogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export function GBLogoFull({ size = 60, style }: GBLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Gracie Barra Braga"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function GBLogo({ size = 40, style }: GBLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="GB"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export default GBLogoFull;
