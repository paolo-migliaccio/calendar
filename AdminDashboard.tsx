import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CurrentUser } from '../types';
import { MountainIcon } from './icons/MountainIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { BellIcon } from './icons/BellIcon';

// Types
type ApiStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';
type LogLevel = 'info' | 'warning' | 'error' | 'critical';
type AlertType = 'success' | 'warning' | 'error' | 'info';

interface ApiStatusInfo {
  name: string;
  status: ApiStatus;
  responseTime: number;
  uptime: number;
  lastCheck: string;
  endpoint: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
}

interface ErrorLog {
  id: number;
  level: LogLevel;
  service: string;
  message: string;
  time: string;
  stack?: string;
  userId?: string;
  requestId?: string;
}

interface UserActivity {
  id: string;
  name: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

interface DatabaseQuery {
  id: string;
  query: string;
  duration: number;
  timestamp: string;
  status: 'success' | 'error';
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
}

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

// Mock Data
const mockApiStatus: ApiStatusInfo[] = [
  { name: "Gemini API (@google/genai)", status: "operational", responseTime: 245, uptime: 99.9, lastCheck: "30s fa", endpoint: "/api/ai/gemini" },
  { name: "Deepseek API", status: "operational", responseTime: 312, uptime: 99.8, lastCheck: "30s fa", endpoint: "/api/ai/deepseek" },
  { name: "Mistral API", status: "degraded", responseTime: 1250, uptime: 97.2, lastCheck: "30s fa", endpoint: "/api/ai/mistral" },
  { name: "Nominatim Geocoding", status: "operational", responseTime: 180, uptime: 99.9, lastCheck: "30s fa", endpoint: "/api/geocoding" },
  { name: "Database Primary", status: "operational", responseTime: 15, uptime: 100, lastCheck: "30s fa", endpoint: "/api/db/health" },
  { name: "Redis Cache", status: "operational", responseTime: 2, uptime: 99.99, lastCheck: "30s fa", endpoint: "/api/cache/health" },
  { name: "File Storage (S3)", status: "operational", responseTime: 95, uptime: 99.9, lastCheck: "30s fa", endpoint: "/api/storage/health" },
  { name: "Email Service", status: "operational", responseTime: 450, uptime: 99.5, lastCheck: "30s fa", endpoint: "/api/email/health" },
];

const mockSystemMetrics: SystemMetric[] = [
  { name: "CPU Usage", value: 45, unit: "%", threshold: 80, status: "normal" },
  { name: "Memory Usage", value: 67, unit: "%", threshold: 85, status: "normal" },
  { name: "Disk Usage", value: 34, unit: "%", threshold: 90, status: "normal" },
  { name: "Network I/O", value: 125, unit: "MB/s", threshold: 500, status: "normal" },
  { name: "Active Connections", value: 1247, unit: "", threshold: 5000, status: "normal" },
  { name: "Queue Size", value: 23, unit: "jobs", threshold: 1000, status: "normal" },
];

const mockErrorLogs: ErrorLog[] = [
  { 
    id: 1, 
    level: 'critical', 
    service: 'Mistral API', 
    message: 'Connection timeout after 5000ms', 
    time: '2 min fa',
    stack: 'Error: ETIMEDOUT\n  at TCPConnectWrap.afterConnect...',
    requestId: 'req_abc123',
    userId: 'user_456'
  },
  { 
    id: 2, 
    level: 'error', 
    service: 'Gemini API', 
    message: 'Invalid response schema: missing required field "content"', 
    time: '15 min fa',
    requestId: 'req_def456'
  },
  { 
    id: 3, 
    level: 'warning', 
    service: 'Database', 
    message: 'Slow query detected: SELECT * FROM users WHERE... (2.3s)', 
    time: '1 ora fa',
    stack: 'Query: SELECT * FROM users WHERE created_at > ?'
  },
  { 
    id: 4, 
    level: 'error', 
    service: 'Redis Cache', 
    message: 'Cache miss rate above 15% threshold', 
    time: '2 ore fa'
  },
];

const mockUserActivity: UserActivity[] = [
  { id: '1', name: 'Marco Rossi', action: 'Login', timestamp: '5 min fa', ip: '192.168.1.1', userAgent: 'Chrome 119' },
  { id: '2', name: 'Anna Verdi', action: 'Created profile', timestamp: '12 min fa', ip: '10.0.0.45', userAgent: 'Firefox 118' },
  { id: '3', name: 'Luca Bianchi', action: 'Search: "Dolomiti"', timestamp: '18 min fa', ip: '172.16.0.10', userAgent: 'Safari 17' },
  { id: '4', name: 'Sistema', action: 'Cache cleared', timestamp: '25 min fa', ip: 'localhost', userAgent: 'Admin Dashboard' },
];

const mockDbQueries: DatabaseQuery[] = [
  { id: '1', query: 'SELECT * FROM profiles WHERE region = ?', duration: 45, timestamp: '1 min fa', status: 'success' },
  { id: '2', query: 'UPDATE users SET last_login = NOW() WHERE id = ?', duration: 12, timestamp: '3 min fa', status: 'success' },
  { id: '3', query: 'SELECT COUNT(*) FROM searches WHERE created_at > ?', duration: 156, timestamp: '5 min fa', status: 'success' },
  { id: '4', query: 'INSERT INTO error_logs (level, message) VALUES (?, ?)', duration: 2340, timestamp: '8 min fa', status: 'error' },
];

const mockFeatureFlags: FeatureFlag[] = [
  { name: 'advanced_search', enabled: true, description: 'Ricerca avanzata con filtri AI', rolloutPercentage: 100 },
  { name: 'beta_ui', enabled: false, description: 'Nuova interfaccia utente beta', rolloutPercentage: 0 },
  { name: 'premium_features', enabled: true, description: 'Funzionalità premium per utenti paganti', rolloutPercentage: 100 },
  { name: 'mobile_app_api', enabled: true, description: 'API per app mobile', rolloutPercentage: 75 },
  { name: 'social_login', enabled: false, description: 'Login con social networks', rolloutPercentage: 25 },
];

const mockStats = {
  activeUsers: '2,847',
  totalUsers: '18,431',
  profilesCreated: '4,318',
  searches: '11,204',
  apiCalls: '33,612',
  revenue: '€12,340',
  conversionRate: '3.2%',
  avgResponseTime: '245ms',
  errorRate: '0.02%',
  last7DaysSearches: [350, 410, 380, 520, 480, 550, 620],
  last7DaysUsers: [120, 140, 135, 180, 165, 195, 210],
  last24HoursApiCalls: [340, 380, 420, 390, 450, 520, 480, 460, 440, 380, 360, 340, 320, 350, 380, 420, 480, 520, 560, 580, 540, 500, 460, 420],
  topSearches: ['Tre Cime di Lavaredo', 'Lago di Braies', 'Sentiero del Ponale', 'Monte Bianco', 'Dolomiti'],
  apiUsage: [
    {name: 'Deepseek', count: 12401, cost: '€234.50'},
    {name: 'Gemini', count: 9803, cost: '€156.20'},
    {name: 'Mistral', count: 11408, cost: '€198.40'}
  ],
  geographicDistribution: [
    {region: 'Nord Italia', users: 8234, percentage: 45},
    {region: 'Centro Italia', users: 5512, percentage: 30},
    {region: 'Sud Italia', users: 3214, percentage: 17},
    {region: 'Isole', users: 1471, percentage: 8}
  ]
};

// Components
const StatusBadge: React.FC<{ status: ApiStatus }> = ({ status }) => {
  const configs = {
    operational: { text: 'Operativo', bg: 'bg-green-100 dark:bg-green-900/30', text_color: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
    degraded: { text: 'Rallentamenti', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text_color: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
    outage: { text: 'Fuori Servizio', bg: 'bg-red-100 dark:bg-red-900/30', text_color: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
    maintenance: { text: 'Manutenzione', bg: 'bg-blue-100 dark:bg-blue-900/30', text_color: 'text-blue-800 dark:text-blue-200', dot: 'bg-blue-500' },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text_color}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      {config.text}
    </span>
  );
};

const LogLevelBadge: React.FC<{ level: LogLevel }> = ({ level }) => {
  const configs = {
    info: { text: 'INFO', bg: 'bg-blue-100 dark:bg-blue-900/30', text_color: 'text-blue-800 dark:text-blue-200' },
    warning: { text: 'WARNING', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text_color: 'text-yellow-800 dark:text-yellow-200' },
    error: { text: 'ERROR', bg: 'bg-red-100 dark:bg-red-900/30', text_color: 'text-red-800 dark:text-red-200' },
    critical: { text: 'CRITICAL', bg: 'bg-red-100 dark:bg-red-900/30', text_color: 'text-red-800 dark:text-red-200' },
  };
  const config = configs[level];
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text_color}`}>
      {config.text}
    </span>
  );
};

const MetricCard: React.FC<{ metric: SystemMetric }> = ({ metric }) => {
  const statusColors = {
    normal: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400'
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.name}</h4>
          <p className={`text-2xl font-bold mt-1 ${statusColors[metric.status]}`}>
            {metric.value}{metric.unit}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-xs px-2 py-1 rounded ${metric.status === 'normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
            Limit: {metric.threshold}{metric.unit}
          </div>
        </div>
      </div>
      <div className="mt-3 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${metric.status === 'normal' ? 'bg-green-500' : metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; subtitle?: string; trend?: 'up' | 'down' | 'stable'; children?: React.ReactNode }> = ({ title, value, subtitle, trend, children }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h4>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded ${trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</p>
    {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    {children}
  </div>
);

const LineChart: React.FC<{data: number[], labels: string[], title: string}> = ({ data, labels, title }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <div className="h-64 relative">
        <svg className="w-full h-full">
          <polyline
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
            points={data.map((value, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((value - min) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
            vectorEffect="non-scaling-stroke"
          />
          {data.map((value, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="rgb(34, 197, 94)"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{labels[i]}: {value}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
};

const BarChart: React.FC<{data: number[], labels: string[], title: string}> = ({ data, labels, title }) => {
  const max = Math.max(...data);
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <div className="h-64 flex justify-around items-end gap-2">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end">
            <div 
              className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-colors cursor-pointer"
              style={{ height: `${(value / max) * 100}%` }}
              title={`${labels[i]}: ${value}`}
            ></div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export const AdminDashboard: React.FC<{ user: CurrentUser; onLogout: () => void; }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'logs' | 'database' | 'users' | 'tools' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date().toLocaleTimeString());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all');
  const [featureFlags, setFeatureFlags] = useState(mockFeatureFlags);
  const [queryToRun, setQueryToRun] = useState('');
  const [queryResult, setQueryResult] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', type: 'warning', title: 'High API Usage', message: 'Deepseek API usage is 20% above normal', timestamp: '5 min fa', dismissed: false },
    { id: '2', type: 'info', title: 'Maintenance Scheduled', message: 'Database maintenance scheduled for tomorrow 2:00 AM', timestamp: '1 ora fa', dismissed: false },
  ]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return mockErrorLogs;
    return mockErrorLogs.filter(log => log.level === logFilter);
  }, [logFilter]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const runDatabaseQuery = useCallback(() => {
    if (!queryToRun.trim()) return;
    setQueryResult(`Executing: ${queryToRun}\n\nResult: Query executed successfully (simulated)\nRows affected: 1\nExecution time: 23ms`);
  }, [queryToRun]);

  const toggleFeatureFlag = useCallback((name: string) => {
    setFeatureFlags(prev => prev.map(flag => 
      flag.name === name ? { ...flag, enabled: !flag.enabled } : flag
    ));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  }, []);

  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const tabConfig = {
    overview: { label: 'Panoramica', icon: '📊' },
    monitoring: { label: 'Monitoraggio', icon: '📈' },
    logs: { label: 'Log & Errori', icon: '📋' },
    database: { label: 'Database', icon: '🗃️' },
    users: { label: 'Utenti', icon: '👥' },
    tools: { label: 'Strumenti', icon: '🔧' },
    settings: { label: 'Impostazioni', icon: '⚙️' },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MountainIcon className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Controllo e monitoraggio piattaforma</p>
              </div>
            </div>
            
            {/* Alerts */}
            <div className="flex items-center gap-4">
              {alerts.filter(a => !a.dismissed).length > 0 && (
                <div className="relative">
                  <BellIcon className="h-6 w-6 text-amber-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {alerts.filter(a => !a.dismissed).length}
                  </span>
                </div>
              )}
              
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing} 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Aggiornando...' : 'Aggiorna'}
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Benvenuto, <span className="font-semibold">{user.name}</span>
                </span>
                <button 
                  onClick={onLogout} 
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" 
                  title="Logout"
                >
                  <LogOutIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Active Alerts */}
      {alerts.filter(a => !a.dismissed).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {alerts.filter(a => !a.dismissed).map(alert => (
              <div key={alert.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">{alert.title}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{alert.message}</p>
                  </div>
                </div>
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {Object.entries(tabConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Metriche Principali</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Utenti Attivi (24h)" value={mockStats.activeUsers} trend="up" subtitle="+12% da ieri" />
                <StatCard title="Ricerche (24h)" value={mockStats.searches} trend="up" subtitle="+8% da ieri" />
                <StatCard title="API Calls (24h)" value={mockStats.apiCalls} trend="stable" subtitle="Stabile" />
                <StatCard title="Tempo Risposta Medio" value={mockStats.avgResponseTime} trend="down" subtitle="-15ms da ieri" />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LineChart 
                data={mockStats.last7DaysUsers} 
                labels={['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']} 
                title="Utenti Attivi (7 giorni)" 
              />
              <BarChart 
                data={mockStats.last7DaysSearches} 
                labels={['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']} 
                title="Ricerche (7 giorni)" 
              />
            </div>

            {/* Recent Activity & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Attività Recente</h3>
                <div className="space-y-3">
                  {mockUserActivity.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{activity.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{activity.action}</p>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Ricerche Popolari</h3>
                <div className="space-y-3">
                  {mockStats.topSearches.map((search, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">{i + 1}. {search}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{Math.floor(Math.random() * 500) + 100}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Metriche di Sistema</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockSystemMetrics.map(metric => (
                  <MetricCard key={metric.name} metric={metric} />
                ))}
              </div>
            </div>

            {/* API Status */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Stato dei Servizi</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ultimo controllo: {lastChecked}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockApiStatus.map(api => (
                  <div key={api.name} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{api.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{api.endpoint}</p>
                      </div>
                      <StatusBadge status={api.status} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Risposta: {api.responseTime}ms</span>
                      <span className="text-slate-600 dark:text-slate-400">Uptime: {api.uptime}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Metrics Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">API Calls (Ultime 24 ore)</h3>
              <div className="h-64 flex items-end justify-between gap-1">
                {mockStats.last24HoursApiCalls.map((calls, i) => (
                  <div 
                    key={i}
                    className="bg-emerald-500 hover:bg-emerald-400 transition-colors cursor-pointer flex-1 rounded-t"
                    style={{ height: `${(calls / Math.max(...mockStats.last24HoursApiCalls)) * 100}%` }}
                    title={`Ora ${i}: ${calls} calls`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Log di Sistema</h2>
              <div className="flex items-center gap-4">
                <select 
                  value={logFilter} 
                  onChange={(e) => setLogFilter(e.target.value as LogLevel | 'all')}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                >
                  <option value="all">Tutti i log</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <LogLevelBadge level={log.level} />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{log.service}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{log.time}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">{log.message}</p>
                        {log.requestId && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Request ID: {log.requestId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestione Database</h2>
            
            {/* Query Runner */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Query Runner</h3>
              <div className="space-y-4">
                <textarea
                  value={queryToRun}
                  onChange={(e) => setQueryToRun(e.target.value)}
                  placeholder="Inserisci la tua query SQL..."
                  className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={runDatabaseQuery}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                  >
                    Esegui Query
                  </button>
                  <button 
                    onClick={() => setQueryToRun('')}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium"
                  >
                    Pulisci
                  </button>
                </div>
                {queryResult && (
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <pre className="text-sm font-mono text-slate-800 dark:text-slate-200">{queryResult}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Queries */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Query Recenti</h3>
              <div className="space-y-3">
                {mockDbQueries.map(query => (
                  <div key={query.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{query.query}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{query.timestamp}</span>
                        <span>{query.duration}ms</span>
                        <span className={`px-2 py-1 rounded ${query.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                          {query.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Backup & Restore</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                    Crea Backup
                  </button>
                  <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
                    Ripristina Backup
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Ottimizzazione</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
                    Analizza Tabelle
                  </button>
                  <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                    Ottimizza Indici
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestione Utenti</h2>
            
            {/* User Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Utenti Totali" value={mockStats.totalUsers} trend="up" />
              <StatCard title="Utenti Attivi (24h)" value={mockStats.activeUsers} trend="up" />
              <StatCard title="Tasso Conversione" value={mockStats.conversionRate} trend="stable" />
              <StatCard title="Ricavi (Mese)" value={mockStats.revenue} trend="up" />
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Distribuzione Geografica</h3>
              <div className="space-y-4">
                {mockStats.geographicDistribution.map((region, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{region.region}</span>
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 w-32">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${region.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{region.users.toLocaleString()}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">({region.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent User Activity */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Attività Utenti Recente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Utente</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Azione</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">IP</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Browser</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUserActivity.map(activity => (
                      <tr key={activity.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{activity.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{activity.action}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{activity.ip}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{activity.userAgent}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{activity.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Strumenti di Sviluppo</h2>
            
            {/* System Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Controlli Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-slate-700 dark:text-slate-300">Modalità Manutenzione</label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Disabilita l'accesso per gli utenti</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode} 
                        onChange={() => setMaintenanceMode(!maintenanceMode)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  {maintenanceMode && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <BellIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">Attenzione</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">La piattaforma è attualmente offline per gli utenti</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Cache & Performance</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => alert('Cache applicazione pulita!')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Pulisci Cache Applicazione
                  </button>
                  <button 
                    onClick={() => alert('Cache Redis pulita!')}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Pulisci Cache Redis
                  </button>
                  <button 
                    onClick={() => alert('CDN cache invalidata!')}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  >
                    Invalida Cache CDN
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Feature Flags</h3>
              <div className="space-y-4">
                {featureFlags.map(flag => (
                  <div key={flag.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{flag.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{flag.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Rollout: {flag.rolloutPercentage}%</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={flag.enabled} 
                        onChange={() => toggleFeatureFlag(flag.name)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* API Usage Monitoring */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Utilizzo API (24h)</h3>
              <div className="space-y-4">
                {mockStats.apiUsage.map((api, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{api.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{api.count.toLocaleString()} chiamate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{api.cost}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Costo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Impostazioni Sistema</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Environment Settings */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Ambiente</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ambiente Corrente</label>
                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                      <option>Production</option>
                      <option>Staging</option>
                      <option>Development</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Debug Mode</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sicurezza</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timeout Sessione (minuti)</label>
                    <input 
                      type="number" 
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rate Limit (req/min)</label>
                    <input 
                      type="number" 
                      defaultValue="100"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Notifiche</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">Email su errori critici</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">Slack notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Backup Settings */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Backup</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Frequenza Backup Automatico</label>
                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                      <option>Ogni ora</option>
                      <option>Ogni 6 ore</option>
                      <option>Giornaliero</option>
                      <option>Settimanale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Retention (giorni)</label>
                    <input 
                      type="number" 
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Settings */}
            <div className="flex justify-end gap-4">
              <button className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                Annulla
              </button>
              <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
                Salva Impostazioni
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Log Detail Modal */}
      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Dettagli Log"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <LogLevelBadge level={selectedLog.level} />
              <span className="font-medium">{selectedLog.service}</span>
              <span className="text-sm text-slate-500">{selectedLog.time}</span>
            </div>
            <div>
              <h4 className="font-medium mb-2">Messaggio</h4>
              <p className="font-mono text-sm bg-slate-100 dark:bg-slate-700 p-3 rounded">{selectedLog.message}</p>
            </div>
            {selectedLog.stack && (
              <div>
                <h4 className="font-medium mb-2">Stack Trace</h4>
                <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-3 rounded overflow-x-auto">{selectedLog.stack}</pre>
              </div>
            )}
            {selectedLog.requestId && (
              <div>
                <h4 className="font-medium mb-2">Request ID</h4>
                <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{selectedLog.requestId}</code>
              </div>
            )}
            {selectedLog.userId && (
              <div>
                <h4 className="font-medium mb-2">User ID</h4>
                <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{selectedLog.userId}</code>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};