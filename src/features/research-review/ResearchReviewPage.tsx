import { useEffect, useState } from 'react';

const BASE = 'http://localhost:4000';

type ProposalStatus = 'submitted' | 'eligible' | 'reviewed' | 'notified';
type ProposalDecision = 'Fund' | 'Waitlist' | 'Decline';

interface Proposal {
  id: number;
  title: string;
  pi: string;
  category: string | null;
  abstract: string | null;
  amount: number;
  status: ProposalStatus;
  aiScore: number | null;
  decision: ProposalDecision | null;
  createdAt: string;
  updatedAt: string;
}

// Language Translations Object
const TRANSLATIONS = {
  en: {
    title: "Research proposal review",
    subtitle: "Screen proposals, run AI scoring, and record committee decisions — all in one place.",
    total: "Total",
    awaitingScreen: "Awaiting screen",
    aiReviewed: "AI reviewed",
    avgScore: "Avg score",
    submitNew: "Submit a new proposal",
    proposalTitle: "Proposal title *",
    titlePlaceholder: "e.g. Climate impact on coastal wetlands",
    pi: "Principal investigator",
    piPlaceholder: "Full name",
    amount: "Requested amount (R)",
    category: "Research category",
    selectCategory: "Select category",
    abstract: "Abstract — describe the research goals and methodology",
    abstractPlaceholder: "What is this research trying to achieve? How will it be carried out?",
    uploadDoc: "Upload proposal document (PDF or DOCX)",
    submitBtn: "Submit proposal",
    submittingBtn: "Submitting…",
    cancelBtn: "Cancel",
    allProposals: "All proposals",
    notifyBtn: "🔔 Notify reviewed",
    loading: "Loading proposals…",
    noProposals: "No proposals yet. Submit one above to get started.",
    unknownPI: "Unknown investigator",
    uncategorized: "Uncategorised",
    aiScoreLabel: "AI score",
    markEligible: "✓ Mark eligible",
    runAI: "✦ Run AI review",
    statusMap: { submitted: 'Submitted', eligible: 'Eligible', reviewed: 'Reviewed', notified: 'Notified' },
    criteria: ['Significance', 'Feasibility', 'Methodology', 'Budget fit'],
    decisions: { Fund: 'Fund', Waitlist: 'Waitlist', Decline: 'Decline' }
  },
  he: {
    title: "סקירת הצעות מחקר",
    subtitle: "סנן הצעות, הרץ דירוג AI, ותעד החלטות ועדה — הכל במקום אחד.",
    total: "סך הכל",
    awaitingScreen: "ממתין לסינון",
    aiReviewed: "נבדק ע\"י AI",
    avgScore: "ציון ממוצע",
    submitNew: "הגש הצעת מחקר חדשה",
    proposalTitle: "כותרת ההצעה *",
    titlePlaceholder: "לדוגמה: השפעת האקלים על ביצות חוף",
    pi: "חוקר ראשי",
    piPlaceholder: "שם מלא",
    amount: "סכום מבוקש (R)",
    category: "קטגוריית מחקר",
    selectCategory: "בחר קטגוריה",
    abstract: "תקציר — תאר את מטרות המחקר והמתודולוגיה",
    abstractPlaceholder: "מה המחקר מנסה להשיג? כיצד הוא יבוצע?",
    uploadDoc: "העלה מסמך הצעה (PDF או DOCX)",
    submitBtn: "הגש הצעה",
    submittingBtn: "מגיש…",
    cancelBtn: "ביטול",
    allProposals: "כל ההצעות",
    notifyBtn: "🔔 עדכן הצעות שנבדקו",
    loading: "טוען הצעות מחקר…",
    noProposals: "אין עדיין הצעות מחקר. הגש הצעה חדשה למעלה כדי להתחיל.",
    unknownPI: "חוקר לא ידוע",
    uncategorized: "ללא קטגוריה",
    aiScoreLabel: "ציון AI",
    markEligible: "✓ סמן ככשיר",
    runAI: "✦ הרץ בדיקת AI",
    statusMap: { submitted: 'הוגש', eligible: 'כשיר', reviewed: 'נבדק', notified: 'הודעה נשלחה' },
    criteria: ['חשיבות', 'היתכנות', 'מתודולוגיה', 'התאמת תקציב'],
    decisions: { Fund: 'מענק', Waitlist: 'רשימת המתנה', Decline: 'דחייה' }
  }
};

const CATEGORIES_EN = [
  'Standard research grant',
  'Early career research award',
  'Collaborative project',
  'Applied research',
  'Fundamental research',
];

