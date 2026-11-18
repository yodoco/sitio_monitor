import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Redirect } from 'wouter';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAdminSession, getGetAdminSessionQueryKey,
  useGetSite, getGetSiteQueryKey, useSaveSite,
  useListInquiries, getListInquiriesQueryKey, useUpdateInquiry, useDeleteInquiry,
  useGetAdminSummary, getGetAdminSummaryQueryKey,
  useGetAdminAccess, getGetAdminAccessQueryKey, useSaveAdminAccess,
  useRequestUploadUrl,
  type SiteContent, type ContentPage, type AdminSummary, type Insight, type Inquiry, type InquiryStatus, type UploadInputContentType,
} from '@workspace/api-client-react';
import {
  AlertTriangle, ArrowUpRight, Check, ExternalLink, FileText, Inbox, LayoutDashboard, Loader2, LogOut, Mail, Menu as MenuIcon,
  Plus, RefreshCw, Save, Settings2, ShieldCheck, Trash2, Upload, X, Newspaper, PanelsTopLeft, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wordmark, Skeleton, BASE } from '@/components/site/shared';
import { Seo } from '@/components/site/seo';

const input = 'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20';
const STATUS: Record<InquiryStatus, { l: string; c: string }> = {
  nuevo: { l: 'Nuevo', c: 'bg-sky/15 text-[hsl(203_74%_36%)]' },
  en_proceso: { l: 'En proceso', c: 'bg-amber-100 text-amber-800' },
  atendido: { l: 'Atendido', c: 'bg-emerald-100 text-emerald-800' },
};
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/* ----------------------------- GATE ----------------------------- */
export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullCenter><Loader2 className="h-6 w-6 animate-spin text-sky" /></FullCenter>;
  if (!isSignedIn) return <Redirect to="/ad-min/sign-in" />;
  return <AdminSessionGate />;
}

function FullCenter({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-mist px-4">{children}</div>;
}

function AdminSessionGate() {
  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey(), retry: false, staleTime: 60_000 } });
  const { signOut } = useClerk();
  const { user } = useUser();
  if (session.isLoading) return <FullCenter><Loader2 className="h-6 w-6 animate-spin text-sky" /></FullCenter>;
  if (session.data?.isAdmin) return <AdminShell email={session.data.email} />;
  const email = session.data?.email || user?.primaryEmailAddress?.emailAddress || '';
  return (
    <FullCenter>
      <Seo title="Acceso denegado" description="Administrador Monitor" noindex />
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg" data-testid="panel-access-denied">
        <Wordmark />
        <ShieldCheck className="mt-8 h-8 w-8 text-sky" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Sin permisos de administración</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-text">
          La cuenta {email ? <strong className="text-navy">{email}</strong> : 'actual'} no está autorizada para administrar este sitio, o su correo aún no está verificado. Solo los correos autorizados por Monitor pueden ingresar.
        </p>
        {session.isError && <p className="mt-3 text-xs text-slate-text">No se pudo confirmar la sesión de administrador.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="mailto:holamonitor@gmail.com?subject=Acceso%20administrador" className="btn-primary"><Mail className="h-4 w-4" />Solicitar acceso</a>
          <button type="button" onClick={() => signOut({ redirectUrl: BASE || '/' })} className="btn-outline" data-testid="button-signout"><LogOut className="h-4 w-4" />Cerrar sesión</button>
        </div>
        <Link href="/" className="mt-6 inline-block text-sm text-slate-text hover:text-sky">Volver al sitio</Link>
      </div>
    </FullCenter>
  );
}

/* ----------------------------- SHELL ----------------------------- */
type Tab = 'resumen' | 'solicitudes' | 'contenido' | 'paginas' | 'insights' | 'accesos';
const TABS: { k: Tab; l: string; i: typeof Inbox }[] = [
  { k: 'resumen', l: 'Resumen', i: LayoutDashboard },
  { k: 'solicitudes', l: 'Solicitudes', i: Inbox },
  { k: 'contenido', l: 'Contenido y medios', i: Settings2 },
  { k: 'paginas', l: 'Páginas del menú', i: PanelsTopLeft },
  { k: 'insights', l: 'Insights', i: Newspaper },
  { k: 'accesos', l: 'Accesos', i: ShieldCheck },
];

