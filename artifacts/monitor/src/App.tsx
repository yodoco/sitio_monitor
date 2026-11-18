import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { getGetSiteQueryKey } from '@workspace/api-client-react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { esES, enUS } from '@clerk/localizations';
import { shadcn } from '@clerk/themes';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider, useLang } from '@/lib/i18n';
import { Wordmark } from '@/components/site/shared';
import { Seo } from '@/components/site/seo';
import { PublicRoutes } from './public-routes';
import AdminPage from '@/pages/admin';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true, staleTime: 30_000 } } });
const initialSite = document.getElementById('monitor-site-data')?.textContent;
if (initialSite) queryClient.setQueryData(getGetSiteQueryKey(), JSON.parse(initialSite));

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/assets/monitor-official.svg`,
  },
  variables: {
    colorPrimary: 'hsl(203 74% 46%)',
    colorForeground: 'hsl(214 55% 13%)',
    colorMutedForeground: 'hsl(214 16% 40%)',
    colorDanger: 'hsl(356 64% 46%)',
    colorBackground: 'hsl(210 40% 99.5%)',
    colorInput: 'hsl(210 40% 99.5%)',
    colorInputForeground: 'hsl(214 55% 13%)',
    colorNeutral: 'hsl(214 40% 30%)',
    fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    borderRadius: '0.7rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[hsl(210_40%_99.5%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[hsl(212_28%_89%)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[hsl(213_73%_15%)] font-bold text-xl',
    headerSubtitle: 'text-[hsl(214_16%_40%)]',
    socialButtonsBlockButtonText: 'text-[hsl(213_73%_15%)] font-semibold',
    formFieldLabel: 'text-[hsl(213_73%_15%)] font-semibold',
    footerActionLink: 'text-[hsl(203_74%_40%)] font-semibold',
    footerActionText: 'text-[hsl(214_16%_40%)]',
    dividerText: 'text-[hsl(214_16%_40%)]',
    identityPreviewEditButton: 'text-[hsl(203_74%_40%)]',
    formFieldSuccessText: 'text-emerald-700',
    alertText: 'text-[hsl(214_55%_13%)]',
    logoBox: 'h-12 justify-center',
    logoImage: 'h-12',
    socialButtonsBlockButton: 'border border-[hsl(212_28%_86%)] bg-white',
    formButtonPrimary: 'bg-[hsl(203_74%_46%)] text-white rounded-full font-semibold',
    formFieldInput: 'border border-[hsl(212_26%_84%)] bg-white text-[hsl(214_55%_13%)]',
    footerAction: 'bg-[hsl(210_40%_96.5%)]',
    dividerLine: 'bg-[hsl(212_28%_89%)]',
    alert: 'bg-[hsl(203_80%_94%)] border border-[hsl(203_60%_80%)]',
    otpCodeFieldInput: 'border border-[hsl(212_26%_84%)] text-[hsl(214_55%_13%)]',
    formFieldRow: 'gap-3',
    main: 'gap-5',
  },
};

function AuthFrame({ children }: { children: ReactNode }) {
  const { t } = useLang();
  return (
    <div className="hero-bg relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-4 py-12">
      <Seo title={t('Acceso administrador', 'Admin access')} description="Monitor" noindex />
      <Link href="/" className="relative"><Wordmark light /></Link>
      <div className="relative w-full">{children}</div>
      <p className="relative max-w-sm text-center text-xs text-white/60">
        {t('Acceso exclusivo para administradores autorizados de Monitor. Crear una cuenta no otorga permisos.', 'Access exclusive to authorized Monitor administrators. Creating an account does not grant permissions.')}
      </p>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthFrame>
      <SignIn routing="path" path={`${basePath}/ad-min/sign-in`} signUpUrl={`${basePath}/ad-min/sign-up`} fallbackRedirectUrl={`${basePath}/ad-min`} />
    </AuthFrame>
  );
}

function SignUpPage() {
  return (
    <AuthFrame>
      <SignUp routing="path" path={`${basePath}/ad-min/sign-up`} signInUrl={`${basePath}/ad-min/sign-in`} fallbackRedirectUrl={`${basePath}/ad-min`} />
    </AuthFrame>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/ad-min/sign-in/*?" component={SignInPage} />
      <Route path="/ad-min/sign-up/*?" component={SignUpPage} />
      <Route path="/ad-min">{() => <RoutedErrorBoundary><AdminPage /></RoutedErrorBoundary>}</Route>
      <Route>{() => <RoutedErrorBoundary><PublicRoutes /></RoutedErrorBoundary>}</Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const base = lang === 'es' ? esES : enUS;
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/ad-min/sign-in`}
      signUpUrl={`${basePath}/ad-min/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/ad-min`}
      signUpFallbackRedirectUrl={`${basePath}/ad-min`}
      afterSignOutUrl={basePath || '/'}
      localization={{
        ...base,
        signIn: {
          ...base.signIn,
          start: {
            ...base.signIn?.start,
            title: lang === 'es' ? 'Administrador Monitor' : 'Monitor administration',
            subtitle: lang === 'es' ? 'Inicia sesión con tu correo autorizado' : 'Sign in with your authorized email',
          },
        },
        signUp: {
          ...base.signUp,
          start: {
            ...base.signUp?.start,
            title: lang === 'es' ? 'Registrar correo autorizado' : 'Register authorized email',
            subtitle: lang === 'es' ? 'Solo correos autorizados obtienen acceso' : 'Only authorized emails get access',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </LanguageProvider>
  );
}

export default App;
