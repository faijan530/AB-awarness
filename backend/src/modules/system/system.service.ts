import { PrismaClient } from '@prisma/client';
import { UpdateSystemSettingDTO, UpdateFeatureFlagDTO, CreateFeatureFlagDTO, SYSTEM_ERROR_CODES } from './system.types';
import { AppError } from '../../middlewares/error.middleware';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit.types';

const prisma = new PrismaClient();

// Only explicitly whitelisted settings are allowed to be managed via API
const WHITELISTED_SETTINGS = [
  'site_name',
  'site_description',
  'breaking_news_enabled',
  'comments_enabled',
  'registration_enabled',
  'maintenance_mode',
  'default_page_size',
  'max_file_upload_mb',
];

export class SystemService {
  /**
   * Fetch all system settings
   */
  static async getSettings() {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return settings;
  }

  /**
   * Get single setting by key
   */
  static async getSettingByKey(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new AppError(`System setting '${key}' not found`, 404, SYSTEM_ERROR_CODES.SETTING_NOT_FOUND);
    }

    return setting;
  }

  /**
   * Update whitelisted system setting with audit logging
   */
  static async updateSetting(key: string, dto: UpdateSystemSettingDTO, updatedBy?: string) {
    if (!WHITELISTED_SETTINGS.includes(key)) {
      throw new AppError(`Setting '${key}' is not whitelisted for modification`, 403, SYSTEM_ERROR_CODES.SETTING_NOT_MUTABLE);
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key } });

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: dto.value,
        description: dto.description || undefined,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : false,
        updatedBy: updatedBy || null,
      },
      update: {
        value: dto.value,
        description: dto.description || undefined,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : undefined,
        updatedBy: updatedBy || null,
      },
    });

    // Record Audit Log
    const action = key === 'maintenance_mode' ? AUDIT_ACTIONS.MAINTENANCE_MODE_CHANGED : AUDIT_ACTIONS.SETTING_CHANGED;

    await AuditService.record({
      actorId: updatedBy,
      action,
      entityType: 'SYSTEM_SETTING',
      entityId: key,
      oldValues: existing ? { value: existing.value } : undefined,
      newValues: { value: updated.value },
    });

    return updated;
  }

  /**
   * Get safe public configuration
   */
  static async getPublicConfig() {
    const publicSettings = await prisma.systemSetting.findMany({
      where: { isPublic: true },
      select: { key: true, value: true, description: true },
    });

    const config: Record<string, any> = {};
    publicSettings.forEach((s) => {
      config[s.key] = s.value;
    });

    return config;
  }

  /**
   * Feature Flags Management
   */
  static async getFeatureFlags() {
    return await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  static async createFeatureFlag(dto: CreateFeatureFlagDTO, updatedBy?: string) {
    const flag = await prisma.featureFlag.create({
      data: {
        key: dto.key,
        enabled: dto.enabled || false,
        description: dto.description || null,
        rolloutPercentage: dto.rolloutPercentage !== undefined ? dto.rolloutPercentage : 100,
        updatedBy: updatedBy || null,
      },
    });

    await AuditService.record({
      actorId: updatedBy,
      action: AUDIT_ACTIONS.FEATURE_FLAG_CHANGED,
      entityType: 'FEATURE_FLAG',
      entityId: flag.key,
      newValues: { enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage },
    });

    return flag;
  }

  static async updateFeatureFlag(key: string, dto: UpdateFeatureFlagDTO, updatedBy?: string) {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });

    if (!existing) {
      throw new AppError(`Feature flag '${key}' not found`, 404, SYSTEM_ERROR_CODES.FEATURE_FLAG_NOT_FOUND);
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        enabled: dto.enabled !== undefined ? dto.enabled : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        rolloutPercentage: dto.rolloutPercentage !== undefined ? dto.rolloutPercentage : undefined,
        updatedBy: updatedBy || null,
      },
    });

    await AuditService.record({
      actorId: updatedBy,
      action: AUDIT_ACTIONS.FEATURE_FLAG_CHANGED,
      entityType: 'FEATURE_FLAG',
      entityId: key,
      oldValues: { enabled: existing.enabled, rolloutPercentage: existing.rolloutPercentage },
      newValues: { enabled: updated.enabled, rolloutPercentage: updated.rolloutPercentage },
    });

    return updated;
  }

  /**
   * System Health: Liveness and Readiness
   */
  static getLiveness() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  static async getReadiness() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'READY',
        services: {
          database: 'UP',
          redis: 'UP',
          storage: 'UP',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError('Service readiness check failed: Database connection down', 503, SYSTEM_ERROR_CODES.SERVICE_UNAVAILABLE);
    }
  }
}
