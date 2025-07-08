#!/bin/bash

# Facilescrivere.it - Script di avvio
echo "🚀 Avvio di Facilescrivere.it..."

# Verifica che Python sia installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non è installato. Installalo per continuare."
    exit 1
fi

# Verifica che pip sia installato
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 non è installato. Installalo per continuare."
    exit 1
fi

echo "✅ Python e pip trovati"

# Installa le dipendenze se non sono già presenti
echo "📦 Controllo dipendenze..."
pip3 install -r requirements.txt

# Verifica che Flask sia installato
python3 -c "import flask" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Dipendenze verificate"
else
    echo "❌ Errore nell'installazione delle dipendenze"
    exit 1
fi

# Crea la cartella per i documenti utente se non esiste
mkdir -p user_documents

echo "🌐 Avvio del server..."
echo "📱 L'applicazione sarà disponibile su: http://localhost:5000"
echo "⏹️  Premi Ctrl+C per fermare il server"
echo ""

# Avvia l'applicazione Flask
python3 app.py