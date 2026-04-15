'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuthStore, useCaseStore } from '@/lib/store';
import { casesApi, documentsApi, analysisApi, searchApi, paymentsApi, exportApi } from '@/lib/api';
import {
  Document,
  TimelineEvent,
  Contradiction,
  ImpeachmentOpportunity,
  EvidenceSignal,
  DepositionAnalysis,
  CaseStrategy,
  SearchResult,
} from '@discoveryintel/shared';
import { formatDate, formatFileSize } from '@/lib/utils';

type Phase = 1 | 2 | 3 | 4 | 5;
type IntelTab = 'timeline' | 'contradictions' | 'impeachment' | 'evidence' | 'strategy';
type NavView =
  | 'plan'
  | 'timeline-full'
  | 'contradictions-full'
  | 'witnesses'
  | 'documents'
  | 'strategy'
  | 'search'
  | 'export';

type DocumentType =
  | 'deposition'
  | 'email'
  | 'expert_report'
  | 'medical_records'
  | 'internal_comms'
  | 'claim_file'
  | 'other';

interface UploadedFile {
  file: File;
  documentType: DocumentType;
  id: string;
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  deposition: 'Deposition',
  email: 'Email thread',
  expert_report: 'Expert report',
  medical_records: 'Medical records',
  internal_comms: 'Internal comms',
  claim_file: 'Claim file',
  other: 'Other',
};

const CASE_TYPE_OPTIONS = [
  'Insurance / bad faith',
  'Personal injury',
  'Employment',
  'Contract / commercial',
  'Medical malpractice',
  'Other',
] as const;

const ANALYSIS_MODULES = [
  { id: 'timeline', label: 'Timeline extraction' },
  { id: 'contradictions', label: 'Contradiction scan' },
  { id: 'impeachment', label: 'Impeachment mapping' },
  { id: 'evidence', label: 'Evidence signals' },
  { id: 'deposition', label: 'Deposition analysis' },
  { id: 'strategy', label: 'Strategy synthesis' },
] as const;

