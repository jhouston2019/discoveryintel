'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Calendar, AlertTriangle, Target, Search, FileText, ArrowLeft } from 'lucide-react';

const demoTimeline = [
  { date: '2024-01-15', event: 'Initial property inspection conducted', source: 'Inspection Report.pdf', confidence: 0.95 },
  { date: '2024-01-18', event: 'Wind damage assessment completed', source: 'Engineer Report.pdf', confidence: 0.92 },
  { date: '2024-02-03', event: 'Insurance claim filed by homeowner', source: 'Claim Documents.pdf', confidence: 0.98 },
  { date: '2024-02-20', event: 'Adjuster site visit and evaluation', source: 'Adjuster Notes.pdf', confidence: 0.90 },
  { date: '2024-03-10', event: 'Claim denial issued', source: 'Denial Letter.pdf', confidence: 0.99 }
];

const demoContradictions = [
  {
    id: '1',
    statement_a: 'The roof damage was caused by normal wear and tear over time',
    statement_b: 'Inspection photos show clear impact damage consistent with wind-blown debris',
    source_a: 'Adjuster Report.pdf',
    source_b: 'Engineer Report.pdf',
    severity: 'high' as const,
    explanation: 'The adjuster conclusion contradicts the physical evidence documented by the independent engineer'
  },
  {
    id: '2',
    statement_a: 'No visible damage was observed during the February inspection',
    statement_b: 'Multiple shingles were missing and underlayment was exposed',
    source_a: 'Adjuster Notes.pdf',
    source_b: 'Inspection Photos.pdf',
    severity: 'high' as const,
    explanation: 'Photographic evidence directly contradicts the adjuster written assessment'
  }
];

const demoImpeachment = [
  {
    id: '1',
    witness: 'John Smith (Insurance Adjuster)',
    statement: 'I conducted a thorough inspection and found no evidence of storm damage',
    contradicting_evidence: 'Timestamped photos from the same date show the adjuster spent only 12 minutes on site, insufficient for a thorough roof inspection',
    source: 'Site Visit Log.pdf',
    page_reference: 'Page 3',
    strength: 'high' as const
  }
];

const demoEvidence = [
  {
    id: '1',
    type: 'admission' as const,
    description: 'Internal email acknowledges that claim was denied to meet quarterly loss ratio targets',
    source: 'Email Chain.pdf',
    importance: 'critical' as const
  },
  {
    id: '2',
    type: 'inconsistency' as const,
    description: 'Adjuster report date is after the denial letter date, suggesting retroactive justification',
    source: 'Document Metadata.pdf',
    importance: 'high' as const
  },
  {
    id: '3',
    type: 'suspicious_communication' as const,
    description: 'Regional manager instructed adjuster to "find reasons to deny" before inspection',
    source: 'Internal Memo.pdf',
    importance: 'critical' as const
  }
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">DiscoveryIntel</span>
            <Badge variant="secondary">DEMO</Badge>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Smith v. ABC Insurance Co.</h1>
          <p className="text-slate-600 mt-2">Property damage insurance dispute</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Demo Case Documents</CardTitle>
            <CardDescription>Sample discovery files (5 documents processed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Inspection Report.pdf', 'Engineer Report.pdf', 'Adjuster Notes.pdf', 'Email Chain.pdf', 'Denial Letter.pdf'].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">{doc}</p>
                  </div>
                  <Badge variant="success">completed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="contradictions">Contradictions</TabsTrigger>
            <TabsTrigger value="impeachment">Impeachment</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Timeline Events</CardTitle>
                  <CardDescription>{demoTimeline.length} events identified</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle>Contradictions</CardTitle>
                  <CardDescription>{demoContradictions.length} found</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle>Impeachment</CardTitle>
                  <CardDescription>{demoImpeachment.length} opportunities</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Search className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Evidence Signals</CardTitle>
                  <CardDescription>{demoEvidence.length} signals detected</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Case Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li className="text-sm text-slate-700">Clear photographic evidence of wind damage</li>
                    <li className="text-sm text-slate-700">Independent engineer report supports claim</li>
                    <li className="text-sm text-slate-700">Internal emails show bad faith claim handling</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Weaknesses</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li className="text-sm text-slate-700">Some pre-existing roof wear documented</li>
                    <li className="text-sm text-slate-700">Claim filed 3 weeks after storm event</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Key Leverage Points</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li className="text-sm text-slate-700">Adjuster spent insufficient time on inspection</li>
                    <li className="text-sm text-slate-700">Internal pressure to deny claims for financial targets</li>
                    <li className="text-sm text-slate-700">Multiple contradictions in adjuster testimony</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoTimeline.map((event, i) => (
                    <div key={i} className="border-l-4 border-blue-600 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{event.date}</p>
                          <p className="text-slate-700 mt-1">{event.event}</p>
                          <p className="text-sm text-slate-500 mt-1">Source: {event.source}</p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(event.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contradictions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contradictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {demoContradictions.map((contradiction) => (
                    <div key={contradiction.id} className="border rounded-lg p-4 bg-orange-50">
                      <Badge variant="destructive" className="mb-3">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impeachment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impeachment Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {demoImpeachment.map((opp) => (
                    <div key={opp.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">Witness: {opp.witness}</h4>
                        <Badge variant="destructive">{opp.strength.toUpperCase()}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Statement:</p>
                          <p className="text-slate-900 mt-1">{opp.statement}</p>
                          <p className="text-xs text-slate-500 mt-1">{opp.page_reference}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-sm font-medium text-slate-700">Contradicting Evidence:</p>
                          <p className="text-slate-700 mt-1">{opp.contradicting_evidence}</p>
                          <p className="text-xs text-slate-500 mt-1">Source: {opp.source}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoEvidence.map((signal) => (
                    <div key={signal.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={signal.importance === 'critical' ? 'destructive' : 'warning'}>
                          {signal.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{signal.importance}</Badge>
                      </div>
                      <p className="text-slate-900 mb-2">{signal.description}</p>
                      <p className="text-xs text-slate-500">Source: {signal.source}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Ready to analyze your own cases?
              </h3>
              <p className="text-slate-600 mb-4">
                Sign up now to upload your discovery documents and generate litigation intelligence
              </p>
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
