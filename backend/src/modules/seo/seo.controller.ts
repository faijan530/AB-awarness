import { Request, Response, NextFunction } from 'express';
import { SeoService } from './seo.service';

export class SeoController {
  private static getBaseUrl(req: Request): string {
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    return `${protocol}://${host}`;
  }

  // Public News SEO Packet (Meta, Open Graph, Twitter, JSON-LD)
  public static async getNewsSeoPacket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const baseUrl = SeoController.getBaseUrl(req);
      const packet = await SeoService.getNewsSeoPacket(slug, baseUrl);
      res.status(200).json({ success: true, data: packet });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin: Get News SEO Overrides
  public static async getNewsSeo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await SeoService.getNewsSeo(id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin: Update News SEO Overrides
  public static async updateNewsSeo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await SeoService.updateNewsSeo(id, req.body);
      res.status(200).json({ success: true, message: 'SEO metadata updated', data });
    } catch (error) {
      next(error);
    }
  }

  // Public: /sitemap.xml
  public static async getSitemapXml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const baseUrl = SeoController.getBaseUrl(req);
      const xml = await SeoService.generateSitemapXml(baseUrl);
      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  // Public: /news-sitemap.xml
  public static async getNewsSitemapXml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const baseUrl = SeoController.getBaseUrl(req);
      const xml = await SeoService.generateNewsSitemapXml(baseUrl);
      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  // Public: /robots.txt
  public static async getRobotsTxt(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const baseUrl = SeoController.getBaseUrl(req);
    const text = SeoService.generateRobotsTxt(baseUrl);
    res.header('Content-Type', 'text/plain');
    res.status(200).send(text);
  }
}
