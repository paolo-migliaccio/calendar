import React, { useState, useEffect } from 'react';
import { 
  CurrentUser, 
  BusinessListing, 
  Analytics, 
  Campaign, 
  Review, 
  Notification,
  Competitor,
  PremiumFeature
} from '../types';
import { StatCard } from './StatCard';
import { AnalyticsChart } from './AnalyticsChart';
import { PremiumFeatureCard } from './PremiumFeatureCard';
import { 
  MountainIcon, 
  LogOutIcon, 
  EyeIcon, 
  MouseClickIcon, 
  PhoneIcon, 
  LocationIcon,
  DollarIcon,
  UsersIcon,
  BarChartIcon,
  BellIcon,
  CrownIcon,
  SettingsIcon,
  StarIcon,
  TrendingUpIcon,
  SparklesIcon,
  ShareIcon,
  MessageIcon,
  ExternalLinkIcon,
  CalendarIcon,
  ThumbsUpIcon
} from '../icons';

interface PremiumBusinessDashboardProps {
  user: CurrentUser;
  listing: BusinessListing;
  onLogout: () => void;
}

// Mock data per la demo
const mockAnalytics: Analytics = {
  views: {
    total: 12450,
    thisMonth: 1245,
    lastMonth: 1089,
    thisWeek: 287,
    today: 43,
    trend: 14.3,
    chartData: [
      { date: '1 Gen', value: 850 },
      { date: '8 Gen', value: 920 },
      { date: '15 Gen', value: 1050 },
      { date: '22 Gen', value: 1150 },
      { date: '29 Gen', value: 1245 },
    ]
  },
  clicks: {
    total: 3420,
    thisMonth: 342,
    lastMonth: 298,
    thisWeek: 78,
    today: 12,
    trend: 14.8,
    chartData: [
      { date: '1 Gen', value: 240 },
      { date: '8 Gen', value: 265 },
      { date: '15 Gen', value: 290 },
      { date: '22 Gen', value: 320 },
      { date: '29 Gen', value: 342 },
    ]
  },
  calls: {
    total: 890,
    thisMonth: 89,
    lastMonth: 76,
    thisWeek: 21,
    today: 3,
    trend: 17.1,
    chartData: [
      { date: '1 Gen', value: 60 },
      { date: '8 Gen', value: 68 },
      { date: '15 Gen', value: 75 },
      { date: '22 Gen', value: 82 },
      { date: '29 Gen', value: 89 },
    ]
  },
  directions: {
    total: 2340,
    thisMonth: 234,
    lastMonth: 201,
    thisWeek: 54,
    today: 8,
    trend: 16.4,
    chartData: [
      { date: '1 Gen', value: 165 },
      { date: '8 Gen', value: 180 },
      { date: '15 Gen', value: 200 },
      { date: '22 Gen', value: 220 },
      { date: '29 Gen', value: 234 },
    ]
  },
  revenue: {
    total: 45600,
    thisMonth: 4560,
    lastMonth: 3890,
    thisWeek: 1045,
    today: 156,
    trend: 17.2,
    chartData: [
      { date: '1 Gen', value: 3200 },
      { date: '8 Gen', value: 3580 },
      { date: '15 Gen', value: 3950 },
      { date: '22 Gen', value: 4280 },
      { date: '29 Gen', value: 4560 },
    ]
  }
};

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Promozione Inverno 2024',
    type: 'promotion',
    status: 'active',
    budget: 500,
    spent: 234,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    impressions: 12500,
    clicks: 890,
    conversions: 45
  },
  {
    id: '2',
    name: 'Boost Visibilità',
    type: 'boost',
    status: 'active',
    budget: 200,
    spent: 178,
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    impressions: 8900,
    clicks: 567,
    conversions: 28
  }
];

const mockReviews: Review[] = [
  {
    id: '1',
    author: 'Marco Rossi',
    rating: 5,
    text: 'Esperienza fantastica! Staff molto professionale e location mozzafiato.',
    date: '2024-01-20',
    response: 'Grazie Marco per la splendida recensione!'
  },
  {
    id: '2',
    author: 'Anna Bianchi',
    rating: 4,
    text: 'Ottimo servizio, unica pecca i tempi di attesa un po lunghi.',
    date: '2024-01-18'
  }
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Nuova Recensione',
    message: 'Hai ricevuto una nuova recensione 5 stelle!',
    date: '2024-01-20',
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Budget Campagna',
    message: 'La campagna "Boost Visibilità" ha raggiunto l\'80% del budget.',
    date: '2024-01-19',
    read: false
  }
];

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Rifugio Monte Bianco',
    category: 'Alloggio',
    rating: 4.3,
    reviewCount: 156,
    views: 980,
    distance: 2.5
  },
  {
    id: '2',
    name: 'Chalet Alpino',
    category: 'Alloggio',
    rating: 4.1,
    reviewCount: 89,
    views: 750,
    distance: 4.2
  }
];

