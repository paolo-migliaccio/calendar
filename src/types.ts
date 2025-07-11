export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  businessId: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  subscriptionExpiry?: Date;
}

export interface BusinessListing {
  id?: string;
  title: string;
  description: string;
  url: string;
  category: string;
  address: string;
  phone: string;
  email?: string;
  photos: string[];
  logo?: string;
  openingHours?: OpeningHours;
  amenities?: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  socialMedia?: SocialMedia;
}

export interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

export interface Analytics {
  views: AnalyticsData;
  clicks: AnalyticsData;
  calls: AnalyticsData;
  directions: AnalyticsData;
  bookings?: AnalyticsData;
  revenue?: AnalyticsData;
}

export interface AnalyticsData {
  total: number;
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  today: number;
  trend: number; // percentage change
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'promotion' | 'boost' | 'featured' | 'ads';
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: string;
  photos?: string[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface Competitor {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  views: number;
  distance: number;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  tier: 'premium' | 'enterprise';
  enabled: boolean;
}