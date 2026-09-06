import { prisma } from '../../config/database';
import { OriginalityAnalysis, SimilarStoryMatch, DuplicateClassification } from './verification.types';

export class OriginalityEngine {
  /**
   * Stop words to filter during shingles generation
   */
  private static stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that', 'these', 'those', 'it', 'as',
  ]);

  /**
   * Tokenize text into normalized lower-case words
   */
  public static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.stopWords.has(w));
  }

  /**
   * Generate n-gram shingles (e.g. n = 3)
   */
  public static generateShingles(tokens: string[], n = 3): Set<string> {
    const shingles = new Set<string>();
    for (let i = 0; i <= tokens.length - n; i++) {
      shingles.add(tokens.slice(i, i + n).join(' '));
    }
    return shingles;
  }

  /**
   * Compute Jaccard Similarity between two sets of shingles
   */
  public static computeJaccard(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Classify similarity score into severity level
   */
  public static classifyDuplicate(similarityScore: number): DuplicateClassification {
    if (similarityScore >= 90) return 'EXACT_DUPLICATE';
    if (similarityScore >= 60) return 'HIGHLY_SIMILAR';
    if (similarityScore >= 30) return 'RELATED_STORY';
    return 'LOW_SIMILARITY';
  }

  /**
   * Run Originality Analysis against all other articles in database
   */
  public static async analyzeArticle(articleId: string, title: string, content: string): Promise<OriginalityAnalysis> {
    const submittedTokens = this.tokenize(`${title} ${content}`);
    const submittedShingles = this.generateShingles(submittedTokens, 3);
    const submittedParagraphs = content.split(/\n+/).filter((p) => p.trim().length > 20);

    // Fetch other active articles from database (excluding the current one)
    const existingArticles = await prisma.news.findMany({
      where: {
        id: { not: articleId },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        publishedAt: true,
        author: { select: { fullName: true } },
      },
      take: 50,
    });

    let maxSimilarity = 0;
    const similarArticles: SimilarStoryMatch[] = [];
    const matchAreasSet = new Set<string>();

    for (const target of existingArticles) {
      const targetTokens = this.tokenize(`${target.title} ${target.content}`);
      const targetShingles = this.generateShingles(targetTokens, 3);

      const jaccard = this.computeJaccard(submittedShingles, targetShingles);
      const similarityPercentage = Math.round(jaccard * 100);

      // Check title similarity
      const titleTokensA = new Set(this.tokenize(title));
      const titleTokensB = new Set(this.tokenize(target.title));
      const titleJaccard = this.computeJaccard(titleTokensA, titleTokensB);
      if (titleJaccard > 0.4) {
        matchAreasSet.add('Headline');
      }

      // Check matching paragraphs
      const matchedPassages: { submittedSnippet: string; matchedSnippet: string; similarity: number }[] = [];
      const targetParagraphs = target.content.split(/\n+/).filter((p) => p.trim().length > 20);

      submittedParagraphs.forEach((subP, idx) => {
        const subPShingles = this.generateShingles(this.tokenize(subP), 2);
        for (const tgtP of targetParagraphs) {
          const tgtPShingles = this.generateShingles(this.tokenize(tgtP), 2);
          const pJaccard = this.computeJaccard(subPShingles, tgtPShingles);
          if (pJaccard > 0.35) {
            matchAreasSet.add(`Paragraph ${idx + 1}`);
            matchedPassages.push({
              submittedSnippet: subP.slice(0, 160) + (subP.length > 160 ? '...' : ''),
              matchedSnippet: tgtP.slice(0, 160) + (tgtP.length > 160 ? '...' : ''),
              similarity: Math.round(pJaccard * 100),
            });
            break;
          }
        }
      });

      if (similarityPercentage > maxSimilarity) {
        maxSimilarity = similarityPercentage;
      }

      if (similarityPercentage >= 15 || matchedPassages.length > 0) {
        similarArticles.push({
          articleId: target.id,
          title: target.title,
          slug: target.slug,
          similarityScore: similarityPercentage,
          duplicateLevel: this.classifyDuplicate(similarityPercentage),
          matchedPassages: matchedPassages.slice(0, 3),
          authorName: target.author?.fullName || 'AB Media Contributor',
          publishedAt: target.publishedAt,
        });
      }
    }

    // Sort similar articles descending by similarity score
    similarArticles.sort((a, b) => b.similarityScore - a.similarityScore);

    const originalityScore = Math.max(0, 100 - maxSimilarity);
    const duplicateLevel = this.classifyDuplicate(maxSimilarity);

    return {
      originalityScore,
      similarityScore: maxSimilarity,
      duplicateLevel,
      matchAreas: Array.from(matchAreasSet),
      similarArticles: similarArticles.slice(0, 5),
      analyzedAt: new Date().toISOString(),
    };
  }
}