export default function CasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = (params?.id as string) || '';
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentCase, setCurrentCase } = useCaseStore();

  const [phase, setPhase] = useState<Phase>(1);
  const [intelTab, setIntelTab] = useState<IntelTab>('timeline');
  const [navView, setNavView] = useState<NavView>('plan');

  const [caseType, setCaseType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [ourSide, setOurSide] = useState<'plaintiff' | 'defense' | ''>('');
  const [keyParties, setKeyParties] = useState('');

  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentDoc, setCurrentDoc] = useState('');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [impeachment, setImpeachment] = useState<ImpeachmentOpportunity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSignal[]>([]);
  const [deposition, setDeposition] = useState<DepositionAnalysis[]>([]);
  const [strategy, setStrategy] = useState<CaseStrategy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  const loadAnalysisResults = useCallback(async () => {
    if (!caseId) return;
    try {
      const [tlRes, ctRes, impRes, evRes, depRes, stRes] = await Promise.all([
        analysisApi.getTimeline(caseId).catch(() => ({ data: { events: [] } })),
        analysisApi.getContradictions(caseId).catch(() => ({ data: { contradictions: [] } })),
        analysisApi.getImpeachment(caseId).catch(() => ({ data: { opportunities: [] } })),
        analysisApi.getEvidence(caseId).catch(() => ({ data: { signals: [] } })),
        analysisApi.getDeposition(caseId).catch(() => ({ data: { analyses: [] } })),
        analysisApi.getStrategy(caseId).catch(() => ({ data: null })),
      ]);
      setTimeline(tlRes.data.events || []);
      setContradictions(ctRes.data.contradictions || []);
      setImpeachment(impRes.data.opportunities || []);
      setEvidence(evRes.data.signals || []);
      setDeposition(depRes.data.analyses || []);
      setStrategy(stRes.data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
    }
  }, [caseId]);

  const loadCaseData = useCallback(async () => {
    if (!caseId) return;
    try {
      const [caseRes, docsRes] = await Promise.all([
        casesApi.get(caseId),
        documentsApi.list(caseId),
      ]);
      setCurrentCase(caseRes.data.case);
      setPaid(caseRes.data.case.analysis_paid === true);
      setDocuments(docsRes.data.documents || []);
      const hasAnalysis = docsRes.data.documents?.some(
        (d: Document) => d.processing_status === 'completed'
      );
      if (hasAnalysis) {
        await loadAnalysisResults();
        setPhase(4);
      } else if (docsRes.data.documents?.length > 0) {
        setPhase(3);
      }
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, loadAnalysisResults, setCurrentCase]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!caseId) {
      router.replace('/dashboard');
      return;
    }
    loadCaseData();
  }, [user, caseId, router, loadCaseData]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      loadCaseData();
    }
  }, [searchParams, loadCaseData]);

  const guessDocType = (name: string): DocumentType => {
    const n = name.toLowerCase();
    if (n.includes('depo')) return 'deposition';
    if (n.includes('email') || n.includes('gmail') || n.includes('comms')) return 'email';
    if (n.includes('expert') || n.includes('report')) return 'expert_report';
    if (n.includes('medical') || n.includes('record') || n.includes('er_')) return 'medical_records';
    if (n.includes('internal') || n.includes('memo') || n.includes('log')) return 'internal_comms';
    if (n.includes('claim') || n.includes('policy')) return 'claim_file';
    return 'other';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newEntries: UploadedFile[] = files.map((f) => ({
      file: f,
      documentType: guessDocType(f.name),
      id: Math.random().toString(36).slice(2),
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateFileType = (id: string, docType: DocumentType) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, documentType: docType } : f))
    );
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUploadAll = async () => {
    if (!pendingFiles.length || !caseId) return;
    setUploading(true);
    try {
      for (const entry of pendingFiles) {
        await documentsApi.upload(caseId, entry.file, entry.documentType);
      }
      await loadCaseData();
      setPendingFiles([]);
      setPhase(2);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!caseId) return;
    if (!paid) {
      try {
        const res = await paymentsApi.createCheckout(caseId);
        if (res.data?.url) {
          window.location.href = res.data.url;
        }
      } catch (err) {
        console.error('Checkout failed:', err);
      }
      return;
    }
    setPhase(3);
    setAnalyzing(true);
    setAnalysisProgress(0);
    const docNames = documents.map((d) => d.filename);
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const pct = Math.min(90, tick * 3);
      setAnalysisProgress(pct);
      const idx = Math.floor(tick / 5);
      if (docNames[idx]) setCurrentDoc(docNames[idx]);
    }, 800);
    try {
      await analysisApi.runAnalysis(caseId);
      await loadAnalysisResults();
      clearInterval(interval);
      setAnalysisProgress(100);
      setTimeout(() => {
        setAnalyzing(false);
        setPhase(4);
      }, 800);
    } catch (err) {
      console.error('Analysis failed:', err);
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !caseId) return;
    setSearching(true);
    try {
      const res = await searchApi.search(caseId, searchQuery);
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const res =
        format === 'pdf' ? await exportApi.downloadPdf(caseId) : await exportApi.downloadDocx(caseId);
      const blob = new Blob([res.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DiscoveryIntel-${currentCase?.case_name || caseId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const highContradictions = contradictions.filter((c) => c.severity === 'high').length;
  const impeachmentCount = impeachment.length;
  const evidenceCount = evidence.length;
  const timelineCount = timeline.length;
  const docsCount = documents.length;

  const allDocsComplete =
    documents.length > 0 && documents.every((d) => d.processing_status === 'completed');

  const analysisStatusLabel = analyzing
    ? 'Analyzing…'
    : phase >= 4 && timeline.length + contradictions.length > 0
      ? 'Intelligence ready'
      : phase === 3 && !allDocsComplete
        ? 'Documents processing'
        : phase === 3
          ? 'Ready to analyze'
          : phase < 3
            ? 'Setup'
            : 'Review';

  const sideLabel =
    ourSide === 'plaintiff' ? 'Plaintiff' : ourSide === 'defense' ? 'Defense' : '—';

  const phaseCardClass = (n: Phase) => {
    if (phase === n) return 'di-phase-card di-phase-card-active';
    if (phase > n) return 'di-phase-card di-phase-card-done';
    return 'di-phase-card';
  };

  const goPhase = (n: Phase) => {
    if (n === 1 || n <= phase || (n === 5 && phase >= 4)) {
      setPhase(n);
      setNavView('plan');
    }
  };

  const intelTabs: { key: IntelTab; label: string }[] = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'contradictions', label: 'Contradictions' },
    { key: 'impeachment', label: 'Impeachment' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'strategy', label: 'Strategy' },
  ];

  const renderTimeline = () => (
    <div className="di-panel">
      <h3 className="di-h3">Case timeline</h3>
      {timeline.length === 0 ? (
        <p className="di-muted">No timeline events yet.</p>
      ) : (
        <ul className="di-timeline">
          {timeline.map((ev, i) => (
            <li key={i} className="di-timeline-item">
              <div className="di-timeline-date">{ev.date}</div>
              <div className="di-timeline-body">
                <p className="di-timeline-event">{ev.event}</p>
                <p className="di-muted-sm">Source: {ev.document_source}</p>
              </div>
              <span className="di-pill di-pill-outline">{Math.round(ev.confidence * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderContradictions = () => (
    <div className="di-panel">
      <h3 className="di-h3">Contradictions</h3>
      {contradictions.length === 0 ? (
        <p className="di-muted">No contradictions detected.</p>
      ) : (
        <div className="di-stack">
          {contradictions.map((c) => (
            <div key={c.id} className="di-card-amber">
              <span className={`di-badge di-sev-${c.severity}`}>{c.severity}</span>
              <p className="di-label">Statement A</p>
              <p>{c.statement_a}</p>
              <p className="di-muted-sm">{c.source_a}</p>
              <p className="di-label">Statement B</p>
              <p>{c.statement_b}</p>
              <p className="di-muted-sm">{c.source_b}</p>
              <p className="di-explain">{c.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderImpeachment = () => (
    <div className="di-panel">
      <h3 className="di-h3">Witnesses & impeachment</h3>
      {impeachment.length === 0 ? (
        <p className="di-muted">No impeachment opportunities yet.</p>
      ) : (
        <div className="di-stack">
          {impeachment.map((o) => (
            <div key={o.id} className="di-card-red">
              <div className="di-row-spread">
                <strong>{o.witness}</strong>
                <span className={`di-badge di-sev-${o.strength}`}>{o.strength}</span>
              </div>
              <p className="di-label">Statement</p>
              <p>{o.statement}</p>
              {o.page_reference && <p className="di-muted-sm">Page: {o.page_reference}</p>}
              <p className="di-label">Contradicting evidence</p>
              <p>{o.contradicting_evidence}</p>
              <p className="di-muted-sm">{o.document_source}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvidenceDeposition = () => (
    <div className="di-panel">
      <h3 className="di-h3">Evidence signals</h3>
      {evidence.length === 0 ? (
        <p className="di-muted">No evidence signals yet.</p>
      ) : (
        <div className="di-stack di-mb-lg">
          {evidence.map((s) => (
            <div key={s.id} className="di-card-neutral">
              <span className="di-badge">{s.signal_type.replace(/_/g, ' ')}</span>
              <span className="di-badge di-badge-ghost">{s.importance}</span>
              <p>{s.description}</p>
              <p className="di-muted-sm">
                {s.document_source}
                {s.page_reference ? ` · p. ${s.page_reference}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      <h3 className="di-h3">Deposition analysis</h3>
      {deposition.length === 0 ? (
        <p className="di-muted">No deposition analyses yet.</p>
      ) : (
        <div className="di-stack">
          {deposition.map((d) => (
            <div key={d.id} className="di-card-neutral">
              <h4 className="di-h4">Witness: {d.witness}</h4>
              {d.key_admissions.length > 0 && (
                <div className="di-subblock">
                  <p className="di-label di-text-emerald">Admissions</p>
                  {d.key_admissions.map((a, i) => (
                    <div key={i} className="di-nested">
                      <p>{a.statement}</p>
                      <p className="di-muted-sm">{a.analysis}</p>
                    </div>
                  ))}
                </div>
              )}
              {d.contradictions.length > 0 && (
                <div className="di-subblock">
                  <p className="di-label di-text-amber">Depo contradictions</p>
                  {d.contradictions.map((a, i) => (
                    <div key={i} className="di-nested">
                      <p>{a.statement}</p>
                      <p className="di-muted-sm">{a.analysis}</p>
                    </div>
                  ))}
                </div>
              )}
              {d.evasive_answers.length > 0 && (
                <div className="di-subblock">
                  <p className="di-label di-text-red">Evasive answers</p>
                  {d.evasive_answers.map((a, i) => (
                    <div key={i} className="di-nested">
                      <p>{a.statement}</p>
                      <p className="di-muted-sm">{a.analysis}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStrategy = () => (
    <div className="di-panel">
      <h3 className="di-h3">Case strategy</h3>
      {!strategy ? (
        <p className="di-muted">No strategy generated yet.</p>
      ) : (
        <div className="di-strategy">
          <div>
            <p className="di-label di-text-emerald">Strengths</p>
            <ul>
              {strategy.case_strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="di-label di-text-red">Weaknesses</p>
            <ul>
              {strategy.case_weaknesses.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="di-label di-text-teal">Leverage</p>
            <ul>
              {strategy.key_leverage_points.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          {strategy.potential_defense_narrative && (
            <div>
              <p className="di-label">Narrative</p>
              <p>{strategy.potential_defense_narrative}</p>
            </div>
          )}
          {strategy.recommended_actions?.length > 0 && (
            <div>
              <p className="di-label">Recommended actions</p>
              <ul>
                {strategy.recommended_actions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="di-panel">
      <h3 className="di-h3">Documents</h3>
      {documents.length === 0 ? (
        <p className="di-muted">No documents uploaded.</p>
      ) : (
        <table className="di-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>{d.filename}</td>
                <td>{formatFileSize(d.file_size)}</td>
                <td>{formatDate(d.upload_date)}</td>
                <td>
                  <span className={`di-status-dot di-st-${d.processing_status}`}>
                    {d.processing_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="di-panel">
      <h3 className="di-h3">Semantic search</h3>
      <form onSubmit={handleSearch} className="di-search-form">
        <input
          className="di-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ask across discovery…"
        />
        <button type="submit" className="di-btn di-btn-primary" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {searchResults.length > 0 && (
        <div className="di-stack di-mt">
          {searchResults.map((r, i) => (
            <div key={i} className="di-card-neutral">
              <div className="di-row-spread">
                <strong>{r.document_name}</strong>
                <span className="di-pill di-pill-outline">
                  {Math.round(r.similarity_score * 100)}% match
                </span>
              </div>
              <p className="di-muted-sm">{r.chunk_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExport = () => (
    <div className="di-panel">
      <h3 className="di-h3">Export report</h3>
      <div className="di-export-grid">
        <button type="button" className="di-btn di-btn-primary" onClick={() => handleExport('pdf')}>
          Download PDF
        </button>
        <button type="button" className="di-btn di-btn-primary" onClick={() => handleExport('docx')}>
          Download DOCX
        </button>
      </div>
    </div>
  );

  const renderPlanBody = () => {
    if (phase === 1) {
      return (
        <div className="di-panel di-panel-hero">
          <h3 className="di-h3">Upload discovery</h3>
          <p className="di-muted">Add one or more files, tag each by type, then upload.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.doc"
            className="di-file-input"
            onChange={handleFileSelect}
          />
          {pendingFiles.length > 0 && (
            <ul className="di-pending-list">
              {pendingFiles.map((pf) => (
                <li key={pf.id} className="di-pending-row">
                  <span className="di-filename">{pf.file.name}</span>
                  <select
                    className="di-select"
                    value={pf.documentType}
                    onChange={(e) => updateFileType(pf.id, e.target.value as DocumentType)}
                  >
                    {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((k) => (
                      <option key={k} value={k}>
                        {DOC_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="di-btn di-btn-ghost" onClick={() => removeFile(pf.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="di-actions">
            <button
              type="button"
              className="di-btn di-btn-primary"
              disabled={!pendingFiles.length || uploading}
              onClick={handleUploadAll}
            >
              {uploading ? 'Uploading…' : 'Upload all'}
            </button>
          </div>
        </div>
      );
    }
    if (phase === 2) {
      return (
        <div className="di-panel di-panel-hero">
          <h3 className="di-h3">Case context</h3>
          <p className="di-muted">Tell the system how to frame analysis.</p>
          <p className="di-label">Case type</p>
          <div className="di-chips">
            {CASE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={caseType === opt ? 'di-chip di-chip-on' : 'di-chip'}
                onClick={() => setCaseType(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="di-label">Our side</p>
          <div className="di-toggle">
            <button
              type="button"
              className={ourSide === 'plaintiff' ? 'di-toggle-btn di-toggle-on' : 'di-toggle-btn'}
              onClick={() => setOurSide('plaintiff')}
            >
              Plaintiff
            </button>
            <button
              type="button"
              className={ourSide === 'defense' ? 'di-toggle-btn di-toggle-on' : 'di-toggle-btn'}
              onClick={() => setOurSide('defense')}
            >
              Defense
            </button>
          </div>
          <p className="di-label">Jurisdiction</p>
          <input
            className="di-input"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="e.g. Northern District of Texas"
          />
          <p className="di-label">Key parties & roles</p>
          <textarea
            className="di-textarea"
            value={keyParties}
            onChange={(e) => setKeyParties(e.target.value)}
            placeholder="Insurer, insured, experts, key witnesses…"
            rows={4}
          />
          <div className="di-actions">
            <button type="button" className="di-btn di-btn-primary" onClick={handleRunAnalysis}>
              {paid ? 'Run analysis →' : 'Analyze case — $499 →'}
            </button>
          </div>
        </div>
      );
    }
    if (phase === 3) {
      const modProgress = analyzing
        ? analysisProgress
        : allDocsComplete
          ? 100
          : 0;
      return (
        <div className="di-panel di-panel-hero">
          <h3 className="di-h3">AI analysis</h3>
          <p className="di-muted">
            {analyzing
              ? `Processing${currentDoc ? ` · ${currentDoc}` : ''}…`
              : allDocsComplete
                ? 'Documents ready. Run analysis or refresh status.'
                : 'Waiting for document processing…'}
          </p>
          <div className="di-doc-dots">
            <p className="di-label">Documents</p>
            <div className="di-dots-row">
              {documents.map((d) => (
                <div key={d.id} className="di-doc-dot-wrap" title={d.filename}>
                  <span className={`di-dot di-dot-${d.processing_status}`} />
                  <span className="di-dot-label">{d.filename.slice(0, 12)}…</span>
                </div>
              ))}
            </div>
          </div>
          <div className="di-module-bars">
            {ANALYSIS_MODULES.map((m) => (
              <div key={m.id} className="di-mod-row">
                <span className="di-mod-label">{m.label}</span>
                <div className="di-bar-track">
                  <div
                    className="di-bar-fill"
                    style={{ width: `${analyzing || phase >= 4 ? modProgress : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="di-actions">
            <button type="button" className="di-btn di-btn-ghost" onClick={() => loadCaseData()}>
              Refresh status
            </button>
            {!analyzing && allDocsComplete && (
              <button type="button" className="di-btn di-btn-primary" onClick={handleRunAnalysis}>
                Run AI analysis
              </button>
            )}
          </div>
        </div>
      );
    }
    if (phase === 4) {
      return (
        <>
          <div className="di-intel-subbar">
            {intelTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={intelTab === t.key ? 'di-subpill di-subpill-on' : 'di-subpill'}
                onClick={() => setIntelTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="di-panel-wrap">
            {intelTab === 'timeline' && renderTimeline()}
            {intelTab === 'contradictions' && renderContradictions()}
            {intelTab === 'impeachment' && renderImpeachment()}
            {intelTab === 'evidence' && renderEvidenceDeposition()}
            {intelTab === 'strategy' && renderStrategy()}
          </div>
          <div className="di-actions di-actions-footer">
            <button type="button" className="di-btn di-btn-primary" onClick={() => setPhase(5)}>
              Continue to export
            </button>
          </div>
        </>
      );
    }
    if (phase === 5) {
      return renderExport();
    }
    return null;
  };

  const renderMain = () => {
    switch (navView) {
      case 'timeline-full':
        return renderTimeline();
      case 'contradictions-full':
        return renderContradictions();
      case 'witnesses':
        return renderImpeachment();
      case 'documents':
        return renderDocuments();
      case 'strategy':
        return renderStrategy();
      case 'search':
        return renderSearch();
      case 'export':
        return renderExport();
      default:
        return renderPlanBody();
    }
  };

  if (!caseId || loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="di-loading">
          <div className="di-loading-inner">
            <div className="di-spinner-lg" />
            <p>Loading case…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="di-shell">
        <header className="di-topnav">
          <div className="di-brand">
            <span className="di-brand-mark" />
            <span className="di-brand-text">DiscoveryIntel</span>
          </div>
          <div className="di-case-pill">{currentCase?.case_name ?? 'Case'}</div>
          <div className="di-metrics">
            <div className="di-metric">
              <span className="di-metric-val">{docsCount}</span>
              <span className="di-metric-lbl">Docs</span>
            </div>
            <div className="di-metric">
              <span className="di-metric-val">{contradictions.length}</span>
              <span className="di-metric-lbl">Contradictions</span>
            </div>
            <div className="di-metric">
              <span className="di-metric-val">{impeachmentCount}</span>
              <span className="di-metric-lbl">Impeachment</span>
            </div>
            <div className="di-metric">
              <span className="di-metric-val">{evidenceCount}</span>
              <span className="di-metric-lbl">Evidence</span>
            </div>
          </div>
        </header>

        <nav className="di-subnav">
          {(
            [
              ['plan', 'Intelligence report'],
              ['timeline-full', 'Full timeline'],
              ['contradictions-full', 'Contradictions'],
              ['witnesses', 'Witnesses'],
              ['documents', 'Documents'],
              ['strategy', 'Strategy'],
              ['search', 'Search'],
              ['export', 'Export'],
            ] as [NavView, string][]
          ).map(([view, label]) => (
            <button
              key={view}
              type="button"
              className={navView === view ? 'di-pill-nav di-pill-nav-on' : 'di-pill-nav'}
              onClick={() => setNavView(view)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="di-status-strip">
          <span>
            <strong>Status</strong> {analysisStatusLabel}
          </span>
          <span>
            <strong>Type</strong> {caseType || '—'}
          </span>
          <span>
            <strong>Side</strong> {sideLabel}
          </span>
          <span>
            <strong>Jurisdiction</strong> {jurisdiction || '—'}
          </span>
          <span>
            <strong>High sev.</strong> {highContradictions}
          </span>
          <span>
            <strong>Timeline</strong> {timelineCount}
          </span>
        </div>

        <div className="di-phase-row">
          {(
            [
              [1, 'Upload documents'],
              [2, 'Case context'],
              [3, 'AI analysis'],
              [4, 'Intelligence review'],
              [5, 'Export report'],
            ] as [Phase, string][]
          ).map(([n, title]) => (
            <button
              key={n}
              type="button"
              className={phaseCardClass(n)}
              onClick={() => goPhase(n)}
            >
              <span className="di-phase-num">{n}</span>
              <span className="di-phase-title">{title}</span>
            </button>
          ))}
        </div>

        <main className="di-main">{renderMain()}</main>
      </div>
    </>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

.di-shell, .di-loading {
  --navy: #0f172a;
  --teal: #14b8a6;
  --emerald: #10b981;
  --amber: #f59e0b;
  --page-bg: #f4f7fb;
  font-family: 'DM Sans', system-ui, sans-serif;
  box-sizing: border-box;
}
.di-shell *, .di-loading * { box-sizing: border-box; }

.di-shell {
  min-height: 100vh;
  background: var(--navy);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
}

.di-topnav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  flex-wrap: wrap;
}

.di-brand { display: flex; align-items: center; gap: 0.5rem; }
.di-brand-mark {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 12px var(--teal);
}
.di-brand-text { font-weight: 700; letter-spacing: -0.02em; }

.di-case-pill {
  background: rgba(20, 184, 166, 0.15);
  color: #5eead4;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(20, 184, 166, 0.35);
}

.di-metrics {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.di-metric {
  text-align: center;
  min-width: 4.5rem;
}
.di-metric-val {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}
.di-metric-lbl {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.di-subnav {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  overflow-x: auto;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}
.di-pill-nav {
  flex-shrink: 0;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
}
.di-pill-nav-on {
  background: rgba(20, 184, 166, 0.2);
  border-color: var(--teal);
  color: #99f6e4;
}

.di-status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  padding: 0.55rem 1.25rem;
  font-size: 0.78rem;
  color: #94a3b8;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}
.di-status-strip strong { color: #64748b; margin-right: 0.35rem; font-weight: 600; }

.di-phase-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
}
@media (max-width: 900px) {
  .di-phase-row { grid-template-columns: repeat(2, 1fr); }
}

.di-phase-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.5);
  border-radius: 10px;
  padding: 0.65rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.di-phase-card-done {
  border-color: rgba(16, 185, 129, 0.45);
  color: #a7f3d0;
}
.di-phase-card-active {
  border-color: var(--teal);
  box-shadow: 0 0 0 1px var(--teal), 0 4px 20px rgba(20, 184, 166, 0.15);
  color: #fff;
}
.di-phase-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--teal);
}
.di-phase-title { font-size: 0.8rem; font-weight: 600; }

.di-main {
  flex: 1;
  margin: 0 1.25rem;
  background: var(--page-bg);
  border-radius: 12px;
  color: #0f172a;
  min-height: 320px;
  overflow: hidden;
}

.di-intel-subbar {
  display: flex;
  gap: 0.4rem;
  padding: 0.75rem 1rem 0;
  flex-wrap: wrap;
}
.di-subpill {
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  color: #475569;
}
.di-subpill-on {
  background: var(--navy);
  color: #f1f5f9;
  border-color: var(--navy);
}

.di-panel-wrap { padding: 0 1rem 1rem; }

.di-panel, .di-panel-hero {
  padding: 1.25rem;
}
.di-panel-hero { max-width: 720px; margin: 0 auto; }

.di-h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: var(--navy); }
.di-h4 { margin: 0 0 0.5rem; font-size: 1rem; }
.di-muted { color: #64748b; margin: 0 0 1rem; font-size: 0.9rem; }
.di-muted-sm { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0; }
.di-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
  margin: 1rem 0 0.4rem;
}
.di-text-emerald { color: var(--emerald); }
.di-text-amber { color: var(--amber); }
.di-text-red { color: #dc2626; }
.di-text-teal { color: #0d9488; }

.di-file-input {
  margin: 0.75rem 0;
  font-size: 0.85rem;
}

.di-pending-list { list-style: none; padding: 0; margin: 0 0 1rem; }
.di-pending-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}
.di-filename { flex: 1; min-width: 120px; font-size: 0.85rem; }
.di-select {
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-family: inherit;
  font-size: 0.8rem;
}

.di-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.di-chip {
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
}
.di-chip-on {
  background: var(--navy);
  color: #f8fafc;
  border-color: var(--navy);
}

.di-toggle { display: flex; gap: 0.4rem; }
.di-toggle-btn {
  flex: 1;
  padding: 0.45rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
}
.di-toggle-on {
  background: rgba(20, 184, 166, 0.15);
  border-color: var(--teal);
  color: #0f766e;
  font-weight: 600;
}

.di-input, .di-textarea {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
}
.di-textarea { resize: vertical; }

.di-actions { margin-top: 1.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.di-actions-footer { padding: 0 1rem 1rem; }

.di-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.di-btn-primary {
  background: var(--teal);
  color: #042f2e;
}
.di-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.di-btn-ghost {
  background: #fff;
  border-color: #cbd5e1;
  color: #334155;
}

.di-doc-dots { margin: 1rem 0; }
.di-dots-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.di-doc-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; font-size: 0.65rem; color: #64748b; max-width: 72px; text-align: center; }
.di-dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: #cbd5e1;
}
.di-dot-pending, .di-dot-processing { background: var(--amber); }
.di-dot-completed { background: var(--emerald); }
.di-dot-failed { background: #dc2626; }

.di-module-bars { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
.di-mod-row { display: flex; align-items: center; gap: 0.75rem; }
.di-mod-label { width: 160px; font-size: 0.78rem; color: #475569; flex-shrink: 0; }
.di-bar-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.di-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--emerald));
  border-radius: 999px;
  transition: width 0.3s ease;
}

.di-timeline { list-style: none; padding: 0; margin: 0; }
.di-timeline-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  align-items: flex-start;
}
.di-timeline-date { font-weight: 700; color: var(--navy); min-width: 100px; font-size: 0.85rem; }
.di-timeline-body { flex: 1; }
.di-timeline-event { margin: 0; font-size: 0.9rem; }

.di-stack { display: flex; flex-direction: column; gap: 0.75rem; }
.di-mb-lg { margin-bottom: 1.5rem; }
.di-mt { margin-top: 1rem; }

.di-card-amber, .di-card-red, .di-card-neutral {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  font-size: 0.88rem;
}
.di-card-amber { border-left: 4px solid var(--amber); background: #fffbeb; }
.di-card-red { border-left: 4px solid #f87171; background: #fef2f2; }

.di-row-spread { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }

.di-badge {
  display: inline-block;
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  margin-right: 0.35rem;
}
.di-badge-ghost { background: transparent; border: 1px solid #cbd5e1; }
.di-sev-high { background: #fee2e2; color: #991b1b; }
.di-sev-medium { background: #ffedd5; color: #9a3412; }
.di-sev-low { background: #e0e7ff; color: #3730a3; }

.di-explain { margin-top: 0.5rem; padding: 0.5rem; background: #fff; border-radius: 6px; font-size: 0.85rem; }

.di-subblock { margin-top: 0.75rem; }
.di-nested { padding: 0.5rem; background: #f8fafc; border-radius: 6px; margin-top: 0.35rem; }

.di-strategy ul { margin: 0.25rem 0 0; padding-left: 1.1rem; font-size: 0.88rem; }
.di-strategy > div { margin-bottom: 1rem; }

.di-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.di-table th, .di-table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; }
.di-table th { color: #64748b; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; }

.di-status-dot { font-size: 0.75rem; font-weight: 600; }
.di-st-pending, .di-st-processing { color: var(--amber); }
.di-st-completed { color: var(--emerald); }
.di-st-failed { color: #dc2626; }

.di-search-form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.di-search-form .di-input { flex: 1; min-width: 200px; }

.di-export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.di-export-card {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.25rem;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s;
}
.di-export-card:hover { border-color: var(--teal); }
.di-export-icon {
  display: inline-block;
  font-weight: 800;
  color: var(--teal);
  margin-bottom: 0.35rem;
}
.di-export-title { display: block; font-weight: 700; color: var(--navy); }
.di-pill {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #e2e8f0;
}
.di-pill-outline { background: transparent; border: 1px solid #cbd5e1; }

.di-loading {
  min-height: 100vh;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
}
.di-loading-inner { text-align: center; }
.di-spinner-lg {
  width: 40px; height: 40px;
  border: 3px solid rgba(148, 163, 184, 0.3);
  border-top-color: var(--teal);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: di-spin 0.8s linear infinite;
}
@keyframes di-spin { to { transform: rotate(360deg); } }
`;
