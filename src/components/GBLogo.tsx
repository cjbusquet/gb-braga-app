interface GBLogoFullProps { size?: number }
interface GBIconProps { size?: number; bg?: string }
interface GBHorizontalProps { size?: number; theme?: 'dark' | 'light' }

export function GBLogoFull({ size = 120 }: GBLogoFullProps) {
  const cx = 50, cy = 50;
  const arcPath = (radius: number, sa: number, ea: number) => {
    const s = sa * Math.PI / 180, e = ea * Math.PI / 180;
    return `M ${cx + radius*Math.cos(s)} ${cy + radius*Math.sin(s)} A ${radius} ${radius} 0 ${ea-sa>180?1:0} 1 ${cx + radius*Math.cos(e)} ${cy + radius*Math.sin(e)}`;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="gbTopArc"    d={arcPath(41, -166, -14)}/>
        <path id="gbBotArc"    d={arcPath(41,   14,  166)}/>
      </defs>
      {/* Outer white disc */}
      <circle cx={cx} cy={cy} r={49} fill="white"/>
      {/* Outer black ring */}
      <circle cx={cx} cy={cy} r={49} fill="none" stroke="#111" strokeWidth="1.5"/>
      {/* Red main circle */}
      <circle cx={cx} cy={cy} r={44.5} fill="#C8102E"/>
      {/* White inner ring */}
      <circle cx={cx} cy={cy} r={39.5} fill="none" stroke="white" strokeWidth="1.4"/>

      {/* ── GB Triangle mark ── */}
      {/* Main white outer triangle */}
      <polygon points="50,13 76.5,55 23.5,55" fill="white"/>
      {/* Red inner cutout → hollow look */}
      <polygon points="50,20.5 70,53 30,53" fill="#C8102E"/>
      {/* Bottom horizontal bar (white) */}
      <rect x="30" y="50" width="40.5" height="6.5" fill="white"/>
      {/* Right cutout → G/C shape */}
      <rect x="52" y="50" width="18.5" height="6.5" fill="#C8102E"/>
      {/* G tongue (white) */}
      <rect x="52" y="50" width="11.5" height="6.5" fill="white"/>

      {/* GRACIE BARRA */}
      <text x={cx} y="67" textAnchor="middle" fill="white" fontSize="5.9" fontWeight="900"
        fontFamily="'Barlow Condensed','Arial Black',Arial,sans-serif" letterSpacing="0.9">GRACIE BARRA</text>

      {/* CARLOS GRACIE JR. */}
      <text x={cx} y="73.5" textAnchor="middle" fill="white" fontSize="3.3" fontWeight="600"
        fontFamily="'Barlow Condensed','Arial Black',Arial,sans-serif" letterSpacing="0.5">CARLOS GRACIE JR.</text>

      {/* BRAZILIAN JIU-JITSU arc */}
      <text fontSize="5" fontWeight="900" fontFamily="'Barlow Condensed','Arial Black',Arial,sans-serif" fill="#111" letterSpacing="0.2">
        <textPath href="#gbTopArc" startOffset="50%" textAnchor="middle">BRAZILIAN JIU-JITSU</textPath>
      </text>

      {/* BRAGA, PORTUGAL arc */}
      <text fontSize="5" fontWeight="900" fontFamily="'Barlow Condensed','Arial Black',Arial,sans-serif" fill="#111" letterSpacing="0.2">
        <textPath href="#gbBotArc" startOffset="50%" textAnchor="middle">BRAGA, PORTUGAL</textPath>
      </text>
    </svg>
  );
}

export function GBIcon({ size = 36, bg = '#C8102E' }: GBIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill={bg}/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <polygon points="50,16 77,62 23,62" fill="white"/>
      <polygon points="50,24 71,60 29,60" fill={bg}/>
      <rect x="29" y="56.5" width="42" height="7" fill="white"/>
      <rect x="53" y="56.5" width="18" height="7" fill={bg}/>
      <rect x="53" y="56.5" width="12" height="7" fill="white"/>
    </svg>
  );
}

export function GBHorizontal({ size = 28, theme = 'light' }: GBHorizontalProps) {
  const textColor = theme === 'dark' ? '#F0EFF4' : '#111114';
  const subColor  = theme === 'dark' ? '#6A6A78'  : '#9896A4';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <GBIcon size={size} bg="#C8102E"/>
      <div>
        <div style={{ color: textColor, fontSize: size * 0.46, fontWeight: 800, lineHeight: 1.05,
          fontFamily: "'Barlow Condensed','Arial Black',sans-serif", letterSpacing: '0.3px', textTransform: 'uppercase' as const }}>
          Gracie Barra
        </div>
        <div style={{ color: subColor, fontSize: size * 0.27, letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginTop: 2, fontWeight: 600 }}>
          Braga · Portugal
        </div>
      </div>
    </div>
  );
}

export default GBLogoFull;
