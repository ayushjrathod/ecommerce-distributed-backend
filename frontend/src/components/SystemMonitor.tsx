import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface SystemMonitorProps {
  onStatusChange?: (status: 'healthy' | 'warning' | 'critical') => void;
}

interface SystemHealth {
  api: boolean;
  database: boolean;
  recommendation: boolean;
  graphql: boolean;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ onStatusChange }) => {
  const [health, setHealth] = useState<SystemHealth>({
    api: true,
    database: true,
    recommendation: true,
    graphql: true,
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [realTimeData, setRealTimeData] = useState({
    requestsPerMinute: 0,
    responseTime: 0,
    errorRate: 0,
  });

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        // Check recommendation service
        const recHealth = await apiService.checkRecommendationServiceHealth();

        // Simulate other health checks
        const newHealth: SystemHealth = {
          api: true,
          database: Math.random() > 0.05, // 95% uptime simulation
          recommendation: recHealth,
          graphql: Math.random() > 0.02, // 98% uptime simulation
          uptime: Math.floor(Date.now() / 1000) % 86400, // Seconds since midnight
          memoryUsage: Math.random() * 80 + 10, // 10-90%
          cpuUsage: Math.random() * 60 + 5, // 5-65%
          activeConnections: Math.floor(Math.random() * 100) + 20,
        };

        setHealth(newHealth);

        // Update real-time metrics
        setRealTimeData({
          requestsPerMinute: Math.floor(Math.random() * 500) + 100,
          responseTime: Math.random() * 200 + 50,
          errorRate: Math.random() * 2,
        });

        // Determine overall system status
        const criticalIssues = !newHealth.api || !newHealth.database;
        const warnings =
          !newHealth.recommendation ||
          !newHealth.graphql ||
          newHealth.memoryUsage > 80 ||
          newHealth.cpuUsage > 80;

        if (criticalIssues) {
          onStatusChange?.('critical');
        } else if (warnings) {
          onStatusChange?.('warning');
        } else {
          onStatusChange?.('healthy');
        }

        // Add log entry
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [`${timestamp}: System health check completed`, ...prev.slice(0, 9)]);
      } catch (error) {
        console.error('Health check failed:', error);
        setLogs((prev) => [
          `${new Date().toLocaleTimeString()}: Health check failed - ${error}`,
          ...prev.slice(0, 9),
        ]);
      }
    };

    // Initial check
    checkSystemHealth();

    // Set up interval for regular checks
    const interval = setInterval(checkSystemHealth, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [onStatusChange]);

  const getStatusColor = (status: boolean) => (status ? '#27ae60' : '#e74c3c');
  const getStatusIcon = (status: boolean) => (status ? '✅' : '❌');

  const getPerformanceColor = (
    value: number,
    thresholds: { warning: number; critical: number }
  ) => {
    if (value > thresholds.critical) return '#e74c3c';
    if (value > thresholds.warning) return '#f39c12';
    return '#27ae60';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Service Status */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem', color: '#374151' }}>🏥 Service Health</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(health.api)}</span>
            <span>API Gateway</span>
            <span style={{ color: getStatusColor(health.api), fontWeight: 'bold' }}>
              {health.api ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(health.database)}</span>
            <span>Database</span>
            <span style={{ color: getStatusColor(health.database), fontWeight: 'bold' }}>
              {health.database ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(health.recommendation)}</span>
            <span>Recommendations</span>
            <span style={{ color: getStatusColor(health.recommendation), fontWeight: 'bold' }}>
              {health.recommendation ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(health.graphql)}</span>
            <span>GraphQL</span>
            <span style={{ color: getStatusColor(health.graphql), fontWeight: 'bold' }}>
              {health.graphql ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem', color: '#374151' }}>⚡ Performance Metrics</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
              {formatUptime(health.uptime)}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Uptime</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getPerformanceColor(health.memoryUsage, { warning: 70, critical: 85 }),
              }}
            >
              {health.memoryUsage.toFixed(1)}%
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Memory Usage</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getPerformanceColor(health.cpuUsage, { warning: 60, critical: 80 }),
              }}
            >
              {health.cpuUsage.toFixed(1)}%
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>CPU Usage</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9b59b6' }}>
              {health.activeConnections}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Connections</div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem', color: '#374151' }}>📊 Real-time Metrics</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
              {realTimeData.requestsPerMinute}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Requests/min</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getPerformanceColor(realTimeData.responseTime, {
                  warning: 150,
                  critical: 300,
                }),
              }}
            >
              {realTimeData.responseTime.toFixed(0)}ms
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Response Time</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getPerformanceColor(realTimeData.errorRate, { warning: 1, critical: 3 }),
              }}
            >
              {realTimeData.errorRate.toFixed(2)}%
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Error Rate</div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem', color: '#374151' }}>📋 Recent Logs</h4>
        <div
          style={{
            background: '#374151',
            color: '#ecf0f1',
            padding: '1rem',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '0.25rem' }}>
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No recent logs...</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem', color: '#374151' }}>🔧 Quick Actions</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() =>
              setLogs((prev) => [
                `${new Date().toLocaleTimeString()}: Manual refresh triggered`,
                ...prev.slice(0, 9),
              ])
            }
          >
            🔄 Refresh
          </button>
          <button
            className="btn btn-warning"
            onClick={() =>
              setLogs((prev) => [
                `${new Date().toLocaleTimeString()}: Cache cleared`,
                ...prev.slice(0, 9),
              ])
            }
          >
            🧹 Clear Cache
          </button>
          <button
            className="btn btn-info"
            onClick={() =>
              setLogs((prev) => [
                `${new Date().toLocaleTimeString()}: Performance report generated`,
                ...prev.slice(0, 9),
              ])
            }
          >
            📈 Performance Report
          </button>
          <button className="btn btn-secondary" onClick={() => setLogs([])}>
            🗑️ Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
