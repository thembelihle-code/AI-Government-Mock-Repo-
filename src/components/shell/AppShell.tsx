import { Cloud, Clock3, ShieldCheck } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { lt } from '../../api/contracts';
import { useI18n } from '../../i18n/I18nProvider';
import { LocaleSwitch } from '../common/LocaleSwitch';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { ROUTES } from '../../app/router/AppRouter';

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { lang, setLang, text } = useI18n();
  const location = useLocation();

  const activeRoute = useMemo(
    () => ROUTES.find((route) => location.pathname.startsWith(route.path)) ?? ROUTES[0],
    [location.pathname]
  );

  const now = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <div className="app-shell">
      <div className="app-shell__atmosphere" aria-hidden="true" />
      <header className="shell-header">
        <div className="brand-lockup">
          <div className="brand-lockup__badge">
            <Cloud size={16} />
            <span>Jutoverse</span>
          </div>
          <div>
            <h1 className="brand-lockup__title">AI Government Experience Mockup</h1>
            <p className="brand-lockup__subtitle">{text(activeRoute.subtitle)}</p>
          </div>
        </div>

        <div className="shell-utilities">
          <div className="utility-card">
            <Clock3 size={16} />
            <span>{now}</span>
          </div>
          <div className="utility-card">
            <ShieldCheck size={16} />
            <span>europe-west1</span>
          </div>
          <LocaleSwitch lang={lang} onChange={setLang} groupLabel={text(lt('Language switcher', 'מחליף שפה'))} />
        </div>
      </header>

      <div className="shell-toolbar">
        <nav className="shell-nav" aria-label={text(lt('Primary navigation', 'ניווט ראשי'))}>
          {ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink key={route.id} to={route.path} className={({ isActive }) => ['nav-pill', isActive ? 'nav-pill--active' : ''].join(' ')}>
                <Icon className="nav-pill__icon" />
                <span>{text(route.label)}</span>
              </NavLink>
            );
          })}
        </nav>
        <ThemeSwitcher />
      </div>

      <section className="shell-hero">
        <div className="shell-hero__lead">
          <span className="eyebrow">{text(activeRoute.badge)}</span>
          <h2>{text(activeRoute.label)}</h2>
          <p>{text(activeRoute.subtitle)}</p>
          <div className="hero-point-row">
            <span className="tag-chip">{text(lt('Mock data, real interaction design', 'נתוני מוקאפ, עיצוב אינטראקציה אמיתי'))}</span>
            <span className="tag-chip">{text(lt('Hebrew RTL ready', 'מוכן ל-Hebrew RTL'))}</span>
            <span className="tag-chip">{text(lt('Resizing panels enabled', 'פאנלים ניתנים לשינוי גודל'))}</span>
          </div>
        </div>
        {/* The entire hero-signals div container has been removed from here */}
      </section>

      <div className="shell-body">
        <main className="shell-main">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}