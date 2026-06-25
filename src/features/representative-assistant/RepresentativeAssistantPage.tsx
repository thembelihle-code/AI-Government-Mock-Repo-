/* eslint-disable */
// @ts-nocheck
import { useMemo, useState, useRef } from 'react';
import { demoAdapter } from '../../api/adapters/demoAdapter';
import { lt } from '../../api/contracts';
import { LoadingDeck } from '../../components/common/LoadingDeck';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusPill } from '../../components/common/StatusPill';
import { WindowPanel } from '../../components/common/WindowPanel';
import { useMockResource } from '../../hooks/useMockResource';
import { useI18n } from '../../i18n/I18nProvider';

export function RepresentativeAssistantPage() {
  const { data, loading } = useMockResource(demoAdapter.getAssistantSnapshot);
  const { text } = useI18n();

  // ─────────────────────────────────────────────
  // INTERACTIVE WORKSPACE STATE DRIVERS
  // ─────────────────────────────────────────────
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>('ALL');
  const [semanticQuery, setSemanticQuery] = useState<string>('');
  const [chatExchanges, setChatExchanges] = useState<any[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<string>('Arabic');
  const [isMicListening, setIsMicRecording] = useState<boolean>(false);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);
  const [notesState, setNotesState] = useState<string>('');

  // --- AUDIO AI PIPELINE STATE TRACKERS (Integrated from Code 1) ---
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState<string>('Idle');
  const [liveEnglish, setLiveEnglish] = useState<string>('');
  const [liveHebrew, setLiveHebrew] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // ─────────────────────────────────────────────

  // Localized mock baseline state extensions to power robust interactive loops
  const dynamicPrompts = useMemo(() => {
    return [
      { text: lt('Verify Identity via Registry', 'אימות זהות מול מרשם המאושר'), answer: lt('Grounded verification pipeline active. Requesting secondary documentation parameters from client node.', 'תהליך אימות זהות מאושר פעיל. מבקש מסמכים משניים מהאזרח.') },
      { text: lt('Escalate to Senior Supervisor', 'הסלמה למפקח בכיר'), answer: lt('Flagging case file for complex regulatory parsing. Routing token to Tier-2 supervisor bracket.', 'מסמן את התיק לבחינה רגולטורית מורכבת. מעביר לנציג בכיר דרג 2.') },
      { text: lt('Fetch Circular 2026-B Criteria', 'שלוף קריטריונים של חוזר 2026-ב'), answer: lt('Grounded Source Circular 2026-B: Citizens in Priority brackets qualify for immediate digital token extraction upon proof of local municipal tax asset indexing.', 'חוזר 2026-ב: אזרחים במסלול קדימות זכאים להנפקה מיידית בכפוף לאינדקס מס מוניציפלי.') }
    ];
  }, []);

  // Sync baseline thread from data with dynamic operational scripts injected by demo user clicks
  const combinedExchanges = useMemo(() => {
    if (!data) return [];
    return [...data.exchanges, ...chatExchanges];
  }, [data, chatExchanges]);

  // Multi-Channel Sentiment Signals filter execution
  const filteredSignals = useMemo(() => {
    if (!data) return [];
    if (activeChannelFilter === 'ALL') return data.liveSignals;
    return data.liveSignals.filter((s: any) => s.source.toUpperCase() === activeChannelFilter);
  }, [data, activeChannelFilter]);

  if (loading || !data) return <LoadingDeck />;

  // Handler: Execute Simulated Prompt Macros into the Interactive Thread
  const handlePromptClick = (promptObj: any) => {
    const userMessage = {
      id: `m-usr-${Date.now()}`,
      speaker: 'agent',
      text: promptObj.text
    };
    const assistantReply = {
      id: `m-asst-${Date.now() + 1}`,
      speaker: 'assistant',
      emphasis: 'accent',
      text: promptObj.answer
    };
    setChatExchanges((prev) => [...prev, userMessage, assistantReply]);
  };

  // Handler: Execute Custom Semantic Query Grounding Pass
  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;

    const queryLower = semanticQuery.toLowerCase();
    let groundingReply = lt(
      `Searching approved knowledge parameters... Grounded Answer: Query logged. No specific compliance violations noted. Recommendation: Follow standard triage manuals.`,
      `מחפש במאגר הנהלים המאושר... תשובה מבוססת: השילוב נרשם במערכת. המלצה: פעל לפי נוהל טיפול סטנדרטי.`
    );

    if (queryLower.includes('benefit') || queryLower.includes('income') || queryLower.includes('housing')) {
      groundingReply = lt(
        `Grounded Answer [Source: Housing Manual §4.2]: Benefit distribution requires verifiable bank assets under Section 12. Cross-referencing against Circular 2026-B confirms eligibility thresholds are adjusted by regional index parameters.`,
        `תשובה מבוססת מקורות [נוהל דיור סעיף 4.2]: חלוקת קצבאות מחייבת אימות נכסים בנקאיים לפי סעיף 12. הצלבה מול חוזר 2026-ב מאשרת שספי הזכאות מותאמים לפי מדדים אזוריים.`
      );
    } else if (queryLower.includes('biometric') || queryLower.includes('photo') || queryLower.includes('id')) {
      groundingReply = lt(
        `Grounded Answer [Source: Identity Circular §1.9]: Photo and biometric verification failures must trigger secondary signature checks via secure terminal routing nodes. Do not override without manual file review flags.`,
        `תשובה מבוססת מקורות [חוזר זיהוי סעיף 1.9]: כשל באימות תמונה ביומטרי מחייב הפעלת בדיקת חתימה משנית דרך מסוף מאובטח. אין לבצע עקיפה ללא סימון התיק לבדיקה ידנית.`
      );
    }

    const userQueryMessage = {
      id: `q-usr-${Date.now()}`,
      speaker: 'agent',
      text: { he: `חיפוש סמנטי: ${semanticQuery}`, en: `Semantic Search: ${semanticQuery}` }
    };
    const systemResponse = {
      id: `q-sys-${Date.now() + 1}`,
      speaker: 'assistant',
      emphasis: 'success',
      text: groundingReply
    };

    setChatExchanges((prev) => [...prev, userQueryMessage, systemResponse]);
    setSemanticQuery('');
  };

  // Handler: Simulated Real-Time Translation Stream Engine
  const triggerSimulatedTranslation = (lang: string) => {
    setActiveLanguage(lang);
    setIsMicRecording(true);

    setTimeout(() => {
      let phraseObj = { en: 'Citizen requesting guidance regarding housing grants.', he: 'האזרח מבקש הנחיות לגבי מענקי דיור.' };
      let transObj = { en: 'Applying Circular 2026-B structural guidelines.', he: 'מחיל את ההנחיות המבניות של חוזר 2026-ב.' };

      if (lang === 'Russian') {
        phraseObj = { en: 'Passport uploaded successfully but signature step is failing.', he: 'הדרכון הועלה בהצלחה אך שלב החתימה נכשל.' };
        transObj = { en: 'Biometric asset verification node mismatch flags detected.', he: 'נמצאה אי-התאמה ברכיב אימות הנכס הביומטרי.' };
      } else if (lang === 'Amharic') {
        phraseObj = { en: 'Where do I submit the supplementary bank income ledger file?', he: 'היכן עליי להגיש את קובץ רישום ההכנסות הבנקאיות המשני?' };
        transObj = { en: 'Upload route assigned to client console section 4.', he: 'נתיב העלאה הוקצה לאזור 4 במסוף האזרח.' };
      }

      const generatedTranslation = {
        id: `t-gen-${Date.now()}`,
        sourceLanguage: lang,
        targetLanguage: 'Hebrew',
        phrase: phraseObj,
        translated: transObj
      };

      data.translations = [generatedTranslation, ...data.translations];
      setIsMicRecording(false);
    }, 1200);
  };

  // --- AUDIO PROCESSING HANDLER (Integrated from Code 1) ---
  const handleMicToggle = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setStatusText('Processing...');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          try {
            const response = await fetch("http://localhost:8000/process_audio", {
              method: "POST",
              body: formData
            });
            const result = await response.json();
            
            setLiveEnglish(result.english_transcript || '[No speech detected]');
            setLiveHebrew(result.hebrew_translation || '[לא זוהה דיבור]');
            setStatusText('Success');
          } catch (err) {
            console.error("Pipeline server unreachable:", err);
            setStatusText('Connection Error');
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setStatusText('Recording...');
      } catch (err) {
        console.error("Mic access denied:", err);
        setStatusText('Mic Error');
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  return (
    <div className="page-stack" style={{ padding: '20px', boxSizing: 'border-box' }}>

      {/* METRICS ROW (BOUND TO COMPILER-LEVEL FORCE HORIZONTAL FLEX MATRICES) */}
      <div 
        className="metric-grid"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          gap: '16px',
          marginBottom: '20px',
          width: '100%',
          flexWrap: 'wrap'
        }}
      >
        {data.metrics.map((metric) => (
          <div key={metric.id} style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <MetricCard metric={metric} />
          </div>
        ))}
      </div>

      {/* TWO-COLUMN APPLICATION MATRIX SPLIT */}
      <div className="page-grid page-grid--assistant" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COMPONENT COLUMN: LIVE ASSIST WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <WindowPanel 
            className="page-grid__span-2" 
            title={text(lt('Guided conversation workspace', 'מרחב שיחה מונחה'))} 
            subtitle={text(lt('Grounded assistance with visible citations and escalation-safe language.', 'סיוע מבוסס מקורות עם ציטוטים גלויים ושפה בטוחה להסלמה.'))} 
            eyebrow={text(lt('Live Assist', 'סיוע חי'))} 
            accent="accent"
          >
            <div className="assistant-layout" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* ACTION MACROS DECK */}
              <div className="assistant-prompts" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="eyebrow" style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
                  {text(lt('Interactive Script Injection Chips (Click to Inject)', 'פרומפטים מוצעים להזרקת שפה מאושרת לחלון השיחה'))}
                </span>
                <div className="tag-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dynamicPrompts.map((prompt, index) => (
                    <button 
                      key={index} 
                      type="button" 
                      className="tag-chip tag-chip--interactive"
                      onClick={() => handlePromptClick(prompt)}
                      style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', background: 'rgba(56, 139, 253, 0.15)', border: '1px solid rgba(56, 139, 253, 0.3)', color: '#58a6ff', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
                    >
                      {text(prompt.text)}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEMANTIC KNOWLEDGE ACQUISITION FORMS */}
              <form onSubmit={handleQuerySubmit} style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                <input 
                  type="text"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  placeholder={text(lt("Ask AI search over manuals... Try 'benefit threshold' or 'biometric check'...", "שאל את מנוע החיפוש לסיוע... נסה 'תנאי זכאות קצבה' או 'נוהל זיהוי'..."))}
                  style={{ flexGrow: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0d1117', color: '#e6edf3', fontSize: '13px', outline: 'none' }}
                />
                <button 
                  type="submit" 
                  style={{ padding: '0 16px', background: '#1f6feb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  {text(lt('Query AI', 'חפש במאגר'))}
                </button>
              </form>

              {/* CHAT INTERACTIVE LOG TILES */}
              <div className="chat-thread" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#0d1117', borderRadius: '8px', padding: '16px', maxHeight: '420px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                {combinedExchanges.map((exchange) => {
                  const isAgent = exchange.speaker === 'agent';
                  return (
                    <article 
                      key={exchange.id} 
                      className={['chat-bubble', `chat-bubble--${exchange.speaker}`, exchange.emphasis ? `chat-bubble--${exchange.emphasis}` : ''].join(' ')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        maxWidth: '85%',
                        alignSelf: isAgent ? 'flex-end' : 'flex-start',
                        background: isAgent ? 'rgba(31, 111, 235, 0.15)' : exchange.emphasis === 'success' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(255,255,255,0.04)',
                        border: isAgent ? '1px solid rgba(31, 111, 235, 0.3)' : exchange.emphasis === 'success' ? '1px solid rgba(63, 185, 80, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: exchange.emphasis ? '0 0 8px rgba(56, 139, 253, 0.1)' : 'none'
                      }}
                    >
                      <span className="chat-bubble__speaker" style={{ display: 'block', fontSize: '11px', color: isAgent ? '#58a6ff' : '#8b949e', fontWeight: 'bold', marginBottom: '4px' }}>
                        {exchange.speaker === 'agent' ? text(lt('Representative Dashboard', 'נציג שירות')) : text(lt('AI Copilot Assistant', 'מערכת סיוע חכמה'))}
                      </span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#e6edf3', lineHeight: '1.4' }}>{text(exchange.text)}</p>
                    </article>
                  );
                })}
              </div>

            </div>
          </WindowPanel>

          {/* INTERNAL OPERATIONS JOURNAL SHEET */}
          <WindowPanel title={text(lt('Internal Operational Log Journal', 'יומן הערות פנימי של הנציג'))} subtitle={text(lt('Document session updates or manual notation indexes down onto the storage tree.', 'תיעוד עדכוני שיחה פנימיים הנשמרים לאורך השיחה.'))}>
            <textarea 
              value={notesState}
              onChange={(e) => setNotesState(e.target.value)}
              placeholder={text(lt('Write internal operative alerts regarding live citizen consultation process here...', 'כתוב הערות פנימיות לגבי מהלך השיחה הנוכחית עם האזרח...'))}
              rows={3}
              style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e6edf3', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </WindowPanel>
        </div>

        {/* RIGHT COMPONENT COLUMN: EVIDENCE, TRANSLATION, AND RISK AUDITING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* EVIDENCE GROUNDING MANIFEST DECK */}
          <WindowPanel 
            title={text(lt('Grounding sources', 'מקורות עיגון'))} 
            subtitle={text(lt('Every answer is backed by an approved source or escalation path.', 'כל תשובה נתמכת במקור מאושר או במסלול הסלמה.'))} 
            eyebrow={text(lt('Evidence', 'ראיות'))} 
            accent="success"
          >
            <div className="stack-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.citations.map((citation) => {
                const isFocused = selectedCitationId === citation.id;
                return (
                  <article 
                    key={citation.id} 
                    className="citation-card"
                    onClick={() => setSelectedCitationId(isFocused ? null : citation.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: isFocused ? 'rgba(63, 185, 80, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: isFocused ? '2px solid #3fb950' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: '#e6edf3', fontSize: '13px' }}>{citation.source}</strong>
                      <StatusPill tone="success" label={text(citation.title)} />
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', lineHeight: '1.4' }}>{text(citation.excerpt)}</p>
                    {isFocused && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(63,185,80,0.2)', fontSize: '11px', color: '#3fb950', fontWeight: 'bold' }}>
                        {text(lt('✓ Source verified. Active reference lock configured for compliance.', '✓ המקור אומת. מופעל נעילת סימוכין רגולטורית תואמת.'))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </WindowPanel>

          {/* REAL-TIME LIVE INTERPRETATION CONTROL DECK */}
          <WindowPanel 
            title={text(lt('Translation assist', 'סיוע תרגום'))} 
            subtitle={text(lt('Multilingual support is framed as a real-time co-pilot, not a hidden system.', 'התמיכה הרב-לשונית ממוסגרת כטייס משנה בזמן אמת ולא כמערכת נסתרת.'))} 
            eyebrow={text(lt('Language Layer', 'שכבת שפה'))} 
            accent="info"
          >
            {/* --- RE-INTEGRATED FROM CODE 1 --- */}
            <div className="assistant-prompts" style={{ marginBottom: '10px' }}>
              <span className="eyebrow" style={{ color: '#94a3b8' }}>TRIGGER MIC INTERPRETATION FEED LOOP</span>
            </div>

            {/* Functional AI Processing Interaction Box */}
            <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                onClick={handleMicToggle} 
                style={{ cursor: 'pointer', padding: '12px', borderRadius: '6px', border: 'none', color: 'white', fontSize: '15px', fontWeight: 'bold', backgroundColor: isRecording ? '#ef4444' : '#38bdf8', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                {isRecording ? '🛑 Stop Stream Recording' : '🎙️ Live Voice Translation'}
              </button>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginLeft: '2px' }}>
                Pipeline Status: <span style={{ color: isRecording ? '#f87171' : '#38bdf8', fontWeight: 'bold' }}>{statusText}</span>
              </div>
            </div>

            {/* Dynamic Local Transcription Output Display Card Insertion */}
            {(liveEnglish || liveHebrew) && (
              <article className="translation-card" style={{ borderLeft: '4px solid #38bdf8', background: 'rgba(56, 189, 248, 0.06)', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
                <div className="translation-card__meta">
                  <strong style={{ color: '#38bdf8' }}>LIVE INPUT → TRANSLATION</strong>
                  <StatusPill tone="info" label="Active Pipeline Engine" />
                </div>
                <p style={{ fontWeight: 500, color: '#f1f5f9', margin: '8px 0' }}>{liveEnglish}</p>
                <p className="translation-card__output" style={{ direction: 'rtl', textAlign: 'right', fontSize: '17px', color: '#38bdf8', marginTop: '6px', fontWeight: 'bold' }}>{liveHebrew}</p>
              </article>
            )}
            {/* --------------------------------- */}

            {/* AUDIO CONTROL TRIGGERS (Code 2 Mock Selectors) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                {text(lt('Simulated Stream Triggers', 'הפעלת הזנת תמלול ותרגום חלופי בזמן אמת'))}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Arabic', 'Russian', 'Amharic'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    disabled={isMicListening}
                    onClick={() => triggerSimulatedTranslation(lang)}
                    style={{
                      cursor: isMicListening ? 'not-allowed' : 'pointer',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: activeLanguage === lang ? '1px solid #58a6ff' : '1px solid rgba(255,255,255,0.1)',
                      background: activeLanguage === lang ? 'rgba(56,139,253,0.2)' : 'rgba(255,255,255,0.05)',
                      color: activeLanguage === lang ? '#58a6ff' : '#c9d1d9',
                      fontSize: '12px',
                      opacity: isMicListening && activeLanguage !== lang ? 0.5 : 1
                    }}
                  >
                    🎤 {lang} {activeLanguage === lang && isMicListening ? '...' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="stack-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.translations.map((item) => (
                <article key={item.id} style={{ padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="translation-card__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#e6edf3' }}>
                      {item.sourceLanguage} → {item.targetLanguage}
                    </strong>
                    <StatusPill tone="info" label={text(lt('Live assist', 'סיוע חי'))} />
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#8b949e', fontStyle: 'italic' }}>"{text(item.phrase)}"</p>
                  <p className="translation-card__output" style={{ margin: 0, fontSize: '13px', color: '#58a6ff', fontWeight: 'bold', background: 'rgba(56,139,253,0.06)', padding: '6px', borderRadius: '4px' }}>
                    📢 {text(item.translated)}
                  </p>
                </article>
              ))}
            </div>
          </WindowPanel>

          {/* RISK AUDITING & sentiment CHANNEL METERS */}
          <WindowPanel 
            title={text(lt('Live support signals', 'אותות תמיכה חיים'))} 
            subtitle={text(lt('Sentiment and translation risk can be surfaced alongside the answer.', 'ניתן להציג סנטימנט וסיכון תרגום לצד התשובה.'))} 
            eyebrow={text(lt('Operator Pulse', 'דופק מפעיל'))} 
            accent="warning"
          >
            {/* SURFACES REAL-TIME CHANNEL FILTER BUTTONS */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '6px' }}>
              {['ALL', 'PHONE', 'DIGITAL', 'SOCIAL'].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setActiveChannelFilter(channel)}
                  style={{
                    flexGrow: 1,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: activeChannelFilter === channel ? '#d29922' : 'transparent',
                    color: activeChannelFilter === channel ? '#0b1220' : '#8b949e',
                    transition: 'all 0.15s'
                  }}
                >
                  {channel}
                </button>
              ))}
            </div>

            <div className="stack-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredSignals.map((signal) => (
                <article key={signal.id} className="signal-row" style={{ padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div className="signal-row__topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#e6edf3' }}>{text(signal.title)}</strong>
                      <StatusPill tone={signal.severity} label={signal.source} />
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', lineHeight: '1.4' }}>{text(signal.summary)}</p>
                  </div>
                  <span className="signal-age" style={{ fontSize: '11px', color: '#8b949e', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    {signal.age}
                  </span>
                </article>
              ))}
            </div>
          </WindowPanel>

        </div>
      </div>
    </div>
  );
}