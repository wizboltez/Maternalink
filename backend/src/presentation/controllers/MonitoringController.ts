import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { MonitoringSession, ContractionReading, CalibrationSession, Device } from '../../infrastructure/database/models';
import { SignalProcessorService } from '../../application/services/SignalProcessorService';
import { ExportService } from '../../application/services/ExportService';
import { SocketServer } from '../../infrastructure/socket/socketServer';
import mongoose from 'mongoose';

export class MonitoringController {
  /**
   * Starts a new monitoring session
   */
  public static async startSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { deviceId, calibrationSessionId } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
      if (!deviceId || !calibrationSessionId) {
        return res.status(400).json({ error: 'Missing deviceId or calibrationSessionId parameters.' });
      }

      // Check device connection
      const device = await Device.findById(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found.' });

      // Verify calibration exists
      const calibration = await CalibrationSession.findById(calibrationSessionId);
      if (!calibration || calibration.status !== 'success') {
        return res.status(400).json({ error: 'A successful calibration profile is required before starting.' });
      }

      // Stop any other active sessions for this user
      await MonitoringSession.updateMany(
        { userId, status: 'active' },
        { status: 'completed', endTime: new Date() }
      );

      // Create new session
      const session = new MonitoringSession({
        userId: new mongoose.Types.ObjectId(userId),
        deviceId: new mongoose.Types.ObjectId(deviceId),
        calibrationSessionId: new mongoose.Types.ObjectId(calibrationSessionId),
        startTime: new Date(),
        status: 'active',
      });

      await session.save();

      // Initialize Signal Processor memory state
      SignalProcessorService.initSessionState(session._id.toString());

      // Broadcast start event over socket
      SocketServer.broadcastToSession(session._id.toString(), 'session_started', {
        sessionId: session._id,
        startTime: session.startTime,
      });

      return res.status(201).json({
        message: 'Monitoring session started.',
        session,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error starting session.' });
    }
  }

  /**
   * Stops an active monitoring session
   */
  public static async stopSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await MonitoringSession.findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status === 'completed') {
        return res.status(400).json({ error: 'Session is already completed.' });
      }

      session.status = 'completed';
      session.endTime = new Date();

      const durationMs = session.endTime.getTime() - session.startTime.getTime();
      const MIN_SESSION_MS = 60 * 1000; // Do not persist sessions shorter than 1 minute

      if (durationMs < MIN_SESSION_MS) {
        await ContractionReading.deleteMany({ monitoringSessionId: session._id });
        await MonitoringSession.findByIdAndDelete(sessionId);
        SignalProcessorService.removeSessionState(sessionId);

        SocketServer.broadcastToSession(sessionId, 'session_stopped', {
          sessionId,
          discarded: true,
        });

        return res.status(200).json({
          message: 'Session was shorter than 1 minute and was not saved.',
          discarded: true,
        });
      }

      await session.save();

      // Clean signal state
      SignalProcessorService.removeSessionState(sessionId);

      // Broadcast stop event over socket
      SocketServer.broadcastToSession(sessionId, 'session_stopped', {
        sessionId,
        endTime: session.endTime,
      });

      return res.status(200).json({
        message: 'Monitoring session completed.',
        session,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error stopping session.' });
    }
  }

