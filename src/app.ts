import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/question.routes';
import rubricRoutes from './routes/rubric.routes';
import agentVersionRoutes from './routes/agent-version.routes';
import auditRoutes from './routes/audit.routes';
import assessmentSessionRoutes from './routes/assessment-session.routes';
import evaluationRoutes from './routes/evaluation.routes';
import expertEvaluationRoutes from './routes/expert-evaluation.routes';
import comparisonRoutes from './routes/comparison.routes';
import refinementRoutes from './routes/refinement.routes';
import finalEvaluationRoutes from './routes/final-evaluation.routes';
import surveyRoutes from './routes/survey.routes';
import statisticsRoutes from './routes/statistics.routes';
import exportRoutes from './routes/export.routes';

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
app.use('/api/sessions', assessmentSessionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/expert', expertEvaluationRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/refinements', refinementRoutes);
app.use('/api/final-reviews', finalEvaluationRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/exports', exportRoutes);

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
