import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service';
import { ApiResponse } from '../../utils/api-response';

export class NewsController {
  /**
   * GET /api/v1/news/my-submissions
   */
  public static async getMySubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const status = req.query.status as any;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await NewsService.getMySubmissions(user.id, status, page, limit);
      ApiResponse.success(res, 'Contributor submissions retrieved successfully', result.articles, result.meta);
    } catch (error) {
      next(error);
    }
  }
  /**
   * GET /api/v1/news
   */
  public static async getNewsFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q: any = req.query?.params && typeof req.query.params === 'object' ? req.query.params : req.query;
      const page = q.page || req.query.page;
      const limit = q.limit || req.query.limit;
      const category = q.category || req.query.category;
      const location = q.location || req.query.location;
      const search = q.search || req.query.search;
      const featured = q.featured !== undefined ? q.featured : req.query.featured;

      const feed = await NewsService.getNewsFeed({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        category: category ? String(category).trim() : undefined,
        location: location ? String(location).trim() : undefined,
        search: search ? String(search).trim() : undefined,
        featured: featured !== undefined ? featured === 'true' || featured === true : undefined,
      });

      ApiResponse.success(res, 'Public news feed retrieved successfully', feed);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/featured
   */
  public static async getFeaturedNews(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const featured = await NewsService.getFeaturedNews();
      ApiResponse.success(res, 'Featured hero news story retrieved', featured);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/breaking
   */
  public static async getBreakingNews(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const breaking = await NewsService.getBreakingNews();
      ApiResponse.success(res, 'Live breaking news alerts retrieved', breaking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/trending
   */
  public static async getTrendingNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const trending = await NewsService.getTrendingNews(limit);
      ApiResponse.success(res, 'Trending news stories retrieved', trending);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/:slug
   */
  public static async getArticleBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const article = await NewsService.getArticleBySlug(slug);
      ApiResponse.success(res, 'News article details retrieved', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/:id/related
   */
  public static async getRelatedNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
      const related = await NewsService.getRelatedNews(id, limit);
      ApiResponse.success(res, 'Related news stories retrieved', related);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news
   */
  public static async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const article = await NewsService.createNews(userId, req.body);
      ApiResponse.success(res, 'News draft created successfully', article, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/news/:id
   */
  public static async updateNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const isSuperAdmin = req.user!.roles.includes('SUPER_ADMIN');

      const updated = await NewsService.updateNews(id, userId, isSuperAdmin, req.body);
      ApiResponse.success(res, 'News article updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news/:id/submit
   */
  public static async submitForReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const submitted = await NewsService.submitForReview(id, userId);
      ApiResponse.success(res, 'News article submitted for editorial review', submitted);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/:id/revisions
   */
  public static async getRevisions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const revisions = await NewsService.getRevisions(id);
      ApiResponse.success(res, 'News revision history retrieved', revisions);
    } catch (error) {
      next(error);
    }
  }
}
