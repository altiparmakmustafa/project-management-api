const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Görev & Proje Yönetim API (Trello Benzeri)',
      version: '1.0.0',
      description:
        'Node.js & Express ile geliştirilmiş, JWT kimlik doğrulama, gerçek zamanlı Socket.io bildirimleri, dosya yükleme ve e-posta bildirimleri destekli RESTful API.',
      contact: {
        name: 'Mustafa Altıparmak',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001/api/v1',
        description: 'Yerel Geliştirme Sunucusu',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: "JWT token değerini 'Bearer <token>' formatında giriniz.",
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            name: { type: 'string', example: 'Mustafa Altıparmak' },
            email: { type: 'string', example: 'mustafa@example.com' },
            title: { type: 'string', example: 'Full Stack Developer' },
            avatar: { type: 'string', example: '' },
            role: { type: 'string', example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'number', example: 200 },
            message: { type: 'string', example: 'İşlem başarılı' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Hata açıklaması' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
