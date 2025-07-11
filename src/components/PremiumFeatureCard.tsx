import React from 'react';
import { CrownIcon, SparklesIcon } from '../icons';

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  enabled: boolean;
  tier: 'premium' | 'enterprise';
  onUpgrade?: () => void;
}

export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  title,
  description,
  icon,
  enabled,
  tier,
  onUpgrade
}) => {
  const tierColors = {
    premium: 'from-purple-500 to-blue-600',
    enterprise: 'from-amber-500 to-orange-600'
  };

  const tierLabels = {
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  return (
    <div className={`
      relative p-6 rounded-xl shadow-lg hover-lift transition-all duration-300
      ${enabled 
        ? 'bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800' 
        : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700'
      }
    `}>
      {/* Premium Badge */}
      <div className={`
        absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold text-white
        bg-gradient-to-r ${tierColors[tier]}
      `}>
        <div className="flex items-center gap-1">
          <CrownIcon className="w-3 h-3" />
          {tierLabels[tier]}
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-3 rounded-lg
          ${enabled 
            ? `bg-gradient-to-r ${tierColors[tier]}` 
            : 'bg-slate-200 dark:bg-slate-700'
          }
        `}>
          {icon || <SparklesIcon className="w-6 h-6 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`
            text-lg font-semibold mb-2
            ${enabled 
              ? 'text-slate-900 dark:text-slate-100' 
              : 'text-slate-500 dark:text-slate-400'
            }
          `}>
            {title}
          </h3>
          <p className={`
            text-sm leading-relaxed mb-4
            ${enabled 
              ? 'text-slate-600 dark:text-slate-300' 
              : 'text-slate-400 dark:text-slate-500'
            }
          `}>
            {description}
          </p>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            {enabled ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Attiva</span>
              </div>
            ) : (
              <button
                onClick={onUpgrade}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  bg-gradient-to-r ${tierColors[tier]} text-white
                  hover:shadow-lg hover:scale-105 active:scale-95
                `}
              >
                Sblocca Funzionalità
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disabled Overlay */}
      {!enabled && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 bg-opacity-50 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <CrownIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Richiede {tierLabels[tier]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};