  /**
   * Submits a reading manually (Independent of hardware sensors, Option 5 support, or manual confirmation flow)
   */
  public static async postReading(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const { rawAdc, flexPercent, intensity, duration, interval, frequency, isConfirmed, isContraction, source } = req.body;

      const session = await MonitoringSession.findById(sessionId);
      if (!session || session.status !== 'active') {
        return res.status(400).json({ error: 'No active monitoring session found with this ID.' });
      }

      // Fetch active calibration params
      const calibration = await CalibrationSession.findById(session.calibrationSessionId);
      if (!calibration) return res.status(404).json({ error: 'Calibration data missing for this session.' });

      let readingData: Partial<ContractionReading>;

      if (source === 'manual') {
        // Manual Confirmation mode flow
        readingData = {
          monitoringSessionId: session._id,
          timestamp: new Date(),
          flexPercent: flexPercent || calibration.baseline,
          intensity: intensity || 0,
          duration: duration || 0,
          interval: interval || 0,
          frequency: frequency || 0,
          source: 'manual',
          isConfirmed: isConfirmed ?? true,
          isContraction: isContraction ?? true,
          phase: 'none',
        };
      } else {
        // Fallback processing using SignalProcessorService for hardware options
        readingData = await SignalProcessorService.processIncomingReading(
          sessionId,
          { rawAdc, flexPercent, intensity, duration, interval, frequency },
          calibration
        );
      }

      const reading = new ContractionReading(readingData);
      await reading.save();

      // Broadcast to live monitors
      SocketServer.broadcastToSession(sessionId, 'reading_received', reading);

      // If contraction is detected, run alerts checks
      if (reading.isContraction) {
        if ((reading.intensity || 0) >= 80) {
          SocketServer.broadcastToSession(sessionId, 'alert_triggered', {
            type: 'high_intensity',
            message: 'High contraction intensity detected. Please monitor your comfort levels.',
            intensity: reading.intensity,
          });
        }
        if ((reading.frequency || 0) >= 12) {
          SocketServer.broadcastToSession(sessionId, 'alert_triggered', {
            type: 'frequent_contractions',
            message: 'Frequent contractions detected (over 12 per hour). Seek professional advice if needed.',
            frequency: reading.frequency,
          });
        }
      }

      return res.status(201).json({ reading });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error processing reading data.' });
    }
  }

  /**
   * Lists the user's historical monitoring sessions
   */
  public static async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { limit, startDate, endDate, search } = req.query;

      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const query: any = { userId };

      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate as string);
        if (endDate) query.startTime.$lte = new Date(endDate as string);
      }

      let sessions = await MonitoringSession.find(query).sort({ startTime: -1 });

      // Exclude sessions shorter than 1 minute
      sessions = sessions.filter((s) => {
        const end = s.endTime || s.startTime;
        return end.getTime() - s.startTime.getTime() >= 60 * 1000;
      });

      // Support basic filtering/search (notes lookup)
      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        sessions = sessions.filter((s) => s.notes && searchRegex.test(s.notes));
      }

      // Default limit 7 to list the last 7 sessions, or custom limit
      const parsedLimit = limit ? parseInt(limit as string, 10) : 7;
      const paginatedSessions = sessions.slice(0, parsedLimit);

      // Map session details alongside their statistics
      const sessionsWithStats = await Promise.all(
        paginatedSessions.map(async (session) => {
          const readings = await ContractionReading.find({ monitoringSessionId: session._id });
          const stats = ExportService.calculateSessionStats(session, readings);
          return {
            session,
            stats,
          };
        })
      );

      return res.status(200).json({ sessions: sessionsWithStats });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error listing sessions.' });
    }
  }

  /**
   * Gets specific session logs and contraction timelines
   */
  public static async getSessionDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await MonitoringSession.findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      const readings = await ContractionReading.find({ monitoringSessionId: sessionId }).sort({ timestamp: 1 });
      const stats = ExportService.calculateSessionStats(session, readings);

      return res.status(200).json({
        session,
        stats,
        readings,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error fetching session logs.' });
    }
  }

  /**
   * PDF Report Export Stream
   */
  public static async exportPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await MonitoringSession.findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      const readings = await ContractionReading.find({ monitoringSessionId: sessionId }).sort({ timestamp: 1 });
      const pdfBuffer = await ExportService.exportToPdf(session, readings);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contraction_report_${sessionId}.pdf`);
      return res.status(200).send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error generating PDF report.' });
    }
  }

  /**
   * Combined PDF export for all valid user sessions
   */
  public static async exportAllPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const pdfBuffer = await ExportService.exportAllToPdf(userId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=contraction_full_history.pdf');
      return res.status(200).send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error generating combined PDF report.' });
    }
  }
}