const CATEGORIES_HE = [
  'מענק מחקר סטנדרטי',
  'פרס מחקר לקריירה מוקדמת',
  'פרויקט שיתופי',
  'מחקר יישומי',
  'מחקר בסיסי',
];

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((e as any).error || 'Request failed');
  }
  return res.json();
}

function scoreColor(score: number) {
  if (score >= 8.5) return '#1D9E75';
  if (score >= 7) return '#BA7517';
  return '#E24B4A';
}

function fmtAmount(n: number) {
  return 'R ' + Number(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 });
}

const PILL_STYLES: Record<ProposalStatus, React.CSSProperties> = {
  submitted:  { background: '#E6F1FB', color: '#0C447C' },
  eligible:   { background: '#FAEEDA', color: '#633806' },
  reviewed:   { background: '#EEEDFE', color: '#3C3489' },
  notified:   { background: '#EAF3DE', color: '#27500A' },
};

const DECISION_COLORS: Record<ProposalDecision, string> = {
  Fund:     '#0F6E56',
  Waitlist: '#854F0B',
  Decline:  '#A32D2D',
};

const emptyForm = { title: '', pi: '', category: '', abstract: '', amount: '' };

export function ResearchReviewPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // --- AUTOMATIC DETECTION LOGIC ---
  const [lang, setLang] = useState<'en' | 'he'>('en');

  useEffect(() => {
    // 1. Check initial language setup on mount
    const detectLang = () => {
      const isHtmlRtl = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'he';
      setLang(isHtmlRtl ? 'he' : 'en');
    };
    
    detectLang();

    // 2. Listen for clicks on your HE/EN top navbar buttons to update instantly
    const handleGlobalClick = () => {
      // Small timeout to allow your main navigation click handler to update the DOM first
      setTimeout(detectLang, 50);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);
  // ------------------------------------------

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'he';
  const currentCategories = isRtl ? CATEGORIES_HE : CATEGORIES_EN;

  const load = async () => {
    try {
      const data = await apiFetch<Proposal[]>('/api/proposals');
      setProposals(data);
    } catch (e: any) {
      setError(lang === 'he' ? 'לא ניתן לטעון הצעות — האם השרת האחורי פועל בפורט 4000?' : 'Could not load proposals — is the backend running on port 4000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); }
    catch (e: any) { setError(e.message); }
  };

  const submitProposal = async () => {
    if (!form.title.trim()) { 
      setError(lang === 'he' ? 'נדרשת כותרת להצעה.' : 'A proposal title is required.'); 
      return; 
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) || 0 }),
      });
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const sorted = [...proposals].sort((a, b) => {
    const s = (b.aiScore ?? -1) - (a.aiScore ?? -1);
    return s !== 0 ? s : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const stats = {
    total: proposals.length,
    submitted: proposals.filter(p => p.status === 'submitted').length,
    reviewed: proposals.filter(p => p.status === 'reviewed' || p.status === 'notified').length,
    avg: (() => {
      const scored = proposals.filter(p => p.aiScore != null);
      return scored.length ? (scored.reduce((a, p) => a + p.aiScore!, 0) / scored.length).toFixed(1) : '—';
    })(),
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      style={{ padding: '1.5rem 2rem', maxWidth: 860, margin: '0 auto', fontFamily: 'var(--font-sans, system-ui)', textAlign: isRtl ? 'right' : 'left' }}
    >

      {/* Header */}
      <div style={{ borderBottom: '0.5px solid var(--color-border-tertiary, #e5e5e5)', marginBottom: '1.5rem', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>{t.title}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>{t.subtitle}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: t.total, value: stats.total },
          { label: t.awaitingScreen, value: stats.submitted },
          { label: t.aiReviewed, value: stats.reviewed },
          { label: t.avgScore, value: stats.avg },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--color-background-secondary, #f5f5f5)', borderRadius: 8, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Submit card */}
      <div style={{ background: 'var(--color-background-primary, #fff)', border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFormOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', width: '100%', textAlign: isRtl ? 'right' : 'left' }}
        >
          <span style={{ fontSize: 18 }}>{formOpen ? '−' : '+'}</span>
          {t.submitNew}
        </button>

        {formOpen && (
          <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'title', label: t.proposalTitle, placeholder: t.titlePlaceholder, full: true },
              { id: 'pi', label: t.pi, placeholder: t.piPlaceholder, full: false },
              { id: 'amount', label: t.amount, placeholder: '0', full: false, type: 'number' },
            ].map(({ id, label, placeholder, full, type }) => (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 4, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
                <label htmlFor={`f-${id}`} style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</label>
                <input
                  id={`f-${id}`}
                  type={type || 'text'}
                  placeholder={placeholder}
                  value={(form as any)[id]}
                  onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                  style={{ color: 'var(--color-text-primary)', textAlign: isRtl ? 'right' : 'left' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="f-category" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t.category}</label>
              <select id="f-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                <option value="">{t.selectCategory}</option>
                {currentCategories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <label htmlFor="f-abstract" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {t.abstract}
              </label>
              <textarea
                id="f-abstract"
                placeholder={t.abstractPlaceholder}
                value={form.abstract}
                onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
                style={{ resize: 'vertical', minHeight: 80, textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>

            {/* Document Upload Section */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <label htmlFor="f-file" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {t.uploadDoc}
              </label>
              <input
                id="f-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Selected file:', file.name);
                  }
                }}
                style={{ 
                  color: 'var(--color-text-primary)',
                  padding: '8px',
                  direction: isRtl ? 'rtl' : 'ltr'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={submitProposal}
                disabled={submitting}
                style={{ background: 'var(--color-text-primary)', color: 'var(--color-background-primary)', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? t.submittingBtn : t.submitBtn}
              </button>
              <button onClick={() => setFormOpen(false)} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ccc)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                {t.cancelBtn}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{t.allProposals}</p>
        <button
          onClick={() => act(() => apiFetch('/api/notify', { method: 'POST' }))}
          style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ccc)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {t.notifyBtn}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FCEBEB', color: '#791F1F', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#791F1F' }} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Proposals */}
      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '3rem 0' }}>{t.loading}</p>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          <p style={{ margin: '0 0 6px', fontSize: 28 }}>📄</p>
          {t.noProposals}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(p => (
            <div key={p.id} style={{ background: 'var(--color-background-primary, #fff)', border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 12, padding: '1rem 1.25rem' }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 3px', color: 'var(--color-text-primary)' }}>{p.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                    {p.pi || t.unknownPI} · {p.category || t.uncategorized}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-start' : 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, fontWeight: 500, ...PILL_STYLES[p.status] }}>
                    {t.statusMap[p.status]}
                  </span>
                  {p.aiScore != null && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 500, textAlign: isRtl ? 'left' : 'right', lineHeight: 1, color: 'var(--color-text-primary)' }}>
                        {p.aiScore.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-secondary)' }}>/10</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: isRtl ? 'left' : 'right', marginTop: 2 }}>{t.aiScoreLabel}</div>
                    </div>
                  )}
                </div>
              </div>

              {p.aiScore != null && (
                <div style={{ height: 4, background: 'var(--color-border-tertiary, #e5e5e5)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.aiScore / 10) * 100}%`, background: scoreColor(p.aiScore), borderRadius: 2 }} />
                </div>
              )}

              {p.abstract && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 10px', lineHeight: 1.6 }}>
                  {p.abstract.length > 160 ? p.abstract.slice(0, 160) + '…' : p.abstract}
                </p>
              )}

              {p.aiScore != null && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {t.criteria.map(c => (
                    <span key={c} style={{ fontSize: 12, background: 'var(--color-background-secondary, #f5f5f5)', borderRadius: 99, padding: '2px 8px', color: 'var(--color-text-secondary)' }}>{c}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTop: '0.5px solid var(--color-border-tertiary, #e5e5e5)', paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.status === 'submitted' && (
                    <button onClick={() => act(() => apiFetch(`/api/proposals/${p.id}/eligibility`, { method: 'PATCH' }))}
                      style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ccc)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {t.markEligible}
                    </button>
                  )}
                  {p.status === 'eligible' && (
                    <button onClick={() => act(() => apiFetch(`/api/proposals/${p.id}/ai-review`, { method: 'POST' }))}
                      style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ccc)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {t.runAI}
                    </button>
                  )}
                  {p.status === 'reviewed' && (['Fund', 'Waitlist', 'Decline'] as ProposalDecision[]).map(d => (
                    <button key={d} onClick={() => act(() => apiFetch(`/api/proposals/${p.id}/decision`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: d }) }))}
                      style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `0.5px solid ${DECISION_COLORS[d]}`, background: 'transparent', cursor: 'pointer', color: DECISION_COLORS[d] }}>
                      {t.decisions[d]}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.decision && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: DECISION_COLORS[p.decision] }}>
                      ● {t.decisions[p.decision]}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{fmtAmount(p.amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}