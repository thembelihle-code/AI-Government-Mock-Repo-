import React, { useMemo, useState } from "react";

// ─────────────────────────────────────────────
// SAFE MOCK (ONLY backend replacement)
// ─────────────────────────────────────────────

const initialData = {
  metrics: [
    { id: "m1", label: "Active Cases", value: 128 },
    { id: "m2", label: "Pending Reviews", value: 42 },
    { id: "m3", label: "Completed Today", value: 19 },
  ],

  cases: [
    {
      id: "CS-1284",
      service: "ID Card Renewal",
      statusLabel: "Document Review",
      progress: 65,
      citizenTier: "Priority Access",
      lastTouchpoint: "2 hours ago",
      waitingOn: "Awaiting biometric verification confirmation.",
      riskScore: 14,
      riskLevel: "Low Risk",
      riskTone: "success",
      extractedFields: [
        { id: "f1", label: "Full Name", value: "Miriam Goldstein", confidence: 98 },
        { id: "f2", label: "ID Number", value: "0XX-XXXXX3", confidence: 96 },
        { id: "f3", label: "Address", value: "Tel Aviv", confidence: 87 },
      ],
      verificationStages: [
        { id: "v1", label: "Photo Match", detail: "AI matched successfully", status: "success" },
        { id: "v2", label: "Address Check", detail: "Verified with registry", status: "accent" },
        { id: "v3", label: "Signature", detail: "Needs review", status: "warning" },
      ],
      selfServiceTimeline: [
        { id: "s1", label: "Login", detail: "User authenticated", status: "success" },
        { id: "s2", label: "Upload", detail: "Documents uploaded", status: "success" },
        { id: "s3", label: "Processing", detail: "AI extraction running", status: "accent" },
      ],
    },

    {
      id: "CS-1201",
      service: "Housing Benefit Application",
      statusLabel: "Income Verification",
      progress: 40,
      citizenTier: "Standard",
      lastTouchpoint: "1 day ago",
      waitingOn: "Upload latest salary slip.",
      riskScore: 68,
      riskLevel: "Medium Risk",
      riskTone: "warning",
      extractedFields: [
        { id: "f1", label: "Full Name", value: "David Cohen", confidence: 92 },
      ],
      verificationStages: [
        { id: "v1", label: "Photo Match", detail: "Partial match", status: "warning" },
      ],
      selfServiceTimeline: [
        { id: "s1", label: "Login", detail: "User authenticated", status: "success" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// UI HELPERS (UNCHANGED STYLE INTENT)
// ─────────────────────────────────────────────

function StatusPill({ label, tone }: any) {
  const color =
    tone === "success"
      ? "#3fb950"
      : tone === "warning"
      ? "#d29922"
      : tone === "accent"
      ? "#58a6ff"
      : "#388bfd";

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        color,
        background: `${color}20`,
        padding: "2px 10px",
        borderRadius: 999,
      }}
    >
      {label}
    </span>
  );
}

function MetricCard({ metric }: any) {
  return (
    <div className="metric-card">
      <div style={{ fontSize: 12, color: "#8b949e" }}>{metric.label}</div>
      <strong style={{ fontSize: 18 }}>{metric.value}</strong>
    </div>
  );
}

function WindowPanel({ title, subtitle, children }: any) {
  return (
    <div className="window-panel">
      <div className="window-panel__header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="window-panel__body">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN (FULLY INTERACTIVE PLATFORM)
// ─────────────────────────────────────────────

export function CitizenServicesPage() {
  const [casesData, setCasesData] = useState(initialData.cases);
  const [selectedId, setSelectedId] = useState(initialData.cases[0].id);
  const [query, setQuery] = useState("");

  // Modals & Dynamic State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCitizenName, setNewCitizenName] = useState("");
  const [newService, setNewService] = useState("General Request");
  const [newTier, setNewTier] = useState("Standard");

  // Per-case dynamic data storage (Notes & Copilot State)
  const [caseNotes, setCaseNotes] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});

  const selectedCase = useMemo(
    () => casesData.find((c) => c.id === selectedId) ?? casesData[0],
    [selectedId, casesData]
  );

  const filteredCases = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return casesData;

    return casesData.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q) ||
        c.statusLabel.toLowerCase().includes(q)
    );
  }, [query, casesData]);

  // Handler: Create Case (FIXED Issue 2: Functional updater to bypass stale state closures)
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitizenName.trim()) return;

    const newId = `CS-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshCase = {
      id: newId,
      service: newService,
      statusLabel: "Intake Processing",
      progress: 20,
      citizenTier: newTier,
      lastTouchpoint: "Just now",
      waitingOn: "Awaiting automated structural document triage.",
      riskScore: Math.floor(10 + Math.random() * 45),
      riskLevel: "Low Risk",
      riskTone: "success",
      extractedFields: [
        { id: "f1", label: "Full Name", value: newCitizenName, confidence: 99 },
        { id: "f2", label: "System Token", value: `TOK-${newId}`, confidence: 95 }
      ],
      verificationStages: [
        { id: "v1", label: "Triage Scan", detail: "File submitted via digital gateway", status: "success" }
      ],
      selfServiceTimeline: [
        { id: "s1", label: "Submission", detail: "Case injected manually by Agent", status: "success" }
      ]
    };

    setCasesData((prev) => [freshCase, ...prev]);
    setSelectedId(newId);
    setIsModalOpen(false);
    setNewCitizenName("");
  };

  // Case Action Handler
  const handleCaseAction = (actionType: "approve" | "request" | "escalate") => {
    setCasesData((prevCases) =>
      prevCases.map((c) => {
        if (c.id !== selectedId) return c;
        if (actionType === "approve") {
          return { ...c, progress: 100, statusLabel: "Approved & Closed", waitingOn: "Processing complete." };
        }
        if (actionType === "request") {
          return { ...c, progress: 50, statusLabel: "Pending Info", waitingOn: "Additional documents requested from citizen." };
        }
        if (actionType === "escalate") {
          return { ...c, progress: 85, statusLabel: "Escalated Review", waitingOn: "Awaiting senior supervisor approval." };
        }
        return c;
      })
    );
  };

  // Mock AI Chat Assistant Submit
  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const citizenName = selectedCase.extractedFields[0]?.value || "the citizen";
    let reply = `Analyzing file for ${citizenName}... Cross-referencing current system logs show no core errors found.`;
    
    if (chatInput.toLowerCase().includes("status") || chatInput.toLowerCase().includes("why")) {
      reply = `Case ${selectedCase.id} is currently stalled at ${selectedCase.statusLabel}. Recommendation: ${selectedCase.waitingOn}`;
    } else if (chatInput.toLowerCase().includes("risk")) {
      reply = `Automated telemetry calculated a ${selectedCase.riskScore}% risk factor for this process (${selectedCase.riskLevel}).`;
    }

    setAiAnswers((prev) => ({ ...prev, [selectedId]: reply }));
    setChatInput("");
  };

  return (
    <div className="page-stack">

      {/* METRICS (WITH FIXED CLICK INTERACTION) */}
      <div className="metric-grid">
        {initialData.metrics.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              if (m.label === "Active Cases") setQuery("");
              if (m.label === "Pending Reviews") setQuery("Income");
              if (m.label === "Completed Today") {
                setQuery("");
                setSelectedId("CS-1284");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <MetricCard metric={m} />
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="page-grid page-grid--citizen">

        {/* LEFT COLUMN: REQUEST QUEUE & SYSTEM ALERTS */}
        <div>
          {/* CASE LIST PANEL WITH LIVE FILTERING */}
          <WindowPanel
            title="Citizen request queue"
            subtitle="Request intake system"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#238636",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                marginBottom: "12px"
              }}
            >
              + Create New Case File
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, service or status..."
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#0d1117",
                color: "#e6edf3",
                outline: "none",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />

            <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>
              {filteredCases.length} case(s) found
            </div>

            {filteredCases.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", color: "#8b949e" }}>
                No matching cases found.
              </div>
            )}

            {filteredCases.map((item) => (
              <div
                key={item.id}
                className={`record-row ${selectedId === item.id ? "record-row--active" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="record-row__top">
                  <strong>{item.id}</strong>
                  <StatusPill
                    label={`${item.progress}%`}
                    tone={item.progress === 100 ? "success" : item.progress > 60 ? "accent" : "warning"}
                  />
                </div>

                <div className="record-row__title">{item.service}</div>
                <p>{item.statusLabel}</p>

                <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
                  {item.citizenTier} • {item.lastTouchpoint}
                </div>
              </div>
            ))}
          </WindowPanel>

          {/* NOTIFICATIONS PANEL */}
          <WindowPanel title="Live Feed System Alerts" subtitle="Global events logs">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ color: "#e6edf3" }}>🔔 <strong style={{ color: "#388bfd" }}>Incoming:</strong> New application registration ID CS-1302 received.</div>
              <div style={{ color: "#e6edf3" }}>⚠ <strong style={{ color: "#d29922" }}>Warning:</strong> Auditing flag triggered for system portal node-B.</div>
              <div style={{ color: "#e6edf3" }}>📄 <strong style={{ color: "#3fb950" }}>Success:</strong> Biometric asset files processed successfully.</div>
            </div>
          </WindowPanel>
        </div>

        {/* RIGHT COLUMN: WORKSPACE AND DYNAMIC METADATA PANELS */}
        <div>
          {/* SELECTED CASE WORKSPACE WITH BUTTON ACTIONS & BAR VISUALIZATION */}
          <WindowPanel
            title="Selected Case Workspace"
            subtitle="Live case processing view"
          >
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px", marginBottom: "14px", borderLeft: "3px solid #388bfd" }}>
              <div style={{ fontSize: "11px", color: "#8b949e", textTransform: "uppercase", fontWeight: "bold" }}>Citizen Scope</div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#e6edf3" }}>
                {selectedCase.extractedFields[0]?.value || "Unknown Subject"}
              </div>
              <div style={{ fontSize: "12px", color: "#8b949e" }}>
                Classification: <span style={{ color: "#58a6ff" }}>{selectedCase.citizenTier}</span> | Verified ID Record
              </div>
            </div>

            {/* FIXED Issue 1: "space-between" corrected from "between" */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 4px 0", color: "#e6edf3" }}>{selectedCase.service}</h3>
              <p style={{ margin: "0 0 12px 0", color: "#8b949e", fontSize: "13px" }}>{selectedCase.waitingOn}</p>
            </div>

            {/* PROGRESS BAR VISUALIZATION */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#8b949e" }}>Completion State</span>
                <span style={{ fontWeight: "bold", color: "#388bfd" }}>{selectedCase.progress}%</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
                <div
                  style={{
                    width: `${selectedCase.progress}%`,
                    height: "100%",
                    background: selectedCase.progress === 100 ? "#3fb950" : "#388bfd",
                    borderRadius: 999,
                    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                />
              </div>
            </div>

            {/* INTEGRATED ACTION BUTTONS */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
              <button
                onClick={() => handleCaseAction("approve")}
                style={{ background: "#238636", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}
              >
                Approve Case
              </button>
              <button
                onClick={() => handleCaseAction("request")}
                style={{ background: "rgba(255,255,255,0.08)", color: "#e6edf3", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
              >
                Request Docs
              </button>
              <button
                onClick={() => handleCaseAction("escalate")}
                style={{ background: "rgba(210,153,34,0.15)", color: "#d29922", border: "1px solid rgba(210,153,34,0.3)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
              >
                Escalate File
              </button>
            </div>
          </WindowPanel>

          {/* AI RISK ASSESSMENT PANEL */}
          <WindowPanel title="AI Risk Assessment" subtitle="Automated triage intelligence layer">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: selectedCase.riskTone === "success" ? "#3fb950" : "#d29922" }}>
                {selectedCase.riskScore}%
              </div>
              <div>
                <StatusPill label={selectedCase.riskLevel} tone={selectedCase.riskTone} />
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#8b949e" }}>
                  Verified against algorithmic fraud frameworks.
                </p>
              </div>
            </div>
          </WindowPanel>

          <WindowPanel title="Extracted Fields" subtitle="AI extraction layer">
            {selectedCase.extractedFields.map((f) => (
              <div key={f.id} style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong style={{ color: "#8b949e" }}>{f.label}:</strong> <span style={{ color: "#e6edf3" }}>{f.value}</span>
              </div>
            ))}
          </WindowPanel>

          <WindowPanel title="Identity Verification" subtitle="Risk checks">
            {selectedCase.verificationStages.map((v) => (
              <div key={v.id} style={{ margin: "6px 0", fontSize: "13px" }}>
                <StatusPill label={v.label} tone={v.status} /> <span style={{ marginLeft: 6, color: "#8b949e" }}>{v.detail}</span>
              </div>
            ))}
          </WindowPanel>

          {/* CASE NOTES PANEL */}
          <WindowPanel title="Officer Notes" subtitle="Internal operations journal">
            <textarea
              value={caseNotes[selectedId] || ""}
              onChange={(e) => setCaseNotes({ ...caseNotes, [selectedId]: e.target.value })}
              placeholder={`Write internal updates regarding case file ${selectedId}...`}
              rows={3}
              style={{
                width: "100%",
                background: "#0d1117",
                color: "#e6edf3",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                padding: "8px",
                fontSize: "13px",
                outline: "none",
                resize: "none",
                boxSizing: "border-box"
              }}
            />
          </WindowPanel>

          <WindowPanel title="Self-Service Flow" subtitle="Citizen journey">
            {selectedCase.selfServiceTimeline.map((s) => (
              <div key={s.id} style={{ margin: "6px 0", fontSize: "13px" }}>
                <StatusPill label={s.label} tone={s.status} /> <span style={{ marginLeft: 6, color: "#8b949e" }}>{s.detail}</span>
              </div>
            ))}
          </WindowPanel>

          {/* AI ACTIVITY FEED */}
          <WindowPanel title="AI Agent Activity Feed" subtitle="Real-time transaction pipelines">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#8b949e" }}>
              <div>🧠 <span style={{ color: "#e6edf3" }}>OCR extraction engine:</span> completed classification pipeline.</div>
              <div>📄 <span style={{ color: "#e6edf3" }}>Document Classifier:</span> structural metadata indexed.</div>
              <div>🔍 <span style={{ color: "#e6edf3" }}>Telemetry Router:</span> fraud verification nodes running.</div>
            </div>
          </WindowPanel>

          {/* INTERACTIVE AI ASSISTANT PANEL */}
          <WindowPanel title="Citizen Service AI Assistant" subtitle="Mock conversational support">
            <div style={{ background: "#0d1117", padding: "10px", borderRadius: "6px", marginBottom: "8px", fontSize: "13px", color: "#8b949e", border: "1px solid rgba(255,255,255,0.05)" }}>
              🤖 <strong>Government AI:</strong> {aiAnswers[selectedId] || "How can I assist you with processing this file today? Ask me about 'status' or 'risk'."}
            </div>
            <form onSubmit={handleAiChatSubmit} style={{ display: "flex", width: "100%" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the AI agent..."
                style={{
                  flexGrow: 1,
                  padding: "8px 10px",
                  background: "#0d1117",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: "#e6edf3",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  marginLeft: 8,
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#388bfd",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px"
                }}
              >
                Send
              </button>
            </form>
          </WindowPanel>
        </div>

      </div>

      {/* DYNAMIC CASE CREATION MODAL LAYER */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", width: "400px", padding: "20px", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 4px 0", color: "#e6edf3" }}>Intake New Citizen Request</h3>
            <p style={{ margin: "0 0 16px 0", color: "#8b949e", fontSize: "12px" }}>Registers dynamic data onto system ledger nodes.</p>
            
            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8b949e", marginBottom: "4px" }}>Citizen Full Name</label>
                <input type="text" required value={newCitizenName} onChange={(e) => setNewCitizenName(e.target.value)} placeholder="e.g. Lev Avner" style={{ width: "100%", padding: "8px", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#e6edf3", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8b949e", marginBottom: "4px" }}>Service Form Subtype</label>
                <select value={newService} onChange={(e) => setNewService(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#e6edf3", boxSizing: "border-box" }}>
                  <option value="ID Card Renewal">ID Card Renewal</option>
                  <option value="Housing Benefit Application">Housing Benefit Application</option>
                  <option value="Biometric Update Request">Biometric Update Request</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8b949e", marginBottom: "4px" }}>Citizen Routing Tier</label>
                <select value={newTier} onChange={(e) => setNewTier(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#e6edf3", boxSizing: "border-box" }}>
                  <option value="Standard">Standard Tier</option>
                  <option value="Priority Access">Priority Access (Accelerated)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "transparent", color: "#8b949e", border: "none", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <button type="submit" style={{ background: "#238636", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>Inject File</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}