const premiumFeatures: PremiumFeature[] = [
  {
    id: '1',
    name: 'Analytics Avanzate',
    description: 'Statistiche dettagliate con confronti competitor e trend di mercato',
    tier: 'premium',
    enabled: true
  },
  {
    id: '2',
    name: 'Campagne Pubblicitarie',
    description: 'Crea e gestisci campagne promozionali per aumentare la visibilità',
    tier: 'premium',
    enabled: true
  },
  {
    id: '3',
    name: 'Gestione Recensioni AI',
    description: 'Risposte automatiche intelligenti e analisi sentiment',
    tier: 'enterprise',
    enabled: false
  },
  {
    id: '4',
    name: 'Prenotazioni Integrate',
    description: 'Sistema di prenotazione completo con calendario e pagamenti',
    tier: 'enterprise',
    enabled: false
  }
];

export const PremiumBusinessDashboard: React.FC<PremiumBusinessDashboardProps> = ({
  user,
  listing,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'campaigns' | 'reviews' | 'features'>('overview');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <BarChartIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUpIcon /> },
    { id: 'campaigns', label: 'Campagne', icon: <SparklesIcon /> },
    { id: 'reviews', label: 'Recensioni', icon: <StarIcon /> },
    { id: 'features', label: 'Funzionalità', icon: <CrownIcon /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <MountainIcon className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Dashboard Premium
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {listing.title}
                  </p>
                </div>
              </div>
              {user.subscriptionTier !== 'free' && (
                <div className="premium-badge">
                  <CrownIcon className="w-3 h-3 mr-1" />
                  {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Logout"
                >
                  <LogOutIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Panoramica Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Visualizzazioni"
                  value={mockAnalytics.views.thisMonth}
                  change={mockAnalytics.views.trend}
                  icon={<EyeIcon />}
                  color="blue"
                  loading={loading}
                />
                <StatCard
                  title="Click al Sito"
                  value={mockAnalytics.clicks.thisMonth}
                  change={mockAnalytics.clicks.trend}
                  icon={<MouseClickIcon />}
                  color="green"
                  loading={loading}
                />
                <StatCard
                  title="Chiamate"
                  value={mockAnalytics.calls.thisMonth}
                  change={mockAnalytics.calls.trend}
                  icon={<PhoneIcon />}
                  color="yellow"
                  loading={loading}
                />
                <StatCard
                  title="Direzioni"
                  value={mockAnalytics.directions.thisMonth}
                  change={mockAnalytics.directions.trend}
                  icon={<LocationIcon />}
                  color="purple"
                  loading={loading}
                />
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnalyticsChart
                type="line"
                title="Trend Visualizzazioni"
                data={mockAnalytics.views.chartData}
                color="#3b82f6"
                loading={loading}
              />
              <AnalyticsChart
                type="bar"
                title="Azioni Utenti"
                data={mockAnalytics.clicks.chartData}
                color="#10b981"
                loading={loading}
              />
            </section>

            {/* Quick Actions */}
            <section>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Azioni Rapide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover-lift">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <ShareIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Condividi Scheda
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Condividi la tua scheda sui social media
                  </p>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Condividi
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover-lift">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Gestisci Orari
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Aggiorna gli orari di apertura
                  </p>
                  <button className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Modifica
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover-lift">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Crea Campagna
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Avvia una nuova campagna promozionale
                  </p>
                  <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Crea
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Analytics Dettagliate
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <ExternalLinkIcon className="w-4 h-4" />
                Esporta Report
              </button>
            </div>

            {/* Revenue Card */}
            {user.subscriptionTier !== 'free' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AnalyticsChart
                    type="line"
                    title="Trend Revenue (€)"
                    data={mockAnalytics.revenue!.chartData}
                    color="#f59e0b"
                    height={400}
                    loading={loading}
                  />
                </div>
                <div className="space-y-6">
                  <StatCard
                    title="Revenue Totale"
                    value={`€${mockAnalytics.revenue!.total.toLocaleString('it-IT')}`}
                    change={mockAnalytics.revenue!.trend}
                    icon={<DollarIcon />}
                    color="yellow"
                    loading={loading}
                  />
                  <StatCard
                    title="Revenue Mensile"
                    value={`€${mockAnalytics.revenue!.thisMonth.toLocaleString('it-IT')}`}
                    change={mockAnalytics.revenue!.trend}
                    icon={<DollarIcon />}
                    color="green"
                    loading={loading}
                  />
                </div>
              </div>
            )}

            {/* Competitor Analysis */}
            <section>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Analisi Competitor
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockCompetitors.map((competitor) => (
                      <div key={competitor.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {competitor.name}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Rating:</span>
                            <div className="flex items-center gap-1">
                              <StarIcon className="w-4 h-4 text-yellow-500" filled />
                              <span className="font-medium">{competitor.rating}</span>
                              <span className="text-slate-400">({competitor.reviewCount})</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Visualizzazioni:</span>
                            <span className="font-medium">{competitor.views}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Distanza:</span>
                            <span className="font-medium">{competitor.distance} km</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Gestione Campagne
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <SparklesIcon className="w-4 h-4" />
                Nuova Campagna
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {mockCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}
                        `}>
                          {campaign.status === 'active' ? 'Attiva' : 'Pausata'}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {campaign.type === 'promotion' ? 'Promozione' : 'Boost'}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <SettingsIcon className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Budget</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        €{campaign.spent} / €{campaign.budget}
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Performance</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Impressioni:</span>
                          <span className="font-medium">{campaign.impressions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Click:</span>
                          <span className="font-medium">{campaign.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversioni:</span>
                          <span className="font-medium text-emerald-600">{campaign.conversions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      Modifica
                    </button>
                    <button className={`
                      flex-1 py-2 px-4 rounded-lg transition-colors
                      ${campaign.status === 'active' 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800'
                      }
                    `}>
                      {campaign.status === 'active' ? 'Pausa' : 'Riattiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Gestione Recensioni
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-yellow-500">
                  <StarIcon className="w-5 h-5" filled />
                  <span className="text-lg font-semibold">{listing.rating || 4.6}</span>
                  <span className="text-sm text-slate-500">({listing.reviewCount || 143} recensioni)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {review.author}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className="w-4 h-4 text-yellow-500" 
                              filled={i < review.rating} 
                            />
                          ))}
                          <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                            {review.date}
                          </span>
                        </div>
                      </div>
                      <button className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                        <MessageIcon className="w-3 h-3" />
                        Rispondi
                      </button>
                    </div>
                    
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      {review.text}
                    </p>
                    
                    {review.response && (
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Risposta del proprietario:
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {review.response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Statistiche Recensioni
                  </h3>
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-8">{stars}</span>
                        <StarIcon className="w-4 h-4 text-yellow-500" filled />
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400 w-8">
                          {stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Azioni Rapide
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-2 py-2 px-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                      <ThumbsUpIcon className="w-4 h-4" />
                      Invia Richiesta Recensione
                    </button>
                    <button className="w-full flex items-center gap-2 py-2 px-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                      <MessageIcon className="w-4 h-4" />
                      Rispondi a Tutte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Funzionalità Premium
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Sblocca tutto il potenziale della tua attività con le nostre funzionalità avanzate
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {premiumFeatures.map((feature) => (
                <PremiumFeatureCard
                  key={feature.id}
                  title={feature.name}
                  description={feature.description}
                  enabled={feature.enabled}
                  tier={feature.tier}
                  onUpgrade={() => {
                    // Handle upgrade logic
                    console.log(`Upgrade to ${feature.tier} for ${feature.name}`);
                  }}
                />
              ))}
            </div>

            {/* Subscription Info */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    Porta la tua attività al livello successivo
                  </h3>
                  <p className="text-purple-100 mb-6">
                    Upgrade al piano Enterprise per sbloccare tutte le funzionalità avanzate e massimizzare il tuo successo online.
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors">
                      Upgrade a Enterprise
                    </button>
                    <button className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors">
                      Scopri di Più
                    </button>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="inline-block p-4 bg-white bg-opacity-20 rounded-full">
                    <CrownIcon className="w-16 h-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};