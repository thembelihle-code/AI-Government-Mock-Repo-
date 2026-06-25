import React, { startTransition, useDeferredValue, useMemo, useState, useEffect } from 'react';
import { demoAdapter } from '../../api/adapters/demoAdapter';
import { lt } from '../../api/contracts';
import { LoadingDeck } from '../../components/common/LoadingDeck';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusPill } from '../../components/common/StatusPill';
import { WindowPanel } from '../../components/common/WindowPanel';
import { useMockResource } from '../../hooks/useMockResource';
import { useI18n } from '../../i18n/I18nProvider';

type AllowedPillTone = 'success' | 'warning' | 'info' | 'neutral';

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  isFocused?: boolean;
}

function InteractiveCard({ children, onClick, isFocused }: InteractiveCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: isFocused ? 'translateY(-2px)' : 'none',
        boxShadow: isFocused ? '0 4px 20px rgba(56,139,253,0.15)' : 'none',
        borderRadius: '8px'
      }}
    >
      {children}
    </div>
  );
}

export function ServiceOperationsPage() {
  const { data, loading } = useMockResource(demoAdapter.getServiceOperationsSnapshot);
  const { text } = useI18n();

  // ── 🧠 1. STATE CONFIGURATION GRID ──
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('INT-4021');
  const [transcriptQuery, setTranscriptQuery] = useState('');
  
  const [secureAccess, setSecureAccess] = useState(true);
  const [anomalyStates, setAnomalyStates] = useState<Record<string, 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED'>>({});
  const [sentimentOverrides, setSentimentOverrides] = useState<Record<string, number>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [forecastMode, setForecastMode] = useState<'NORMAL' | 'LOW' | 'PEAK' | 'EMERGENCY'>('NORMAL');
  const [activeTaxonomyFilter, setActiveTaxonomyFilter] = useState<string | null>(null);

  const [activeTelemetryModal, setActiveTelemetryModal] = useState<'ALERTS' | 'RECOVERY' | 'EXPLAIN_ANOMALY' | 'EXPORT' | 'AGENTS' | null>(null);
  const [selectedAnomalyContext, setSelectedAnomalyContext] = useState<any>(null);
  const [selectedPainPoint, setSelectedPainPoint] = useState<string | null>(null);
  const [responseTimeSlider, setResponseTimeSlider] = useState<number>(15);
  const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState(92);

  // ✅ FIX 3: ADDED HOVER & INTERACTION STATE SYSTEM FOR CONFIDENCE BADGES
  const [selectedConfidence, setSelectedConfidence] = useState<string | null>(null);

  const [auditTrails, setAuditTrails] = useState<Record<string, Array<{ time: string; msg: string }>>>({
    'ANM-902': [{ time: '09:14 AM', msg: 'System flagged transcript context: Script Deviation pattern detected' }],
    'ANM-903': [{ time: '10:02 AM', msg: 'System flagged authentication parameter mismatch stack threshold' }]
  });

  const [liveActivityFeed, setLiveActivityFeed] = useState<Array<{ id: string; time: string; feedMsg: string; tone: AllowedPillTone }>>([
    { id: '1', time: '11:42 AM', feedMsg: 'Inquiry classified down to active verification workspace queue', tone: 'info' },
    { id: '2', time: '11:43 AM', feedMsg: 'Critical sentiment variance vector isolated inside node INT-4022', tone: 'warning' },
    { id: '3', time: '11:45 AM', feedMsg: 'Workforce allocation matrices calculated for active peak requirements', tone: 'success' }
  ]);

  useEffect(() => {
    const feedTemplates = [
      { feedMsg: 'AI confidence score optimized recursively across contract queues.', tone: 'success' as AllowedPillTone },
      { feedMsg: 'New interaction packet mapped via global ingestion registry layer.', tone: 'info' as AllowedPillTone },
      { feedMsg: 'Telemetry analyzer completed recursive data model safety check.', tone: 'info' as AllowedPillTone }
    ];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const picked = feedTemplates[Math.floor(Math.random() * feedTemplates.length)];
      setLiveActivityFeed(prev => [{ id: Math.random().toString(), time: timeStr, ...picked }, ...prev.slice(0, 4)]);
      setSystemHealth(prev => Math.max(85, Math.min(99, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const deferredQuery = useDeferredValue(query);

  // ── 🛡️ 2. STRUCTURE DATA SCHEMA BACKSTOPS ──
  const rawInteractions = data && Array.isArray(data.interactions) ? data.interactions : [];
  const metrics = data && Array.isArray(data.metrics) ? data.metrics : [];
  const rawAnomalies = data && Array.isArray(data.anomalies) ? data.anomalies : [];
  const rawForecast = data && Array.isArray(data.forecast) ? data.forecast : [];
  const taxonomy = data && Array.isArray(data.taxonomy) ? data.taxonomy : [];

  const baselineTranscripts: Record<string, string> = {
    'INT-4021': "Citizen requested immediate confirmation regarding housing benefit options and verification timeline tracking variables. Agent maintained direct accuracy parameters.",
    'INT-4022': "Inquiry logged via mobile portal interface requesting digital ID token reset procedures. System flagged potential authentication mismatch path, routing to supervisor.",
  };

  const taxonomyDrilldownData: Record<string, { share: string, trend: string, themes: string[], cases: string[] }> = {
    'housing': { share: '34%', trend: '↑ 12%', themes: ['Rental subsidy constraints', 'Housing appeal queue delays', 'Emergency housing allocation'], cases: ['INT-4021'] },
    'identity': { share: '28%', trend: '↑ 19%', themes: ['Biometric token resets', 'MFA device detachment loops', 'Cross-agency credential checks'], cases: ['INT-4022'] },
    'benefits': { share: '22%', trend: '↓ 4%', themes: ['Child credit recalculation', 'Disability index indexing', 'Backpayment allocation matrices'], cases: ['INT-4021', 'INT-4022'] },
    'housing-assistance': { share: '34%', trend: '↑ 12%', themes: ['Rental subsidy constraints', 'Housing appeal queue delays', 'Emergency housing allocation'], cases: ['INT-4021'] },
    'identity-verification': { share: '28%', trend: '↑ 19%', themes: ['Biometric token resets', 'MFA device detachment loops', 'Cross-agency credential checks'], cases: ['INT-4022'] },
    'benefits-processing': { share: '22%', trend: '↓ 4%', themes: ['Child credit recalculation', 'Disability index indexing', 'Backpayment allocation matrices'], cases: ['INT-4021', 'INT-4022'] }
  };

  const painPointsSchema: Record<string, { pct: string, rootCause: string, responseAction: string }> = {
    'Housing Assistance': { pct: '34%', rootCause: 'Aggregated systemic caseload constraints matching localized verification server limits during high-demand periods.', responseAction: 'Deploy cross-trained processing nodes recursively to clear active indexing stacks.' },
    'Identity Verification': { pct: '28%', rootCause: 'Timeout drops and MFA re-routing backlogs occurring inside the legacy multi-factor token gateway window.', responseAction: 'Bypass primary automation layer; auto-route mismatch packets to Human-in-the-Loop exception desk.' },
    'Benefits Processing': { pct: '22%', rootCause: 'Caseload queues tracking manual backpayment indexing calculations and cross-department banking settlement delays.', responseAction: 'Force sync real-time clearing tokens manually via secondary secure banking interface layer.' }
  };

  const safePillTone = (rawTone: string | undefined): AllowedPillTone => {
    if (!rawTone) return 'neutral';
    const clean = rawTone.toLowerCase().trim();
    if (['success', 'active', 'ok', 'online', 'verified'].includes(clean)) return 'success';
    if (['warning', 'pending', 'degraded'].includes(clean)) return 'warning';
    if (['info', 'accent', 'neutral'].includes(clean)) return 'info';
    return 'neutral';
  };

  // ── 📊 3. DYNAMIC METRICS OVERRIDES RECONCILIATION ──
  const interactiveMetrics = useMemo(() => {
    return metrics.map((m) => {
      if (!m) return m;
      const labelText = String(text(m.label || m.title || m.name || '')).toLowerCase();
      
      if (labelText.includes('alert') || labelText.includes('חריגות') || labelText.includes('quality')) {
        const remainingAlerts = rawAnomalies.filter(
          (a) => a && a.id && (!anomalyStates[a.id] || anomalyStates[a.id] === 'PENDING')
        ).length;
        return { ...m, label: 'Quality Alerts (Click to Open)', value: remainingAlerts, isCustomAlert: true };
      }

      if (labelText.includes('sentiment') || labelText.includes('סנטימנט') || labelText.includes('recovery')) {
        const totalSentimentSum = rawInteractions.reduce((sum, item) => {
          if (!item) return sum;
          const activeVal = sentimentOverrides[item.id] !== undefined ? sentimentOverrides[item.id] : (item.sentiment || 75);
          return sum + activeVal;
        }, 0);
        const baseAverage = Math.round(totalSentimentSum / (rawInteractions.length || 1));
        const projectedRecoveryRate = Math.min(100, Math.round(baseAverage + (responseTimeSlider * 0.4)));
        return { ...m, label: 'Sentiment Recovery (Click to Tune)', value: projectedRecoveryRate, isCustomRecovery: true }; 
      }

      if (labelText.includes('coverage') || labelText.includes('כיסוי')) {
        return { ...m, value: secureAccess ? 100 : 84 };
      }

      return m;
    });
  }, [metrics, rawAnomalies, anomalyStates, rawInteractions, sentimentOverrides, secureAccess, responseTimeSlider, text]);

  // ── 🎛️ 4. WORKFORCE RESOURCES SCHEDULING ENGINE ──
  const workforceScheduling = useMemo(() => {
    const baseStaff = 42;
    if (forecastMode === 'LOW') return { current: baseStaff, recommended: 24, difference: -18, tone: 'info' as AllowedPillTone, action: 'Reallocate idle staff assets to downstream administrative logs.' };
    if (forecastMode === 'PEAK') return { current: baseStaff, recommended: 55, difference: 13, tone: 'warning' as AllowedPillTone, action: 'Activate on-call tier-2 specialists to stabilize interaction queue limits.' };
    if (forecastMode === 'EMERGENCY') return { current: baseStaff, recommended: 68, difference: 26, tone: 'warning' as AllowedPillTone, action: 'CRITICAL SYSTEM TRAFFIC: Deploy emergency representatives immediately.' };
    return { current: baseStaff, recommended: baseStaff, difference: 0, tone: 'success' as AllowedPillTone, action: 'Standard workforce distribution meets baseline operational performance bounds.' };
  }, [forecastMode]);

  // ── 🔍 5. QUEUE SELECTION PIPELINES ──
  const filteredInteractions = useMemo(() => {
    return rawInteractions.filter((interaction) => {
      if (!interaction) return false;

      if (activeTaxonomyFilter) {
        // ✅ FIX 1: AIRTIGHT TAXONOMY ID NORMALIZATION STRACT (Bypasses casing or string-spacing layout mismatches recursively)
        const normalizedId = activeTaxonomyFilter.toLowerCase().replace(/\s+/g, '-');
        const targetGroupData = taxonomyDrilldownData[activeTaxonomyFilter] || 
                                taxonomyDrilldownData[normalizedId] || 
                                taxonomyDrilldownData[`tax-${normalizedId}`];
                                
        if (targetGroupData && !targetGroupData.cases.includes(interaction.id)) {
          return false;
        }
      }

      const term = deferredQuery.trim().toLowerCase();
      if (!term) return true;

      const idStr = String(interaction.id || '').toLowerCase();
      const citizenStr = String(interaction.citizen || '').toLowerCase();
      const channelStr = String(interaction.channel || '').toLowerCase();
      
      return `${idStr} ${citizenStr} ${channelStr}`.toLowerCase().includes(term);
    });
  }, [rawInteractions, deferredQuery, activeTaxonomyFilter]);

  const selectedInteraction = rawInteractions.find((i) => i && i.id === selectedId) || filteredInteractions[0] || null;

  const activeInteractionData = useMemo(() => {
    if (!selectedInteraction) return null;
    const targetId = selectedInteraction.id;
    const currentSentiment = sentimentOverrides[targetId] !== undefined ? sentimentOverrides[targetId] : (selectedInteraction.sentiment || 75);

    let computedAction = text(selectedInteraction.nextStep);
    if (currentSentiment < 45) {
      computedAction = text(lt("🔴 CRITICAL: Initiate immediate supervisor phone override path.", "🔴 קריטי: יזום מסלול עקיפת מפקח טלפוני מיידי."));
    } else if (currentSentiment > 85) {
      computedAction = text(lt("🟢 OPTIMIZED: Log resolution and send automated satisfaction inquiry.", "🟢 אופטימלי: רשום פתרון ושלח סקר שביעות רצון אוטומטי."));
    }

    return {
      sentiment: currentSentiment,
      category: categoryOverrides[targetId] || text(selectedInteraction.topic),
      transcript: baselineTranscripts[targetId] || "Operational tracking session captured via active processing gateway index. Metrics within standard bounds.",
      recommendation: computedAction
    };
  }, [selectedInteraction, sentimentOverrides, categoryOverrides, text]);

  const activeForecastMetrics = useMemo(() => {
    return rawForecast.map((point) => {
      if (!point) return null;
      let scalingMultiplier = 1.0;
      if (forecastMode === 'LOW') scalingMultiplier = 0.45;
      if (forecastMode === 'PEAK') scalingMultiplier = 1.4;
      if (forecastMode === 'EMERGENCY') scalingMultiplier = 1.85;
      return { ...point, value: Math.min(Math.round((point.value || 0) * scalingMultiplier), 100) };
    });
  }, [rawForecast, forecastMode]);

  const appendAuditMsg = (anomalyId: string, message: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAuditTrails(prev => ({
      ...prev,
      [anomalyId]: [...(prev[anomalyId] || []), { time: timeStr, msg: message }]
    }));
  };

  if (loading || !data) {
    return <LoadingDeck />;
  }

  return (
    <div className="page-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* METRICS CARD GRIDS */}
      <div className="metric-grid">
        {interactiveMetrics.map((metric) => {
          if (!metric || !metric.id) return null;
          const isInteractive = metric.isCustomAlert || metric.isCustomRecovery;
          const isHovered = hoveredMetricId === metric.id;
          
          return (
            <div
              key={metric.id}
              onClick={() => {
                if (metric.isCustomAlert) setActiveTelemetryModal('ALERTS');
                if (metric.isCustomRecovery) setActiveTelemetryModal('RECOVERY');
              }}
              onMouseEnter={() => isInteractive && setHoveredMetricId(metric.id)}
              onMouseLeave={() => isInteractive && setHoveredMetricId(null)}
              style={{ 
                cursor: isInteractive ? 'pointer' : 'default', 
                transition: 'all 0.15s ease-in-out',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHovered ? '0 4px 20px rgba(56,139,253,0.25)' : 'none',
                border: isHovered ? '1px solid #388bfd' : isInteractive ? '1px dashed rgba(56,139,253,0.35)' : '1px solid transparent',
                borderRadius: '8px'
              }}
            >
              <MetricCard metric={metric} />
            </div>
          );
        })}
      </div>

      {/* SERVICE HEALTH EXECUTIVE COMMAND CENTER VIEW */}
      <WindowPanel
        title={lt('AI Operational Insight Center', 'מרכז תובנות תפעוליות של AI')}
        subtitle={lt('High-level automated matrix tracking systemic constraints across active channels.', 'מטריצה אוטומטית ברמת על למעקב אחר מגבלות מערכתיות בערוצים פעילים.')}
        eyebrow={lt('Executive Overview', 'מבט מנהלים')}
        accent="accent"
      >
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            
            <div style={{ flex: 1, minWidth: '180px', background: 'rgba(56,139,253,0.06)', border: '1px solid #388bfd', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#58a6ff', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>📡 Live System Health Score</span>
              <strong style={{ fontSize: '22px', marginTop: '4px', display: 'block', color: '#fff', fontFamily: 'monospace' }}>{systemHealth}%</strong>
            </div>

            {[
              { label: 'Most Common Issue', val: 'Housing Assistance' },
              { label: 'Fastest Growing Topic', val: 'Identity Verification' },
              { label: 'Highest Risk Queue', val: 'Benefits Processing' }
            ].map((insight, idx) => {
              const isCardTargetActive = selectedPainPoint === insight.val;
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedPainPoint(isCardTargetActive ? null : insight.val)}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    cursor: 'pointer',
                    background: isCardTargetActive ? 'rgba(248,81,73,0.08)' : 'rgba(255,255,255,0.01)',
                    border: isCardTargetActive ? '1px solid #f85149' : '1px solid rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (!isCardTargetActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { if (!isCardTargetActive) e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                >
                  <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', display: 'block' }}>{insight.label}</span>
                  <strong style={{ fontSize: '14px', marginTop: '4px', display: 'block', color: isCardTargetActive ? '#f85149' : '#f0f6fc' }}>
                    {insight.val} {isCardTargetActive ? '🎯' : ''}
                  </strong>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setActiveTelemetryModal('EXPORT')}
            style={{ padding: '10px 20px', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📥 Export System Report
          </button>
        </div>

        {/* ── 💡 FIX 2: IMMEDATE INLINE EXPLANATION DRAWER FOR THE EXECUTIVE OVERVIEW CARDS ── */}
        {selectedPainPoint && painPointsSchema[selectedPainPoint] && (
          <div style={{ marginTop: '16px', padding: '14px', border: '1px solid #f85149', borderRadius: '8px', background: 'rgba(248,81,73,0.08)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#f85149', fontSize: '14px' }}>🔍 Root Cause Intelligence Scope: {selectedPainPoint}</strong>
              <button type="button" onClick={() => setSelectedPainPoint(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.4' }}>
              <span style={{ color: '#8b949e', fontWeight: 'bold', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Detected Bottleneck:</span>
              {painPointsSchema[selectedPainPoint].rootCause}
            </p>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
              <span style={{ color: '#3fb950', fontWeight: 'bold', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Remediation Orchestration:</span>
              {painPointsSchema[selectedPainPoint].responseAction}
            </p>
          </div>
        )}

        {/* CONFIDENCE CARDS BAR LAYER */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          {[
            { label: 'Classification Confidence', score: '93%' },
            { label: 'Sentiment Confidence', score: '89%' },
            { label: 'Anomaly Radar Confidence', score: '96%' }
          ].map((conf, i) => {
            const isConfFocused = selectedConfidence === conf.label;
            return (
              <div 
                key={i} 
                onClick={() => setSelectedConfidence(isConfFocused ? null : conf.label)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '12px', 
                  color: isConfFocused ? '#fff' : '#8b949e', 
                  background: isConfFocused ? 'rgba(56,139,253,0.15)' : 'rgba(0,0,0,0.15)', 
                  border: isConfFocused ? '1px solid #388bfd' : '1px solid transparent',
                  padding: '4px 10px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{conf.label}:</span>
                <strong style={{ color: isConfFocused ? '#58a6ff' : '#3fb950', fontFamily: 'monospace' }}>{conf.score}</strong>
              </div>
            );
          })}
        </div>

        {/* ── 💡 FIX 3: INTERACTIVE EXPANSION COMPONENT BLOCK FOR THE CONFIDENCE ENGINE BADGES ── */}
        {selectedConfidence && (
          <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #388bfd', borderRadius: '6px', background: 'rgba(56,139,253,0.03)', animation: 'fadeIn 0.15s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ color: '#58a6ff', fontSize: '13px' }}>🤖 AI Confidence Calibration Metric: {selectedConfidence}</strong>
              <button type="button" onClick={() => setSelectedConfidence(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '11px' }}>×</button>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', lineHeight: '1.4' }}>
              This validation indexing rating verifies mathematical reliability metrics generated against current localized parsing templates. High telemetry signal consistency preserves strict model boundaries.
            </p>
          </div>
        )}
      </WindowPanel>

      <div className="page-grid page-grid--operations">
        
        {/* INTERACTION QUEUE TIMELINE QUEUE */}
        <WindowPanel
          className="page-grid__span-2"
          title={lt('Interaction monitor', 'מוניטור אינטראקציות')}
          subtitle={lt('Search, review, and route active interactions across channels.', 'חיפוש, סקירה וניתוב אינטראקציות פעילות בין ערוצים.')}
          eyebrow={lt('Live Queue', 'תור חי')}
          accent="accent"
        >
          <div className="toolbar-row" style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <input
              className="glass-input"
              type="search"
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                startTransition(() => setQuery(next));
              }}
              placeholder={text(lt('Search by ID, citizen, or tracking variables...', 'חפש לפי מזהה, אזרח או משתני מעקב...'))}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'inherit' }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>Automation Coverage Mode</span>
              <button
                type="button"
                onClick={() => setSecureAccess(!secureAccess)}
                style={{ background: secureAccess ? '#238636' : '#21262d', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {secureAccess ? 'ACTIVE (100% Coverage)' : 'OFFLINE (Standard)'}
              </button>
            </div>

            {activeTaxonomyFilter && (
              <button 
                type="button"
                onClick={() => setActiveTaxonomyFilter(null)}
                style={{ padding: '6px 12px', background: 'rgba(248,81,73,0.15)', color: '#f85149', border: '1px solid #f85149', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Drill Down Filter Active ×
              </button>
            )}
          </div>

          <div className="record-list">
            {filteredInteractions.map((interaction) => {
              if (!interaction || !interaction.id) return null;
              
              const isActive = interaction.id === selectedInteraction?.id;
              const cardSentiment = sentimentOverrides[interaction.id] !== undefined ? sentimentOverrides[interaction.id] : interaction.sentiment;
              const cardTopic = categoryOverrides[interaction.id] || text(interaction.topic);

              return (
                <button
                  key={interaction.id}
                  type="button"
                  className={['record-row', isActive ? 'record-row--active' : ''].join(' ')}
                  onClick={() => setSelectedId(interaction.id)}
                  style={{ 
                    textDecoration: 'none', 
                    textAlign: 'left', 
                    width: '100%',
                    cursor: 'pointer',
                    transform: isActive ? 'translateX(6px)' : 'none',
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? '3px solid #388bfd' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(56,139,253,0.08)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = ''; }}
                >
                  <div className="record-row__top">
                    <strong>{interaction.id}</strong>
                    <StatusPill tone={cardSentiment > 70 ? 'success' : cardSentiment > 45 ? 'info' : 'warning'} label={`${cardSentiment}% Sentiment`} />
                  </div>
                  <strong className="record-row__title" style={{ display: 'block', margin: '4px 0' }}>{cardTopic}</strong>
                  <p>{text(interaction.summary)}</p>
                </button>
              );
            })}
          </div>
        </WindowPanel>

        {/* WORKSPACE DETAILED INTENT VIEWER AREA */}
        <WindowPanel
          title={lt('Selected interaction', 'אינטראקציה נבחרת')}
          subtitle={lt('The detail window handles real-time text parsing engines.', 'חלון הפרטים מטפל במנועי ניתוח טקסט בזמן אמת.')}
          eyebrow={lt('Detail Surface', 'משטח פרטים')}
          accent={safePillTone(selectedInteraction?.status)}
          summary={<p>{selectedInteraction?.id || 'No Selection'}</p>}
        >
          {selectedInteraction && activeInteractionData ? (
            <div className="detail-card">
              <div className="detail-card__hero">
                <div>
                  <span className="eyebrow">{selectedInteraction.citizen}</span>
                  <h3>{activeInteractionData.category}</h3>
                </div>
                <StatusPill tone={safePillTone(selectedInteraction.status)} label={`${activeInteractionData.sentiment}%`} />
              </div>

              <div className="detail-stat" style={{ marginBottom: '16px', marginTop: '12px' }}>
                <div className="detail-stat__topline">
                  <span>{text(lt('Sentiment recovery tracking index', 'מדד מעקב אחר התאוששות סנטימנט'))}</span>
                  <strong>{activeInteractionData.sentiment}%</strong>
                </div>
                <div className="progress-bar progress-bar--wide">
                  <span style={{ width: `${activeInteractionData.sentiment}%`, backgroundColor: activeInteractionData.sentiment > 70 ? '#3fb950' : '#388bfd', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <button type="button" onClick={() => setSentimentOverrides(p => ({ ...p, [selectedInteraction.id]: 95 }))} style={{ flex: 1, padding: '6px 0', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(63,185,80,0.1)', border: '1px solid #3fb950', color: '#3fb950', borderRadius: '4px' }}>Simulate Positive</button>
                <button type="button" onClick={() => setSentimentOverrides(p => ({ ...p, [selectedInteraction.id]: 20 }))} style={{ flex: 1, padding: '6px 0', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', color: '#f85149', borderRadius: '4px' }}>Simulate Distress</button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '11px', color: '#58a6ff', textTransform: 'uppercase' }}>{text(lt('Searchable Transcript Engine', 'מנוע תמלול אוטומטי בר חיפוש'))}</strong>
                  <input
                    type="text"
                    value={transcriptQuery}
                    onChange={(e) => setTranscriptQuery(e.target.value)}
                    placeholder="Type words..."
                    style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'inherit', width: '120px', outline: 'none' }}
                  />
                </div>
                <div style={{ maxHeight: '75px', overflowY: 'auto', fontSize: '12px', color: '#8b949e', fontStyle: 'italic', lineHeight: '1.4' }}>
                  {(() => {
                    const term = transcriptQuery.trim();
                    if (!term) return activeInteractionData.transcript;
                    try {
                      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      return activeInteractionData.transcript.split(new RegExp(`(${escapedTerm})`, 'gi')).map((p, i) => 
                        p.toLowerCase() === term.toLowerCase() ? <mark key={i} style={{ background: '#f3e151', color: '#000', borderRadius: '2px', padding: '0 2px' }}>{p}</mark> : p
                      );
                    } catch {
                      return activeInteractionData.transcript;
                    }
                  })()}
                </div>
              </div>

              <dl className="property-grid">
                <div><dt>Channel</dt><dd>{selectedInteraction.channel}</dd></div>
                <div><dt>Queue time</dt><dd>{selectedInteraction.queueTime}</dd></div>
                <div><dt>Next step</dt><dd style={{ color: '#58a6ff', fontWeight: 'bold' }}>{activeInteractionData.recommendation}</dd></div>
              </dl>
            </div>
          ) : (
            <div style={{ padding: '4px', textAlign: 'center', color: '#8b949e', fontStyle: 'italic' }}>No selection active.</div>
          )}
        </WindowPanel>

        {/* QUALITY ALERTS ANOMALY RADAR */}
        <WindowPanel title={lt('Anomaly radar', 'מכ״ם חריגות')} subtitle={lt('High-signal deviations captured by semantic monitoring tokens.', 'חריגות בעלות אות גבוה שנלכדו על ידי אסימוני ניטור סמנטיים.')} eyebrow={lt('Quality Control', 'בקרת איכות')} accent="warning">
          <div className="stack-list">
            {rawAnomalies.map((anomaly) => {
              if (!anomaly || !anomaly.id) return null;
              const localState = anomalyStates[anomaly.id] || 'PENDING';
              const specificHistory = auditTrails[anomaly.id] || [];

              return (
                <article key={anomaly.id} className="signal-row" style={{ opacity: localState !== 'PENDING' ? 0.6 : 1, background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '8px' }}>
                  <div>
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{text(anomaly.title)}</strong>
                      <StatusPill tone={localState === 'ACKNOWLEDGED' ? 'success' : localState === 'ESCALATED' ? 'warning' : 'neutral'} label={localState !== 'PENDING' ? localState : anomaly.source} />
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '12px', color: '#8b949e' }}>{text(anomaly.summary)}</p>
                    
                    {specificHistory.length > 0 && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', margin: '8px 0', fontSize: '11px', borderLeft: '2px solid #58a6ff' }}>
                        <span style={{ color: '#8b949e', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold', display: 'block' }}>Compliance Audit Trail</span>
                        {specificHistory.map((h, i) => (
                          <div key={i} style={{ color: '#c9d1d9', marginTop: '2px' }}>
                            <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>[{h.time}]</span> {h.msg}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => { setSelectedAnomalyContext(anomaly); setActiveTelemetryModal('EXPLAIN_ANOMALY'); }} 
                        style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', border: '1px solid rgba(88,166,255,0.3)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        🔍 Explain Detection
                      </button>

                      {localState === 'PENDING' && (
                        <>
                          <button type="button" onClick={() => { setAnomalyStates(p => ({ ...p, [anomaly.id]: 'ACKNOWLEDGED' })); appendAuditMsg(anomaly.id, 'Acknowledged by Platform Supervisor'); }} style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(63,185,80,0.1)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.2)', borderRadius: '4px', cursor: 'pointer' }}>Acknowledge</button>
                          <button type="button" onClick={() => { setAnomalyStates(p => ({ ...p, [anomaly.id]: 'ESCALATED' })); appendAuditMsg(anomaly.id, 'Escalated packet up to Tier-2 Operations Desk'); }} style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)', borderRadius: '4px', cursor: 'pointer' }}>Escalate</button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </WindowPanel>

        {/* DEMAND FORECAST RESOURCING ENGINE */}
        <WindowPanel title={lt('Demand forecast', 'תחזית ביקוש')} subtitle={lt('Planning workforce bands cross-analyzed against forecasting inputs.', 'רצועות תכנון כוח אדם בניתוח הצלב מול תשומות החיזוי.')} eyebrow={lt('Staffing Insights', 'תובנות כוח אדם')} accent="info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '6px' }}>
              {(['NORMAL', 'LOW', 'PEAK', 'EMERGENCY'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForecastMode(mode)}
                  style={{ flex: 1, padding: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', background: forecastMode === mode ? '#388bfd' : 'transparent', border: 'none', color: forecastMode === mode ? '#fff' : '#8b949e' }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#58a6ff', fontWeight: 'bold', display: 'block' }}>🤖 Suggested Staffing Actions</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>Active Staff: <strong>{workforceScheduling.current}</strong></span>
                <span style={{ fontSize: '12px' }}>Recommended: <strong style={{ color: '#58a6ff' }}>{workforceScheduling.recommended}</strong></span>
                <StatusPill tone={workforceScheduling.tone} label={workforceScheduling.difference === 0 ? 'OPTIMIZED' : `${workforceScheduling.difference > 0 ? '+' : ''}${workforceScheduling.difference} Reps`} />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8b949e', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                {workforceScheduling.action}
              </p>
            </div>

            <div className="forecast-chart">
              {activeForecastMetrics.map((point) => (
                point && point.label ? (
                  <div key={point.label} className="forecast-chart__bar">
                    <div className="forecast-chart__track">
                      <span style={{ height: `${point.value}%`, background: forecastMode === 'EMERGENCY' ? '#f85149' : '#388bfd', transition: 'height 0.3s ease' }} />
                    </div>
                    <strong>{point.label}</strong>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </WindowPanel>

        {/* INQUIRY TAXONOMY DRILL-DOWNS */}
        <WindowPanel title={lt('Inquiry taxonomy', 'טקסונומיית פניות')} subtitle={lt('Click any category card block to drill into systemic tracking themes.', 'לחץ על קטגוריית כרטיס כלשהי כדי לקדוח לנושאים מערכתיים.')} eyebrow={lt('Classification Mix', 'תמהיל סיווג')} accent="success">
          <div className="stack-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {taxonomy.map((bucket) => {
              if (!bucket || !bucket.id) return null;
              
              const rawLabel = String(text(bucket.label));
              const isSelected = activeTaxonomyFilter === bucket.id;
              
              // ✅ FIXED: Normalized path lookup handles whatever ID shape your pipeline throws at it
              const normalizedId = bucket.id.toLowerCase().replace(/\s+/g, '-');
              const drilldown = taxonomyDrilldownData[bucket.id] || 
                                taxonomyDrilldownData[normalizedId] || 
                                taxonomyDrilldownData[`tax-${normalizedId}`];

              return (
                <div 
                  key={bucket.id} 
                  onClick={() => setActiveTaxonomyFilter(isSelected ? null : bucket.id)}
                  className="progress-card progress-card--tight" 
                  style={{ border: isSelected ? '1px solid #238636' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(35,134,54,0.1)' : 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                >
                  <div className="progress-card__header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: isSelected ? '#3fb950' : 'inherit', fontSize: '13px' }}>{rawLabel} {isSelected ? ' 🎯' : ''}</strong>
                    <span className="progress-card__value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{bucket.share}%</span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${bucket.share}%`, backgroundColor: isSelected ? '#3fb950' : '#238636', display: 'block', height: '6px', borderRadius: '3px' }} />
                  </div>

                  {isSelected && drilldown && (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px', fontSize: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e', marginBottom: '6px' }}>
                        <span>Volume: <strong>{drilldown.share}</strong></span>
                        <span style={{ color: '#3fb950', fontWeight: 'bold' }}>{drilldown.trend} Trend</span>
                      </div>
                      <span style={{ display: 'block', color: '#58a6ff', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Underlying Themes:</span>
                      <ul style={{ paddingLeft: '14px', margin: '0 0 10px 0', color: '#c9d1d9', lineHeight: '1.4' }}>
                        {drilldown.themes.map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {drilldown.cases.map((caseId) => (
                          <button key={caseId} type="button" onClick={() => setSelectedId(caseId)} style={{ background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>📁 {caseId} Focus</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </WindowPanel>

        {/* AGENT TELETREMY OPERATIONAL PANELS */}
        <InteractiveCard onClick={() => setActiveTelemetryModal('AGENTS')}>
          <WindowPanel title={lt('Agent telemetry overview', 'סקירת טלמטריית סוכנים')} subtitle={lt('Operational metrics evaluating agent compliance targets. Click to explore.', 'מדדים המעריכים יעדי תאימות של סוכנים. לחץ לחקירה.')} eyebrow={lt('Workforce Monitoring', 'ניטור כוח אדם')} accent="neutral">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              {[
                { label: 'Top Performing Asset', val: 'Agent-4019 (96% CSAT)' },
                { label: 'Avg Resolution Time', val: '4.2 Minutes' },
                { label: 'Escalation Rate Index', val: '2.4% System Wide' }
              ].map((agentMetric, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#8b949e' }}>{agentMetric.label}</span>
                  <strong style={{ color: '#58a6ff' }}>{agentMetric.val} →</strong>
                </div>
              ))}
            </div>
          </WindowPanel>
        </InteractiveCard>

        {/* CITIZEN SENTIMENT PAIN POINT INTELLIGENCE LAYER */}
        <WindowPanel
          className="page-grid__span-2"
          title={lt('Citizen Pain Point Intelligence Studio', 'סטודיו לניתוח נקודות כאב של אזרחים')}
          subtitle={lt('PRD Compliance Node: Uncovers underlying systemic bottlenecks and localized root cause vectors.', 'רכיב תאימות PRD: חושף צווארי בקבוק מערכתיים ומניעי שורש מקומיים.')}
          eyebrow={lt('Systemic Issue Extractor', 'מחלץ בעיות מערכתיות')}
          accent="danger"
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(painPointsSchema).map(([name, schema]) => {
                const isSelected = selectedPainPoint === name;
                return (
                  <div
                    key={name}
                    onClick={() => setSelectedPainPoint(isSelected ? null : name)}
                    style={{ background: isSelected ? 'rgba(248,81,73,0.08)' : 'rgba(255,255,255,0.01)', border: isSelected ? '1px solid #f85149' : '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ fontSize: '13px', color: isSelected ? '#f85149' : 'inherit', fontWeight: isSelected ? 'bold' : 'normal' }}>⚡ {name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8b949e' }}>{schema.pct}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1.2, minWidth: '300px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {selectedPainPoint ? (
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#f85149', fontWeight: 'bold', display: 'block' }}>🔍 Root Cause:</span>
                  <p style={{ margin: '6px 0 12px 0', fontSize: '13px', color: '#c9d1d9', fontStyle: 'italic' }}>"{painPointsSchema[selectedPainPoint].rootCause}"</p>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#3fb950', fontWeight: 'bold', display: 'block' }}>🛡️ Remediation Action:</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' }}>{painPointsSchema[selectedPainPoint].responseAction}</p>
                </div>
              ) : (
                <p style={{ margin: 0, textAlign: 'center', color: '#8b949e', fontStyle: 'italic', fontSize: '13px' }}>Select an AI citizen pain point key to trigger root cause isolation matrices.</p>
              )}
            </div>
          </div>
        </WindowPanel>

        {/* REAL-TIME TICK FEED HEARTBEAT */}
        <WindowPanel title={lt('Live activity event log stream', 'זרם יומן אירועים פעיל')} subtitle={lt('System actions logging sequentially. Click any row to query active systemic metrics.', 'פעולות מערכת נרשמות באופן סדרתי.')} eyebrow={lt('System Heartbeat', 'דופק מערכת')} accent="info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {liveActivityFeed.map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => setSelectedPainPoint('Identity Verification')}
                style={{ fontSize: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#388bfd'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#58a6ff', fontWeight: 'bold' }}>[{activity.time}]</span>
                  <StatusPill tone={activity.tone} label="LIVE LOG" />
                </div>
                <span style={{ color: '#c9d1d9' }}>{activity.feedMsg}</span>
              </div>
            ))}
          </div>
        </WindowPanel>

      </div>

      {/* MODAL WINDOW PLATFORM OVERLAYS */}
      {activeTelemetryModal && (
        <>
          <div 
            onClick={() => setActiveTelemetryModal(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)', zIndex: 9998, animation: 'fadeIn 0.15s' }}
          />

          <div style={{ position: 'fixed', right: '24px', top: '24px', width: '360px', background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.65)', zIndex: 9999, color: '#c9d1d9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#58a6ff', textTransform: 'uppercase' }}>
                {activeTelemetryModal === 'ALERTS' && '⚠️ Active Quality Alerts'}
                {activeTelemetryModal === 'RECOVERY' && '📊 Sentiment Recovery Tuner'}
                {activeTelemetryModal === 'EXPLAIN_ANOMALY' && '🤖 Explainable AI Audit Trail'}
                {activeTelemetryModal === 'EXPORT' && '📥 Executive Export Engine'}
                {activeTelemetryModal === 'AGENTS' && '👥 Agent Performance Analytics'}
              </strong>
              <button type="button" onClick={() => setActiveTelemetryModal(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>×</button>
            </div>

            {activeTelemetryModal === 'ALERTS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'INT-4021', title: 'Script Deviation Packets', severity: 'warning' as AllowedPillTone },
                  { id: 'INT-4022', title: 'Escalation Delay Gateway Timeout', severity: 'warning' as AllowedPillTone }
                ].map((alertItem) => (
                  <div key={alertItem.id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong>{alertItem.id}</strong>
                      <StatusPill tone={alertItem.severity} label={alertItem.severity.toUpperCase()} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '8px' }}>{alertItem.title}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => { 
                          const exists = rawInteractions.some(i => i && i.id === alertItem.id);
                          if (exists) {
                            setSelectedId(alertItem.id);
                            setActiveTelemetryModal(null);
                          }
                        }} 
                        style={{ flex: 1, padding: '4px 0', fontSize: '11px', background: '#21262d', border: '1px solid #30363d', color: '#58a6ff', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        View Transcript
                      </button>
                      <button type="button" onClick={() => alert(`Supervisor assigned to ${alertItem.id}`)} style={{ flex: 1, padding: '4px 0', fontSize: '11px', background: '#21262d', border: '1px solid #30363d', color: '#3fb950', cursor: 'pointer', fontWeight: 'bold' }}>Assign Supervisor</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTelemetryModal === 'RECOVERY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Positive Interactions:</span><strong style={{ color: '#3fb950' }}>78%</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Neutral Distribution:</span><strong style={{ color: '#388bfd' }}>15%</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Negative Spike Matrix:</span><strong style={{ color: '#f85149' }}>7%</strong></div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Response Time Reduction:</span>
                    <strong style={{ color: '#58a6ff' }}>{responseTimeSlider}% Faster</strong>
                  </div>
                  <input type="range" min="0" max="50" value={responseTimeSlider} onChange={(e) => setResponseTimeSlider(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#388bfd' }} />
                  
                  <div style={{ marginTop: '12px', background: 'rgba(56,139,253,0.1)', border: '1px solid #388bfd', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8b949e', display: 'block' }}>Projected Recovery Rate</span>
                    <strong style={{ fontSize: '20px', fontFamily: 'monospace' }}>{Math.min(100, 76 + Math.round(responseTimeSlider * 0.4))}%</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTelemetryModal === 'EXPLAIN_ANOMALY' && selectedAnomalyContext && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div><span>Target Identifier:</span><strong> {selectedAnomalyContext.title}</strong></div>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '11px', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>🤖 Reason:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace' }}>
                    <div>· Trigger: <span style={{ color: '#f85149' }}>Negative sentiment patterns detected across transcript lines.</span></div>
                    <div>· Compliance Score: <span style={{ color: '#d29922' }}>61% Verification Variance</span></div>
                    <div>· Script Deviations: <span style={{ color: '#f85149' }}>4 specific occurrences flagged</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTelemetryModal === 'EXPORT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { title: '📄 Comprehensive Analysis PDF', desc: 'Full transcript records, sentiment trends, and anomaly audits.' },
                  { title: '📊 Executive Summary Briefing', desc: 'Aggregated classification metrics and staffing forecast indices.' },
                  { title: '🚨 Quality Incident File Package', desc: 'Strict human-in-the-loop exception logs and escalation traces.' }
                ].map((report, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      setLiveActivityFeed(prev => [
                        { id: Math.random().toString(), time: timeStr, feedMsg: `SUCCESS: Executive ledger report compiled for [${report.title.split(' ')[1]} format]`, tone: 'success' },
                        ...prev
                      ]);
                      setActiveTelemetryModal(null);
                    }}
                    style={{ textAlign: 'left', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}
                  >
                    <strong style={{ color: '#58a6ff', fontSize: '13px' }}>{report.title}</strong>
                    <span style={{ color: '#8b949e', fontSize: '11px' }}>{report.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTelemetryModal === 'AGENTS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <p style={{ margin: 0, color: '#8b949e' }}>Real-time supervisor performance metrics for active operational queues:</p>
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>🎯 <strong>Agent-4019:</strong> <span style={{ color: '#3fb950' }}>96% Customer Satisfaction (CSAT)</span></div>
                  <div>⏱️ <strong>Average Processing Resolution:</strong> <span style={{ color: '#58a6ff' }}>4.2 Minutes per interaction</span></div>
                  <div>🛡️ <strong>Escalation Threshold Deviation:</strong> <span style={{ color: '#d29922' }}>2.4% System Wide Average</span></div>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setLiveActivityFeed(prev => [
                      { id: Math.random().toString(), time: timeStr, feedMsg: 'SYSTEM ALERT: Workforce optimization script executed manually across agent assets', tone: 'success' },
                      ...prev
                    ]);
                    setActiveTelemetryModal(null);
                  }}
                  style={{ width: '100%', padding: '10px', background: '#388bfd', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ⚙️ Optimize Staff Allocation Matrix
                </button>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}