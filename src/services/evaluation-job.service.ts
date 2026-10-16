import { prisma } from '../lib/prisma';

export interface EvaluationJob {
  id: string;
  sourceSessionId: string;
  targetSessionId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalEvaluations: number;
  completedEvaluations: number;
  currentModel: string | null;
  currentQuestionCode: string | null;
  errorMessage: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export class EvaluationJobService {
  private static tableInitialized = false;

  /**
   * Ensure SQLite evaluation_jobs table exists.
   */
  static async initTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS evaluation_jobs (
          id TEXT PRIMARY KEY,
          sourceSessionId TEXT NOT NULL,
          targetSessionId TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          totalEvaluations INTEGER NOT NULL DEFAULT 30,
          completedEvaluations INTEGER NOT NULL DEFAULT 0,
          currentModel TEXT,
          currentQuestionCode TEXT,
          errorMessage TEXT,
          isDemo INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          completedAt TEXT
        );
      `);
      this.tableInitialized = true;
    } catch (err) {
      console.error('[EvaluationJobService] Failed to initialize table:', err);
      throw err;
    }
  }

  /**
   * Create or replace job for a target session
   */
  static async createJob(params: {
    id?: string;
    sourceSessionId: string;
    targetSessionId: string;
    totalEvaluations?: number;
    completedEvaluations?: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    currentModel?: string;
    currentQuestionCode?: string;
    isDemo?: boolean;
  }): Promise<EvaluationJob> {
    await this.initTable();

    const id = params.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const total = params.totalEvaluations ?? 30;
    const completed = params.completedEvaluations ?? 0;
    const status = params.status || 'PENDING';
    const isDemo = params.isDemo !== false ? 1 : 0;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `
      INSERT OR REPLACE INTO evaluation_jobs (
        id, sourceSessionId, targetSessionId, status,
        totalEvaluations, completedEvaluations, currentModel,
        currentQuestionCode, errorMessage, isDemo, createdAt, updatedAt, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL)
    `,
      id,
      params.sourceSessionId,
      params.targetSessionId,
      status,
      total,
      completed,
      params.currentModel || null,
      params.currentQuestionCode || null,
      isDemo,
      now,
      now
    );

    return (await this.getJob(id))!;
  }

  /**
   * Get job by ID
   */
  static async getJob(id: string): Promise<EvaluationJob | null> {
    await this.initTable();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM evaluation_jobs WHERE id = ? LIMIT 1`,
      id
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  /**
   * Get latest job by source session ID
   */
  static async getJobBySourceSession(sourceSessionId: string): Promise<EvaluationJob | null> {
    await this.initTable();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM evaluation_jobs WHERE sourceSessionId = ? ORDER BY createdAt DESC LIMIT 1`,
      sourceSessionId
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  /**
   * Get latest job by target demo session ID
   */
  static async getJobByTargetSession(targetSessionId: string): Promise<EvaluationJob | null> {
    await this.initTable();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM evaluation_jobs WHERE targetSessionId = ? ORDER BY createdAt DESC LIMIT 1`,
      targetSessionId
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  /**
   * Update progress for a running job
   */
  static async updateProgress(
    id: string,
    updates: {
      completedEvaluations: number;
      currentModel?: string;
      currentQuestionCode?: string;
      status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    }
  ): Promise<void> {
    await this.initTable();
    const now = new Date().toISOString();
    const status = updates.status || 'PROCESSING';

    await prisma.$executeRawUnsafe(
      `
      UPDATE evaluation_jobs
      SET completedEvaluations = ?,
          currentModel = COALESCE(?, currentModel),
          currentQuestionCode = COALESCE(?, currentQuestionCode),
          status = ?,
          updatedAt = ?
      WHERE id = ?
    `,
      updates.completedEvaluations,
      updates.currentModel || null,
      updates.currentQuestionCode || null,
      status,
      now,
      id
    );
  }

  /**
   * Mark job as completed
   */
  static async completeJob(id: string, finalCount: number = 30): Promise<void> {
    await this.initTable();
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(
      `
      UPDATE evaluation_jobs
      SET status = 'COMPLETED',
          completedEvaluations = ?,
          currentModel = NULL,
          currentQuestionCode = NULL,
          updatedAt = ?,
          completedAt = ?
      WHERE id = ?
    `,
      finalCount,
      now,
      now,
      id
    );
  }

  /**
   * Mark job as failed
   */
  static async failJob(id: string, errorMessage: string): Promise<void> {
    await this.initTable();
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(
      `
      UPDATE evaluation_jobs
      SET status = 'FAILED',
          errorMessage = ?,
          updatedAt = ?
      WHERE id = ?
    `,
      errorMessage,
      now,
      id
    );
  }

  /**
   * Synchronize job evaluation count with actual evaluations stored in Prisma database
   */
  static async reconcileJobWithDatabase(jobId: string): Promise<EvaluationJob | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;

    const actualCount = await prisma.evaluation.count({
      where: { sessionId: job.targetSessionId },
    });

    if (actualCount >= job.totalEvaluations && job.status !== 'COMPLETED') {
      await this.completeJob(jobId, actualCount);
    } else if (actualCount !== job.completedEvaluations && job.status !== 'COMPLETED') {
      await this.updateProgress(jobId, { completedEvaluations: actualCount });
    }

    return await this.getJob(jobId);
  }

  private static mapRow(row: any): EvaluationJob {
    return {
      id: row.id,
      sourceSessionId: row.sourceSessionId,
      targetSessionId: row.targetSessionId,
      status: row.status,
      totalEvaluations: Number(row.totalEvaluations),
      completedEvaluations: Number(row.completedEvaluations),
      currentModel: row.currentModel || null,
      currentQuestionCode: row.currentQuestionCode || null,
      errorMessage: row.errorMessage || null,
      isDemo: Boolean(row.isDemo),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt || null,
    };
  }
}
