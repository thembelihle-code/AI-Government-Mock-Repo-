export type LocalizedText = {
  en: string;
  he: string;
};

export type Tone = 'info' | 'success' | 'warning' | 'danger' | 'accent';

export type Metric = {
  id: string;
  label: LocalizedText;
  value: string;
  delta: string;
  narrative: LocalizedText;
  tone: Tone;
  points: number[];
};

export type Alert = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  severity: Tone;
  source: string;
  age: string;
  recommendation?: LocalizedText;
  reviewLabel?: LocalizedText;
};

export type WorkstreamCard = {
  id: string;
  title: LocalizedText;
  narrative: LocalizedText;
  progressLabel: LocalizedText;
  progress: number;
  route: string;
};

export type CloudCapability = {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  icon: string;
  accent: Tone;
};

export type OverviewSnapshot = {
  missionTitle: LocalizedText;
  missionNarrative: LocalizedText;
  metrics: Metric[];
  alerts: Alert[];
  workstreams: WorkstreamCard[];
  cloudCapabilities: CloudCapability[];
  milestones: TimelineItem[];
};

export type TimelineItem = {
  id: string;
  label: LocalizedText;
  detail: LocalizedText;
  status: Tone;
};

export type ServiceInteraction = {
  id: string;
  citizen: string;
  channel: string;
  topic: LocalizedText;
  summary: LocalizedText;
  queueTime: string;
  sentiment: number;
  status: Tone;
  flags: string[];
  nextStep: LocalizedText;
};

export type ForecastPoint = {
  label: string;
  value: number;
};

export type TaxonomyBucket = {
  id: string;
  label: LocalizedText;
  share: number;
  change: string;
};

export type ServiceOperationsSnapshot = {
  metrics: Metric[];
  interactions: ServiceInteraction[];
  anomalies: Alert[];
  forecast: ForecastPoint[];
  taxonomy: TaxonomyBucket[];
};

export type Citation = {
  id: string;
  source: string;
  title: LocalizedText;
  excerpt: LocalizedText;
};

export type AssistantExchange = {
  id: string;
  speaker: 'agent' | 'assistant';
  text: LocalizedText;
  emphasis?: Tone;
};

export type TranslationCue = {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  phrase: LocalizedText;
  translated: LocalizedText;
};

export type AssistantSnapshot = {
  metrics: Metric[];
  exchanges: AssistantExchange[];
  suggestedPrompts: LocalizedText[];
  citations: Citation[];
  translations: TranslationCue[];
  liveSignals: Alert[];
};

export type CitizenCase = {
  id: string;
  service: LocalizedText;
  citizenTier: LocalizedText;
  statusLabel: LocalizedText;
  progress: number;
  waitingOn: LocalizedText;
  lastTouchpoint: string;
};

export type ExtractedField = {
  id: string;
  label: LocalizedText;
  value: string;
  confidence: number;
};

export type VerificationStage = {
  id: string;
  label: LocalizedText;
  detail: LocalizedText;
  status: Tone;
};

export type CitizenServicesSnapshot = {
  metrics: Metric[];
  cases: CitizenCase[];
  extractedFields: ExtractedField[];
  verificationStages: VerificationStage[];
  selfServiceTimeline: TimelineItem[];
};

export type Proposal = {
  id: string;
  title: LocalizedText;
  domain: LocalizedText;
  score: number;
  statusLabel: LocalizedText;
  readiness: string;
};

export type EvaluationCriterion = {
  id: string;
  label: LocalizedText;
  score: number;
  rationale: LocalizedText;
};

export type ResearchReviewSnapshot = {
  metrics: Metric[];
  proposals: Proposal[];
  criteria: EvaluationCriterion[];
  strengths: LocalizedText[];
  risks: LocalizedText[];
  recommendation: LocalizedText;
  auditTrail: TimelineItem[];
};

export type ConnectorStatus = {
  id: string;
  name: string;
  status: Tone;
  narrative: LocalizedText;
  icon: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: LocalizedText;
  context: LocalizedText;
  time: string;
  status: Tone;
};

export type AdministrationSnapshot = {
  metrics: Metric[];
  connectors: ConnectorStatus[];
  auditEvents: AuditEvent[];
  governanceSignals: TimelineItem[];
};

export function lt(en: string, he: string): LocalizedText {
  return { en, he };
}
