import { useState, type FormEvent } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSubmitInquiry,
  getListInquiriesQueryKey,
  getGetAdminSummaryQueryKey,
  type SubmissionResult,
  type InquiryInputKind,
} from '@workspace/api-client-react';
import { SERVICES } from '@/lib/content';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = { compact?: boolean; kind?: InquiryInputKind; defaultService?: string; dark?: boolean };

const field = 'w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-text/70 transition-colors focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20';

export function ContactForm({ compact, kind = 'contacto', defaultService = '', dark }: Props) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const submit = useSubmitInquiry();
  const [v, setV] = useState({ name: '', company: '', email: '', phone: '', message: '', service: defaultService, website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = t('Escribe tu nombre.', 'Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = t('Correo no válido.', 'Invalid email.');
    if (v.message.trim().length < 10) e.message = t('Cuéntanos un poco más (mín. 10 caracteres).', 'Tell us a bit more (min. 10 characters).');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    submit.mutate(
      {
        data: {
          name: v.name.trim(),
          email: v.email.trim(),
          message: v.message.trim(),
          kind,
          website: v.website,
          company: v.company.trim() || undefined,
          phone: v.phone.trim() || undefined,
          service: v.service || undefined,
        },
      },
      {
        onSuccess: (r) => {
          setResult(r);
          qc.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
        },
      },
    );
  };

  if (result) {
    return (
      <div className={cn('rounded-2xl border p-6', dark ? 'border-white/15 bg-white/5 text-white' : 'border-border bg-card')} role="status" data-testid="status-submission">
        <CheckCircle2 className="h-8 w-8 text-sky" />
        <p className="mt-4 text-lg font-bold">{t('Recibimos tu mensaje', 'We received your message')}</p>
        <p className={cn('mt-2 text-sm', dark ? 'text-white/75' : 'text-slate-text')}>{result.message}</p>
        {!result.emailSent && (
          <p className={cn('mt-3 text-xs', dark ? 'text-white/60' : 'text-slate-text')} data-testid="text-email-not-sent">
            {t('Tu solicitud quedó registrada; el aviso por correo no se envió automáticamente. El equipo la revisará en su bandeja interna.', 'Your request was saved; the email notification was not sent automatically. The team will review it in its internal inbox.')}
          </p>
        )}
        <button type="button" onClick={() => { setResult(null); setV({ name: '', company: '', email: '', phone: '', message: '', service: defaultService, website: '' }); }} className="link-arrow mt-5" data-testid="button-new-message">
          {t('Enviar otro mensaje', 'Send another message')}<ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const label = cn('mb-1.5 block text-xs font-semibold', dark ? 'text-white/80' : 'text-navy');
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2" data-testid={`form-${kind}`}>
      <div className="hidden" aria-hidden>
        <label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></label>
      </div>
      <div>
        <label htmlFor={`n-${kind}`} className={label}>{t('Nombre', 'Name')}</label>
        <input id={`n-${kind}`} className={field} value={v.name} onChange={set('name')} autoComplete="name" data-testid="input-name" />
        {err('name')}
      </div>
      <div>
        <label htmlFor={`p-${kind}`} className={label}>{t('Teléfono', 'Phone')}</label>
        <input id={`p-${kind}`} className={field} value={v.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" data-testid="input-phone" />
      </div>
      {!compact && (
        <div>
          <label htmlFor={`c-${kind}`} className={label}>{t('Empresa', 'Company')}</label>
          <input id={`c-${kind}`} className={field} value={v.company} onChange={set('company')} autoComplete="organization" data-testid="input-company" />
        </div>
      )}
      <div className={compact ? 'sm:col-span-2' : ''}>
        <label htmlFor={`e-${kind}`} className={label}>{t('Correo electrónico', 'Email')}</label>
        <input id={`e-${kind}`} type="email" className={field} value={v.email} onChange={set('email')} autoComplete="email" data-testid="input-email" />
        {err('email')}
      </div>
      {!compact && (
        <div className="sm:col-span-2">
          <label htmlFor={`s-${kind}`} className={label}>{t('Servicio de interés', 'Service of interest')}</label>
          <select id={`s-${kind}`} className={field} value={v.service} onChange={set('service')} data-testid="select-service">
            <option value="">{t('Aún no lo sé / Asesoría', 'Not sure yet / Advice')}</option>
            {SERVICES.map((s) => <option key={s.slug} value={s.title.es}>{s.title[lang]}</option>)}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label htmlFor={`m-${kind}`} className={label}>{kind === 'cotizacion' ? t('Describe tu proyecto', 'Describe your project') : t('Cuéntanos tu necesidad', 'Tell us your need')}</label>
        <textarea id={`m-${kind}`} rows={compact ? 3 : 5} className={field} value={v.message} onChange={set('message')} data-testid="input-message"
          placeholder={kind === 'cotizacion' ? t('Objetivo, mercado o ciudad, tiempos y cualquier dato útil.', 'Objective, market or city, timing and any useful detail.') : ''} />
        {err('message')}
      </div>
      {submit.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive sm:col-span-2" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('No pudimos enviar tu mensaje. Intenta de nuevo o llámanos.', 'We could not send your message. Try again or call us.')}
        </div>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={submit.isPending} className={cn('btn-primary w-full justify-center', compact && '!bg-navy-deep hover:!bg-navy')} data-testid="button-submit">
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {kind === 'cotizacion' ? t('Solicitar cotización', 'Request a quote') : t('Concertar una cita', 'Schedule a meeting')}
        </button>
      </div>
    </form>
  );
}
