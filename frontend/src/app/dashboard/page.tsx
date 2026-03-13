'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { casesApi } from '@/lib/api';
import { Case } from '@discoveryintel/shared';
import { Plus, FolderOpen, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCase, setShowNewCase] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!user && !storedToken) {
      router.push('/login');
      return;
    }

    loadCases();
  }, [user, router]);

  const loadCases = async () => {
    try {
      const response = await casesApi.list();
      setCases(response.data.cases);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await casesApi.create(caseName, caseDescription);
      setCases([response.data.case, ...cases]);
      setCaseName('');
      setCaseDescription('');
      setShowNewCase(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create case');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Cases</h1>
            <p className="text-slate-600 mt-1">Manage your litigation cases</p>
          </div>
          <Button onClick={() => setShowNewCase(!showNewCase)}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>

        {showNewCase && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Case</CardTitle>
              <CardDescription>Set up a new litigation case</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCase} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="caseName" className="text-sm font-medium">
                    Case Name
                  </label>
                  <Input
                    id="caseName"
                    placeholder="Smith v. ABC Corp"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input
                    id="description"
                    placeholder="Brief case description"
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit">Create Case</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewCase(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No cases yet</h3>
              <p className="text-slate-600 mb-4">Create your first case to get started</p>
              <Button onClick={() => setShowNewCase(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((caseItem) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{caseItem.case_name}</CardTitle>
                    {caseItem.description && (
                      <CardDescription>{caseItem.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(caseItem.created_at)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
