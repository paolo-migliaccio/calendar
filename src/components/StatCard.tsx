import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from '../icons';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  yellow: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  period = 'vs mese scorso',
  icon,
  color = 'blue',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-8 w-8 rounded-lg"></div>
        </div>
        <div className="skeleton h-8 w-20 mb-2"></div>
        <div className="skeleton h-3 w-16"></div>
      </div>
    );
  }

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover-lift animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {isPositive && (
                <TrendingUpIcon className="w-4 h-4 text-emerald-500 mr-1" />
              )}
              {isNegative && (
                <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                isPositive ? 'text-emerald-600' : 
                isNegative ? 'text-red-600' : 
                'text-slate-500'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {period}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};