const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Görev & Proje Yönetim API (Trello Benzeri)',
      version: '1.0.0',
      description:
        'Node.js & Express ile geliştirilmiş, JWT kimlik doğrulama, Proje/Görev CRUD, gerçek zamanlı Socket.io bildirimleri, Multer dosya yükleme ve Nodemailer e-posta bildirimleri destekli RESTful API.',
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
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            title: { type: 'string', example: 'E-Ticaret Projesi' },
            description: { type: 'string', example: 'E-Ticaret web ve mobil projesi' },
            color: { type: 'string', example: '#3b82f6' },
            status: { type: 'string', enum: ['active', 'archived', 'completed'], example: 'active' },
            owner: { $ref: '#/components/schemas/User' },
            members: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Attachment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
            originalName: { type: 'string', example: 'ekran_goruntusu.png' },
            filename: { type: 'string', example: 'ekran_goruntusu-1629532800000.png' },
            path: { type: 'string', example: '/uploads/ekran_goruntusu-1629532800000.png' },
            mimetype: { type: 'string', example: 'image/png' },
            size: { type: 'number', example: 1048576 },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
            title: { type: 'string', example: 'Auth Modülü Geliştirmesi' },
            description: { type: 'string', example: 'JWT tabanlı register ve login rotalarının kodlanması' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
            project: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            assignee: { $ref: '#/components/schemas/User' },
            createdBy: { $ref: '#/components/schemas/User' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['backend', 'jwt', 'security'],
            },
            dueDate: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' },
            },
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
