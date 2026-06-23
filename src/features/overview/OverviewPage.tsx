import { CloudIcon } from '../../components/common/CloudIcon';
import { LoadingDeck } from '../../components/common/LoadingDeck';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusPill } from '../../components/common/StatusPill';
import { WindowPanel } from '../../components/common/WindowPanel';
import { useMockResource } from '../../hooks/useMockResource';
import { demoAdapter } from '../../api/adapters/demoAdapter';
import { lt } from '../../api/contracts';
import { useI18n } from '../../i18n/I18nProvider';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function OverviewPage() {
  const { data, loading } = useMockResource(demoAdapter.getOverviewSnapshot);
  const [liveData, setLiveData] = useState<typeof data | null>(null);
  const { text } = useI18n();
  const navigate = useNavigate();

  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<
  'all' | 'danger' | 'warning' | 'info'
>('all');
  
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D'>('24H');

  useEffect(() => {
  if (data) {
    setLiveData(data);
  }
}, [data]);

// TEMPORARY TEST
  

  // Simulated updates
  useEffect(() => {
  if (!liveData) return;

  const timer = setInterval(() => {
    setLiveData((current) => {
      if (!current) return current;

      return {
        ...current,

        metrics: current.metrics.map((metric) => ({
          ...metric,
          points: metric.points.map((point) =>
            Math.max(
              10,
              point + Math.floor(Math.random() * 5 - 2)
            )
          ),
        })),

        alerts: current.alerts.map((alert) => ({
          ...alert,
          age:
            Math.floor(Math.random() * 10 + 1) +
            ' min ago',
        })),
      };
    });
  }, 10000);

  return () => clearInterval(timer);
}, [liveData]);

  if (loading || !data || !liveData) {
    return <LoadingDeck />;
  }

  const filteredAlerts =
  severityFilter === 'all'
    ? liveData?.alerts ?? []
    : (liveData?.alerts ?? []).filter(
        (alert) => alert.severity === severityFilter
      );
  
  const displayedMetrics = liveData.metrics.map((metric) => {
  let multiplier = 1;

  if (timeRange === '1H') {
    multiplier = 0.4;
  }

  if (timeRange === '7D') {
    multiplier = 1.6;
  }

  const numericValue = parseInt(metric.value.replace('%', ''));

  return {
    ...metric,
    value: `${Math.min(
  100,
  Math.round(numericValue * multiplier)
)}%`,
  };
});
    
    return (
  <div className="page-stack">
    <section className="feature-banner">
      <div>
        <span className="eyebrow">
          {text(lt('Program Narrative', 'נרטיב התוכנית'))}
        </span>
        <h2>{text(data.missionTitle)}</h2>
        <p>{text(data.missionNarrative)}</p>
      </div>

      <div className="feature-banner__chips">
        <StatusPill
          tone="accent"
          label={text(lt('GCP-first', 'GCP-first'))}
        />

        <StatusPill
          tone="success"
          label={text(lt('React + TypeScript', 'React + TypeScript'))}
        />

        <StatusPill
          tone="warning"
          label={text(lt('Human oversight on', 'פיקוח אנושי פעיל'))}
        />
      </div>
    </section>

 <div className="time-range-selector">
  <button
    className={timeRange === '1H' ? 'active' : ''}
    onClick={() => setTimeRange('1H')}
  >
    1H
  </button>

  <button
    className={timeRange === '24H' ? 'active' : ''}
    onClick={() => setTimeRange('24H')}
  >
    24H
  </button>

  <button
    className={timeRange === '7D' ? 'active' : ''}
    onClick={() => setTimeRange('7D')}
  >
    7D
  </button>
</div>

      <div className="metric-grid">
        {displayedMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="page-grid page-grid--overview">
        <WindowPanel
          title={lt('Active signals', 'אותות פעילים')}
          subtitle={lt('Program-level alerts across all four workstreams.', 'התראות ברמת התוכנית בכל ארבעת זרמי העבודה.')}
          eyebrow={lt('Operations Pulse', 'דופק תפעולי')}
          accent="warning"
        >
          <div className="signal-filters">
  <button
    className={severityFilter === 'all' ? 'active' : ''}
    onClick={(e) => {
  e.stopPropagation();
  setSeverityFilter('all');
}}
  >
    All
  </button>

  <button
    className={severityFilter === 'warning' ? 'active' : ''}
    onClick={(e) => {
  e.stopPropagation();
  setSeverityFilter('warning');
}}
  >
    Warning
  </button>

  <button
    className={severityFilter === 'info' ? 'active' : ''}
    onClick={(e) => {
  e.stopPropagation();
  setSeverityFilter('info');
}}
  >
    Info
  </button>

  <button
    className={severityFilter === 'danger' ? 'active' : ''}
    onClick={(e) => {
  e.stopPropagation();
  setSeverityFilter('danger');
}}
  >
    Critical
  </button>
</div>
          <div className="stack-list">
            {filteredAlerts.map((alert) => (
  <article
    key={alert.id}
    className="signal-row"
    onClick={() =>
      setSelectedAlert(selectedAlert === alert.id ? null : alert.id)
    }
  >
    <div>
      <div className="signal-row__topline">
        <strong>{text(alert.title)}</strong>
        <StatusPill tone={alert.severity} label={alert.source} />
      </div>

      <p>{text(alert.summary)}</p>

      {selectedAlert === alert.id && (
        <div className="signal-details">
          <p>
            {text(
                lt(
                  'Suggested action: investigate and escalate if necessary.',
                  'פעולה מוצעת: לבדוק ולהסלים במידת הצורך.'
                )
            )}
          </p>

          <StatusPill
            tone="warning"
            label={text(
              lt(
                'Human review required',
                'נדרשת בדיקה אנושית'
              )
            )}
          />
        </div>
      )}
    </div>

    <span className="signal-age">{alert.age}</span>
  </article>
))}
          </div>
        </WindowPanel>

        <WindowPanel
          title={lt('Workstream readiness', 'מוכנות זרמי העבודה')}
          subtitle={lt('Each RFI work area represented as a live UI surface.', 'כל אזור RFI מיוצג כמשטח UI חי.')}
          eyebrow={lt('Feature Coverage', 'כיסוי יכולות')}
          accent="accent"
        >
          <div className="stack-list">
            {liveData?.workstreams.map((stream) => (
  <article
    key={stream.id}
    className="progress-card progress-card--clickable"
    onClick={() => {
      switch (stream.id) {
        case 'service-operations':
          navigate('/service-operations');
          break;

        case 'representative-assistant':
          navigate('/representative-assistant');
          break;

        case 'citizen-services':
          navigate('/citizen-services');
          break;

        case 'research-review':
          navigate('/research-review');
          break;

        case 'administration':
          navigate('/administration');
          break;

        default:
          break;
      }
    }}
  >
                <div className="progress-card__header">
                  <div>
                    <strong>{text(stream.title)}</strong>
                    <p>{text(stream.narrative)}</p>
                  </div>
                  <span className="progress-card__value">{stream.progress}%</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${stream.progress}%` }} />
                </div>
                <div className="progress-card__footer">{text(stream.progressLabel)}</div>
              </article>
            ))}
          </div>
        </WindowPanel>

        <WindowPanel
          title={lt('Cloud capability map', 'מפת יכולות ענן')}
          subtitle={lt('Visual language aligned to the GCP-native delivery contract.', 'שפה ויזואלית המיושרת לחוזה המסירה ה-GCP-native.')}
          eyebrow={lt('Platform Story', 'סיפור פלטפורמה')}
          accent="info"
        >
          <div className="capability-grid">
            {liveData?.cloudCapabilities.map((capability) => (
              <article key={capability.id} className="capability-card">
                <CloudIcon name={capability.icon} label={text(capability.title)} />
                <div>
                  <strong>{text(capability.title)}</strong>
                  <p>{text(capability.detail)}</p>
                </div>
              </article>
            ))}
          </div>
        </WindowPanel>

        <WindowPanel
          title={lt('Execution milestones', 'אבני דרך לביצוע')}
          subtitle={lt('A clear line from assumptions to live UI outcomes.', 'קו ברור מהנחות עבודה אל תוצרי UI חיים.')}
          eyebrow={lt('Delivery Thread', 'חוט אספקה')}
          accent="success"
        >
          <div className="timeline-list">
            {liveData?.milestones.map((milestone) => (
              <article key={milestone.id} className="timeline-item">
                <StatusPill tone={milestone.status} label={text(milestone.label)} />
                <p>{text(milestone.detail)}</p>
              </article>
            ))}
          </div>
        </WindowPanel>
      </div>
    </div>
  );
}
