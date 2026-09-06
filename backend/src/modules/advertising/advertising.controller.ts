import { Request, Response, NextFunction } from 'express';
import { AdvertisingService } from './advertising.service';
import { AppError } from '../../middlewares/error.middleware';

export class AdvertisingController {
  // Public Ad Serving
  public static async serveAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const placementCode = req.query.placementCode as string;
      if (!placementCode) throw new AppError('placementCode query parameter is required', 400, 'BAD_REQUEST');

      const location = req.query.location as string;
      const category = req.query.category as string;

      const ad = await AdvertisingService.serveAd({ placementCode, location, category });
      res.status(200).json({ success: true, data: ad });
    } catch (error) {
      next(error);
    }
  }

  // Record Impression
  public static async recordImpression(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { creativeId } = req.params;
      const { placementCode } = req.body;
      const ipHash = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await AdvertisingService.recordImpression(creativeId, placementCode, ipHash, userAgent);
      res.status(200).json({ success: true, message: 'Impression recorded' });
    } catch (error) {
      next(error);
    }
  }

  // Record Click and Redirect
  public static async recordClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { creativeId } = req.params;
      const ipHash = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const destinationUrl = await AdvertisingService.recordClick(creativeId, ipHash, userAgent);

      // If client requests JSON (e.g. API test), or redirect browser
      if (req.headers.accept?.includes('application/json')) {
        res.status(200).json({ success: true, destinationUrl });
      } else {
        res.redirect(302, destinationUrl);
      }
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SUPER ADMIN ACTIONS
  // ==========================================

  public static async getAdvertisers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status } = req.query;
      const list = await AdvertisingService.getAdvertisers({
        search: search as string,
        status: status as any,
      });
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }

  public static async createAdvertiser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const advertiser = await AdvertisingService.createAdvertiser(req.body);
      res.status(201).json({ success: true, data: advertiser });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAdvertiser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const advertiser = await AdvertisingService.updateAdvertiser(req.params.id, req.body);
      res.status(200).json({ success: true, data: advertiser });
    } catch (error) {
      next(error);
    }
  }

  public static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { advertiserId, status } = req.query;
      const list = await AdvertisingService.getCampaigns({
        advertiserId: advertiserId as string,
        status: status as any,
      });
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }

  public static async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await AdvertisingService.createCampaign(req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await AdvertisingService.updateCampaign(req.params.id, req.body);
      res.status(200).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  public static async activateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await AdvertisingService.activateCampaign(req.params.id);
      res.status(200).json({ success: true, message: 'Campaign activated', data: campaign });
    } catch (error) {
      next(error);
    }
  }

  public static async pauseCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await AdvertisingService.pauseCampaign(req.params.id);
      res.status(200).json({ success: true, message: 'Campaign paused', data: campaign });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdvertisingService.deleteCampaign(req.params.id);
      res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getCreatives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.query;
      const creatives = await AdvertisingService.getCreatives({ campaignId: campaignId as string });
      res.status(200).json({ success: true, data: creatives });
    } catch (error) {
      next(error);
    }
  }

  public static async createCreative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creative = await AdvertisingService.createCreative(req.body);
      res.status(201).json({ success: true, data: creative });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCreative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creative = await AdvertisingService.updateCreative(req.params.id, req.body);
      res.status(200).json({ success: true, data: creative });
    } catch (error) {
      next(error);
    }
  }

  public static async getPlacements(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const placements = await AdvertisingService.getPlacements();
      res.status(200).json({ success: true, data: placements });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePlacement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const placement = await AdvertisingService.updatePlacement(req.params.id, req.body);
      res.status(200).json({ success: true, data: placement });
    } catch (error) {
      next(error);
    }
  }
}
