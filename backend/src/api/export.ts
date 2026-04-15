import express from 'express';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);

async function verifyUserOwnsCase(caseId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('cases')
    .select('user_id')
    .eq('id', caseId)
    .single();

  return !error && !!data && data.user_id === userId;
}

async function getAnalysisResult(caseId: string, analysisType: string): Promise<unknown | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_results')
    .select('result_json')
    .eq('case_id', caseId)
    .eq('analysis_type', analysisType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.result_json;
}

function safeFilenamePart(name: string): string {
  const s = name.replace(/[^\w\- .]/g, '_').trim().slice(0, 80);
  return s || 'Case';
}

async function fetchExportPayload(caseId: string, userId: string) {
  if (!(await verifyUserOwnsCase(caseId, userId))) {
    throw new AppError('Case not found or unauthorized', 404);
  }

  const { data: caseRow, error: ce } = await supabaseAdmin
    .from('cases')
    .select('case_name')
    .eq('id', caseId)
    .eq('user_id', userId)
    .single();

  if (ce || !caseRow) {
    throw new AppError('Case not found', 404);
  }

  const [timeline, contradictions, impeachment, evidence, strategy] = await Promise.all([
    getAnalysisResult(caseId, 'timeline'),
    getAnalysisResult(caseId, 'contradictions'),
    getAnalysisResult(caseId, 'impeachment'),
    getAnalysisResult(caseId, 'evidence'),
    getAnalysisResult(caseId, 'strategy'),
  ]);

  const events = (timeline as { events?: unknown[] })?.events ?? [];
  const contradictionsList =
    (contradictions as { contradictions?: unknown[] })?.contradictions ?? [];
  const opportunities = (impeachment as { opportunities?: unknown[] })?.opportunities ?? [];
  const signals = (evidence as { signals?: unknown[] })?.signals ?? [];
  const strat = (strategy as Record<string, unknown>) || {};

  return { caseRow, events, contradictionsList, opportunities, signals, strat };
}

