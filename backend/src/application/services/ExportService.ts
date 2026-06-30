import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';
import mongoose from 'mongoose';
import { ContractionReading, IContractionReading, IMonitoringSession, MonitoringSession, PregnancyProfile, User } from '../../infrastructure/database/models';

export interface SessionSummaryStats {
  totalContractions: number;
  averageDuration: number;
  averageInterval: number;
  peakIntensity: number;
  sessionDurationMinutes: number;
}

export class ExportService {
  /**
   * Calculate summary statistics for a monitoring session
   */
  public static calculateSessionStats(
    session: IMonitoringSession,
    readings: IContractionReading[]
  ): SessionSummaryStats {
    const contractions = readings.filter((r) => r.isContraction);
    const durationSum = contractions.reduce((sum, r) => sum + (r.duration || 0), 0);
    const intervalSum = contractions.reduce((sum, r) => sum + (r.interval || 0), 0);
    const peakIntensity = readings.reduce((max, r) => Math.max(max, r.intensity || 0), 0);

    const endTime = session.endTime || new Date();
    const sessionDurationMs = endTime.getTime() - session.startTime.getTime();
    const sessionDurationMinutes = Math.round(sessionDurationMs / 60000);

    return {
      totalContractions: contractions.length,
      averageDuration: contractions.length > 0 ? Math.round(durationSum / contractions.length) : 0,
      averageInterval: contractions.length > 1 ? Math.round(intervalSum / (contractions.length - 1)) : 0,
      peakIntensity,
      sessionDurationMinutes,
    };
  }

