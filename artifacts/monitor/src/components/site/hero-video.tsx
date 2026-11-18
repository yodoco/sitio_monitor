import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (preference.matches) video.pause();
      else void video.play().catch(() => setPaused(true));
    };
    syncMotion();
    preference.addEventListener('change', syncMotion);
    return () => preference.removeEventListener('change', syncMotion);
  }, [src]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <video
          ref={ref}
          poster={poster}
          muted loop playsInline preload="metadata" disablePictureInPicture
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-center"
        >
          <source src={src.replace(/\.mp4$/, '.webm')} type="video/webm" />
          <source src={src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,42,63,0.94)_0%,rgba(15,59,87,0.80)_50%,rgba(22,88,127,0.48)_100%)]" />
      </div>
      {!failed && <button
        type="button"
        onClick={() => {
          const video = ref.current;
          if (!video) return;
          if (video.paused) void video.play().catch(() => setPaused(true));
          else video.pause();
        }}
        aria-label={paused ? t('Reproducir video de fondo', 'Play background video') : t('Pausar video de fondo', 'Pause background video')}
        className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-navy/40 text-white/80 transition-colors hover:bg-navy/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>}
    </>
  );
}
