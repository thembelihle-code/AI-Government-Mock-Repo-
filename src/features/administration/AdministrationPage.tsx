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

export function AdministrationPage() {
  const { data, loading } = useMockResource(demoAdapter.getAdministrationSnapshot);
  const { text } = useI18n();

  // ── UNCONDITIONAL HOOK BLOCK (Initialized stably at the absolute top) ──
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  
  // Simulated Interactive Connector States (Simulates real-time system toggle paths)
  const [connectorStatusOverrides, setConnectorStatusOverrides] = useState<Record<string, 'success' | 'warning' | 'error'>>({});
  
  // Governance Feed Search State
  const [govSearch, setGovSearch] = useState('');
  const deferredGovSearch = useDeferredValue(govSearch);

  // Audit Log Timeline Filter Selection Matrix
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');

  // ── DEFENSIVE DATA CASTING BACKSTOPS (Defends against blank layout parameters) ──
  const metrics = data && Array.isArray(data.metrics) ? data.metrics : [];
  const connectors = data && Array.isArray(data.connectors) ? data.connectors : [];
  const auditEvents = data && Array.isArray(data.auditEvents) ? data.auditEvents : [];
  const governanceSignals = data && Array.isArray(data.governanceSignals) ? data.governanceSignals : [];

  // ── 📊 INTERACTIVE TOP METRICS MATRIX (Reconciliation Factory linked to states below) ──
  const interactiveMetrics = useMemo(() => {
    return metrics.map((m) => {
      if (!m) return m;
      const labelText = String(text(m.label || m.title || m.name || '')).toLowerCase();

      // 1. Dynamic Platform Connectors Metrics Count
      if (labelText.includes('connector') || labelText.includes('מחברים') || labelText.includes('active')) {
        const structuralBaseCount = connectors.length || 4;
        const disabledCount = Object.values(connectorStatusOverrides).filter(
          (status) => status === 'warning' || status === 'error'
        ).length;
        return { ...m, value: Math.max(0, structuralBaseCount - disabledCount) };
      }

      // 2. Dynamic Audit Stream Event Metric Count
      if (labelText.includes('audit') || labelText.includes('ביקורת') || labelText.includes('event')) {
        const currentCalculatedCount = auditEvents.filter((event) => {
          if (!event) return false;
          if (auditFilter === 'ALL') return true;
          return String(event.status || '').toUpperCase() === auditFilter;
        }).length;
        return { ...m, value: currentCalculatedCount };
      }

      return m;
    });
  }, [metrics, connectors, auditEvents, connectorStatusOverrides, auditFilter, text]);

  // ── 🧠 HIGH-FIDELITY SEARCH AND FILTERING PIPELINES ──
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
      const labelStr = String(text(item.label || '')).toLowerCase();
      const detailStr = String(text(item.detail || '')).toLowerCase();
      return labelStr.includes(s) || detailStr.includes(s);
    });
  }, [governanceSignals, deferredGovSearch, text]);

  // ── SELECTED CONNECTOR ANALYSIS COMPILER ──
  const targetedConnector = connectors.find((c) => c && c.id === selectedConnectorId) || null;

  // ── HOOK SECURITY RENDER TIMING GATEWAY ──
  if (loading || !data) return <LoadingDeck />;

  return (
    <div className="page-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🚀 RESPONSIVE METRIC INDICATOR LAYER (Linked to real-time interactions below) */}
      <div className="metric-grid">
        {interactiveMetrics.map((metric) => (
          metric && metric.id ? <MetricCard key={metric.id} metric={metric} /> : null
        ))}
      </div>

      <div className="page-grid page-grid--admin">
        
        {/* PLATFORM CONNECTORS PANEL WITH SIMULATION TOGGLES */}
        <WindowPanel 
          title={lt('Connector posture', 'עמדת המחברים')} 
          subtitle={lt('Each mock connector reflects a future integration contract without overpromising implementation.', 'כל מחבר מוקאפ משקף חוזה אינטגרציה עתידי מבלי להבטיח יישום יתר.')} 
          eyebrow={lt('Platform Connectors', 'מחברי פלטפורמה')} 
          accent="accent"
        >
          <div className="capability-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {connectors.map((connector) => {
              if (!connector || !connector.id) return null;
              
              // Evaluate live mutated status fields
              const activeStatus = connectorStatusOverrides[connector.id] || connector.status || 'success';
              const isFocused = connector.id === selectedConnectorId;

              return (
                <article 
                  key={connector.id} 
                  className={`capability-card ${isFocused ? 'capability-card--active' : ''}`}
                  onClick={() => setSelectedConnectorId(connector.id)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isFocused ? '2px solid #388bfd' : '1px solid rgba(255,255,255,0.05)',
                    background: isFocused ? 'rgba(56,139,253,0.06)' : 'rgba(255,255,255,0.01)',
                    padding: '14px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start'
                  }}
                >
                  <CloudIcon name={connector.icon} label={connector.name} />
                  <div style={{ flex: 1 }}>
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#f0f6fc' }}>{connector.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Status Switcher Link: Simulates interface state changes live for presentation testing */}
                        <button
                          type="button"
                          onClick={() => setConnectorStatusOverrides(prev => ({
                            ...prev,
                            [connector.id]: activeStatus === 'success' ? 'error' : 'success'
                          }))}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: '#8b949e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          {activeStatus === 'success' ? 'Simulate Interruption' : 'Restore Connection'}
                        </button>
                        <StatusPill tone={activeStatus} label={activeStatus.toUpperCase()} />
                      </div>
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#8b949e' }}>{text(connector.narrative)}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Expanded Explorer Details view Layer */}
          {targetedConnector && (
            <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '10px', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Connector Telemetry Explorer</span>
              <h4 style={{ margin: '4px 0', fontSize: '13px' }}>Integration Mapping: {targetedConnector.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', fontStyle: 'italic' }}>
                Contract endpoint validation matrix active. Secure token synchronization layer verifies compliance criteria recursively.
              </p>
            </div>
          )}
        </WindowPanel>

        {/* CONTROLS AREA */}
        <WindowPanel title={lt('Experience controls', 'בקרות חוויה')} subtitle={lt('The token-driven theme model from react-poc is preserved here as a first-class control.', 'מודל ערכות הנושא מונחה הטוקנים של react-poc נשמר כאן כבקרה ממדרגה ראשונה.')} eyebrow={lt('Theme Runtime', 'מנוע ערכות נושא')} accent="info">
          <div className="admin-theme-panel">
            <ThemeSwitcher />
            <p>{text(lt('Jutoverse remains the default, but alternate controlled palettes are available for demos and accessibility review.', 'Jutoverse נשאר ברירת המחדל, אך פלטות מבוקרות נוספות זמינות להדגמות ולסקירת נגישות.'))}</p>
          </div>
        </WindowPanel>

        {/* AUDIT TIMELINE LOG MONITOR (WITH DYNAMIC SEGMENTATION TABS) */}
        <WindowPanel 
          className="page-grid__span-2" 
          title={lt('Audit events', 'אירועי ביקורת')} 
          subtitle={lt('Human actions, privacy signals, and committee access remain visible in one timeline.', 'פעולות אנושיות, אותות פרטיות וגישה של ועדות נשארים גלויים בציר אחד.')} 
          eyebrow={lt('Governance Feed', 'פיד ממשל')} 
          accent="warning"
        >
          {/* Audit Segmentation Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '6px', marginBottom: '16px', maxWidth: '420px' }}>
            {(['ALL', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAuditFilter(tab)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: 'none',
                  transition: 'all 0.15s ease',
                  background: auditFilter === tab ? '#21262d' : 'transparent',
                  color: auditFilter === tab ? '#58a6ff' : '#8b949e'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="stack-list" style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAudits.length === 0 ? (
              <p style={{ textPlain: true, color: 'rgba(255,255,255,0.4)', padding: '20px 0', textAlign: 'center' }}>
                No audit feed parameters found matching active context filter indices.
              </p>
            ) : (
              filteredAudits.map((event) => (
                <article key={event.id} className="signal-row" style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong>{event.actor}</strong>
                      <StatusPill tone={event.status} label={event.time} />
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{text(event.action)}</p>
                    <small style={{ color: '#8b949e', display: 'block' }}>{text(event.context)}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </WindowPanel>

        {/* GOVERNANCE SIGNALS MATRIX WITH KEYWORD INTERLOCK SEARCH */}
        <WindowPanel 
          title={lt('Governance signals', 'אותות ממשל')} 
          subtitle={lt('These cards capture the execution constraints the UI still respects.', 'כרטיסים אלה לוכדים את מגבלות הביצוע שה-UI עדיין מכבד.')} 
          eyebrow={lt('Contract Watch', 'פיקוח חוזים')} 
          accent="success"
        >
          {/* Signal Search Engine Wrapper */}
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={govSearch}
              onChange={(e) => setGovSearch(e.target.value)}
              placeholder="🔍 Search constraints by query string..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '5px',
                color: 'inherit',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div className="timeline-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {filteredGovSignals.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', padding: '15px 0', textPlain: true }}>No watch signals match key filter criteria.</p>
            ) : (
              filteredGovSignals.map((item) => (
                <article key={item.id} className="timeline-item" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <StatusPill tone={item.status} label={text(item.label)} />
                    <small style={{ color: '#484f58', fontSize: '10px' }}>{item.id}</small>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#8b949e' }}>{text(item.detail)}</p>
                </article>
              ))
            )}
          </div>
        </WindowPanel>

      </div>
    </div>
  );
}