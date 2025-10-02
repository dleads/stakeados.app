'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

type AdUnitProps = {
  slot: string; // e.g. "6373701520"
  className?: string;
  style?: React.CSSProperties;
};

export default function AdUnit({ slot, className, style }: AdUnitProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!window) return;
    try {
      // Inicializa cola de anuncios y solicita render
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Silent
    }
  }, []);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (process.env.NODE_ENV === 'production' && !client) {
    // Si no hay client configurado en prod, no renderizamos el bloque de anuncio
    return null;
  }

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...(style || {}) }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
