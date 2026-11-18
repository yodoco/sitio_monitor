import { Route, Switch } from 'wouter';
import { SiteLayout } from '@/components/site/layout';
import Home from '@/pages/home';
import {
  AboutPage, CmsPage, ContactPage, InsightDetailPage, InsightsPage, PrivacyPage,
  NotFoundInline, ServiceDetailPage, ServicesPage,
} from '@/pages/public';

// Shared by the browser and SSR: the same components and content, not a crawler-only copy.
export function PublicRoutes() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/servicios" component={ServicesPage} />
        <Route path="/servicios/:slug" component={ServiceDetailPage} />
        <Route path="/quienes-somos" component={AboutPage} />
        <Route path="/insights" component={InsightsPage} />
        <Route path="/insights/:slug" component={InsightDetailPage} />
        <Route path="/contacto" component={ContactPage} />
        <Route path="/paginas/:slug" component={CmsPage} />
        <Route path="/aviso-de-privacidad" component={PrivacyPage} />
        <Route component={NotFoundInline} />
      </Switch>
    </SiteLayout>
  );
}
