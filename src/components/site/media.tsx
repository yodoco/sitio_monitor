import { useEffect, useRef, useState } from 'react';
import { Pause, Play, BarChart3, ClipboardList, Database, Eye, Layers, MessageSquareText, Search, Users } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { BASE, useSite } from './shared';

const DEFAULT_VIDEO = '/api/storage/public-objects/monitor-video.mp4';

export function AboutMedia() {
  const { t } = useLang();
  const { site, isLoading } = useSite();
  const video = site?.videoUrl?.trim() || (isLoading ? '' : DEFAULT_VIDEO);
  const image = site?.aboutImage?.trim();
  const poster = image || `${BASE}/assets/video-poster.jpg`;
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
      {video ? (
        <AutoVideo src={video} poster={poster} label={t('Video institucional de Monitor', 'Monitor institutional video')} pauseLabel={[t('Pausar video', 'Pause video'), t('Reproducir video', 'Play video')]} />
      ) : image ? (
        <img src={image} alt={t('Equipo Monitor', 'Monitor team')} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-mist" />
      )}
    </div>
  );
}

function AutoVideo({ src, poster, label, pauseLabel }: { src: string; poster: string; label: string; pauseLabel: [string, string] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); setPaused(true); return; }
    v.play().catch(() => setPaused(true));
  }, [src]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); } else { v.pause(); setPaused(true); }
  };
  return (
    <>
      <video ref={ref} key={src} className="h-full w-full object-cover" src={src} poster={poster}
        autoPlay muted loop playsInline preload="metadata" disablePictureInPicture aria-label={label} data-testid="video-about" />
      <button type="button" onClick={toggle} aria-label={paused ? pauseLabel[1] : pauseLabel[0]} data-testid="button-video-toggle"
        className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/80 opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100">
        {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
      </button>
    </>
  );
}

const ICONS: Record<string, typeof Layers> = {
  'estudio-de-mercado-integral': Layers,
  'estudios-cuantitativos': BarChart3,
  'estudios-cualitativos': MessageSquareText,
  'levantamiento-de-campo': ClipboardList,
  'mineria-de-datos': Database,
  'focus-groups': Users,
  'entrevistas-a-profundidad': Search,
  'mystery-shopper': Eye,
};
export function ServiceIcon({ slug, className = 'h-5 w-5' }: { slug: string; className?: string }) {
  const I = ICONS[slug] ?? Layers;
  return <I className={className} strokeWidth={1.8} />;
}
