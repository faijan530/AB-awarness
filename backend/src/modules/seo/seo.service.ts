import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NewsStatus } from '@prisma/client';
import { UpdateNewsSeoDTO, NewsSeoPacket } from './seo.types';

export class SeoService {
  private static SITE_NAME = 'Abhishek Bhardwaj Media Platform';

  /**
   * Get complete SEO packet (Meta tags, Open Graph, Twitter Card, Schema.org NewsArticle JSON-LD)
   */
  public static async getNewsSeoPacket(slug: string, baseUrl: string): Promise<NewsSeoPacket> {
    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        author: { select: { fullName: true } },
        featuredImage: { select: { url: true } },
        categories: { include: { category: { select: { name: true } } } },
        seoMetadata: true,
      },
    });

    if (!news || news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('Published news article not found for SEO', 404, 'NEWS_NOT_FOUND');
    }

    const canonicalUrl = news.seoMetadata?.canonicalUrl || `${baseUrl}/news/${news.slug}`;
    const metaTitle = news.seoMetadata?.title || `${news.title} | ${this.SITE_NAME}`;
    const metaDescription =
      news.seoMetadata?.description ||
      news.shortDescription ||
      news.excerpt ||
      news.title.substring(0, 160);

    const imageUrl = news.seoMetadata?.ogImage || news.featuredImage?.url || null;
    const authorName = news.author?.fullName || this.SITE_NAME;

    // Schema.org NewsArticle JSON-LD
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: news.title,
      description: metaDescription,
      image: imageUrl ? [imageUrl] : [],
      datePublished: news.publishedAt?.toISOString() || news.createdAt.toISOString(),
      dateModified: news.updatedAt.toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: authorName,
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: this.SITE_NAME,
        url: baseUrl,
      },
      articleSection: news.categories[0]?.category?.name || 'General',
    };

    return {
      title: news.title,
      metaTitle,
      metaDescription,
      canonicalUrl,
      robots: news.seoMetadata?.noIndex ? 'noindex, nofollow' : 'index, follow',
      openGraph: {
        title: news.seoMetadata?.ogTitle || metaTitle,
        description: news.seoMetadata?.ogDescription || metaDescription,
        image: imageUrl,
        url: canonicalUrl,
        type: 'article',
        siteName: this.SITE_NAME,
      },
      twitterCard: {
        card: 'summary_large_image',
        title: news.seoMetadata?.ogTitle || metaTitle,
        description: news.seoMetadata?.ogDescription || metaDescription,
        image: imageUrl,
      },
      structuredData,
    };
  }

  /**
   * Super Admin get custom SEO metadata for article
   */
  public static async getNewsSeo(newsId: string) {
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      include: { seoMetadata: true },
    });
    if (!news) throw new AppError('News not found', 404, 'NEWS_NOT_FOUND');
    return news.seoMetadata;
  }

  /**
   * Super Admin update custom SEO metadata
   */
  public static async updateNewsSeo(newsId: string, dto: UpdateNewsSeoDTO) {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News not found', 404, 'NEWS_NOT_FOUND');

    return prisma.seoMetadata.upsert({
      where: { newsId },
      update: {
        ...(dto.metaTitle && { title: dto.metaTitle }),
        ...(dto.metaDescription && { description: dto.metaDescription }),
        ...(dto.canonicalUrl !== undefined && { canonicalUrl: dto.canonicalUrl }),
        ...(dto.ogTitle !== undefined && { ogTitle: dto.ogTitle }),
        ...(dto.ogDescription !== undefined && { ogDescription: dto.ogDescription }),
        ...(dto.ogImage !== undefined && { ogImage: dto.ogImage }),
        ...(dto.noIndex !== undefined && { noIndex: dto.noIndex }),
      },
      create: {
        newsId,
        title: dto.metaTitle || news.title,
        description: dto.metaDescription || news.shortDescription || news.title,
        canonicalUrl: dto.canonicalUrl || null,
        ogTitle: dto.ogTitle || null,
        ogDescription: dto.ogDescription || null,
        ogImage: dto.ogImage || null,
        noIndex: dto.noIndex ?? false,
      },
    });
  }

  /**
   * Generate standard XML sitemap
   */
  public static async generateSitemapXml(baseUrl: string): Promise<string> {
    const publishedNews = await prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home
    xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>always</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // Categories
    for (const cat of categories) {
      xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <lastmod>${cat.updatedAt.toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    // Published Stories
    for (const story of publishedNews) {
      const lastmod = (story.updatedAt || story.publishedAt || new Date()).toISOString();
      xml += `  <url>\n    <loc>${baseUrl}/news/${story.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate Google News XML Sitemap (<news:news>)
   */
  public static async generateNewsSitemapXml(baseUrl: string): Promise<string> {
    // Only published articles within last 48 hours for Google News
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const recentNews = await prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        publishedAt: { gte: cutoff },
        deletedAt: null,
      },
      select: {
        title: true,
        slug: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 250,
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    for (const story of recentNews) {
      const pubDate = (story.publishedAt || new Date()).toISOString();
      // Escape XML entities
      const escapedTitle = story.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/news/${story.slug}</loc>\n`;
      xml += '    <news:news>\n';
      xml += '      <news:publication>\n';
      xml += `        <news:name>${this.SITE_NAME}</news:name>\n`;
      xml += '        <news:language>en</news:language>\n';
      xml += '      </news:publication>\n';
      xml += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
      xml += `      <news:title>${escapedTitle}</news:title>\n`;
      xml += '    </news:news>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate robots.txt
   */
  public static generateRobotsTxt(baseUrl: string): string {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /api/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      `Sitemap: ${baseUrl}/news-sitemap.xml`,
      '',
    ].join('\n');
  }
}
