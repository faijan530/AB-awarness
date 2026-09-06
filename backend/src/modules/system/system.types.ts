export interface UpdateSystemSettingDTO {
  value: any;
  description?: string;
  isPublic?: boolean;
}

export interface CreateFeatureFlagDTO {
  key: string;
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
}

export interface UpdateFeatureFlagDTO {
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
}

export const SYSTEM_ERROR_CODES = {
  SETTING_NOT_FOUND: 'SETTING_NOT_FOUND',
  SETTING_NOT_MUTABLE: 'SETTING_NOT_MUTABLE',
  SETTING_INVALID_VALUE: 'SETTING_INVALID_VALUE',
  FEATURE_FLAG_NOT_FOUND: 'FEATURE_FLAG_NOT_FOUND',
  MAINTENANCE_MODE: 'SYSTEM_MAINTENANCE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
