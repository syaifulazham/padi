const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

/**
 * Weighbridge Service
 * Serial port communication with weighbridge
 */

class WeighbridgeService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.portPath = process.env.WEIGHBRIDGE_PORT || 'COM3';
    this.baudRate = parseInt(process.env.WEIGHBRIDGE_BAUD_RATE) || 9600;
  }

  /**
   * Connect to weighbridge
   */
  async connect() {
    try {
      if (this.isConnected) {
        return { success: true, message: 'Already connected' };
      }

      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      return new Promise((resolve, reject) => {
        this.port.on('open', () => {
          this.isConnected = true;
          console.log(`✅ Weighbridge connected on ${this.portPath}`);
          resolve({ success: true, message: 'Weighbridge connected' });
        });

        this.port.on('error', (err) => {
          this.isConnected = false;
          console.error('❌ Weighbridge error:', err.message);
          reject({ success: false, error: err.message });
        });
      });
    } catch (error) {
      console.error('Error connecting to weighbridge:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from weighbridge
   */
  async disconnect() {
    try {
      if (this.port && this.port.isOpen) {
        await new Promise((resolve, reject) => {
          this.port.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        this.isConnected = false;
        console.log('Weighbridge disconnected');
      }
      return { success: true, message: 'Disconnected' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Read weight from weighbridge
   */
  async readWeight() {
    try {
      if (!this.isConnected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          throw new Error('Failed to connect to weighbridge');
        }
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout reading weight'));
        }, 5000);

        this.parser.once('data', (data) => {
          clearTimeout(timeout);
          try {
            const weight = this.parseWeight(data);
            resolve(weight);
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error reading weight:', error);
      throw error;
    }
  }

  /**
   * Parse weight data from weighbridge
   * Format depends on your weighbridge model
   * Common formats:
   * - "WT: 1234.5 kg"
   * - "1234.5"
   * - "+001234.5kg"
   */
  parseWeight(data) {
    try {
      console.log('Raw weighbridge data:', data);

      // Remove non-numeric characters except decimal point and minus sign
      let cleaned = data.toString().replace(/[^\d.-]/g, '');
      
      const weight = parseFloat(cleaned);
      
      if (isNaN(weight)) {
        throw new Error('Invalid weight data');
      }

      return {
        weight: weight,
        unit: 'kg',
        raw: data.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing weight:', error);
      throw new Error(`Failed to parse weight: ${error.message}`);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      port: this.portPath,
      baudRate: this.baudRate
    };
  }

  /**
   * List available serial ports
   */
  static async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        vendorId: port.vendorId,
        productId: port.productId
      }));
    } catch (error) {
      console.error('Error listing ports:', error);
      return [];
    }
  }
}

// Create singleton instance
const weighbridgeService = new WeighbridgeService();

module.exports = weighbridgeService;
