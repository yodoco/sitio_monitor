import { useEffect, useState, type ReactNode } from 'react';
import { Link, Redirect } from 'wouter';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { Loader2, LogOut, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Wordmark, BASE } from '@/components/site/shared';
import { Seo } from '@/components/site/seo';

// Tablero de inteligencia inmobiliaria. La página solo verifica el acceso y muestra el tablero
// (public/inteligencia-inmobiliaria/tablero/) en un marco; los datos los entrega /api/tablero/data
// únicamente a cuentas autorizadas.
const RUTA = '/inteligencia-inmobiliaria';
type Estado = { s: 'cargando' } | { s: 'ok' } | { s: 'denegado' } | { s: 'error' };

export default function InteligenciaInmobiliariaPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Centro><Loader2 className="h-6 w-6 animate-spin text-sky" /></Centro>;
  if (!isSignedIn) return <Redirect to={`${RUTA}/sign-in`} />;
  return <TableroGate />;
}

function Centro({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-mist px-4">{children}</div>;
}

function TableroGate() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [estado, setEstado] = useState<Estado>({ s: 'cargando' });
  const [intento, setIntento] = useState(0);
  const salir = () => signOut({ redirectUrl: `${BASE}${RUTA}/sign-in` });

  useEffect(() => {
    let vivo = true;
    setEstado({ s: 'cargando' });
    fetch('/api/tablero/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((r) => { if (vivo) setEstado(r.ok ? { s: 'ok' } : r.status === 401 || r.status === 403 ? { s: 'denegado' } : { s: 'error' }); })
      .catch(() => { if (vivo) setEstado({ s: 'error' }); });
    return () => { vivo = false; };
  }, [intento]);

  // El tablero (en el marco) pide cerrar sesión o avisa que la sesión ya no es válida.
  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.tipo === 'monitor-salir') salir();
      if (e.data?.tipo === 'monitor-sesion') setIntento((n) => n + 1);
    };
    window.addEventListener('message', oir);
    return () => window.removeEventListener('message', oir);
  });

  if (estado.s === 'cargando') return <Centro><Loader2 className="h-6 w-6 animate-spin text-sky" /></Centro>;
  if (estado.s === 'ok') {
    return (
      <>
        <Seo title="Inteligencia inmobiliaria" description="Monitor" noindex />
        <iframe title="Tablero de inteligencia inmobiliaria" src={`${BASE}${RUTA}/tablero/index.html`}
          className="fixed inset-0 h-[100dvh] w-full border-0 bg-white" data-testid="frame-tablero" />
      </>
    );
  }
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const denegado = estado.s === 'denegado';
  return (
    <Centro>
      <Seo title="Inteligencia inmobiliaria" description="Monitor" noindex />
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg" data-testid="tablero-access-denied">
        <Wordmark />
        <ShieldCheck className="mt-8 h-8 w-8 text-sky" />
        <h1 className="mt-4 text-2xl font-bold text-navy">{denegado ? 'Tu cuenta aún no tiene acceso' : 'No pudimos abrir el tablero'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-text">
          {denegado
            ? <>La cuenta {email ? <strong className="text-navy">{email}</strong> : 'actual'} no está autorizada, o su correo aún no está verificado. Pide a Monitor que autorice este correo.</>
            : 'Intenta de nuevo en unos momentos.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {denegado
            ? <a href="mailto:holamonitor@gmail.com?subject=Acceso%20a%20inteligencia%20inmobiliaria" className="btn-primary"><Mail className="h-4 w-4" />Solicitar acceso</a>
            : <button type="button" onClick={() => setIntento((n) => n + 1)} className="btn-primary"><RefreshCw className="h-4 w-4" />Reintentar</button>}
          <button type="button" onClick={salir} className="btn-outline" data-testid="button-tablero-signout"><LogOut className="h-4 w-4" />Cerrar sesión</button>
        </div>
        <Link href="/" className="mt-6 inline-block text-sm text-slate-text hover:text-sky">Ir al sitio de Monitor</Link>
      </div>
    </Centro>
  );
}
