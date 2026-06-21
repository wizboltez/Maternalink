import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { CalibrationSession, ContractionReading, MonitoringSession } from '../../infrastructure/database/models';
import { SignalProcessorService } from '../../application/services/SignalProcessorService';

export class SocketServer {
  private static io: Server | null = null;

  /**
   * Initializes the Socket.IO Server and binds events
   */
  public static init(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

      // User joins a room specific to their monitoring session
      socket.on('join_session', (sessionId: string) => {
        socket.join(sessionId);
        console.log(`👤 Client ${socket.id} joined session room: ${sessionId}`);
      });

      // User leaves the session room
      socket.on('leave_session', (sessionId: string) => {
        socket.leave(sessionId);
        console.log(`👤 Client ${socket.id} left session room: ${sessionId}`);
      });

      // Real-Time Hardware telemetry stream ingestion (via WebSockets or REST)
      socket.on('hardware_reading', async (data: {
        sessionId: string;
        rawAdc?: number;
        flexPercent?: number;
        intensity?: number;
        duration?: number;
        interval?: number;
        frequency?: number;
        batteryLevel?: number;
      }) => {
        try {
          const { sessionId } = data;
          if (!sessionId) return;

          // Lookup active session
          const session = await MonitoringSession.findById(sessionId);
          if (!session || session.status !== 'active') {
            socket.emit('error', 'Session is not active or does not exist.');
            return;
          }

          // Fetch calibration settings
          const calibration = await CalibrationSession.findById(session.calibrationSessionId);
          if (!calibration) {
            socket.emit('error', 'No calibration profile associated with this session.');
            return;
          }

          // Process reading dynamically based on option 1-5 hardware variations
          const readingData = await SignalProcessorService.processIncomingReading(
            sessionId,
            data,
            calibration
          );

          const reading = new ContractionReading(readingData);
          await reading.save();

          // Broadcast reading data to all users in this session room
          this.broadcastToSession(sessionId, 'reading_received', reading);

          // Trigger telemetry alarms/notifications
          if (reading.isContraction) {
            if ((reading.intensity || 0) >= 80) {
              this.broadcastToSession(sessionId, 'alert_triggered', {
                type: 'high_intensity',
                message: 'High contraction intensity detected. Take deep, slow breaths.',
                intensity: reading.intensity,
              });
            }
            if ((reading.frequency || 0) >= 12) {
              this.broadcastToSession(sessionId, 'alert_triggered', {
                type: 'frequent_contractions',
                message: 'Contractions are very frequent. Consider calling your care provider.',
                frequency: reading.frequency,
              });
            }
          }

          // Sync battery status if present
          if (data.batteryLevel !== undefined) {
            this.broadcastToSession(sessionId, 'battery_status', {
              batteryLevel: data.batteryLevel,
            });
            if (data.batteryLevel < 15) {
              this.broadcastToSession(sessionId, 'alert_triggered', {
                type: 'low_battery',
                message: 'Wearable belt battery level is below 15%. Please plug in the charger.',
                batteryLevel: data.batteryLevel,
              });
            }
          }

        } catch (error: any) {
          console.error('❌ Error handling hardware_reading:', error);
          socket.emit('error', 'Failed to process hardware reading.');
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Broadcasts an event to all sockets connected to a session room
   */
  public static broadcastToSession(sessionId: string, event: string, payload: any): void {
    if (this.io) {
      this.io.to(sessionId).emit(event, payload);
    }
  }
}
