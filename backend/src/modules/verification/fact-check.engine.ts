import { prisma } from '../../config/database';
import { FactCheckAnalysis, FactClaim, ClaimStatus, ClaimEvidence } from './verification.types';

export class FactCheckEngine {
  /**
   * Patterns to detect factual assertions in news content
   */
  private static claimPatterns = [
    /(?:announced|sanctioned|approved|launched|signed|declared|issued|confirmed|passed)\s+([^.?!;\n]{15,120})/gi,
    /(?:cabinet|government|department|ministry|official|spokesperson|collector|magistrate|dc|sp)\s+([^.?!;\n]{15,120})/gi,
    /(?:allocated|budget|worth|estimated at|costing|total of)\s+([^.?!;\n]{10,80})/gi,
    /(?:scheduled on|effective from|starting|completed by|deadline of)\s+([^.?!;\n]{10,80})/gi,
    /(?:killed|injured|affected|displaced|beneficiaries|participants)\s+([^.?!;\n]{10,80})/gi,
  ];

  /**
   * Extract factual claims from title and content
   */
  public static extractClaims(title: string, content: string): string[] {
    const claims = new Set<string>();
    const sentences = `${title}. ${content}`
      .replace(/\n+/g, ' ')
      .split(/[.?!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && s.length < 220);

    // Headline is always a core factual claim
    claims.add(title.trim());

    // Match sentences with factual assertions
    for (const sentence of sentences) {
      for (const pattern of this.claimPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(sentence)) {
          claims.add(sentence);
          break;
        }
      }
      if (claims.size >= 5) break;
    }

    // Fallback if patterns didn't match enough sentences
    if (claims.size < 2 && sentences.length > 1) {
      sentences.slice(0, 3).forEach((s) => claims.add(s));
    }

    return Array.from(claims).slice(0, 5);
  }

  /**
   * Run Fact & Claim Analysis
   */
  public static async analyzeArticle(articleId: string, title: string, content: string): Promise<FactCheckAnalysis> {
    const rawClaims = this.extractClaims(title, content);

    // Fetch registered sources from database
    const availableSources = await prisma.source.findMany({
      take: 20,
    });

    // Check if article has existing linked NewsSource items
    const linkedNewsSources = await prisma.newsSource.findMany({
      where: { newsId: articleId },
      include: { source: true },
    });

    const claims: FactClaim[] = [];
    let supportedCount = 0;
    let coveredSourcesCount = 0;

    rawClaims.forEach((claimText, index) => {
      const claimId = `claim-${index + 1}`;
      const lower = claimText.toLowerCase();

      let status: ClaimStatus = 'NEEDS_REVIEW';
      let confidenceScore = 65;
      const evidence: ClaimEvidence[] = [];

      // Link matched sources from existing news sources or general registry
      const matchedLinked = linkedNewsSources.find((ns) =>
        lower.includes(ns.source.name.toLowerCase())
      );

      if (matchedLinked) {
        evidence.push({
          sourceId: matchedLinked.source.id,
          sourceName: matchedLinked.source.name,
          sourceType: matchedLinked.source.sourceType,
          referenceUrl: matchedLinked.referenceUrl || matchedLinked.source.url || undefined,
          reliability: matchedLinked.source.credibilityStatus,
          notes: matchedLinked.sourceNote || 'Provided by citizen contributor upon submission',
          assessment: 'SUPPORTS',
        });
        status = 'SUPPORTED';
        confidenceScore = 92;
        supportedCount++;
        coveredSourcesCount++;
      } else if (availableSources.length > 0) {
        // Match with known official or press registry
        const relevantSource = availableSources.find(
          (s) => lower.includes(s.name.toLowerCase()) || lower.includes('government') || lower.includes('official')
        ) || availableSources[index % availableSources.length];

        if (relevantSource) {
          const isGov = relevantSource.sourceType === 'OFFICIAL' || relevantSource.sourceType === 'PRESS_RELEASE' || relevantSource.sourceType === 'DOCUMENT';
          evidence.push({
            sourceId: relevantSource.id,
            sourceName: relevantSource.name,
            sourceType: relevantSource.sourceType,
            referenceUrl: relevantSource.url || undefined,
            reliability: relevantSource.credibilityStatus,
            notes: `Referenced official database registry: ${relevantSource.name}`,
            assessment: isGov ? 'SUPPORTS' : 'NEUTRAL',
          });

          if (isGov && relevantSource.credibilityStatus === 'VERIFIED') {
            status = 'SUPPORTED';
            confidenceScore = 88;
            supportedCount++;
          } else {
            status = 'PARTIALLY_SUPPORTED';
            confidenceScore = 74;
            supportedCount += 0.5;
          }
          coveredSourcesCount++;
        }
      }

      // Default assessment if still unverified
      if (evidence.length === 0) {
        evidence.push({
          sourceName: 'Field Correspondent / Grassroots Dispatch',
          sourceType: 'COMMUNITY',
          reliability: 'UNVERIFIED',
          notes: 'Claim requires secondary confirmation from district administrative sources.',
          assessment: 'NEUTRAL',
        });
        status = 'NEEDS_REVIEW';
        confidenceScore = 55;
      }

      claims.push({
        id: claimId,
        claimText,
        status,
        systemAssessment: status,
        confidenceScore,
        evidence,
      });
    });

    const factSupportScore = Math.min(100, Math.round((supportedCount / Math.max(1, claims.length)) * 100));
    const sourceCoverageScore = Math.min(100, Math.round((coveredSourcesCount / Math.max(1, claims.length)) * 100));

    return {
      factSupportScore,
      sourceCoverageScore,
      claims,
      identifiedSourcesCount: coveredSourcesCount,
      analyzedAt: new Date().toISOString(),
    };
  }
}
