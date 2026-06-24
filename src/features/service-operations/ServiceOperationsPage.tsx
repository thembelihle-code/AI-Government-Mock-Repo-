import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { demoAdapter } from '../../api/adapters/demoAdapter';
import { lt } from '../../api/contracts';
import { LoadingDeck } from '../../components/common/LoadingDeck';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusPill } from '../../components/common/StatusPill';
import { WindowPanel } from '../../components/common/WindowPanel';
import { useMockResource } from '../../hooks/useMockResource';
import { useI18n } from '../../i18n/I18nProvider';

export function ServiceOperationsPage() {
  const { data, loading } = useMockResource(demoAdapter.getServiceOperationsSnapshot);
  const { text } = useI18n();

  // ── ALL STATE HOOKS INITIALIZED TOGETHER AT THE ABSOLUTE TOP ──
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('INT-4021');
  const [transcriptQuery, setTranscriptQuery] = useState('');
  
  // Interactive Simulator States
  const [secureAccess, setSecureAccess] = useState(true);
  const [anomalyStates, setAnomalyStates] = useState<Record<string, 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED'>>({});
  const [sentimentOverrides, setSentimentOverrides] = useState<Record<string, number>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [forecastMode, setForecastMode] = useState<'NORMAL' | 'LOW' | 'PEAK' | 'EMERGENCY'>('NORMAL');
  const [activeTaxonomyFilter, setActiveTaxonomyFilter] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  // ── SAFE TYPE CASTING DEFAULTS (Defends against broken data contracts) ──
  const rawInteractions = data && Array.isArray(data.interactions) ? data.interactions : [];
  const metrics = data && Array.isArray(data.metrics) ? data.metrics : [];
  const rawAnomalies = data && Array.isArray(data.anomalies) ? data.anomalies : [];
  const rawForecast = data && Array.isArray(data.forecast) ? data.forecast : [];
  const taxonomy = data && Array.isArray(data.taxonomy) ? data.taxonomy : [];

  const baselineTranscripts: Record<string, string> = {
    'INT-4021': "Citizen requested immediate confirmation regarding housing benefit options and verification timeline tracking variables. Agent maintained direct accuracy parameters.",
    'INT-4022': "Inquiry logged via mobile portal interface requesting digital ID token reset procedures. System flagged potential authentication mismatch path, routing to supervisor.",
  };

  // ── 📊 FIX 1 & 3: HARDENED TOP METRICS CALCULATIONS (Pure Numeric Outputs) ──
  const interactiveMetrics = useMemo(() => {
    return metrics.map((m) => {
      if (!m) return m;
      const labelText = String(text(m.label || m.title || '')).toLowerCase();
      
      // Fix 3: Added double-layered null verification for 'a' and 'a.id'
      if (labelText.includes('alert') || labelText.includes('חריגות') || labelText.includes('quality')) {
        const remainingAlerts = rawAnomalies.filter(
          (a) => a && a.id && (!anomalyStates[a.id] || anomalyStates[a.id] === 'PENDING')
        ).length;
        return { ...m, value: remainingAlerts };
      }

      // Fix 1: Returns raw integers to prevent string coercion rendering crashes
      if (labelText.includes('sentiment') || labelText.includes('סנטימנט') || labelText.includes('recovery')) {
        const totalSentimentSum = rawInteractions.reduce((sum, item) => {
          if (!item) return sum;
          const activeVal = sentimentOverrides[item.id] !== undefined ? sentimentOverrides[item.id] : (item.sentiment || 75);
          return sum + activeVal;
        }, 0);
        const liveAverage = Math.min(100, Math.round(totalSentimentSum / (rawInteractions.length || 1)));
        return { ...m, value: liveAverage }; 
      }

      // Fix 1: Returns pure numbers instead of explicit hardcoded percentage strings
      if (labelText.includes('coverage') || labelText.includes('כיסוי')) {
        return { ...m, value: secureAccess ? 100 : 84 };
      }

      return m;
    });
  }, [metrics, rawAnomalies, anomalyStates, rawInteractions, sentimentOverrides, secureAccess, text]);

  // ── 🧠 FIX 2: MULTI-DIRECTIONAL SEMANTIC ROUTING ENGINE ──
  const filteredInteractions = useMemo(() => {
    return rawInteractions.filter((interaction) => {
      if (!interaction) return false;

      // Fix 2: Replaced token splitting with safe substring cross-checks
      if (activeTaxonomyFilter) {
        const liveTopic = (categoryOverrides[interaction.id] || text(interaction.topic) || '').toLowerCase();
        const activeFilterClean = activeTaxonomyFilter.toLowerCase();
        
        // Checks if either string satisfies containing criteria to catch multi-lingual wording variations
        const isMatch = liveTopic.includes(activeFilterClean) || activeFilterClean.includes(liveTopic);
        if (!isMatch) return false;
      }

      const term = deferredQuery.trim().toLowerCase();
      if (!term) return true;

      const idStr = String(interaction.id || '').toLowerCase();
      const citizenStr = String(interaction.citizen || '').toLowerCase();
      const channelStr = String(interaction.channel || '').toLowerCase();
      const topicEn = interaction.topic && typeof interaction.topic === 'object' ? String(interaction.topic.en || '') : '';
      const topicHe = interaction.topic && typeof interaction.topic === 'object' ? String(interaction.topic.he || '') : '';

      return `${idStr} ${citizenStr} ${channelStr} ${topicEn} ${topicHe}`.toLowerCase().includes(term);
    });
  }, [rawInteractions, deferredQuery, activeTaxonomyFilter, categoryOverrides, text]);

  // ── SAFE SELECTION RESOLUTION ──
  const selectedInteraction = filteredInteractions.find((i) => i && i.id === selectedId) || filteredInteractions[0] || null;

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

  // ── HOOK SECURITY RENDER GATEWAY ──
  if (loading || !data || !selectedInteraction || !activeInteractionData) {
    return <LoadingDeck />;
  }

  return (
    <div className="page-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* METRICS */}
      <div className="metric-grid">
        {interactiveMetrics.map((metric) => (
          metric && metric.id ? <MetricCard key={metric.id} metric={metric} /> : null
        ))}
      </div>

      <div className="page-grid page-grid--operations">
        
        {/* INTERACTION MONITOR (Original layout preserved with dynamic list updates) */}
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
              placeholder={text(lt('Search by interaction, citizen, or topic', 'חפש לפי אינטראקציה, אזרח או נושא'))}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'inherit' }}
            />
            
            {/* GATEKEEPER AUTOMATION CONTROLLER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>24/7 Automation Mode</span>
              <button
                type="button"
                onClick={() => setSecureAccess(!secureAccess)}
                style={{
                  background: secureAccess ? '#238636' : '#21262d',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {secureAccess ? 'ACTIVE (100% Coverage)' : 'OFFLINE (Standard)'}
              </button>
            </div>

            {activeTaxonomyFilter && (
              <button 
                type="button"
                onClick={() => setActiveTaxonomyFilter(null)}
                style={{ padding: '6px 12px', background: 'rgba(56,139,253,0.15)', color: '#388bfd', border: '1px solid #388bfd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                Filter: {activeTaxonomyFilter} ×
              </button>
            )}
          </div>

          {/* RENDER QUEUE LIST TRACKER */}
          <div className="record-list">
            {filteredInteractions.map((interaction) => {
              if (!interaction || !interaction.id) return null;
              const isActive = interaction.id === selectedInteraction.id;
              
              const cardSentiment = sentimentOverrides[interaction.id] !== undefined ? sentimentOverrides[interaction.id] : interaction.sentiment;
              const cardTopic = categoryOverrides[interaction.id] || text(interaction.topic);

              return (
                <button
                  key={interaction.id}
                  type="button"
                  className={['record-row', isActive ? 'record-row--active' : ''].join(' ')}
                  onClick={() => setSelectedId(interaction.id)}
                >
                  <div className="record-row__top">
                    <strong>{interaction.id}</strong>
                    {/* 🎯 REFINED LIVE OPERATION DASHBOARD PILL (Reacts colorfully to custom tweaks) */}
                    <StatusPill 
                      tone={cardSentiment > 70 ? 'success' : cardSentiment > 45 ? 'info' : 'warning'} 
                      label={`${cardSentiment}% Sentiment`} 
                    />
                  </div>
                  <strong className="record-row__title">{cardTopic}</strong>
                  <p>{text(interaction.summary)}</p>
                  
                  <div className="tag-row">
                    {Array.isArray(interaction.flags) && interaction.flags.map((flag) => (
                      <span key={flag} className="tag-chip">
                        {flag}
                      </span>
                    ))}
                    <span className="tag-chip tag-chip--muted">{interaction.channel}</span>
                    <span className="tag-chip tag-chip--muted">{interaction.queueTime}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </WindowPanel>

        {/* WORKSPACE AREA */}
        <WindowPanel
          title={lt('Selected interaction', 'אינטראקציה נבחרת')}
          subtitle={lt('The detail window is intentionally resizable, collapsible, and expandable.', 'חלון הפרטים בכוונה ניתן לשינוי גודל, כיווץ והרחבה.')}
          eyebrow={lt('Detail Surface', 'משטח פרטים')}
          accent={selectedInteraction.status}
          summary={<p>{selectedInteraction.id}</p>}
        >
          <div className="detail-card">
            <div className="detail-card__hero">
              <div>
                <span className="eyebrow">{selectedInteraction.citizen}</span>
                <h3>{activeInteractionData.category}</h3>
              </div>
              <StatusPill tone={selectedInteraction.status} label={`${activeInteractionData.sentiment}%`} />
            </div>
            <p>{text(selectedInteraction.summary)}</p>

            <div className="detail-stat" style={{ marginBottom: '16px' }}>
              <div className="detail-stat__topline">
                <span>{text(lt('Sentiment recovery potential', 'פוטנציאל התאוששות סנטימנט'))}</span>
                <strong>{activeInteractionData.sentiment}%</strong>
              </div>
              <div className="progress-bar progress-bar--wide">
                <span style={{ width: `${activeInteractionData.sentiment}%`, backgroundColor: activeInteractionData.sentiment > 70 ? '#3fb950' : '#388bfd' }} />
              </div>
            </div>

            {/* LIVE SIMULATOR SWITCHES */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setSentimentOverrides(p => ({ ...p, [selectedInteraction.id]: 95 }))} style={{ flex: 1, padding: '4px 0', fontSize: '11px', cursor: 'pointer', background: 'rgba(63,185,80,0.1)', border: '1px solid #3fb950', color: '#3fb950', borderRadius: '4px' }}>Simulate Positive</button>
              <button type="button" onClick={() => setSentimentOverrides(p => ({ ...p, [selectedInteraction.id]: 20 }))} style={{ flex: 1, padding: '4px 0', fontSize: '11px', cursor: 'pointer', background: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', color: '#f85149', borderRadius: '4px' }}>Simulate Distress</button>
            </div>

            {/* SEARCHABLE TRANSCRIPT BOX */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '11px', color: '#58a6ff', textTransform: 'uppercase' }}>{text(lt('Searchable Transcript Engine', 'מנוע תמלול אוטומטי בר חיפוש'))}</strong>
                <input
                  type="text"
                  value={transcriptQuery}
                  onChange={(e) => setTranscriptQuery(e.target.value)}
                  placeholder="🔍 Search words..."
                  style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'inherit', width: '110px', outline: 'none' }}
                />
              </div>
              <div style={{ maxHeight: '75px', overflowY: 'auto', fontSize: '12px', color: '#8b949e', fontStyle: 'italic', lineHeight: '1.4' }}>
                {transcriptQuery.trim() ? (
                  activeInteractionData.transcript.split(new RegExp(`(${transcriptQuery})`, 'gi')).map((p, i) => 
                    p.toLowerCase() === transcriptQuery.toLowerCase() ? <mark key={i} style={{ background: '#f3e151', color: '#000' }}>{p}</mark> : p
                  )
                ) : activeInteractionData.transcript}
              </div>
            </div>

            <dl className="property-grid">
              <div>
                <dt>{text(lt('Channel', 'ערוץ'))}</dt>
                <dd>{selectedInteraction.channel}</dd>
              </div>
              <div>
                <dt>{text(lt('Queue time', 'זמן המתנה'))}</dt>
                <dd>{selectedInteraction.queueTime}</dd>
              </div>
              <div>
                <dt>{text(lt('Next step', 'שלב הבא'))}</dt>
                <dd style={{ color: '#58a6ff', fontWeight: 'bold' }}>{activeInteractionData.recommendation}</dd>
              </div>
              <div>
                <dt>{text(lt('Flags', 'דגלים'))}</dt>
                <dd>{Array.isArray(selectedInteraction.flags) ? selectedInteraction.flags.join(', ') : ''}</dd>
              </div>
            </dl>
            
            {/* INQUIRY CATEGORY ROUTER */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>Inquiry Category Routing:</span>
              <select
                value={categoryOverrides[selectedInteraction.id] || ''}
                onChange={(e) => setCategoryOverrides(prev => ({ ...prev, [selectedInteraction.id]: e.target.value }))}
                style={{ background: '#161b22', color: '#e6edf3', border: '1px solid rgba(255,255,255,0.15)', padding: '4px 6px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              >
                <option value="">Default Classification</option>
                <option value="💡 Housing Allowance Application">Housing Assistance</option>
                <option value="💳 Identity Registry Verification">Identity Protocol</option>
              </select>
            </div>
          </div>
        </WindowPanel>

        {/* QUALITY CONTROL / ANOMALY RADAR */}
        <WindowPanel title={lt('Anomaly radar', 'מכ״ם חריגות')} subtitle={lt('High-signal items surfaced for supervisors.', 'פריטים בעלי אות גבוה שמוצגים למפקחים.')} eyebrow={lt('Quality Control', 'בקרת איכות')} accent="warning">
          <div className="stack-list">
            {rawAnomalies.map((anomaly) => {
              if (!anomaly || !anomaly.id) return null;
              const localState = anomalyStates[anomaly.id] || 'PENDING';

              return (
                <article key={anomaly.id} className="signal-row" style={{ opacity: localState !== 'PENDING' ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  <div>
                    <div className="signal-row__topline">
                      <strong>{text(anomaly.title)}</strong>
                      <StatusPill tone={localState === 'ACKNOWLEDGED' ? 'success' : localState === 'ESCALATED' ? 'danger' : anomaly.severity} label={localState !== 'PENDING' ? localState : anomaly.source} />
                    </div>
                    <p>{text(anomaly.summary)}</p>
                    
                    {localState === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setAnomalyStates(p => ({ ...p, [anomaly.id]: 'ACKNOWLEDGED' }))} style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(63,185,80,0.1)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.2)', borderRadius: '4px', cursor: 'pointer' }}>Acknowledge</button>
                        <button type="button" onClick={() => setAnomalyStates(p => ({ ...p, [anomaly.id]: 'ESCALATED' }))} style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)', borderRadius: '4px', cursor: 'pointer' }}>Escalate</button>
                      </div>
                    )}
                  </div>
                  <span className="signal-age">{anomaly.age}</span>
                </article>
              );
            })}
          </div>
        </WindowPanel>

        {/* DEMAND FORECAST SIMULATOR */}
        <WindowPanel title={lt('Demand forecast', 'תחזית ביקוש')} subtitle={lt('Simple planning bands demonstrate workforce prediction intent.', 'רצועות תכנון פשוטות מדגימות את כוונת חיזוי כוח האדם.')} eyebrow={lt('Staffing Insights', 'תובנות כוח אדם')} accent="info">
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

            <div className="forecast-chart">
              {activeForecastMetrics.map((point) => (
                point && point.label ? (
                  <div key={point.label} className="forecast-chart__bar">
                    <div className="forecast-chart__track">
                      <span style={{ height: `${point.value}%`, background: forecastMode === 'EMERGENCY' ? '#f85149' : '#388bfd' }} />
                    </div>
                    <strong>{point.label}</strong>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </WindowPanel>

        {/* INQUIRY TAXONOMY INTERLOCK FILTER CONTAINER */}
        <WindowPanel title={lt('Inquiry taxonomy', 'טקסונומיית פניות')} subtitle={lt('Click any row category to filter the main live queue view above.', 'לחץ על קטגוריית שורה כלשהי כדי לסנן את תצוגת התור הפעילה למעלה.')} eyebrow={lt('Classification Mix', 'תמהיל סיווג')} accent="success">
          <div className="stack-list">
            {taxonomy.map((bucket) => {
              if (!bucket || !bucket.id) return null;
              
              // Clean up label references safely to extract broad keyword matching categories ("Housing", "Identity")
              const matchKey = String(text(bucket.label)).replace(/[^\u0590-\u05fe\u05d0-\u05eaA-Za-z ]/g, '').trim().split(' ')[0];
              const isSelected = activeTaxonomyFilter === matchKey;

              return (
                <div 
                  key={bucket.id} 
                  onClick={() => setActiveTaxonomyFilter(isSelected ? null : matchKey)}
                  className="progress-card progress-card--tight" 
                  style={{ border: isSelected ? '1px solid #3fb950' : '1px solid transparent', background: isSelected ? 'rgba(63,185,80,0.05)' : 'transparent', padding: '8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div className="progress-card__header">
                    <strong style={{ color: isSelected ? '#3fb950' : 'inherit' }}>{text(bucket.label)} {isSelected ? '🔍' : ''}</strong>
                    <span className="progress-card__value">{bucket.share}%</span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${bucket.share}%`, backgroundColor: isSelected ? '#3fb950' : '#238636' }} />
                  </div>
                  <div className="progress-card__footer" style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                    <span>{bucket.change}</span>
                    <span style={{ fontSize: '10px', textDecoration: 'underline', color: '#58a6ff' }}>{isSelected ? 'Reset list' : 'Filter group'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </WindowPanel>

      </div>
    </div>
  );
}
