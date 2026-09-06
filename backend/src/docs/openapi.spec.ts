export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Abhishek Bhardwaj Media Platform — Production API Documentation',
    version: '1.0.0',
    description:
      'Complete Backend REST API specification covering Modules 1–12: News Publishing, Multi-Tier Auth, Verification, Engagement, SEO, Analytics, System Health, and Infrastructure.',
    contact: {
      name: 'Platform Engineering Team',
      email: 'engineering@abhishekbhardwaj.media',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary Production & Development API v1 Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token (obtained from POST /api/v1/auth/login)',
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          meta: { type: 'object' },
        },
      },
      ApiResponseError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'Access token expired or invalid' },
              details: { type: 'object' },
            },
          },
        },
      },
      NewsItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'news_123' },
          title: { type: 'string', example: 'Garhwa NH-75 Bypass Project Approved' },
          slug: { type: 'string', example: 'garhwa-nh-75-bypass-project' },
          status: { type: 'string', example: 'PUBLISHED' },
          publishedAt: { type: 'string', format: 'date-time' },
          viewCount: { type: 'integer', example: 1250 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Root System Liveness & Health Check',
        tags: ['System & Health'],
        responses: {
          '200': {
            description: 'System is healthy and operational',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponseSuccess' },
              },
            },
          },
        },
      },
    },
    '/health/live': {
      get: {
        summary: 'Kubernetes Liveness Probe Endpoint',
        tags: ['System & Health'],
        responses: {
          '200': { description: 'Liveness status UP' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Kubernetes Readiness Probe Endpoint (DB + Redis)',
        tags: ['System & Health'],
        responses: {
          '200': { description: 'Readiness status READY' },
          '503': { description: 'Service Unavailable' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User Login & JWT Token Generation',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'superadmin@abawareness.com' },
                  password: { type: 'string', example: 'AdminPass123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful with JWT access token' },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Too many authentication attempts' },
        },
      },
    },
    '/news': {
      get: {
        summary: 'Fetch Public News Feed',
        tags: ['News & Publishing'],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Paginated news feed list' },
        },
      },
    },
    '/admin/analytics/news': {
      get: {
        summary: 'Fetch News Analytics Metrics (Super Admin)',
        tags: ['Analytics & Operations'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'News analytics overview' },
          '403': { description: 'Forbidden - Super Admin required' },
        },
      },
    },
  },
};
