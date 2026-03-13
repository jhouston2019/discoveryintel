import { TimelineGenerator } from './timelineGenerator';
import { ContradictionDetector } from './contradictionDetector';
import { ImpeachmentFinder } from './impeachmentFinder';
import { EvidenceExtractor } from './evidenceExtractor';
import { DepositionAnalyzer } from './depositionAnalyzer';
import { StrategyGenerator } from './strategyGenerator';

export class AnalysisOrchestrator {
  private timelineGenerator: TimelineGenerator;
  private contradictionDetector: ContradictionDetector;
  private impeachmentFinder: ImpeachmentFinder;
  private evidenceExtractor: EvidenceExtractor;
  private depositionAnalyzer: DepositionAnalyzer;
  private strategyGenerator: StrategyGenerator;

  constructor() {
    this.timelineGenerator = new TimelineGenerator();
    this.contradictionDetector = new ContradictionDetector();
    this.impeachmentFinder = new ImpeachmentFinder();
    this.evidenceExtractor = new EvidenceExtractor();
    this.depositionAnalyzer = new DepositionAnalyzer();
    this.strategyGenerator = new StrategyGenerator();
  }

  async runFullAnalysis(caseId: string): Promise<void> {
    console.log(`Starting full analysis for case ${caseId}`);

    try {
      console.log('Generating timeline...');
      await this.timelineGenerator.generateTimeline(caseId);

      console.log('Detecting contradictions...');
      await this.contradictionDetector.detectContradictions(caseId);

      console.log('Finding impeachment opportunities...');
      await this.impeachmentFinder.findImpeachmentOpportunities(caseId);

      console.log('Extracting evidence signals...');
      await this.evidenceExtractor.extractEvidenceSignals(caseId);

      console.log('Analyzing depositions...');
      await this.depositionAnalyzer.analyzeDepositions(caseId);

      console.log('Generating case strategy...');
      await this.strategyGenerator.generateCaseStrategy(caseId);

      console.log(`Full analysis complete for case ${caseId}`);
    } catch (error) {
      console.error('Analysis orchestration error:', error);
      throw error;
    }
  }
}
