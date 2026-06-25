import { useState, useRef } from 'react';
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

  // --- AUDIO AI PIPELINE STATE TRACKERS ---
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState<string>('Idle');
  const [liveEnglish, setLiveEnglish] = useState<string>('');
  const [liveHebrew, setLiveHebrew] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // ----------------------------------------

  if (loading || !data) return <LoadingDeck />;

  // --- AUDIO PROCESSING HANDLER ---
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
            // TARGET ALIGNMENT: Fetching to the new port 8001
            const response = await fetch("http://localhost:8001/process_audio", {
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
    <div className="page-stack">
      <div className="metric-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="page-grid page-grid--assistant">
        <WindowPanel className="page-grid__span-2" title={lt('Guided conversation workspace', 'מרחב שיחה מונחה')} subtitle={lt('Grounded assistance with visible citations and escalation-safe language.', 'סיוע מבוסס מקורות עם ציטוטים גלויים ושפה בטוחה להסלמה.')} eyebrow={lt('Live Assist', 'סיוע חי')} accent="accent">
          <div className="assistant-layout">
            <div className="assistant-prompts">
              <span className="eyebrow">{text(lt('Suggested prompts', 'פרומפטים מוצעים'))}</span>
              <div className="tag-row">
                {data.suggestedPrompts.map((prompt, index) => (
                  <button key={index} type="button" className="tag-chip tag-chip--interactive">
                    {text(prompt)}
                  </button>
                ))}
              </div>
            </div>
            <div className="chat-thread">
              {data.exchanges.map((exchange) => (
                <article key={exchange.id} className={['chat-bubble', `chat-bubble--${exchange.speaker}`, exchange.emphasis ? `chat-bubble--${exchange.emphasis}` : ''].join(' ')}>
                  <span className="chat-bubble__speaker">{exchange.speaker === 'agent' ? text(lt('Representative', 'נציג')) : 'Assistant'}</span>
                  <p>{text(exchange.text)}</p>
                </article>
              ))}
            </div>
          </div>
        </WindowPanel>

        <WindowPanel title={lt('Grounding sources', 'מקורות עיגון')} subtitle={lt('Every answer is backed by an approved source or escalation path.', 'כל תשובה נתמכת במקור מאושר או במסלול הסלמה.')} eyebrow={lt('Evidence', 'ראיות')} accent="success">
          <div className="stack-list">
            {data.citations.map((citation) => (
              <article key={citation.id} className="citation-card">
                <div className="signal-row__topline">
                  <strong>{citation.source}</strong>
                  <StatusPill tone="success" label={text(citation.title)} />
                </div>
                <p>{text(citation.excerpt)}</p>
              </article>
            ))}
          </div>
        </WindowPanel>

        {/* --- RE-INTEGRATED TRANSLATION ASSIST PANEL --- */}
        <WindowPanel title={lt('Translation assist', 'סיוע תרגום')} subtitle={lt('Multilingual support is framed as a real-time co-pilot, not a hidden system.', 'התמיכה הרב-לשונית ממוסגרת כטייס משנה בזמן אמת ולא כמערכת נסתרת.')} eyebrow={lt('Language Layer', 'שכבת שפה')} accent="info">
          <div className="stack-list">
            
            {/* Kept your new feed layout section headers wrapper intact */}
            <div className="assistant-prompts" style={{ marginBottom: '10px' }}>
              <span className="eyebrow" style={{ color: '#94a3b8' }}>TRIGGER MIC INTERPRETATION FEED LOOP</span>
            </div>

            {/* Functional AI Processing Interaction Box inserted right here */}
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

            {/* Default structural list layout continues downstream */}
            {data.translations.map((item) => (
              <article key={item.id} className="translation-card">
                <div className="translation-card__meta">
                  <strong>
                    {item.sourceLanguage} → {item.targetLanguage}
                  </strong>
                  <StatusPill tone="info" label={text(lt('Live assist', 'סיוע חי'))} />
                </div>
                <p>{text(item.phrase)}</p>
                <p className="translation-card__output">{text(item.translated)}</p>
              </article>
            ))}
          </div>
        </WindowPanel>

        <WindowPanel title={lt('Live support signals', 'אותות תמיכה חיים')} subtitle={lt('Sentiment and translation risk can be surfaced alongside the answer.', 'ניתן להציג סנטימנט וסיכון תרגום לצד התשובה.')} eyebrow={lt('Operator Pulse', 'דופק מפעיל')} accent="warning">
          <div className="stack-list">
            {data.liveSignals.map((signal) => (
              <article key={signal.id} className="signal-row">
                <div>
                  <div className="signal-row__topline">
                    <strong>{text(signal.title)}</strong>
                    <StatusPill tone={signal.severity} label={signal.source} />
                  </div>
                  <p>{text(signal.summary)}</p>
                </div>
                <span className="signal-age">{signal.age}</span>
              </article>
            ))}
          </div>
        </WindowPanel>
      </div>
    </div>
  );
}