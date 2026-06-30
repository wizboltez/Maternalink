import { Request, Response } from 'express';
import { HealthSyncBatch } from '../../infrastructure/database/models';

export class HealthSyncController {
  // POST /api/health/sync — receives batched health data
  static async syncBatch(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { deviceId, sessionStart, sessionEnd, readings, alerts, summary } = req.body;

      const batch = await HealthSyncBatch.create({
        userId,
        deviceId,
        syncTimestamp: new Date(),
        sessionStart: new Date(sessionStart),
        sessionEnd: new Date(sessionEnd),
        readings: readings.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })),
        alerts: (alerts || []).map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })),
        summary: summary || {},
      });

      res.status(201).json({ message: 'Health data synced successfully', batchId: batch._id });
    } catch (error: any) {
      console.error('Health sync error:', error);
      res.status(500).json({ error: 'Failed to sync health data', details: error.message });
    }
  }

  // GET /api/health/history — retrieve synced health history
  static async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { days = 7 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - Number(days));

      const batches = await HealthSyncBatch.find({
        userId,
        syncTimestamp: { $gte: since },
      }).sort({ syncTimestamp: -1 }).select('-readings').lean();

      res.json({ batches });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch health history', details: error.message });
    }
  }

  // GET /api/health/latest — get latest synced snapshot
  static async getLatest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const latest = await HealthSyncBatch.findOne({ userId })
        .sort({ syncTimestamp: -1 })
        .lean();

      if (!latest) {
        return res.status(404).json({ error: 'No health data found' });
      }

      res.json({ batch: latest });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch latest health data', details: error.message });
    }
  }

  // GET /api/health/batch/:batchId — get full batch with readings
  static async getBatchDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const batch = await HealthSyncBatch.findOne({
        _id: req.params.batchId,
        userId,
      }).lean();

      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }

      res.json({ batch });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch batch details', details: error.message });
    }
  }
}
