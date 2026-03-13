'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { useAuthStore, useCaseStore } from '@/lib/store';
import { casesApi, documentsApi, analysisApi, searchApi } from '@/lib/api';
import { Document, TimelineEvent, Contradiction, ImpeachmentOpportunity, EvidenceSignal, DepositionAnalysis, CaseStrategy, SearchResult } from '@discoveryintel/shared';
import { Upload, FileText, Calendar, AlertTriangle, Target, Search as SearchIcon, TrendingUp, Loader2 } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';

export default function CasePage() {
  const params = useParams();
  const caseId = params.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentCase, setCurrentCase } = useCaseStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [impeachment, setImpeachment] = useState<ImpeachmentOpportunity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSignal[]>([]);
  const [deposition, setDeposition] = useState<DepositionAnalysis[]>([]);
  const [strategy, setStrategy] = useState<CaseStrategy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadCaseData();
  }, [user, caseId, router]);

  const loadCaseData = async () => {
    try {
      const [caseResponse, docsResponse] = await Promise.all([
        casesApi.get(caseId),
        documentsApi.list(caseId)
      ]);

      setCurrentCase(caseResponse.data.case);
      setDocuments(docsResponse.data.documents);

      loadAnalysisResults();
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisResults = async () => {
    try {
      const [timelineRes, contradictionsRes, impeachmentRes, evidenceRes, depositionRes, strategyRes] = await Promise.all([
        analysisApi.getTimeline(caseId).catch(() => ({ data: { events: [] } })),
        analysisApi.getContradictions(caseId).catch(() => ({ data: { contradictions: [] } })),
        analysisApi.getImpeachment(caseId).catch(() => ({ data: { opportunities: [] } })),
        analysisApi.getEvidence(caseId).catch(() => ({ data: { signals: [] } })),
        analysisApi.getDeposition(caseId).catch(() => ({ data: { analyses: [] } })),
        analysisApi.getStrategy(caseId).catch(() => ({ data: null }))
      ]);

      setTimeline(timelineRes.data.events || []);
      setContradictions(contradictionsRes.data.contradictions || []);
      setImpeachment(impeachmentRes.data.opportunities || []);
      setEvidence(evidenceRes.data.signals || []);
      setDeposition(depositionRes.data.analyses || []);
      setStrategy(strategyRes.data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await documentsApi.upload(caseId, file);
      await loadCaseData();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await searchApi.search(caseId, searchQuery);
      setSearchResults(response.data.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-slate-600">Loading case...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{currentCase?.case_name}</h1>
          {currentCase?.description && (
            <p className="text-slate-600 mt-2">{currentCase.description}</p>
          )}
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Discovery Documents</CardTitle>
              <CardDescription>Upload PDF, DOCX, or TXT files for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Uploaded Documents ({documents.length})
                </p>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(doc.file_size)} • {formatDate(doc.upload_date)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        doc.processing_status === 'completed' ? 'success' :
                        doc.processing_status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {doc.processing_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="contradictions">Contradictions</TabsTrigger>
            <TabsTrigger value="impeachment">Impeachment</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="deposition">Deposition</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Timeline Events</CardTitle>
                  <CardDescription>{timeline.length} events identified</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle>Contradictions</CardTitle>
                  <CardDescription>{contradictions.length} found</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle>Impeachment</CardTitle>
                  <CardDescription>{impeachment.length} opportunities</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <SearchIcon className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Evidence Signals</CardTitle>
                  <CardDescription>{evidence.length} signals detected</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Depositions</CardTitle>
                  <CardDescription>{deposition.length} analyzed</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Case Strategy</CardTitle>
                  <CardDescription>{strategy ? 'Generated' : 'Pending'}</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {strategy && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Case Strategy Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {strategy.case_strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-slate-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Weaknesses</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {strategy.case_weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm text-slate-700">{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Key Leverage Points</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {strategy.key_leverage_points.map((point, i) => (
                        <li key={i} className="text-sm text-slate-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Case Timeline</CardTitle>
                <CardDescription>Chronological events extracted from discovery</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No timeline events yet. Upload documents to generate timeline.</p>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((event, i) => (
                      <div key={i} className="border-l-4 border-blue-600 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{event.date}</p>
                            <p className="text-slate-700 mt-1">{event.event}</p>
                            <p className="text-sm text-slate-500 mt-1">Source: {event.document_source}</p>
                          </div>
                          <Badge variant="outline">
                            {Math.round(event.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contradictions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contradictions</CardTitle>
                <CardDescription>Conflicting statements across documents</CardDescription>
              </CardHeader>
              <CardContent>
                {contradictions.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No contradictions detected yet.</p>
                ) : (
                  <div className="space-y-6">
                    {contradictions.map((contradiction) => (
                      <div key={contradiction.id} className="border rounded-lg p-4 bg-orange-50">
                        <Badge variant={
                          contradiction.severity === 'high' ? 'destructive' :
                          contradiction.severity === 'medium' ? 'warning' :
                          'secondary'
                        } className="mb-3">
                          {contradiction.severity.toUpperCase()}
                        </Badge>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Statement A:</p>
                            <p className="text-slate-900 mt-1">{contradiction.statement_a}</p>
                            <p className="text-xs text-slate-500 mt-1">Source: {contradiction.source_a}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Statement B:</p>
                            <p className="text-slate-900 mt-1">{contradiction.statement_b}</p>
                            <p className="text-xs text-slate-500 mt-1">Source: {contradiction.source_b}</p>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <p className="text-sm font-medium text-slate-700">Analysis:</p>
                            <p className="text-slate-700 mt-1">{contradiction.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impeachment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impeachment Opportunities</CardTitle>
                <CardDescription>Witness statements contradicted by evidence</CardDescription>
              </CardHeader>
              <CardContent>
                {impeachment.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No impeachment opportunities identified yet.</p>
                ) : (
                  <div className="space-y-6">
                    {impeachment.map((opp) => (
                      <div key={opp.id} className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-slate-900">Witness: {opp.witness}</h4>
                          <Badge variant={
                            opp.strength === 'high' ? 'destructive' :
                            opp.strength === 'medium' ? 'warning' :
                            'secondary'
                          }>
                            {opp.strength.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Statement:</p>
                            <p className="text-slate-900 mt-1">{opp.statement}</p>
                            {opp.page_reference && (
                              <p className="text-xs text-slate-500 mt-1">Page: {opp.page_reference}</p>
                            )}
                          </div>
                          <div className="bg-white p-3 rounded">
                            <p className="text-sm font-medium text-slate-700">Contradicting Evidence:</p>
                            <p className="text-slate-700 mt-1">{opp.contradicting_evidence}</p>
                            <p className="text-xs text-slate-500 mt-1">Source: {opp.document_source}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Signals</CardTitle>
                <CardDescription>Key evidence detected in discovery</CardDescription>
              </CardHeader>
              <CardContent>
                {evidence.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No evidence signals detected yet.</p>
                ) : (
                  <div className="space-y-4">
                    {evidence.map((signal) => (
                      <div key={signal.id} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={
                            signal.importance === 'critical' ? 'destructive' :
                            signal.importance === 'high' ? 'warning' :
                            'secondary'
                          }>
                            {signal.signal_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{signal.importance}</Badge>
                        </div>
                        <p className="text-slate-900 mb-2">{signal.description}</p>
                        <p className="text-xs text-slate-500">
                          Source: {signal.document_source}
                          {signal.page_reference && ` • Page: ${signal.page_reference}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposition" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Deposition Analysis</CardTitle>
                <CardDescription>Analysis of deposition transcripts</CardDescription>
              </CardHeader>
              <CardContent>
                {deposition.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No depositions analyzed yet.</p>
                ) : (
                  <div className="space-y-8">
                    {deposition.map((dep) => (
                      <div key={dep.id} className="border rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">
                          Witness: {dep.witness}
                        </h4>

                        {dep.key_admissions.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-green-700 mb-2">Key Admissions</h5>
                            <div className="space-y-2">
                              {dep.key_admissions.map((admission, i) => (
                                <div key={i} className="bg-green-50 p-3 rounded">
                                  <p className="text-sm text-slate-900">{admission.statement}</p>
                                  <p className="text-xs text-slate-600 mt-1">{admission.analysis}</p>
                                  <p className="text-xs text-slate-500 mt-1">Page: {admission.page_reference}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {dep.contradictions.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-orange-700 mb-2">Contradictions</h5>
                            <div className="space-y-2">
                              {dep.contradictions.map((contradiction, i) => (
                                <div key={i} className="bg-orange-50 p-3 rounded">
                                  <p className="text-sm text-slate-900">{contradiction.statement}</p>
                                  <p className="text-xs text-slate-600 mt-1">{contradiction.analysis}</p>
                                  <p className="text-xs text-slate-500 mt-1">Page: {contradiction.page_reference}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {dep.evasive_answers.length > 0 && (
                          <div>
                            <h5 className="font-medium text-red-700 mb-2">Evasive Answers</h5>
                            <div className="space-y-2">
                              {dep.evasive_answers.map((evasive, i) => (
                                <div key={i} className="bg-red-50 p-3 rounded">
                                  <p className="text-sm text-slate-900">{evasive.statement}</p>
                                  <p className="text-xs text-slate-600 mt-1">{evasive.analysis}</p>
                                  <p className="text-xs text-slate-500 mt-1">Page: {evasive.page_reference}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Semantic Search</CardTitle>
                <CardDescription>Search across all discovery documents</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="What contradicts the engineer report?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={searching}>
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map((result, i) => (
                      <div key={i} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-slate-900">{result.document_name}</p>
                          <Badge variant="outline">
                            {Math.round(result.similarity_score * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">{result.chunk_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
