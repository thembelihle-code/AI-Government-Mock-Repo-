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
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AdministrationPage() {
  const { data, loading } = useMockResource(demoAdapter.getAdministrationSnapshot);
  const { text } = useI18n();
  const navigate = useNavigate();

  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (loading || !data) return <LoadingDeck />;

  return (
    <div className="page-stack">

      {/* METRICS */}
      <div className="metric-grid">
        {data.metrics.map((metric) => (
          <div
            key={metric.id}
            onClick={() =>
              setSelectedItem({ type: "metric", data: metric })
            }
            style={{ cursor: "pointer" }}
          >
            <MetricCard metric={metric} />
          </div>
        ))}
      </div>

      <div className="page-grid page-grid--admin">

        {/* CONNECTORS */}
        <WindowPanel
          title={lt('Connector posture', 'עמדת המחברים')}
          subtitle={lt(
            'Each mock connector reflects a future integration contract without overpromising implementation.',
            'כל מחבר מוקאפ משקף חוזה אינטגרציה עתידי מבלי להבטיח יישום יתר.'
          )}
          eyebrow={lt('Platform Connectors', 'מחברי פלטפורמה')}
          accent="accent"
        >
          <div className="capability-grid">
            {data.connectors.map((connector) => (
              <article
                key={connector.id}
                className="capability-card"
                onClick={() =>
                  setSelectedItem({ type: "connector", data: connector })
                }
                style={{ cursor: "pointer" }}
              >
                <CloudIcon name={connector.icon} label={connector.name} />

                <div>
                  <div className="signal-row__topline">
                    <strong>{connector.name}</strong>
                    <StatusPill tone={connector.status} label={text('Status')} />
                  </div>
                  <p>{text(connector.narrative)}</p>
                </div>
              </article>
            ))}
          </div>
        </WindowPanel>

        {/* EXPERIENCE CONTROLS */}
        <WindowPanel
          title={lt('Experience controls', 'בקרות חוויה')}
          subtitle={lt(
            'The token-driven theme model from react-poc is preserved here as a first-class control.',
            'מודל ערכות הנושא מונחה הטוקנים של react-poc נשמר כאן כבקרה ממדרגה ראשונה.'
          )}
          eyebrow={lt('Theme Runtime', 'מנוע ערכות נושא')}
          accent="info"
        >
          <div className="admin-theme-panel">
            <ThemeSwitcher />

            <p>
              {text(
                lt(
                  'Jutoverse remains the default, but alternate controlled palettes are available for demos and accessibility review.',
                  'Jutoverse נשאר ברירת המחדל, אך פלטות מבוקרות נוספות זמינות להדגמות ולסקירת נגישות.'
                )
              )}
            </p>
          </div>
        </WindowPanel>

        {/* AUDIT EVENTS */}
        <WindowPanel
          className="page-grid__span-2"
          title={lt('Audit events', 'אירועי ביקורת')}
          subtitle={lt(
            'Human actions, privacy signals, and committee access remain visible in one timeline.',
            'פעולות אנושיות, אותות פרטיות וגישה של ועדות נשארים גלויים בציר אחד.'
          )}
          eyebrow={lt('Governance Feed', 'פיד ממשל')}
          accent="warning"
        >
          <div className="stack-list">
            {data.auditEvents.map((event) => (
              <article
                key={event.id}
                className="signal-row"
                onClick={() =>
                  setSelectedItem({ type: "audit", data: event })
                }
                style={{ cursor: "pointer" }}
              >
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
      </div>

      {/* ✅ FIXED MODAL (INSIDE RETURN PROPERLY) */}
      {selectedItem && (
        <div
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            width: 320,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 9999
          }}
        >
          <button onClick={() => setSelectedItem(null)}>
            Close
          </button>

          <h3>Demo Info</h3>

          {selectedItem.type === "metric" && (
            <>
              <p>{selectedItem.data.label}</p>
              <p>{selectedItem.data.value}</p>
            </>
          )}

          {selectedItem.type === "connector" && (
            <>
              <p>{selectedItem.data.name}</p>
              <p>{selectedItem.data.narrative}</p>
            </>
          )}

          {selectedItem.type === "audit" && (
            <>
              <p>{selectedItem.data.actor}</p>
              <p>{selectedItem.data.action}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}