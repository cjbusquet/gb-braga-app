import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);
  const [isTablet,  setIsTablet]  = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return { isMobile, isTablet };
}
