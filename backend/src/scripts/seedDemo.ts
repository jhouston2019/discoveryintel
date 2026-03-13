import { supabaseAdmin } from '../db/supabase';
import bcrypt from 'bcryptjs';

async function seedDemoData() {
  console.log('Seeding demo data...');

  const demoEmail = 'demo@discoveryintel.com';
  const demoPassword = await bcrypt.hash('demo123456', 10);

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', demoEmail)
    .single();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log('Demo user already exists');
  } else {
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({ email: demoEmail, password: demoPassword })
      .select('id')
      .single();

    if (error || !newUser) {
      console.error('Failed to create demo user:', error);
      return;
    }

    userId = newUser.id;
    console.log('Demo user created');
  }

  const { data: demoCase, error: caseError } = await supabaseAdmin
    .from('cases')
    .insert({
      user_id: userId,
      case_name: 'Smith v. ABC Insurance Co. (Demo)',
      description: 'Property damage insurance dispute - Demo case with pre-loaded analysis'
    })
    .select('id')
    .single();

  if (caseError || !demoCase) {
    console.error('Failed to create demo case:', caseError);
    return;
  }

  console.log('Demo case created');

  const timelineAnalysis = {
    events: [
      {
        date: '2024-01-15',
        event: 'Initial property inspection conducted',
        document_source: 'Inspection Report.pdf',
        document_id: 'demo-doc-1',
        confidence: 0.95
      },
      {
        date: '2024-01-18',
        event: 'Wind damage assessment completed by engineer',
        document_source: 'Engineer Report.pdf',
        document_id: 'demo-doc-2',
        confidence: 0.92
      },
      {
        date: '2024-02-03',
        event: 'Insurance claim filed by homeowner',
        document_source: 'Claim Documents.pdf',
        document_id: 'demo-doc-3',
        confidence: 0.98
      },
      {
        date: '2024-02-20',
        event: 'Adjuster site visit and evaluation',
        document_source: 'Adjuster Notes.pdf',
        document_id: 'demo-doc-4',
        confidence: 0.90
      },
      {
        date: '2024-03-10',
        event: 'Claim denial issued',
        document_source: 'Denial Letter.pdf',
        document_id: 'demo-doc-5',
        confidence: 0.99
      }
    ]
  };

  const contradictionsAnalysis = {
    contradictions: [
      {
        id: 'demo-contra-1',
        statement_a: 'The roof damage was caused by normal wear and tear over time',
        statement_b: 'Inspection photos show clear impact damage consistent with wind-blown debris',
        source_a: 'Adjuster Report.pdf',
        source_b: 'Engineer Report.pdf',
        document_id_a: 'demo-doc-4',
        document_id_b: 'demo-doc-2',
        severity: 'high',
        explanation: 'The adjuster conclusion contradicts the physical evidence documented by the independent engineer'
      }
    ]
  };

  const impeachmentAnalysis = {
    opportunities: [
      {
        id: 'demo-imp-1',
        witness: 'John Smith (Insurance Adjuster)',
        statement: 'I conducted a thorough inspection and found no evidence of storm damage',
        contradicting_evidence: 'Site visit logs show adjuster spent only 12 minutes on site',
        document_source: 'Site Visit Log.pdf',
        document_id: 'demo-doc-6',
        page_reference: 'Page 3',
        strength: 'high'
      }
    ]
  };

  const evidenceAnalysis = {
    signals: [
      {
        id: 'demo-ev-1',
        signal_type: 'admission',
        description: 'Internal email acknowledges claim was denied to meet quarterly loss ratio targets',
        document_source: 'Email Chain.pdf',
        document_id: 'demo-doc-7',
        importance: 'critical'
      },
      {
        id: 'demo-ev-2',
        signal_type: 'suspicious_communication',
        description: 'Regional manager instructed adjuster to find reasons to deny before inspection',
        document_source: 'Internal Memo.pdf',
        document_id: 'demo-doc-8',
        importance: 'critical'
      }
    ]
  };

  const strategyAnalysis = {
    case_strengths: [
      'Clear photographic evidence of wind damage',
      'Independent engineer report supports claim',
      'Internal emails show bad faith claim handling',
      'Multiple contradictions in adjuster testimony'
    ],
    case_weaknesses: [
      'Some pre-existing roof wear documented',
      'Claim filed 3 weeks after storm event',
      'No immediate emergency repairs documented'
    ],
    key_leverage_points: [
      'Adjuster spent insufficient time on inspection (12 minutes)',
      'Internal pressure to deny claims for financial targets',
      'Contradiction between adjuster and engineer findings',
      'Evidence of predetermined denial decision'
    ],
    potential_defense_narrative: 'Defense will argue pre-existing damage and delayed reporting indicate the damage was not storm-related. They will emphasize normal wear and tear and question the timing of the claim.',
    recommended_actions: [
      'Depose regional claims manager regarding email directives',
      'Request all internal communications about loss ratios',
      'Obtain weather data for the storm date',
      'Hire roofing expert to rebut wear-and-tear theory',
      'Prepare bad faith claim based on internal emails'
    ]
  };

  await supabaseAdmin.from('analysis_results').insert([
    {
      case_id: demoCase.id,
      analysis_type: 'timeline',
      result_json: timelineAnalysis
    },
    {
      case_id: demoCase.id,
      analysis_type: 'contradictions',
      result_json: contradictionsAnalysis
    },
    {
      case_id: demoCase.id,
      analysis_type: 'impeachment',
      result_json: impeachmentAnalysis
    },
    {
      case_id: demoCase.id,
      analysis_type: 'evidence',
      result_json: evidenceAnalysis
    },
    {
      case_id: demoCase.id,
      analysis_type: 'strategy',
      result_json: strategyAnalysis
    }
  ]);

  console.log('Demo data seeded successfully!');
  console.log(`Demo credentials: ${demoEmail} / demo123456`);
  console.log(`Case ID: ${demoCase.id}`);
}

seedDemoData().catch(console.error);