router.get('/:caseId/pdf', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;
    const { caseRow, events, contradictionsList, opportunities, signals, strat } =
      await fetchExportPayload(caseId, req.userId!);

    const baseName = safeFilenamePart(caseRow.case_name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DiscoveryIntel-${baseName}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(22).fillColor('#0f172a').text('DiscoveryIntel', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Case: ${caseRow.case_name}`, { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }), { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).fillColor('#0f172a').text('Confidential — Attorney Work Product', { align: 'center' });
    doc.addPage();

    doc.fontSize(16).fillColor('#0f172a').text('Section 1: Case Timeline', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    if (events.length === 0) {
      doc.fillColor('#334155').text('No timeline events on file.');
    } else {
      const sorted = [...events].sort((a, b) =>
        String((a as { date?: string }).date || '').localeCompare(
          String((b as { date?: string }).date || '')
        )
      );
      for (const ev of sorted) {
        const row = ev as { date?: string; event?: string; document_source?: string };
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(String(row.date || '—'));
        doc.font('Helvetica').fillColor('#1e293b').text(String(row.event || ''));
        if (row.document_source) {
          doc.fontSize(9).fillColor('#64748b').text(`Source: ${row.document_source}`);
        }
        doc.fontSize(10).moveDown(0.5);
      }
    }
    doc.addPage();

    doc.fontSize(16).fillColor('#0f172a').text('Section 2: Contradictions', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    if (contradictionsList.length === 0) {
      doc.fillColor('#334155').text('No contradictions on file.');
    } else {
      for (const c of contradictionsList) {
        const row = c as {
          severity?: string;
          statement_a?: string;
          statement_b?: string;
          source_a?: string;
          source_b?: string;
          explanation?: string;
        };
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(`Severity: ${String(row.severity || '—')}`);
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text('Statement A:');
        doc.text(`  ${String(row.statement_a || '')}`);
        doc.text(`  Source A: ${String(row.source_a || '')}`);
        doc.text('Statement B:');
        doc.text(`  ${String(row.statement_b || '')}`);
        doc.text(`  Source B: ${String(row.source_b || '')}`);
        doc.text(`Analysis: ${String(row.explanation || '')}`);
        doc.moveDown();
      }
    }
    doc.addPage();

    doc.fontSize(16).fillColor('#0f172a').text('Section 3: Impeachment Opportunities', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    if (opportunities.length === 0) {
      doc.fillColor('#334155').text('No impeachment opportunities on file.');
    } else {
      for (const o of opportunities) {
        const row = o as {
          witness?: string;
          statement?: string;
          contradicting_evidence?: string;
          document_source?: string;
        };
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(`Witness: ${String(row.witness || '')}`);
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text(`Statement: ${String(row.statement || '')}`);
        doc.text(`Contradicting evidence: ${String(row.contradicting_evidence || '')}`);
        doc.text(`Source: ${String(row.document_source || '')}`);
        doc.moveDown();
      }
    }
    doc.addPage();

    doc.fontSize(16).fillColor('#0f172a').text('Section 4: Evidence Signals', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    if (signals.length === 0) {
      doc.fillColor('#334155').text('No evidence signals on file.');
    } else {
      for (const s of signals) {
        const row = s as { signal_type?: string; description?: string; document_source?: string };
        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .text(String(row.signal_type || 'signal').replace(/_/g, ' '));
        doc.font('Helvetica').fillColor('#1e293b').text(String(row.description || ''));
        doc.fontSize(9).fillColor('#64748b').text(`Source: ${String(row.document_source || '')}`);
        doc.fontSize(10).moveDown();
      }
    }
    doc.addPage();

    doc.fontSize(16).fillColor('#0f172a').text('Section 5: Case Strategy', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    const strengths = (strat.case_strengths as string[] | undefined) ?? [];
    const weaknesses = (strat.case_weaknesses as string[] | undefined) ?? [];
    const leverage = (strat.key_leverage_points as string[] | undefined) ?? [];
    if (!strengths.length && !weaknesses.length && !leverage.length) {
      doc.fillColor('#334155').text('No strategy on file.');
    } else {
      doc.fillColor('#0f172a').font('Helvetica-Bold').text('Strengths');
      doc.font('Helvetica').fillColor('#1e293b');
      strengths.forEach((x) => doc.text(`• ${x}`));
      doc.moveDown();
      doc.font('Helvetica-Bold').fillColor('#0f172a').text('Weaknesses');
      doc.font('Helvetica');
      weaknesses.forEach((x) => doc.text(`• ${x}`));
      doc.moveDown();
      doc.font('Helvetica-Bold').fillColor('#0f172a').text('Key leverage points');
      doc.font('Helvetica');
      leverage.forEach((x) => doc.text(`• ${x}`));
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

router.get('/:caseId/docx', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;
    const { caseRow, events, contradictionsList, opportunities, signals, strat } =
      await fetchExportPayload(caseId, req.userId!);

    const baseName = safeFilenamePart(caseRow.case_name);
    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'DiscoveryIntel', bold: true, size: 36 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: caseRow.case_name, size: 28, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Confidential — Attorney Work Product', italics: true })],
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Section 1: Case Timeline' })],
      }),
    ];

    if (events.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'No timeline events on file.' })] }));
    } else {
      const sorted = [...events].sort((a, b) =>
        String((a as { date?: string }).date || '').localeCompare(
          String((b as { date?: string }).date || '')
        )
      );
      for (const ev of sorted) {
        const row = ev as { date?: string; event?: string; document_source?: string };
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${row.date || '—'}: `, bold: true }),
              new TextRun({ text: row.event || '' }),
            ],
          })
        );
        if (row.document_source) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Source: ${row.document_source}`, size: 20 })],
            })
          );
        }
      }
    }

    children.push(
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Section 2: Contradictions' })],
      })
    );
    if (contradictionsList.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'No contradictions on file.' })] }));
    } else {
      for (const c of contradictionsList) {
        const row = c as {
          severity?: string;
          statement_a?: string;
          statement_b?: string;
          source_a?: string;
          source_b?: string;
          explanation?: string;
        };
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Severity: ${row.severity || '—'}`, bold: true })],
          }),
          new Paragraph({ children: [new TextRun({ text: 'Statement A:', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: row.statement_a || '' })] }),
          new Paragraph({ children: [new TextRun({ text: `Source A: ${row.source_a || ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: 'Statement B:', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: row.statement_b || '' })] }),
          new Paragraph({ children: [new TextRun({ text: `Source B: ${row.source_b || ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Analysis: ${row.explanation || ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: '' })] })
        );
      }
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Section 3: Impeachment Opportunities' })],
      })
    );
    if (opportunities.length === 0) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'No impeachment opportunities on file.' })] })
      );
    } else {
      for (const o of opportunities) {
        const row = o as {
          witness?: string;
          statement?: string;
          contradicting_evidence?: string;
          document_source?: string;
        };
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Witness: ${row.witness || ''}`, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Statement: ${row.statement || ''}` })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Contradicting evidence: ${row.contradicting_evidence || ''}` }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Source: ${row.document_source || ''}` })],
          }),
          new Paragraph({ children: [new TextRun({ text: '' })] })
        );
      }
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Section 4: Evidence Signals' })],
      })
    );
    if (signals.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'No evidence signals on file.' })] }));
    } else {
      for (const s of signals) {
        const row = s as { signal_type?: string; description?: string; document_source?: string };
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: String(row.signal_type || 'signal').replace(/_/g, ' '),
                bold: true,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: row.description || '' })] }),
          new Paragraph({
            children: [new TextRun({ text: `Source: ${row.document_source || ''}` })],
          }),
          new Paragraph({ children: [new TextRun({ text: '' })] })
        );
      }
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Section 5: Case Strategy' })],
      })
    );
    const strengths = (strat.case_strengths as string[] | undefined) ?? [];
    const weaknesses = (strat.case_weaknesses as string[] | undefined) ?? [];
    const leverage = (strat.key_leverage_points as string[] | undefined) ?? [];
    if (!strengths.length && !weaknesses.length && !leverage.length) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'No strategy on file.' })] }));
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Strengths', bold: true })] }));
      strengths.forEach((x) =>
        children.push(new Paragraph({ children: [new TextRun({ text: `• ${x}` })] }))
      );
      children.push(new Paragraph({ children: [new TextRun({ text: 'Weaknesses', bold: true })] }));
      weaknesses.forEach((x) =>
        children.push(new Paragraph({ children: [new TextRun({ text: `• ${x}` })] }))
      );
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Key leverage points', bold: true })] })
      );
      leverage.forEach((x) =>
        children.push(new Paragraph({ children: [new TextRun({ text: `• ${x}` })] }))
      );
    }

    const docxDoc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(docxDoc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="DiscoveryIntel-${baseName}.docx"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

export default router;
