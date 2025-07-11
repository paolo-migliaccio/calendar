# 🏔️ Dashboard Premium per Attività Commerciali

Una dashboard moderna e completa per la gestione di attività commerciali che pagano per essere presenti sulla piattaforma. Costruita con React, TypeScript e Tailwind CSS.

## ✨ Caratteristiche Principali

### 📊 Analytics Avanzate
- **Statistiche Dettagliate**: Visualizzazioni, click, chiamate, direzioni
- **Grafici Interattivi**: Trend temporali con Chart.js
- **Confronto Competitor**: Analisi della concorrenza
- **Metriche Revenue**: Tracciamento ricavi (Premium/Enterprise)

### 🎯 Gestione Campagne
- **Campagne Promozionali**: Creazione e gestione campagne
- **Budget Tracking**: Monitoraggio spese e performance
- **Boost Visibilità**: Aumento della visibilità nelle ricerche
- **Conversioni**: Tracciamento ROI e conversioni

### ⭐ Gestione Recensioni
- **Monitoraggio Recensioni**: Vista centralizzata di tutte le recensioni
- **Risposte Rapide**: Sistema di risposta veloce
- **Statistiche Rating**: Distribuzione delle valutazioni
- **Richieste Recensioni**: Invio automatico richieste

### 🚀 Funzionalità Premium
- **Analytics AI**: Insights intelligenti e predizioni
- **Gestione Recensioni AI**: Risposte automatiche intelligenti
- **Sistema Prenotazioni**: Calendario integrato con pagamenti
- **Marketing Automation**: Campagne automatizzate

### 🎨 Design e UX
- **Interfaccia Moderna**: Design pulito e professionale
- **Dark/Light Mode**: Supporto modalità scura
- **Responsive**: Ottimizzato per tutti i dispositivi
- **Animazioni Fluide**: Transizioni e micro-interazioni

## 🛠️ Tecnologie Utilizzate

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Chart.js** - Grafici e visualizzazioni
- **React Chart.js 2** - Integrazione React per Chart.js
- **Date-fns** - Manipolazione date
- **Lucide React** - Icone moderne

## 📦 Installazione

1. **Clona il repository**
```bash
git clone <repository-url>
cd business-dashboard-premium
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Installa dipendenze aggiuntive**
```bash
npm install react react-dom react-scripts typescript
npm install @types/react @types/react-dom @types/node
npm install chart.js react-chartjs-2 date-fns
npm install tailwindcss autoprefixer postcss
```

4. **Avvia il server di sviluppo**
```bash
npm start
```

5. **Costruisci per produzione**
```bash
npm run build
```

## 🚀 Avvio Rapido

### Configurazione Iniziale

1. **Crea file di configurazione PostCSS**
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

2. **Configura TypeScript per JSX**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

### Credenziali Demo

- **Email**: giuseppe@rifugiolecime.it
- **Password**: password123

## 📁 Struttura del Progetto

```
src/
├── components/           # Componenti React
│   ├── StatCard.tsx          # Card statistiche
│   ├── AnalyticsChart.tsx    # Grafici analytics
│   ├── PremiumFeatureCard.tsx # Card funzionalità premium
│   └── PremiumBusinessDashboard.tsx # Dashboard principale
├── icons/               # Icone SVG
│   └── index.tsx            # Esportazione icone
├── types.ts             # Definizioni TypeScript
├── App.tsx              # Componente principale
├── index.tsx            # Entry point
└── index.css            # Stili globali
```

## 🎯 Funzionalità per Piano

### 🆓 Piano Gratuito
- Statistiche base (visualizzazioni, click)
- Gestione scheda attività
- Risposta alle recensioni

### 💎 Piano Premium
- ✅ Tutte le funzionalità gratuite
- ✅ Analytics avanzate con trend
- ✅ Gestione campagne pubblicitarie
- ✅ Confronto competitor
- ✅ Metriche revenue
- ✅ Boost visibilità

### 🚀 Piano Enterprise
- ✅ Tutte le funzionalità Premium
- ✅ AI per gestione recensioni
- ✅ Sistema prenotazioni integrato
- ✅ Marketing automation
- ✅ API personalizzate
- ✅ Supporto prioritario

## 🎨 Personalizzazione

### Colori Tema
```css
/* Personalizza i colori nel file tailwind.config.js */
colors: {
  primary: { /* Blu personalizzato */ },
  premium: { /* Viola premium */ },
  success: { /* Verde successo */ },
  warning: { /* Arancione warning */ },
  danger: { /* Rosso errore */ }
}
```

### Componenti Personalizzati
```typescript
// Esempio di personalizzazione StatCard
<StatCard
  title="Nuova Metrica"
  value={1234}
  change={15.2}
  icon={<CustomIcon />}
  color="purple"
/>
```

## 📊 Integrazione Dati

### API Mock Data
I dati sono attualmente mockati per la demo. Per integrazione reale:

```typescript
// services/api.ts
export const fetchAnalytics = async (businessId: string) => {
  const response = await fetch(`/api/analytics/${businessId}`);
  return response.json();
};

export const fetchCampaigns = async (businessId: string) => {
  const response = await fetch(`/api/campaigns/${businessId}`);
  return response.json();
};
```

### Integrazione Chart.js
```typescript
// Personalizza grafici
const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: true },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true }
  }
};
```

## 🔒 Sicurezza

- **Autenticazione**: Sistema login con JWT
- **Autorizzazione**: Controllo accesso per piano
- **Validazione**: Input sanitization
- **HTTPS**: Comunicazioni sicure

## 📱 Responsive Design

La dashboard è completamente responsive:
- **Desktop**: Layout a 3 colonne
- **Tablet**: Layout a 2 colonne
- **Mobile**: Layout singola colonna con navigazione mobile

## 🎭 Dark Mode

Supporto completo per modalità scura:
```typescript
// Toggle dark mode
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
};
```

## 🚀 Performance

### Ottimizzazioni Implementate
- **Lazy Loading**: Caricamento differito componenti
- **Memoization**: React.memo per componenti pesanti
- **Bundle Splitting**: Code splitting automatico
- **Image Optimization**: Immagini responsive

### Metriche Target
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **CLS**: < 0.1
- **FID**: < 100ms

## 🧪 Testing

```bash
# Esegui test
npm test

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🚀 Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Roadmap

### Q1 2024
- [ ] Integrazione API reali
- [ ] Sistema notifiche push
- [ ] Export dati CSV/PDF

### Q2 2024
- [ ] App mobile React Native
- [ ] Integrazione pagamenti
- [ ] Chat support clienti

### Q3 2024
- [ ] AI recommendations
- [ ] Marketplace integrations
- [ ] Advanced reporting

## 🤝 Contributi

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit modifiche (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## 📝 Licenza

Questo progetto è licenziato sotto MIT License - vedi il file [LICENSE](LICENSE) per dettagli.

## 🆘 Supporto

- **Email**: support@businessplatform.it
- **Discord**: [Community Discord](https://discord.gg/business-platform)
- **Documentazione**: [docs.businessplatform.it](https://docs.businessplatform.it)

## 👥 Team

- **Frontend**: React/TypeScript specialists
- **Design**: UX/UI designers
- **Backend**: Node.js/Python developers
- **DevOps**: AWS/Docker experts

---

⭐ **Se ti piace questo progetto, lascia una stella su GitHub!**

💼 **Perfetto per attività commerciali che vogliono massimizzare la loro presenza online**
