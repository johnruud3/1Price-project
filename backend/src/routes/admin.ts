import { Router, Request, Response } from 'express';
import { cleanupOldSubmissions, getStorageStats } from '../services/cleanupService.js';

const router = Router();

// Simple admin authentication (for MVP - replace with proper auth later)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-secret';

function isAdmin(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${ADMIN_SECRET}`;
}

// Get storage statistics and dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await getStorageStats();
    
    res.json({
      storage: stats,
      cleanup_info: {
        retention_days: 180,
        next_cleanup_eligible: stats.older_than_180_days,
        auto_cleanup_enabled: true,
      },
      system_info: {
        database: 'Supabase',
        free_tier_limit_mb: 500,
        usage_percentage: (stats.estimated_size_mb / 500) * 100,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Manual cleanup trigger
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const retentionDays = parseInt(req.body.retention_days) || 180;
    
    const result = await cleanupOldSubmissions(retentionDays);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({
      error: 'Failed to run cleanup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get cleanup history (simple version - stores in memory for MVP)
let cleanupHistory: any[] = [];

router.get('/cleanup/history', async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      history: cleanupHistory.slice(-10), // Last 10 cleanups
    });
  } catch (error) {
    console.error('Error getting cleanup history:', error);
    res.status(500).json({
      error: 'Failed to get cleanup history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Scheduled cleanup endpoint (call this from a cron job)
router.post('/cleanup/scheduled', async (req: Request, res: Response) => {
  try {
    // Simple secret-based auth for cron jobs
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== ADMIN_SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await cleanupOldSubmissions(180);
    
    // Store in history
    cleanupHistory.push({
      ...result,
      type: 'scheduled',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error running scheduled cleanup:', error);
    res.status(500).json({
      error: 'Failed to run scheduled cleanup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
