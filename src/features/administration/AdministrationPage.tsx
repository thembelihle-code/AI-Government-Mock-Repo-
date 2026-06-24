import { demoAdapter } from '../../api/adapters/demoAdapter';
import { lt } from '../../api/contracts';
import { CloudIcon } from '../../components/common/CloudIcon';
import { LoadingDeck } from '../../components/common/LoadingDeck';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusPill } from '../../components/common/StatusPill';
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher';
import { WindowPanel } from '../../components/common/WindowPanel';
import { useMockResource } from '../../hooks/useMockResource';
import { useI18n } from '../../i18n/I18nProvider';

export function AdministrationPage() {
  const { data, loading } = useMockResource(demoAdapter.getAdministrationSnapshot);
  const { text } = useI18n();

  if (loading || !data) return <LoadingDeck />;

  return (
    <div className="page-stack">
      <div className="metric-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="page-grid page-grid--admin">
        <WindowPanel title={lt('Connector posture', 'עמדת המחברים')} subtitle={lt('Each mock connector reflects a future integration contract without overpromising implementation.', 'כל מחבר מוקאפ משקף חוזה אינטגרציה עתידי מבלי להבטיח יישום יתר.')} eyebrow={lt('Platform Connectors', 'מחברי פלטפורמה')} accent="accent">
          <div className="capability-grid">
            {data.connectors.map((connector) => (
              <article key={connector.id} className="capability-card">
                <CloudIcon name={connector.icon} label={connector.name} />
                <div>
                  <div className="signal-row__topline">
                    <strong>{connector.name}</strong>
                    <StatusPill tone={connector.status} label={text(lt('Status', 'סטטוס'))} />
                  </div>
                  <p>{text(connector.narrative)}</p>
                </div>
              </article>
            ))}
          </div>
        </WindowPanel>

        <WindowPanel title={lt('Experience controls', 'בקרות חוויה')} subtitle={lt('The token-driven theme model from react-poc is preserved here as a first-class control.', 'מודל ערכות הנושא מונחה הטוקנים של react-poc נשמר כאן כבקרה ממדרגה ראשונה.')} eyebrow={lt('Theme Runtime', 'מנוע ערכות נושא')} accent="info">
          <div className="admin-theme-panel">
            <ThemeSwitcher />
            <p>{text(lt('Jutoverse remains the default, but alternate controlled palettes are available for demos and accessibility review.', 'Jutoverse נשאר ברירת המחדל, אך פלטות מבוקרות נוספות זמינות להדגמות ולסקירת נגישות.'))}</p>
          </div>
        </WindowPanel>

        <WindowPanel className="page-grid__span-2" title={lt('Audit events', 'אירועי ביקורת')} subtitle={lt('Human actions, privacy signals, and committee access remain visible in one timeline.', 'פעולות אנושיות, אותות פרטיות וגישה של ועדות נשארים גלויים בציר אחד.')} eyebrow={lt('Governance Feed', 'פיד ממשל')} accent="warning">
          <div className="stack-list">
            {data.auditEvents.map((event) => (
              <article key={event.id} className="signal-row">
                <div>
                  <div className="signal-row__topline">
                    <strong>{event.actor}</strong>
                    <StatusPill tone={event.status} label={event.time} />
                  </div>
                  <p>{text(event.action)}</p>
                  <small>{text(event.context)}</small>
                </div>
              </article>
            ))}
          </div>
        </WindowPanel>

        <WindowPanel title={lt('Governance signals', 'אותות ממשל')} subtitle={lt('These cards capture the execution constraints the UI still respects.', 'כרטיסים אלה לוכדים את מגבלות הביצוע שה-UI עדיין מכבד.')} eyebrow={lt('Contract Watch', 'פיקוח חוזים')} accent="success">
          <div className="timeline-list">
            {data.governanceSignals.map((item) => (
              <article key={item.id} className="timeline-item">
                <StatusPill tone={item.status} label={text(item.label)} />
                <p>{text(item.detail)}</p>
              </article>
            ))}
          </div>
        </WindowPanel>
      </div>
    </div>
  );
}