  /**
   * Export session details as a CSV string
   */
  public static async exportToCsv(
    session: IMonitoringSession,
    readings: IContractionReading[]
  ): Promise<string> {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'rawAdc', title: 'Raw ADC' },
        { id: 'flexPercent', title: 'Flex Percentage (%)' },
        { id: 'intensity', title: 'Contraction Intensity (%)' },
        { id: 'isContraction', title: 'Contraction Detected' },
        { id: 'duration', title: 'Duration (seconds)' },
        { id: 'interval', title: 'Interval (seconds)' },
        { id: 'frequency', title: 'Frequency (per hour)' },
        { id: 'source', title: 'Source (Hardware/Manual)' },
        { id: 'isConfirmed', title: 'User Confirmed' },
      ],
    });

    const records = readings.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      rawAdc: r.rawAdc !== undefined ? r.rawAdc : '',
      flexPercent: r.flexPercent !== undefined ? r.flexPercent.toFixed(1) : '',
      intensity: r.intensity !== undefined ? r.intensity.toFixed(1) : '',
      isContraction: r.isContraction ? 'YES' : 'NO',
      duration: r.duration !== undefined ? r.duration : '',
      interval: r.interval !== undefined ? r.interval : '',
      frequency: r.frequency !== undefined ? r.frequency.toFixed(1) : '',
      source: r.source,
      isConfirmed: r.isConfirmed ? 'YES' : 'NO',
    }));

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    return header + body;
  }

  /**
   * Export session summary reports as a PDF buffer
   */
  public static async exportToPdf(
    session: IMonitoringSession,
    readings: IContractionReading[]
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Retrieve User & Pregnancy details
        const user = await User.findById(session.userId);
        const profile = await PregnancyProfile.findOne({ userId: session.userId });

        // Calculate statistics
        const stats = this.calculateSessionStats(session, readings);
        const contractions = readings.filter((r) => r.isContraction);

        // --- PDF LAYOUT DESIGN ---

        // Header Title
        doc.fillColor('#4A154B').fontSize(24).font('Helvetica-Bold').text('Contraction Monitoring Summary', { align: 'center' });
        doc.moveDown(0.2);
        doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Smart Maternal Belt System Report', { align: 'center' });
        doc.moveDown(1.5);

        // Draw Divider Line
        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(1);

        // Grid Columns - Patient Information & Session Information
        const col1X = 50;
        const col2X = 310;
        let originalY = doc.y;

        // Left Column: Patient Profile
        doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Patient Information', col1X, originalY);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
          .text(`Name: ${user ? user.name : 'Unknown User'}`)
          .moveDown(0.3)
          .text(`Due Date: ${profile ? profile.dueDate.toLocaleDateString() : 'N/A'}`)
          .moveDown(0.3)
          .text(`Gestational Age: ${profile ? profile.gestationalAgeWeeks + ' Weeks' : 'N/A'}`)
          .moveDown(0.3)
          .text(`Attending Doctor: ${profile ? profile.doctorName : 'N/A'}`);

        // Right Column: Session Metadata
        doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Session Information', col2X, originalY);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
          .text(`Session ID: ${session._id}`)
          .moveDown(0.3)
          .text(`Status: ${session.status.toUpperCase()}`)
          .moveDown(0.3)
          .text(`Started: ${session.startTime.toLocaleString()}`)
          .moveDown(0.3)
          .text(`Duration: ${stats.sessionDurationMinutes} minutes`);

        doc.moveDown(2);
        doc.x = col1X; // Reset X position

        // Statistics Summary Section (Styled Card Box)
        const summaryY = doc.y;
        doc.fillColor('#F7FAFC').rect(50, summaryY, 512, 85).fill();
        doc.strokeColor('#EDF2F7').lineWidth(1).rect(50, summaryY, 512, 85).stroke();

        doc.fillColor('#4A154B').fontSize(11).font('Helvetica-Bold').text('Monitoring Summary Statistics', 65, summaryY + 12);

        // Horizontal Grid inside summary box
        doc.fillColor('#2D3748').fontSize(9).font('Helvetica');
        doc.text('Total Contractions:', 65, summaryY + 35);
        doc.font('Helvetica-Bold').text(`${stats.totalContractions}`, 200, summaryY + 35);

        doc.font('Helvetica').text('Average Contraction Duration:', 65, summaryY + 50);
        doc.font('Helvetica-Bold').text(`${stats.averageDuration} seconds`, 200, summaryY + 50);

        doc.font('Helvetica').text('Average Contraction Interval:', 65, summaryY + 65);
        doc.font('Helvetica-Bold').text(`${stats.averageInterval > 0 ? stats.averageInterval + ' seconds' : 'N/A'}`, 200, summaryY + 65);

        doc.font('Helvetica').text('Peak Amplitude / Intensity:', 320, summaryY + 35);
        doc.font('Helvetica-Bold').text(`${stats.peakIntensity.toFixed(0)}%`, 460, summaryY + 35);

        doc.font('Helvetica').text('Active Monitoring Time:', 320, summaryY + 50);
        doc.font('Helvetica-Bold').text(`${stats.sessionDurationMinutes} mins`, 460, summaryY + 50);

        doc.moveDown(3);
        doc.y = summaryY + 105;

        // Contraction Timeline Table
        doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Contraction Detection Timeline');
        doc.moveDown(0.5);

        // Table Header
        const tableY = doc.y;
        doc.fillColor('#EDF2F7').rect(50, tableY, 512, 20).fill();
        doc.fillColor('#4A5568').fontSize(9).font('Helvetica-Bold');
        doc.text('#', 60, tableY + 6);
        doc.text('Timestamp', 90, tableY + 6);
        doc.text('Duration (sec)', 250, tableY + 6);
        doc.text('Interval (sec)', 350, tableY + 6);
        doc.text('Intensity (%)', 450, tableY + 6);

        let rowY = tableY + 20;
        doc.font('Helvetica').fillColor('#2D3748');

        if (contractions.length === 0) {
          doc.text('No contractions detected or recorded during this session.', 60, rowY + 6);
          rowY += 20;
        } else {
          contractions.forEach((c, index) => {
            // Draw alternating row backgrounds
            if (index % 2 === 1) {
              doc.fillColor('#F8FAFC').rect(50, rowY, 512, 20).fill();
            }

            doc.fillColor('#2D3748').fontSize(9);
            doc.text(`${index + 1}`, 60, rowY + 6);
            doc.text(`${c.timestamp.toLocaleTimeString()}`, 90, rowY + 6);
            doc.text(`${c.duration || 'N/A'}`, 250, rowY + 6);
            doc.text(`${c.interval || 'N/A'}`, 350, rowY + 6);
            doc.text(`${c.intensity ? Math.round(c.intensity) + '%' : 'N/A'}`, 450, rowY + 6);
            rowY += 20;

            // Page Break helper if rows exceed boundary
            if (rowY > 700) {
              doc.addPage();
              rowY = 50;
            }
          });
        }

        doc.y = rowY + 20;
        doc.moveDown(2);

        // --- MEDICAL DISCLAIMER SECTION ---
        const disclaimerY = doc.y;
        // Keep disclaimer at the bottom of the page
        if (disclaimerY > 600) {
          doc.addPage();
        }

        const safetyY = doc.y;
        doc.fillColor('#FFF5F5').rect(50, safetyY, 512, 60).fill();
        doc.strokeColor('#FEB2B2').lineWidth(1).rect(50, safetyY, 512, 60).stroke();

        doc.fillColor('#C53030').fontSize(9).font('Helvetica-Bold').text('SAFETY & MEDICAL DISCLAIMER', 65, safetyY + 10);
        doc.fillColor('#742A2A').font('Helvetica').fontSize(8).text(
          'This report is generated by the Smart Maternal Belt Contraction Monitoring System. ' +
          'It is intended strictly to support pattern monitoring and tracking. This module does NOT diagnose ' +
          'labor, make medical decisions, or replace professional healthcare diagnostics. ' +
          'If you experience bleeding, severe pain, leakage of fluid, or reduced fetal movement, contact emergency services immediately.',
          65,
          safetyY + 22,
          { width: 480, lineGap: 2 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Export all valid user sessions (>= 1 minute) into a single multi-page PDF
   */
  public static async exportAllToPdf(userId: string): Promise<Buffer> {
    const userOid = new mongoose.Types.ObjectId(userId);
    const sessions = await MonitoringSession.find({ userId: userOid }).sort({ startTime: -1 });

    const validSessions = sessions.filter((s) => {
      const end = s.endTime || s.startTime;
      return end.getTime() - s.startTime.getTime() >= 60 * 1000;
    });

    if (validSessions.length === 0) {
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50 });
          const buffers: Buffer[] = [];
          doc.on('data', (chunk) => buffers.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(buffers)));
          doc.fillColor('#4A154B').fontSize(20).font('Helvetica-Bold').text('Contraction Monitoring — Full History', { align: 'center' });
          doc.moveDown(1);
          doc.fillColor('#666666').fontSize(12).font('Helvetica').text('No sessions longer than 1 minute were found for this account.', { align: 'center' });
          doc.end();
        } catch (err) {
          reject(err);
        }
      });
    }

    const user = await User.findById(userId);
    const profile = await PregnancyProfile.findOne({ userId: userOid });

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fillColor('#4A154B').fontSize(24).font('Helvetica-Bold').text('Contraction Monitoring — Full History', { align: 'center' });
        doc.moveDown(0.2);
        doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Smart Maternal Belt System — Combined Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Patient: ${user ? user.name : 'Unknown User'}  ·  Sessions: ${validSessions.length}`, { align: 'center' });
        doc.moveDown(1.5);

        for (let i = 0; i < validSessions.length; i++) {
          if (i > 0) doc.addPage();
          const session = validSessions[i];
          const readings = await ContractionReading.find({ monitoringSessionId: session._id }).sort({ timestamp: 1 });
          this.renderSessionReport(doc, session, readings, user, profile);
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private static renderSessionReport(
    doc: InstanceType<typeof PDFDocument>,
    session: IMonitoringSession,
    readings: IContractionReading[],
    user: { name: string } | null,
    profile: { dueDate: Date; gestationalAgeWeeks: number; doctorName?: string } | null
  ): void {
    const stats = this.calculateSessionStats(session, readings);
    const contractions = readings.filter((r) => r.isContraction);

    doc.fillColor('#4A154B').fontSize(18).font('Helvetica-Bold').text('Session Report', { align: 'left' });
    doc.moveDown(0.2);
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text(`Session ${session._id}`, { align: 'left' });
    doc.moveDown(1);

    doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(1);

    const col1X = 50;
    const col2X = 310;
    const originalY = doc.y;

    doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Patient Information', col1X, originalY);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
      .text(`Name: ${user ? user.name : 'Unknown User'}`)
      .moveDown(0.3)
      .text(`Due Date: ${profile ? profile.dueDate.toLocaleDateString() : 'N/A'}`)
      .moveDown(0.3)
      .text(`Gestational Age: ${profile ? profile.gestationalAgeWeeks + ' Weeks' : 'N/A'}`)
      .moveDown(0.3)
      .text(`Attending Doctor: ${profile ? profile.doctorName : 'N/A'}`);

    doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Session Information', col2X, originalY);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
      .text(`Status: ${session.status.toUpperCase()}`)
      .moveDown(0.3)
      .text(`Started: ${session.startTime.toLocaleString()}`)
      .moveDown(0.3)
      .text(`Duration: ${stats.sessionDurationMinutes} minutes`);

    doc.moveDown(2);
    doc.x = col1X;

    const summaryY = doc.y;
    doc.fillColor('#F7FAFC').rect(50, summaryY, 512, 85).fill();
    doc.strokeColor('#EDF2F7').lineWidth(1).rect(50, summaryY, 512, 85).stroke();

    doc.fillColor('#4A154B').fontSize(11).font('Helvetica-Bold').text('Monitoring Summary Statistics', 65, summaryY + 12);

    doc.fillColor('#2D3748').fontSize(9).font('Helvetica');
    doc.text('Total Contractions:', 65, summaryY + 35);
    doc.font('Helvetica-Bold').text(`${stats.totalContractions}`, 200, summaryY + 35);

    doc.font('Helvetica').text('Average Contraction Duration:', 65, summaryY + 50);
    doc.font('Helvetica-Bold').text(`${stats.averageDuration} seconds`, 200, summaryY + 50);

    doc.font('Helvetica').text('Average Contraction Interval:', 65, summaryY + 65);
    doc.font('Helvetica-Bold').text(`${stats.averageInterval > 0 ? stats.averageInterval + ' seconds' : 'N/A'}`, 200, summaryY + 65);

    doc.font('Helvetica').text('Peak Amplitude / Intensity:', 320, summaryY + 35);
    doc.font('Helvetica-Bold').text(`${stats.peakIntensity.toFixed(0)}%`, 460, summaryY + 35);

    doc.font('Helvetica').text('Active Monitoring Time:', 320, summaryY + 50);
    doc.font('Helvetica-Bold').text(`${stats.sessionDurationMinutes} mins`, 460, summaryY + 50);

    doc.y = summaryY + 105;
    doc.moveDown(1);

    doc.fillColor('#1A202C').fontSize(12).font('Helvetica-Bold').text('Contraction Detection Timeline');
    doc.moveDown(0.5);

    const tableY = doc.y;
    doc.fillColor('#EDF2F7').rect(50, tableY, 512, 20).fill();
    doc.fillColor('#4A5568').fontSize(9).font('Helvetica-Bold');
    doc.text('#', 60, tableY + 6);
    doc.text('Timestamp', 90, tableY + 6);
    doc.text('Duration (sec)', 250, tableY + 6);
    doc.text('Interval (sec)', 350, tableY + 6);
    doc.text('Intensity (%)', 450, tableY + 6);

    let rowY = tableY + 20;
    doc.font('Helvetica').fillColor('#2D3748');

    if (contractions.length === 0) {
      doc.text('No contractions detected or recorded during this session.', 60, rowY + 6);
      rowY += 20;
    } else {
      contractions.forEach((c, index) => {
        if (index % 2 === 1) {
          doc.fillColor('#F8FAFC').rect(50, rowY, 512, 20).fill();
        }
        doc.fillColor('#2D3748').fontSize(9);
        doc.text(`${index + 1}`, 60, rowY + 6);
        doc.text(`${c.timestamp.toLocaleTimeString()}`, 90, rowY + 6);
        doc.text(`${c.duration || 'N/A'}`, 250, rowY + 6);
        doc.text(`${c.interval || 'N/A'}`, 350, rowY + 6);
        doc.text(`${c.intensity ? Math.round(c.intensity) + '%' : 'N/A'}`, 450, rowY + 6);
        rowY += 20;
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }
      });
    }

    doc.y = rowY + 10;
  }
}
