# Facilescrivere.it - Assistente per la Scrittura

Un'applicazione web intuitiva e accessibile basata sull'intelligenza artificiale per assistere le persone con difficoltà di scrittura nella redazione di testi quotidiani e formali.

## 🎯 Obiettivo

Semplificare la comunicazione scritta per anziani e persone con difficoltà di scrittura, rendendo la scrittura chiara, corretta e appropriata al contesto.

## ✨ Funzionalità Principali

### 🔍 Motore di Correzione Intelligente
- Rilevamento e correzione di errori ortografici
- Suggerimenti per linguaggio più formale
- Correzioni contestuali automatiche

### 📄 Modelli di Documento Predefiniti
- **Lettera di Contestazione** - Per reclami formali
- **Email Formale** - Per comunicazioni professionali
- **Lettera di Auguri** - Per occasioni speciali
- **Richiesta Informazioni** - Per richieste ufficiali
- **Curriculum Vitae Semplice** - Per la ricerca del lavoro
- **Messaggio di Condoglianze** - Per momenti difficili

### 👤 Dizionario Personale
- Salvataggio di parole e frasi preferite
- Personalizzazione del vocabolario
- Accesso rapido alle espressioni frequenti

### 📁 Gestione Documenti
- Salvataggio automatico dei documenti
- Esportazione in formato PDF
- Monitoraggio delle modifiche

### ♿ Design Accessibile
- Interfaccia semplice e intuitiva
- Font grandi e contrasto elevato
- Pensato specificamente per anziani

## 🚀 Installazione e Avvio

### Prerequisiti
- Python 3.8 o superiore
- pip (gestore pacchetti Python)

### Installazione

1. **Clona o scarica il progetto**
   ```bash
   cd facilescrivere
   ```

2. **Installa le dipendenze**
   ```bash
   pip install -r requirements.txt
   ```

3. **Avvia l'applicazione**
   ```bash
   python app.py
   ```

4. **Apri il browser e vai su**
   ```
   http://localhost:5000
   ```

## 🎨 Come Utilizzare l'Applicazione

### 1. Scegliere un Modello
- Seleziona uno dei modelli predefiniti dalla sezione superiore
- Oppure scegli "Documento Vuoto" per iniziare da zero

### 2. Scrivere il Testo
- Compila i campi indicati tra parentesi quadre [...]
- Scrivi il contenuto del documento nell'area di testo

### 3. Controllare il Testo
- Clicca su "🔍 Controlla Testo" per ricevere suggerimenti
- Applica le correzioni suggerite automaticamente

### 4. Salvare ed Esportare
- Salva il documento con "💾 Salva Documento"
- Esporta in PDF con "📄 Esporta PDF"

### 5. Gestire il Dizionario Personale
- Aggiungi parole e frasi frequenti
- Accedi rapidamente alle tue espressioni preferite

## ⌨️ Scorciatoie da Tastiera

- **Ctrl + S**: Salva documento
- **Ctrl + Enter**: Controlla grammatica
- **Esc**: Chiudi overlay e messaggi

## 🛠️ Tecnologie Utilizzate

### Backend
- **Python 3.8+** - Linguaggio di programmazione principale
- **Flask** - Framework web leggero
- **ReportLab** - Generazione PDF

### Frontend
- **HTML5** - Struttura della pagina
- **CSS3** - Design responsivo e accessibile
- **JavaScript ES6+** - Interattività lato client

### Funzionalità AI/NLP
- **Correzione ortografica** - Sistema di correzione integrato
- **Analisi del linguaggio** - Suggerimenti per formalità
- **Elaborazione del testo** - Analisi e miglioramento automatico

## 📁 Struttura del Progetto

```
facilescrivere/
├── app.py                 # Applicazione Flask principale
├── requirements.txt       # Dipendenze Python
├── README.md             # Questo file
├── templates/
│   └── index.html        # Template HTML principale
├── static/
│   ├── css/
│   │   └── style.css     # Stili CSS
│   └── js/
│       └── app.js        # JavaScript frontend
└── user_documents/       # Documenti salvati (creata automaticamente)
```

## 🔧 Configurazione

L'applicazione utilizza le seguenti impostazioni predefinite:
- **Porta**: 5000
- **Host**: 0.0.0.0 (accessibile da rete locale)
- **Debug**: Abilitato in sviluppo
- **Cartella documenti**: `user_documents/`

## 🚀 Funzionalità Future

### Integrazioni AI Avanzate
- **Google Cloud Natural Language API** - Analisi del sentimento
- **OpenAI GPT** - Suggerimenti di scrittura avanzati
- **Microsoft Translator** - Supporto multilingue

### Miglioramenti UI/UX
- **Modalità notturna** - Per ridurre l'affaticamento degli occhi
- **Zoom avanzato** - Controllo granulare delle dimensioni
- **Sintesi vocale** - Lettura ad alta voce del testo

### Funzionalità Aggiuntive
- **Cronologia documenti** - Elenco documenti salvati
- **Condivisione documenti** - Invio via email
- **Backup cloud** - Sincronizzazione online
- **Analytics di utilizzo** - Statistiche per miglioramenti

## 🐛 Risoluzione Problemi

### L'applicazione non si avvia
1. Verifica che Python sia installato: `python --version`
2. Installa le dipendenze: `pip install -r requirements.txt`
3. Controlla che la porta 5000 sia libera

### Errori di dipendenze
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Problemi di PDF
Assicurati che ReportLab sia installato correttamente:
```bash
pip install reportlab==4.0.4
```

## 📞 Supporto

Per supporto tecnico o suggerimenti:
- 📧 Email: support@facilescrivere.it
- 📱 Telefono: +39 XXX XXX XXXX
- 🌐 Sito web: https://facilescrivere.it

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedere il file LICENSE per i dettagli.

## 👥 Contributi

I contributi sono benvenuti! Per contribuire:
1. Fork del repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push al branch
5. Apri una Pull Request

## 🔄 Aggiornamenti

**Versione 1.0.0** (2024)
- Rilascio iniziale
- Modelli di documento base
- Correzione grammaticale semplice
- Export PDF
- Dizionario personale

---

**Facilescrivere.it** - Rendere la scrittura accessibile a tutti! ✍️❤️