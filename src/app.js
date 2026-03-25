import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importação das rotas
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import meRouter from './routes/me.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --- CONFIGURAÇÕES DE SEGURANÇA ---

// Ajuste no Helmet: contentSecurityPolicy desativado para o Swagger carregar CSS/JS
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(morgan('combined'));

// CORS: Configurado para aceitar o seu frontend da Vercel ou localhost
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Rate limiting para a API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Parsing do corpo das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO SWAGGER ---

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Pedidos API',
      version: '1.0.0',
      description: 'API REST para o Sistema de Pedidos — Atividade Final Unifor',
    },
    // Define a URL do servidor automaticamente baseada no ambiente
    servers: [
      { 
        url: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor Local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Atenção: Garante que o Swagger encontre as rotas dentro da pasta routes
  apis: [join(__dirname, 'routes', '*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rota da documentação
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Docs - Sistema de Pedidos",
}));

// --- ROTAS DA APLICAÇÃO ---

// Health check (Para testar se o Render está OK)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/me', meRouter);

// Tratamento de Rota Não Encontrada (404)
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// Tratamento de Erros Global (Middleware)
app.use(errorHandler);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[server] Swagger docs: http://localhost:${PORT}/api/docs`);
});

export default app;