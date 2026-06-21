import { Request, Response } from 'express';
import { Device } from '../../infrastructure/database/models';

export class DeviceController {
  /**
   * Registers a maternal belt device
   */
  public static async registerDevice(req: Request, res: Response) {
    try {
      const { serialNumber, name, firmwareVersion, batteryLevel, capabilities } = req.body;

      let device = await Device.findOne({ serialNumber });
      if (device) {
        // Update existing device
        device.name = name || device.name;
        device.firmwareVersion = firmwareVersion || device.firmwareVersion;
        device.batteryLevel = batteryLevel !== undefined ? batteryLevel : device.batteryLevel;
        device.capabilities = capabilities || device.capabilities;
        device.status = 'online';
        device.lastConnectedAt = new Date();
      } else {
        // Create new device
        device = new Device({
          serialNumber,
          name,
          firmwareVersion,
          batteryLevel: batteryLevel !== undefined ? batteryLevel : 100,
          capabilities: capabilities || ['adc', 'flex_percent'],
          status: 'online',
          lastConnectedAt: new Date(),
        });
      }

      await device.save();
      return res.status(200).json({
        message: 'Device synced successfully.',
        device,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error pairing device.' });
    }
  }

  /**
   * Lists all devices registered in the system
   */
  public static async getDevices(req: Request, res: Response) {
    try {
      const devices = await Device.find().sort({ lastConnectedAt: -1 });
      return res.status(200).json({ devices });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error listing devices.' });
    }
  }

  /**
   * Update device battery or capabilities
   */
  public static async updateDeviceStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { batteryLevel, status } = req.body;

      const device = await Device.findById(id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found.' });
      }

      if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
      if (status) device.status = status;
      device.lastConnectedAt = new Date();

      await device.save();
      return res.status(200).json({
        message: 'Device status updated.',
        device,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error updating device.' });
    }
  }
}