function AdminShell({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [nav, setNav] = useState(false);
  const { signOut } = useClerk();
  const summary = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), refetchInterval: 60_000, refetchIntervalInBackground: false } });
  const siteQ = useGetSite({ query: { queryKey: getGetSiteQueryKey(), staleTime: 0 } });
  const editor = useSiteEditor(siteQ.data);

  return (
    <div className="min-h-[100dvh] bg-mist/70 lg:grid lg:grid-cols-[250px_1fr]">
      <Seo title="Administrador" description="CMS Monitor" noindex />
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[250px] bg-navy-deep text-white transition-transform lg:static lg:translate-x-0', nav ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between"><Wordmark light /><button className="lg:hidden" onClick={() => setNav(false)} aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
          <p className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-sky">Administrador</p>
          <nav className="mt-8 space-y-1">
            {TABS.map(({ k, l, i: I }) => (
              <button key={k} type="button" onClick={() => { setTab(k); setNav(false); }} data-testid={`tab-admin-${k}`}
                className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', tab === k ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
                <I className="h-4 w-4" />{l}
                {k === 'solicitudes' && !!summary.data?.newCount && <span className="ml-auto rounded-full bg-sky px-2 text-[0.68rem] font-bold">{summary.data.newCount}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-white/10 pt-4 text-xs text-white/60">
            <p className="truncate" title={email}>{email}</p>
            <Link href="/" className="flex items-center gap-2 hover:text-white" data-testid="link-view-site"><ExternalLink className="h-3.5 w-3.5" />Ver sitio</Link>
            <button type="button" onClick={() => signOut({ redirectUrl: BASE || '/' })} className="flex items-center gap-2 hover:text-white" data-testid="button-admin-signout"><LogOut className="h-3.5 w-3.5" />Cerrar sesión</button>
          </div>
        </div>
      </aside>
      {nav && <div className="fixed inset-0 z-30 bg-navy-deep/40 lg:hidden" onClick={() => setNav(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setNav(true)} aria-label="Menú" data-testid="button-admin-menu"><MenuIcon className="h-5 w-5 text-navy" /></button>
            <h1 className="text-lg font-bold text-navy">{TABS.find((t) => t.k === tab)?.l}</h1>
          </div>
          {['contenido', 'paginas', 'insights'].includes(tab) && <SaveBar editor={editor} />}
        </header>
        <main className="p-4 md:p-8">
          {siteQ.isError && ['contenido', 'paginas', 'insights'].includes(tab) ? (
            <ErrorBox msg="No se pudo cargar el contenido del sitio." onRetry={() => siteQ.refetch()} />
          ) : (
            <>
              {tab === 'resumen' && <SummaryTab summary={summary} go={setTab} />}
              {tab === 'solicitudes' && <InquiriesTab />}
              {tab === 'contenido' && (editor.draft ? <ContentTab editor={editor} /> : <FormSkeleton />)}
              {tab === 'paginas' && (editor.draft ? <PagesTab editor={editor} /> : <FormSkeleton />)}
              {tab === 'insights' && (editor.draft ? <InsightsTab editor={editor} /> : <FormSkeleton />)}
              {tab === 'accesos' && <AccessTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>;
}
function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive" role="alert">
      <span className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{msg}</span>
      <button type="button" onClick={onRetry} className="btn-outline !py-2 text-xs" data-testid="button-retry"><RefreshCw className="h-3.5 w-3.5" />Reintentar</button>
    </div>
  );
}
function Card({ title, desc, children, actions }: { title: string; desc?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-base font-bold text-navy">{title}</h2>{desc && <p className="mt-1 text-xs text-slate-text">{desc}</p>}</div>
        {actions}
      </div>
      {children}
    </section>
  );
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">{label}</span>{children}{hint && <span className="mt-1 block text-[0.7rem] text-slate-text">{hint}</span>}</label>;
}

/* ----------------------------- SITE EDITOR STATE ----------------------------- */
type Editor = ReturnType<typeof useSiteEditor>;
function useSiteEditor(server: SiteContent | undefined) {
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const init = useRef(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveSite();
  useEffect(() => {
    if (server && !init.current) { init.current = true; setDraft(server); }
  }, [server]);
  const update = (fn: (d: SiteContent) => SiteContent) => { setDraft((d) => (d ? fn(d) : d)); setDirty(true); };
  const commit = () => {
    if (!draft) return;
    save.mutate({ data: draft }, {
      onSuccess: (saved) => {
        setDraft(saved); setDirty(false);
        qc.setQueryData(getGetSiteQueryKey(), saved);
        qc.invalidateQueries({ queryKey: getGetSiteQueryKey() });
        toast({ title: 'Cambios publicados', description: 'El sitio ya muestra la nueva versión.' });
      },
      onError: (e) => toast({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : 'Revisa los campos e intenta de nuevo.', variant: 'destructive' }),
    });
  };
  const discard = () => { if (server) { setDraft(server); setDirty(false); } };
  return { draft, update, dirty, commit, discard, saving: save.isPending };
}

function SaveBar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-2">
      {editor.dirty && <span className="hidden text-xs text-amber-700 sm:inline">Cambios sin guardar</span>}
      {editor.dirty && <button type="button" onClick={editor.discard} className="rounded-full px-3 py-2 text-xs font-semibold text-slate-text hover:text-navy" data-testid="button-discard">Descartar</button>}
      <button type="button" onClick={editor.commit} disabled={!editor.dirty || editor.saving} className="btn-primary !py-2 text-xs" data-testid="button-save-site">
        {editor.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Guardar y publicar
      </button>
    </div>
  );
}

/* ----------------------------- UPLOAD ----------------------------- */
const ACCEPT: Record<string, string> = { image: 'image/jpeg,image/png,image/webp,image/gif', video: 'video/mp4,video/webm', pdf: 'application/pdf', any: 'image/jpeg,image/png,image/webp,image/gif,application/pdf' };
function Uploader({ accept, onDone, label = 'Subir archivo' }: { accept: keyof typeof ACCEPT; onDone: (url: string) => void; label?: string }) {
  const req = useRequestUploadUrl();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const onDoneRef = useRef(onDone); onDoneRef.current = onDone;
  const handle = async (file: File) => {
    setError('');
    if (!ACCEPT[accept].split(',').includes(file.type)) { setError('Formato no permitido.'); return; }
    try {
      setProgress(0);
      const r = await req.mutateAsync({ data: { name: file.name.slice(0, 200), size: file.size, contentType: file.type as UploadInputContentType } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', r.uploadURL);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Error ${xhr.status} al subir`)));
        xhr.onerror = () => reject(new Error('Error de red al subir'));
        xhr.send(file);
      });
      onDoneRef.current(r.publicUrl);
      setProgress(null);
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : 'No se pudo subir el archivo.');
    }
  };
  return (
    <div>
      <input ref={ref} type="file" accept={ACCEPT[accept]} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={progress !== null} className="btn-outline !px-3.5 !py-2 text-xs" data-testid={`button-upload-${accept}`}>
        {progress !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {progress !== null ? `Subiendo ${progress}%` : label}
      </button>
      {progress !== null && <div className="mt-2 h-1 w-40 overflow-hidden rounded bg-muted"><div className="h-full bg-sky transition-[width]" style={{ width: `${progress}%` }} /></div>}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function MediaField({ label, value, onChange, kind }: { label: string; value: string; onChange: (v: string) => void; kind: 'image' | 'video' | 'pdf' | 'any' }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… o sube un archivo" />
          {value && <button type="button" onClick={() => onChange('')} className="rounded-lg border border-border px-2 text-slate-text hover:text-destructive" aria-label="Quitar"><X className="h-4 w-4" /></button>}
        </div>
        <Uploader accept={kind} onDone={onChange} />
        {value && kind === 'image' && <img src={value} alt="" className="h-24 rounded-lg border border-border object-cover" />}
        {value && kind === 'video' && <video src={value} className="h-28 rounded-lg border border-border" controls preload="metadata" />}
      </div>
    </Field>
  );
}

/* ----------------------------- SUMMARY ----------------------------- */
function SummaryTab({ summary, go }: { summary: { isLoading: boolean; isError: boolean; data?: AdminSummary; refetch: () => unknown }; go: (t: Tab) => void }) {
  if (summary.isLoading) return <FormSkeleton />;
  if (summary.isError || !summary.data) return <ErrorBox msg="No se pudo cargar el resumen." onRetry={() => summary.refetch()} />;
  const s = summary.data;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Solicitudes totales', s.total], ['Nuevas sin atender', s.newCount], ['Cotizaciones', s.quotes]].map(([l, v]) => (
          <button key={l as string} type="button" onClick={() => go('solicitudes')} className="rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-sky/50" data-testid={`stat-${l}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-text">{l}</p>
            <p className="mt-2 text-4xl font-bold text-navy">{v}</p>
          </button>
        ))}
      </div>
      <Card title="Notificaciones por correo">
        <div className={cn('flex items-start gap-3 rounded-xl p-4 text-sm', s.emailConfigured ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900')} data-testid="status-email">
          {s.emailConfigured ? <Check className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
          <div>
            <p className="font-semibold">{s.emailConfigured ? `Avisos activos hacia ${s.emailRecipient}` : 'Envío automático de avisos pendiente de configurar'}</p>
            {s.emailNote && <p className="mt-1 text-xs opacity-80">{s.emailNote}</p>}
            {!s.emailConfigured && <p className="mt-1 text-xs opacity-80">Todas las solicitudes se guardan aquí, en la bandeja interna, aunque el aviso por correo no se envíe.</p>}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {([['contenido', 'Editar textos, contacto y video'], ['paginas', 'Agregar páginas al menú'], ['insights', 'Publicar artículos y reportes']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => go(k)} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-left text-sm font-semibold text-navy hover:border-sky/50 hover:text-sky">{l}<ArrowUpRight className="h-4 w-4" /></button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- INQUIRIES ----------------------------- */
function InquiriesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useListInquiries({ query: { queryKey: getListInquiriesQueryKey(), refetchInterval: 30_000, refetchIntervalInBackground: false, staleTime: 15_000 } });
  const upd = useUpdateInquiry();
  const del = useDeleteInquiry();
  const [kind, setKind] = useState<'all' | 'contacto' | 'cotizacion'>('all');
  const [status, setStatus] = useState<'all' | InquiryStatus>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Inquiry | null>(null);
  const [confirm, setConfirm] = useState<Inquiry | null>(null);
  const items = useMemo(() => (list.data ?? []).filter((i) =>
    (kind === 'all' || i.kind === kind) && (status === 'all' || i.status === status) &&
    (!q || `${i.name} ${i.email} ${i.company} ${i.message}`.toLowerCase().includes(q.toLowerCase()))), [list.data, kind, status, q]);
  const refresh = () => { qc.invalidateQueries({ queryKey: getListInquiriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); };
  const setSt = (i: Inquiry, s: InquiryStatus) => upd.mutate({ id: i.id, data: { status: s } }, {
    onSuccess: (r) => { refresh(); if (open?.id === r.id) setOpen(r); },
    onError: () => toast({ title: 'No se pudo actualizar', variant: 'destructive' }),
  });
  const doDelete = () => {
    if (!confirm) return;
    del.mutate({ id: confirm.id }, {
      onSuccess: () => { refresh(); if (open?.id === confirm.id) setOpen(null); setConfirm(null); toast({ title: 'Solicitud eliminada' }); },
      onError: () => toast({ title: 'No se pudo eliminar', variant: 'destructive' }),
    });
  };
  const subject = (i: Inquiry) => `Re: ${i.kind === 'cotizacion' ? 'Cotización' : 'Contacto'} — Monitor`;
  const body = (i: Inquiry) => `Hola ${i.name},\n\nGracias por escribir a Monitor.\n\n---\nTu mensaje:\n${i.message}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-text" /><input className={cn(input, 'pl-9')} placeholder="Buscar por nombre, correo o mensaje" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-search-inquiries" /></div>
        <select className={cn(input, 'md:w-44')} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} data-testid="select-filter-kind">
          <option value="all">Todos los tipos</option><option value="contacto">Contacto</option><option value="cotizacion">Cotización</option>
        </select>
        <select className={cn(input, 'md:w-44')} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} data-testid="select-filter-status">
          <option value="all">Todos los estados</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </select>
        <button type="button" onClick={() => list.refetch()} className="btn-outline !py-2 text-xs" data-testid="button-refresh-inquiries"><RefreshCw className={cn('h-3.5 w-3.5', list.isFetching && 'animate-spin')} />Actualizar</button>
      </div>
      {list.isLoading ? <FormSkeleton /> : list.isError ? <ErrorBox msg="No se pudieron cargar las solicitudes." onRetry={() => list.refetch()} /> : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="empty-inquiries">
          <Inbox className="mx-auto h-8 w-8 text-sky" />
          <p className="mt-3 font-semibold text-navy">{(list.data ?? []).length === 0 ? 'Aún no llegan solicitudes' : 'Ninguna solicitud coincide con los filtros'}</p>
          <p className="mt-1 text-sm text-slate-text">Los mensajes de contacto y cotización del sitio aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setOpen(i)} data-testid={`row-inquiry-${i.id}`}
                  className={cn('w-full rounded-xl border bg-card p-4 text-left transition-colors', open?.id === i.id ? 'border-sky' : 'border-border hover:border-sky/40')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-navy">{i.name}</span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold', STATUS[i.status].c)}>{STATUS[i.status].l}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-text">{i.email}{i.company && ` · ${i.company}`}</p>
                  <div className="mt-2 flex items-center gap-2 text-[0.7rem] text-slate-text">
                    <span className={cn('rounded px-1.5 py-0.5 font-semibold', i.kind === 'cotizacion' ? 'bg-navy text-white' : 'bg-muted text-navy')}>{i.kind === 'cotizacion' ? 'Cotización' : 'Contacto'}</span>
                    {format(new Date(i.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {open ? (
            <article className="h-fit rounded-2xl border border-border bg-card p-6 xl:sticky xl:top-24" data-testid="panel-inquiry-detail">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold text-navy">{open.name}</h2><p className="text-sm text-slate-text">{format(new Date(open.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</p></div>
                <button onClick={() => setOpen(null)} aria-label="Cerrar" className="text-slate-text hover:text-navy"><X className="h-5 w-5" /></button>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[['Correo', open.email], ['Teléfono', open.phone || '—'], ['Empresa', open.company || '—'], ['Servicio', open.service || '—']].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-slate-text">{k}</dt><dd className="break-words font-medium text-navy">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-5 whitespace-pre-line rounded-xl bg-mist p-4 text-sm leading-relaxed text-ink">{open.message}</p>
              <p className="mt-3 text-xs text-slate-text">{open.emailSent ? 'Aviso por correo enviado.' : 'Aviso por correo no enviado; registrada solo en la bandeja.'}</p>
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-navy">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS) as InquiryStatus[]).map((s) => (
                    <button key={s} type="button" disabled={upd.isPending} onClick={() => setSt(open, s)} data-testid={`button-status-${s}`}
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', open.status === s ? 'border-navy bg-navy text-white' : 'border-border text-navy hover:border-sky')}>{STATUS[s].l}</button>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                <a className="btn-primary !py-2 text-xs" href={`mailto:${open.email}?subject=${encodeURIComponent(subject(open))}&body=${encodeURIComponent(body(open))}`} data-testid="link-reply-mailto"><Mail className="h-3.5 w-3.5" />Responder</a>
                <a className="btn-outline !py-2 text-xs" target="_blank" rel="noreferrer" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(open.email)}&su=${encodeURIComponent(subject(open))}&body=${encodeURIComponent(body(open))}`} data-testid="link-reply-gmail"><ExternalLink className="h-3.5 w-3.5" />Responder en Gmail</a>
                <button type="button" onClick={() => setConfirm(open)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5" data-testid="button-delete-inquiry"><Trash2 className="h-3.5 w-3.5" />Eliminar</button>
              </div>
            </article>
          ) : (
            <div className="hidden h-60 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-slate-text xl:flex">Selecciona una solicitud para ver el detalle</div>
          )}
        </div>
      )}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar solicitud</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará definitivamente la solicitud de {confirm?.name}. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); doDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
              {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ----------------------------- CONTENT ----------------------------- */
function ContentTab({ editor }: { editor: Editor }) {
  const d = editor.draft!;
  const set = (k: keyof SiteContent) => (v: string) => editor.update((s) => ({ ...s, [k]: v }));
  const txt = (k: keyof SiteContent, label: string, rows = 0, hint?: string) => (
    <Field label={label} hint={hint}>
      {rows ? <textarea rows={rows} className={input} value={d[k] as string} onChange={(e) => set(k)(e.target.value)} data-testid={`input-${k}`} />
        : <input className={input} value={d[k] as string} onChange={(e) => set(k)(e.target.value)} data-testid={`input-${k}`} />}
    </Field>
  );
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Portada (inicio)" desc="La última palabra del título se muestra en azul.">
        <div className="space-y-4">{txt('heroTitle', 'Título principal')}{txt('heroDescription', 'Descripción', 4)}</div>
      </Card>
      <Card title="Sobre nosotros">
        <div className="space-y-4">{txt('aboutTitle', 'Título')}{txt('aboutDescription', 'Descripción', 5)}</div>
      </Card>
      <Card title="Medios" desc="Imagen y video de la sección Sobre nosotros. Formatos: JPG, PNG, WEBP, GIF, MP4, WEBM.">
        <div className="space-y-5">
          <MediaField label="Video institucional" value={d.videoUrl} onChange={set('videoUrl')} kind="video" />
          <MediaField label="Imagen (portada del video o imagen alternativa)" value={d.aboutImage} onChange={set('aboutImage')} kind="image" />
        </div>
      </Card>
      <Card title="Contacto y enlaces" desc="Se muestran en encabezado, pie de página y página de contacto.">
        <div className="space-y-4">{txt('phone', 'Teléfono')}{txt('email', 'Correo electrónico')}{txt('address', 'Dirección', 2)}{txt('facebook', 'Facebook (URL)')}</div>
      </Card>
    </div>
  );
}

/* ----------------------------- PAGES ----------------------------- */
function PagesTab({ editor }: { editor: Editor }) {
  const pages = editor.draft!.pages;
  const [sel, setSel] = useState<number | null>(pages.length ? 0 : null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const setPage = (i: number, patch: Partial<ContentPage>) => editor.update((s) => ({ ...s, pages: s.pages.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const add = () => {
    const n = pages.length + 1;
    editor.update((s) => ({ ...s, pages: [...s.pages, { slug: `nueva-pagina-${n}`, title: `Nueva página ${n}`, body: '', image: '', showInMenu: true, published: false }] }));
    setSel(pages.length);
  };
  const p = sel !== null ? pages[sel] : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <button type="button" onClick={add} disabled={pages.length >= 30} className="btn-primary w-full justify-center !py-2 text-xs" data-testid="button-add-page"><Plus className="h-4 w-4" />Nueva página</button>
        {pages.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-slate-text">Sin páginas adicionales. Crea una para agregarla al menú principal.</p>}
        {pages.map((pg, i) => (
          <button key={i} type="button" onClick={() => setSel(i)} data-testid={`row-page-${i}`} className={cn('w-full rounded-xl border bg-card p-3 text-left', sel === i ? 'border-sky' : 'border-border hover:border-sky/40')}>
            <span className="block truncate text-sm font-semibold text-navy">{pg.title || 'Sin título'}</span>
            <span className="mt-1 flex gap-1.5 text-[0.66rem]">
              <span className={cn('rounded px-1.5', pg.published ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-slate-text')}>{pg.published ? 'Publicada' : 'Borrador'}</span>
              {pg.showInMenu && <span className="rounded bg-accent px-1.5 text-navy">En menú</span>}
            </span>
          </button>
        ))}
      </div>
      {p && sel !== null ? (
        <Card title="Editar página" actions={<button type="button" onClick={() => setConfirm(sel)} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive" data-testid="button-delete-page"><Trash2 className="h-3.5 w-3.5" />Eliminar</button>}>
          <div className="space-y-4">
            <Field label="Título"><input className={input} value={p.title} onChange={(e) => setPage(sel, { title: e.target.value })} data-testid="input-page-title" /></Field>
            <Field label="Dirección (slug)" hint={`Se publicará en /paginas/${p.slug}`}>
              <div className="flex gap-2"><input className={input} value={p.slug} onChange={(e) => setPage(sel, { slug: slugify(e.target.value) })} /><button type="button" className="btn-outline !py-2 text-xs" onClick={() => setPage(sel, { slug: slugify(p.title) })}>Desde título</button></div>
            </Field>
            <Field label="Contenido" hint="Separa párrafos con una línea en blanco. Usa ## al inicio para un subtítulo."><textarea rows={10} className={input} value={p.body} onChange={(e) => setPage(sel, { body: e.target.value })} data-testid="input-page-body" /></Field>
            <MediaField label="Imagen" value={p.image} onChange={(v) => setPage(sel, { image: v })} kind="image" />
            <div className="flex flex-wrap gap-5">
              <Toggle checked={p.published} onChange={(v) => setPage(sel, { published: v })} label="Publicada" />
              <Toggle checked={p.showInMenu} onChange={(v) => setPage(sel, { showInMenu: v })} label="Mostrar en menú principal" />
            </div>
          </div>
        </Card>
      ) : <div className="hidden rounded-2xl border border-dashed border-border lg:block" />}
      <ConfirmRemove open={confirm !== null} what={confirm !== null ? pages[confirm]?.title : ''} onCancel={() => setConfirm(null)}
        onConfirm={() => { const i = confirm!; editor.update((s) => ({ ...s, pages: s.pages.filter((_, j) => j !== i) })); setSel(null); setConfirm(null); }} />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-navy">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-sky' : 'bg-input')} data-testid={`toggle-${slugify(label)}`}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>{label}
    </label>
  );
}

function ConfirmRemove({ open, what, onCancel, onConfirm }: { open: boolean; what?: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Eliminar “{what}”</AlertDialogTitle>
          <AlertDialogDescription>Se quitará del borrador. El cambio se aplicará al sitio cuando pulses “Guardar y publicar”.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-remove">Eliminar</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ----------------------------- INSIGHTS ----------------------------- */
function InsightsTab({ editor }: { editor: Editor }) {
  const items = editor.draft!.insights;
  const [sel, setSel] = useState<number | null>(items.length ? 0 : null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const setIt = (i: number, patch: Partial<Insight>) => editor.update((s) => ({ ...s, insights: s.insights.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const add = () => {
    const n = items.length + 1;
    editor.update((s) => ({ ...s, insights: [...s.insights, { slug: `publicacion-${n}`, title: `Nueva publicación ${n}`, category: 'articulo', summary: '', body: '', image: '', resourceUrl: '', published: false }] }));
    setSel(items.length);
  };
  const p = sel !== null ? items[sel] : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <button type="button" onClick={add} disabled={items.length >= 100} className="btn-primary w-full justify-center !py-2 text-xs" data-testid="button-add-insight"><Plus className="h-4 w-4" />Nueva publicación</button>
        {items.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-slate-text">Aún no hay publicaciones. Los artículos publicados aparecerán en Insights y en el inicio.</p>}
        {items.map((it, i) => (
          <button key={i} type="button" onClick={() => setSel(i)} data-testid={`row-insight-${i}`} className={cn('w-full rounded-xl border bg-card p-3 text-left', sel === i ? 'border-sky' : 'border-border hover:border-sky/40')}>
            <span className="block truncate text-sm font-semibold text-navy">{it.title}</span>
            <span className="mt-1 flex gap-1.5 text-[0.66rem]">
              <span className={cn('rounded px-1.5', it.published ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-slate-text')}>{it.published ? 'Publicado' : 'Borrador'}</span>
              <span className="rounded bg-accent px-1.5 text-navy">{it.category}</span>
            </span>
          </button>
        ))}
      </div>
      {p && sel !== null ? (
        <Card title="Editar publicación" actions={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIt(sel, { published: !p.published })} className="btn-outline !py-1.5 text-xs" data-testid="button-toggle-publish">{p.published ? 'Despublicar' : 'Publicar'}</button>
            <button type="button" onClick={() => setConfirm(sel)} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive" data-testid="button-delete-insight"><Trash2 className="h-3.5 w-3.5" />Eliminar</button>
          </div>}>
          <div className="space-y-4">
            <Field label="Título"><input className={input} value={p.title} onChange={(e) => setIt(sel, { title: e.target.value })} data-testid="input-insight-title" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría">
                <select className={input} value={p.category} onChange={(e) => setIt(sel, { category: e.target.value as Insight['category'] })} data-testid="select-insight-category">
                  <option value="articulo">Artículo</option><option value="reporte">Reporte</option><option value="caso">Caso de éxito</option>
                </select>
              </Field>
              <Field label="Dirección (slug)" hint={`/insights/${p.slug}`}><input className={input} value={p.slug} onChange={(e) => setIt(sel, { slug: slugify(e.target.value) })} /></Field>
            </div>
            <Field label="Resumen"><textarea rows={2} className={input} value={p.summary} onChange={(e) => setIt(sel, { summary: e.target.value })} /></Field>
            <Field label="Contenido" hint="Separa párrafos con una línea en blanco. Usa ## para subtítulos."><textarea rows={10} className={input} value={p.body} onChange={(e) => setIt(sel, { body: e.target.value })} /></Field>
            <MediaField label="Imagen destacada" value={p.image} onChange={(v) => setIt(sel, { image: v })} kind="image" />
            <MediaField label="Recurso descargable o enlace (PDF o URL)" value={p.resourceUrl} onChange={(v) => setIt(sel, { resourceUrl: v })} kind="pdf" />
            {p.resourceUrl && <a href={p.resourceUrl} target="_blank" rel="noreferrer" className="link-arrow"><FileText className="h-3.5 w-3.5" />Abrir recurso</a>}
          </div>
        </Card>
      ) : <div className="hidden rounded-2xl border border-dashed border-border lg:block" />}
      <ConfirmRemove open={confirm !== null} what={confirm !== null ? items[confirm]?.title : ''} onCancel={() => setConfirm(null)}
        onConfirm={() => { const i = confirm!; editor.update((s) => ({ ...s, insights: s.insights.filter((_, j) => j !== i) })); setSel(null); setConfirm(null); }} />
    </div>
  );
}

/* ----------------------------- ACCESS ----------------------------- */
function AccessTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const access = useGetAdminAccess({ query: { queryKey: getGetAdminAccessQueryKey() } });
  const save = useSaveAdminAccess();
  const [second, setSecond] = useState('');
  const init = useRef(false);
  useEffect(() => { if (access.data && !init.current) { init.current = true; setSecond(access.data.emails[1] ?? ''); } }, [access.data]);
  if (access.isLoading) return <FormSkeleton />;
  if (access.isError || !access.data) return <ErrorBox msg="No se pudo cargar la lista de accesos." onRetry={() => access.refetch()} />;
  const first = access.data.emails[0];
  const valid = !second || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(second.trim());
  const submit = () => {
    const emails = [first, second.trim().toLowerCase()].filter(Boolean);
    save.mutate({ data: { emails } }, {
      onSuccess: (r) => { qc.setQueryData(getGetAdminAccessQueryKey(), r); qc.invalidateQueries({ queryKey: getGetAdminAccessQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }); toast({ title: 'Accesos actualizados' }); },
      onError: () => toast({ title: 'No se pudo guardar', variant: 'destructive' }),
    });
  };
  return (
    <div className="max-w-2xl space-y-6">
      <Card title="Administradores autorizados" desc="Máximo dos cuentas. Cada persona debe registrarse e iniciar sesión con este correo y verificarlo.">
        <div className="space-y-4">
          <Field label="Administrador 1 (principal)"><input className={cn(input, 'bg-muted')} value={first} readOnly data-testid="input-admin-1" /></Field>
          <Field label="Administrador 2" hint="Déjalo vacío para no asignar un segundo administrador.">
            <input className={input} type="email" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="correo@empresa.com" data-testid="input-admin-2" />
          </Field>
          {!valid && <p className="text-xs text-destructive">Correo no válido.</p>}
          <button type="button" onClick={submit} disabled={!valid || save.isPending || second.trim() === (access.data.emails[1] ?? '')} className="btn-primary !py-2 text-xs" data-testid="button-save-access">
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Guardar accesos
          </button>
        </div>
      </Card>
      <p className="text-xs text-slate-text">El registro público no otorga permisos: solo los correos de esta lista, verificados, pueden entrar al administrador.</p>
    </div>
  );
}
