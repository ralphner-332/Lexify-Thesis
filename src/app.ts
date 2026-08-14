import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/question.routes';
import rubricRoutes from './routes/rubric.routes';
import agentVersionRoutes from './routes/agent-version.routes';
import auditRoutes from './routes/audit.routes';

export const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'YAWA Research Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/agent-versions', agentVersionRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});
