import React, { useState, useMemo, useDeferredValue } from 'react';
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

type AllowedPillTone = 'success' | 'warning' | 'info' | 'neutral' | 'accent';

export function AdministrationPage() {
  const { data, loading } = useMockResource(demoAdapter.getAdministrationSnapshot);
  const { text } = useI18n();

  // ── 🧠 1. STATE INITIALIZATION ENGINE ──
  const [selectedItem, setSelectedItem] = useState<{ type: 'metric' | 'connector' | 'audit' | 'gov'; data: any } | null>(null);
  const [connectorStatusOverrides, setConnectorStatusOverrides] = useState<Record<string, string>>({});
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');
  const [govSearch, setGovSearch] = useState('');

  const deferredGovSearch = useDeferredValue(govSearch);

  // ── 🛡️ 2. DEFENSIVE DATA CASTING BACKSTOPS ──
  const metrics = data && Array.isArray(data.metrics) ? data.metrics : [];
  const connectors = data && Array.isArray(data.connectors) ? data.connectors : [];
  const auditEvents = data && Array.isArray(data.auditEvents) ? data.auditEvents : [];
  const governanceSignals = data && Array.isArray(data.governanceSignals) ? data.governanceSignals : [];

  // Defensive status-to-pill mapping contract validation
  const safePillTone = (rawTone: string | undefined): AllowedPillTone => {
    if (!rawTone) return 'neutral';
    const clean = rawTone.toLowerCase().trim();
    if (['success', 'active', 'ok', 'online', 'verified'].includes(clean)) return 'success';
    if (['warning', 'pending', 'degraded', 'intermittent'].includes(clean)) return 'warning';
    if (['error', 'danger', 'failed', 'offline', 'critical'].includes(clean)) return 'neutral';
    if (['info', 'accent', 'neutral'].includes(clean)) return clean as AllowedPillTone;
    return 'neutral';
  };

  const safeText = (keyOrObject: any, fallbackStr: string = ''): string => {
    if (!keyOrObject) return fallbackStr;
    try {
      return typeof text === 'function' ? text(keyOrObject) : fallbackStr;
    } catch {
      return fallbackStr;
    }
  };

  // ── 📊 3. DYNAMIC METRICS RECONCILIATION ENGINE ──
  const interactiveMetrics = useMemo(() => {
    return metrics.map((m) => {
      if (!m) return m;
      const labelText = String(safeText(m.label || m.title || m.name || '', '')).toLowerCase();

      if (labelText.includes('connector') || labelText.includes('מחברים') || labelText.includes('active')) {
        const baseTotal = connectors.length;
        const disabledCount = Object.values(connectorStatusOverrides).filter(
          (status) => status === 'warning' || status === 'error'
        ).length;
        return { ...m, value: Math.max(0, baseTotal - disabledCount) };
      }

      if (labelText.includes('audit') || labelText.includes('ביקורת') || labelText.includes('event')) {
        const liveFilteredCount = auditEvents.filter((event) => {
          if (!event) return false;
          if (auditFilter === 'ALL') return true;
          return String(event.status || '').toUpperCase() === auditFilter;
        }).length;
        return { ...m, value: liveFilteredCount };
      }

      return m;
    });
  }, [metrics, connectors, auditEvents, connectorStatusOverrides, auditFilter]);

  // ── 🔍 4. TELEMETRY SELECTION PIPELINES ──
  const filteredAudits = useMemo(() => {
    return auditEvents.filter((event) => {
      if (!event) return false;
      if (auditFilter === 'ALL') return true;
      return String(event.status || '').toUpperCase() === auditFilter;
    });
  }, [auditEvents, auditFilter]);

  const filteredGovSignals = useMemo(() => {
    const s = deferredGovSearch.toLowerCase().trim();
    if (!s) return governanceSignals;
    return governanceSignals.filter((item) => {
      if (!item) return false;
      const labelStr = String(safeText(item.label || '', '')).toLowerCase();
      const detailStr = String(safeText(item.detail || '', '')).toLowerCase();
      return labelStr.includes(s) || detailStr.includes(s);
    });
  }, [governanceSignals, deferredGovSearch]);

  if (loading || !data) return <LoadingDeck />;

  return (
    <div className="page-stack">
      
      {/* METRIC GRID */}
      <div className="metric-grid">
        {interactiveMetrics.map((metric) => (
          metric && metric.id ? (
            <div 
              key={metric.id} 
              onClick={() => setSelectedItem({ type: 'metric', data: metric })}
              style={{ cursor: 'pointer' }}
            >
              <MetricCard metric={metric} />
            </div>
          ) : null
        ))}
      </div>

      {/* ORIGINAL RESPONSIVE GRID LAYOUT PAGE MESH */}
      <div className="page-grid page-grid--admin">
        
        {/* PLATFORM CONNECTORS PANEL */}
        <WindowPanel title={lt('Connector posture', 'עמדת המחברים')} subtitle={lt('Each mock connector reflects a future integration contract without overpromising implementation.', 'כל מחבר מוקאפ משקף חוזה אינטגרציה עתידי מבלי להבטיח יישום יתר.')} eyebrow={lt('Platform Connectors', 'מחברי פלטפורמה')} accent="accent">
          <div className="capability-grid">
            {connectors.map((connector) => {
              if (!connector || !connector.id) return null;
              const liveStatus = connectorStatusOverrides[connector.id] || connector.status;
              
              return (
                <article 
                  key={connector.id} 
                  className="capability-card"
                  onClick={() => setSelectedItem({ type: 'connector', data: { ...connector, status: liveStatus } })}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <CloudIcon name={connector.icon} label={connector.name} />
                  <div>
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{connector.name}</strong>
                      
                      {/* Interactive Simulation Inline Toggles */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = liveStatus === 'success' ? 'warning' : 'success';
                            setConnectorStatusOverrides(prev => ({ ...prev, [connector.id]: next }));
                          }}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          {liveStatus === 'success' ? 'Simulate Fault' : 'Fix Link'}
                        </button>
                        <StatusPill tone={safePillTone(liveStatus)} label={String(liveStatus).toUpperCase()} />
                      </div>
                    </div>
                    <p style={{ marginTop: '4px' }}>{safeText(connector.narrative)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </WindowPanel>

        {/* EXPERIENCE CONTROLS PANEL */}
        <WindowPanel title={lt('Experience controls', 'בקרות חוויה')} subtitle={lt('The token-driven theme model from react-poc is preserved here as a first-class control.', 'מודל ערכות הנושא מונחה הטוקנים של react-poc נשמר כאן כבקרה ממדרגה ראשונה.')} eyebrow={lt('Theme Runtime', 'מנוע ערכות נושא')} accent="info">
          <div className="admin-theme-panel">
            <ThemeSwitcher />
            <p style={{ marginTop: '8px' }}>{safeText(lt('Jutoverse remains the default, but alternate controlled palettes are available for demos and accessibility review.', 'Jutoverse נשאר ברירת המחדל, אך פלטות מבוקרות נוספות זמינות להדגמות ולסקירת נגישות.'))}</p>
          </div>
        </WindowPanel>

        {/* AUDIT LOG COMPLIANCE FEED PANEL */}
        <WindowPanel className="page-grid__span-2" title={lt('Audit events', 'אירועי ביקורת')} subtitle={lt('Human actions, privacy signals, and committee access remain visible in one timeline.', 'פעולות אנושיות, אותות פרטיות וגישה של ועדות נשארים גלויים בציר אחד.')} eyebrow={lt('Governance Feed', 'פיד ממשל')} accent="warning">
          
          {/* Timeline Tab Segments */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', maxWidth: '340px' }}>
            {(['ALL', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAuditFilter(tab)}
                style={{ flex: 1, padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', background: auditFilter === tab ? 'rgba(56,139,253,0.15)' : 'transparent', color: auditFilter === tab ? '#58a6ff' : '#8b949e' }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="stack-list">
            {filteredAudits.map((event, idx) => {
              if (!event) return null;
              return (
                <article 
                  key={event.id || `audit-${idx}`} 
                  className="signal-row"
                  onClick={() => setSelectedItem({ type: 'audit', data: event })}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="signal-row__topline">
                      <strong>{event.actor}</strong>
                      <StatusPill tone={safePillTone(event.status)} label={event.time} />
                    </div>
                    <p>{safeText(event.action)}</p>
                    <small style={{ color: '#8b949e', display: 'block', marginTop: '2px' }}>{safeText(event.context)}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </WindowPanel>

        {/* GOVERNANCE WATCH PANEL */}
        <WindowPanel title={lt('Governance signals', 'אותות ממשל')} subtitle={lt('These cards capture the execution constraints the UI still respects.', 'כרטיסים אלה לוכדים את מגבלות הביצוע שה-UI STILL מכבד.')} eyebrow={lt('Contract Watch', 'פיקוח חוזים')} accent="success">
          
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="text" 
              value={govSearch}
              onChange={(e) => setGovSearch(e.target.value)}
              placeholder="🔍 Search compliance signals..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e6edf3', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div className="timeline-list">
            {filteredGovSignals.map((item, idx) => {
              if (!item) return null;
              return (
                <article 
                  key={item.id || `gov-${idx}`} 
                  className="timeline-item"
                  onClick={() => setSelectedItem({ type: 'gov', data: item })}
                  style={{ cursor: 'pointer' }}
                >
                  <StatusPill tone={safePillTone(item.status)} label={safeText(item.label)} />
                  <p style={{ marginTop: '4px' }}>{safeText(item.detail)}</p>
                </article>
              );
            })}
          </div>
        </WindowPanel>
      </div>

      {/* ── 🛡️ TRUE PROFESSIONAL CONTEXT OVERLAY SHIELD DRAWER (SAFE MOUNTING) ── */}
      {selectedItem && (
        <>
          <div 
            onClick={() => setSelectedItem(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(1px)', zIndex: 9998 }}
          />

          <div style={{ position: 'fixed', right: '24px', top: '24px', width: '340px', background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '20px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)', zIndex: 9999, color: '#c9d1d9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <strong style={{ fontSize: '13px', color: '#58a6ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔬 Telemetry Node Inspector
              </strong>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>×</button>
            </div>

            {selectedItem.type === 'metric' && selectedItem.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Ledger Node Index</span>
                <strong style={{ fontSize: '16px', color: '#f0f6fc' }}>{safeText(selectedItem.data.label || selectedItem.data.title)}</strong>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', display: 'block', color: '#8b949e' }}>Computed Live Quantity:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#58a6ff', fontFamily: 'monospace' }}>{selectedItem.data.value}</span>
                </div>
              </div>
            )}

            {selectedItem.type === 'connector' && selectedItem.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: '#f0f6fc' }}>{selectedItem.data.name}</strong>
                  <StatusPill tone={safePillTone(selectedItem.data.status)} label={String(selectedItem.data.status).toUpperCase()} />
                </div>
                <p style={{ fontSize: '13px', color: '#8b949e', margin: '4px 0 0 0', lineHeight: '1.4' }}>{safeText(selectedItem.data.narrative)}</p>
                <small style={{ fontSize: '11px', color: '#484f58', fontFamily: 'monospace', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', marginTop: '4px' }}>
                  REGIONAL ZONE DEPLOY: europe-west1
                </small>
              </div>
            )}

            {selectedItem.type === 'audit' && selectedItem.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: '#f0f6fc' }}>Actor: {selectedItem.data.actor}</strong>
                  <StatusPill tone={safePillTone(selectedItem.data.status)} label={selectedItem.data.time} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '11px', color: '#8b949e', display: 'block', marginBottom: '2px' }}>Action Trace Statement:</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#e6edf3' }}>{safeText(selectedItem.data.action)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#8b949e', display: 'block', marginBottom: '2px' }}>Scope Token:</span>
                  <code style={{ fontSize: '12px', color: '#d29922', wordBreak: 'break-all' }}>{safeText(selectedItem.data.context)}</code>
                </div>
              </div>
            )}

            {selectedItem.type === 'gov' && selectedItem.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Constraint Identity</span>
                <StatusPill tone={safePillTone(selectedItem.data.status)} label={safeText(selectedItem.data.label)} />
                <p style={{ fontSize: '13px', color: '#e6edf3', marginTop: '6px' }}>{safeText(selectedItem.data.detail)}</p>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
