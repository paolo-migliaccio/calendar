import React, { useState, useEffect } from 'react';
import { PremiumBusinessDashboard } from './components/PremiumBusinessDashboard';
import { CurrentUser, BusinessListing } from './types';

// Mock data per la demo
const mockUser: CurrentUser = {
  id: '1',
  name: 'Giuseppe Rossi',
  email: 'giuseppe@rifugiolecime.it',
  businessId: 'business-1',
  subscriptionTier: 'premium',
  subscriptionExpiry: new Date('2024-12-31')
};

const mockListing: BusinessListing = {
  id: 'business-1',
  title: 'Rifugio Le Cime',
  description: 'Un accogliente rifugio con cucina tipica e vista mozzafiato sulle montagne. Offriamo pernottamento e specialità locali fatte in casa con ingredienti a km zero.',
  url: 'https://www.rifugiolecime.it',
  category: 'Alloggio',
  address: 'Località Tre Cime, 32041 Auronzo di Cadore BL',
  phone: '+39 0435 1234567',
  email: 'info@rifugiolecime.it',
  photos: [
    'https://images.unsplash.com/photo-1589834390799-226876442654?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542332213-31f8734805c3?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop'
  ],
  logo: 'https://images.unsplash.com/photo-1464822759844-d150baec4e5b?q=80&w=200&auto=format&fit=crop',
  openingHours: {
    monday: { open: '07:00', close: '22:00' },
    tuesday: { open: '07:00', close: '22:00' },
    wednesday: { open: '07:00', close: '22:00' },
    thursday: { open: '07:00', close: '22:00' },
    friday: { open: '07:00', close: '23:00' },
    saturday: { open: '07:00', close: '23:00' },
    sunday: { open: '07:00', close: '22:00' }
  },
  amenities: [
    'WiFi Gratuito',
    'Parcheggio',
    'Ristorante',
    'Bar',
    'Terrazza Panoramica',
    'Camere Riscaldate',
    'Servizio Escursioni',
    'Prodotti Locali'
  ],
  priceRange: '€€',
  rating: 4.6,
  reviewCount: 143,
  verified: true,
  featured: true,
  socialMedia: {
    facebook: 'https://facebook.com/rifugiolecime',
    instagram: 'https://instagram.com/rifugiolecime',
    website: 'https://www.rifugiolecime.it'
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Simulate authentication check
    setTimeout(() => {
      setIsAuthenticated(true);
      setLoading(false);
    }, 1500);

    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Simulate logout process
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Caricamento Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Preparazione della tua dashboard premium...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Dashboard Premium
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Accedi alla tua dashboard per gestire la tua attività
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={mockUser.email}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                placeholder="Inserisci la tua email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                defaultValue="password123"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                placeholder="Inserisci la tua password"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAuthenticated(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Accedi alla Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
                Password dimenticata?
              </button>
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                {darkMode ? '☀️' : '🌙'}
                {darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Piano Premium Attivo
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <PremiumBusinessDashboard
        user={mockUser}
        listing={mockListing}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;