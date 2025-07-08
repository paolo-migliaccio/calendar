@echo off
rem Facilescrivere.it - Script di avvio per Windows

echo 🚀 Avvio di Facilescrivere.it...

rem Verifica che Python sia installato
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non è installato. Installalo da python.org per continuare.
    pause
    exit /b 1
)

rem Verifica che pip sia installato
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip non è installato. Installalo per continuare.
    pause
    exit /b 1
)

echo ✅ Python e pip trovati

rem Installa le dipendenze
echo 📦 Controllo dipendenze...
pip install -r requirements.txt

rem Verifica che Flask sia installato
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ❌ Errore nell'installazione delle dipendenze
    pause
    exit /b 1
)

echo ✅ Dipendenze verificate

rem Crea la cartella per i documenti utente se non esiste
if not exist user_documents mkdir user_documents

echo 🌐 Avvio del server...
echo 📱 L'applicazione sarà disponibile su: http://localhost:5000
echo ⏹️ Chiudi questa finestra per fermare il server
echo.

rem Avvia l'applicazione Flask
python app.py

pause