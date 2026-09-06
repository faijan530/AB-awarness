export enum AnalyticsEventType {
  // User Events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',

  // News Events
  NEWS_VIEWED = 'NEWS_VIEWED',
  NEWS_SHARED = 'NEWS_SHARED',
  NEWS_BOOKMARKED = 'NEWS_BOOKMARKED',
  NEWS_REACTED = 'NEWS_REACTED',

  // Search Events
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',
  SEARCH_RESULT_CLICKED = 'SEARCH_RESULT_CLICKED',

  // Engagement Events
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  COMMENT_REACTED = 'COMMENT_REACTED',
  REPORT_CREATED = 'REPORT_CREATED',

  // Advertising Events
  AD_IMPRESSION = 'AD_IMPRESSION',
  AD_CLICK = 'AD_CLICK',
}

export interface TrackEventDTO {
  event: AnalyticsEventType | string;
  entityType?: string;
  entityId?: string;
  anonymousId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsQueryFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  location?: string;
  author?: string;
  page?: number;
  limit?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export const ANALYTICS_ERROR_CODES = {
  INVALID_EVENT: 'ANALYTICS_INVALID_EVENT',
  INVALID_DATE_RANGE: 'ANALYTICS_INVALID_DATE_RANGE',
  EXPORT_FAILED: 'ANALYTICS_EXPORT_FAILED',
  QUERY_TOO_LARGE: 'ANALYTICS_QUERY_TOO_LARGE',
} as const;
