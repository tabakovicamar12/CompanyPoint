export interface LogEntry {
  _id?: string;
  timestamp: string;
  level?: string;
  logType?: string;
  service?: string;
  serviceName?: string;
  url: string;
  statusCode?: number;
  correlationId: string;
  message?: string;
}

export class LogsService {
  private baseUrl = 'http://localhost:3000';

  async syncLogs(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error syncing logs:', error);
      return false;
    }
  }

  async getLogs(from: string, to: string): Promise<LogEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/logs/${from}/${to}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();
      const logs = Array.isArray(data) ? data : [];
      
      // Map database fields to our interface
      return logs.map(log => ({
        _id: log._id,
        timestamp: log.timestamp,
        level: log.level || log.logType,
        logType: log.logType,
        service: log.service || log.serviceName,
        serviceName: log.serviceName,
        url: log.url,
        statusCode: log.statusCode,
        correlationId: log.correlationId,
        message: log.message
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/logs`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  }
}
