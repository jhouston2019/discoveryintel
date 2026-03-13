'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, Search, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">DiscoveryIntel</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          AI Litigation Intelligence
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Upload discovery files and uncover timelines, contradictions, and evidence signals instantly.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Analysis
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Powerful Litigation Intelligence
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Case Timeline</CardTitle>
              <CardDescription>
                Automatically extract and organize events chronologically from all discovery documents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Contradiction Detection</CardTitle>
              <CardDescription>
                Identify conflicts between statements across depositions, emails, and reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>Impeachment Opportunities</CardTitle>
              <CardDescription>
                Find witness statements contradicted by documentary evidence
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Search className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Evidence Signals</CardTitle>
              <CardDescription>
                Detect admissions, inconsistencies, and suspicious communications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Deposition Analysis</CardTitle>
              <CardDescription>
                Analyze transcripts for key admissions, contradictions, and evasive answers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Case Strategy</CardTitle>
              <CardDescription>
                Generate strategic insights with strengths, weaknesses, and leverage points
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          How It Works
        </h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Create Case</h3>
            <p className="text-sm text-slate-600">Set up a new litigation case</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-slate-600">Upload discovery files</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
            <p className="text-sm text-slate-600">System processes and analyzes</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">View Intelligence</h3>
            <p className="text-sm text-slate-600">Access insights and search</p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2026 DiscoveryIntel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
