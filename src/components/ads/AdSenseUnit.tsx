import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, adSenseEnabled } from '@/lib/adsense';

interface AdSenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'horizontal' | 'rectangle';
  layout?: 'in-article';
  className?: string;
}

export const AdSenseUnit = ({ slot, format = 'auto', layout, className }: AdSenseUnitProps) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adSenseEnabled || !slot || pushed.current) return;
    pushed.current = true;
    try {
      ((window as unknown as { adsbygoogle: object[] }).adsbygoogle ||= []).push({});
    } catch {
      // Bloqueador de anuncios: el script no cargó, no hay nada que hacer.
    }
  }, [slot]);

  if (!adSenseEnabled || !slot) return null;

  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-2 text-center">Publicidad</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </div>
  );
};
