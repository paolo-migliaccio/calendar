# 📅 Gestionale Calendario Formatori

Sistema completo per la gestione centralizzata del calendario dei formatori, prenotazioni auto aziendale e richieste di rimborso, con interfaccia moderna basata su FullCalendar, Bootstrap 5 e Material Design Lite.

## 🌟 Caratteristiche Principali

### 📅 Gestione Calendario
- **Vista multipla**: Mensile, settimanale e giornaliera con FullCalendar v6.1.18
- **Eventi colorati**: Diversi colori per tipo evento (Corso interno, Evento pubblico, Riunione, Formazione)
- **Drag & Drop**: Spostamento e ridimensionamento eventi direttamente nel calendario
- **Assegnazione formatori**: Ogni evento può essere assegnato a uno o più formatori
- **Controllo sovrapposizioni**: Validazione automatica per evitare conflitti

### 🚗 Prenotazione Auto Aziendale
- **Calendario dedicato**: Vista separata per le prenotazioni auto
- **Controllo conflitti**: Validazione automatica sovrapposizioni
- **Workflow approvazione**: Richiesta → Approvazione admin → Utilizzo
- **Upload documenti**: Possibilità di allegare giustificativi
- **Notifiche**: Alert automatiche per nuove richieste

### 💰 Gestione Rimborsi Spese
- **Categorie multiple**: Trasporto, vitto, alloggio, materiali, altro
- **Upload ricevute**: Supporto PDF, JPG, PNG, DOC, DOCX
- **Stati tracciabili**: In attesa → Approvato/Rifiutato
- **Report automatici**: Generazione report mensili
- **Workflow admin**: Dashboard per approvazioni rapide

### 🔐 Sistema Privilegi
- **Ruoli utente**: Admin e Formatore con permessi granulari
- **Permessi personalizzabili**: 
  - Può prenotare auto aziendale
  - Può richiedere rimborsi
- **Autenticazione sicura**: Sistema sessioni con timeout
- **Log attività**: Tracciamento completo azioni utenti

## 🛠️ Tecnologie Utilizzate

### Frontend
- **HTML5 + JavaScript Vanilla**
- **FullCalendar v6.1.18** per la gestione calendario
- **Bootstrap 5.3.0** per layout responsive
- **Material Design Lite 1.3.0** per componenti UI
- **Google Material Icons** per iconografia

### Backend
- **PHP 7.4+** con PDO per database
- **MySQL 5.7+** per persistenza dati
- **API RESTful** per comunicazione frontend-backend
- **Sistema sicurezza** con rate limiting e validazione input

### Sicurezza
- **Password hashing** con PHP password_hash()
- **Sanitizzazione input** completa
- **Rate limiting** per prevenire attacchi
- **Validazione file upload** con controllo tipi
- **Log completo** di tutte le attività

## 📦 Installazione e Deployment

### Prerequisiti
- **Server web** (Apache/Nginx) con PHP 7.4+
- **MySQL 5.7+** o MariaDB 10.2+
- **Moduli PHP**: PDO, PDO_MySQL, JSON, Session, FileInfo
- **SSL certificato** per ambiente produzione

### 1. Preparazione Server

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install apache2 php7.4 php7.4-mysql php7.4-json php7.4-session mysql-server

# CentOS/RHEL
sudo yum install httpd php php-mysqlnd php-json mysql-server
```

### 2. Configurazione Database

```bash
# Accesso MySQL
mysql -u root -p

# Esecuzione schema
mysql -u root -p < database/schema.sql
```

**Configurazione sicurezza database:**
```sql
-- Crea utente dedicato (consigliato per produzione)
CREATE USER 'calendario_app'@'localhost' IDENTIFIED BY 'PASSWORD_SICURA';
GRANT SELECT, INSERT, UPDATE, DELETE ON gestionale_formatori.* TO 'calendario_app'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurazione PHP

**File: `api/config/database.php`**
```php
// Aggiorna credenziali database
define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_formatori');
define('DB_USER', 'calendario_app');
define('DB_PASS', 'PASSWORD_SICURA');

// Aggiorna chiave JWT per produzione
define('JWT_SECRET', 'chiave-super-segreta-da-cambiare-in-produzione');
```

### 4. Configurazione Apache

**File: `/etc/apache2/sites-available/calendario.conf`**
```apache
<VirtualHost *:80>
    ServerName calendar.labcd.it
    DocumentRoot /var/www/calendario
    
    <Directory /var/www/calendario>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Redirect a HTTPS
    RewriteEngine on
    RewriteCond %{SERVER_NAME} =calendar.labcd.it
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

<VirtualHost *:443>
    ServerName calendar.labcd.it
    DocumentRoot /var/www/calendario
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    <Directory /var/www/calendario>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</VirtualHost>
```

### 5. Configurazione Permessi

```bash
# Proprietà file
sudo chown -R www-data:www-data /var/www/calendario
sudo chmod -R 755 /var/www/calendario

# Directory upload e log
sudo mkdir -p /var/www/calendario/uploads /var/www/calendario/logs /var/www/calendario/cache
sudo chmod -R 775 /var/www/calendario/uploads /var/www/calendario/logs /var/www/calendario/cache
sudo chown -R www-data:www-data /var/www/calendario/uploads /var/www/calendario/logs /var/www/calendario/cache
```

### 6. File .htaccess

**File: `.htaccess`**
```apache
RewriteEngine On

# Redirect API calls
RewriteRule ^api/(.*)$ api/$1 [L]

# Sicurezza
<Files "*.php">
    <IfModule mod_headers.c>
        Header set X-Content-Type-Options nosniff
        Header set X-Frame-Options DENY
        Header set X-XSS-Protection "1; mode=block"
    </IfModule>
</Files>

# Blocca accesso a file sensibili
<Files ~ "\.(log|sql|md)$">
    Order allow,deny
    Deny from all
</Files>

# Cache statico
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>
```

## 🔑 Credenziali Demo

### Utenti di Test

**👨‍💼 Amministratore:**
- Email: `mario.rossi@azienda.it`
- Password: `admin123`
- Privilegi: Completi (gestione eventi, approvazioni, report)

**👩‍🏫 Formatore Completo:**
- Email: `giulia.bianchi@azienda.it`
- Password: `formatore123`
- Privilegi: Eventi personali, prenotazioni auto, rimborsi

**👨‍🏫 Formatore Limitato:**
- Email: `luca.verde@azienda.it`
- Password: `formatore123`
- Privilegi: Solo eventi e rimborsi (no auto)

> ⚠️ **IMPORTANTE**: Cambiare tutte le password prima del deployment in produzione!

## 📱 Guida Utilizzo

### Login e Dashboard
1. Accedere all'URL del sistema
2. Inserire credenziali nella schermata di login
3. La dashboard mostra statistiche personali e menu principale

### Gestione Eventi
1. **Nuovo Evento**: Click su "Nuovo Evento" o selezione date nel calendario
2. **Modifica**: Click sull'evento esistente nel calendario
3. **Spostamento**: Drag & drop direttamente nel calendario
4. **Eliminazione**: Tramite modal di modifica evento

### Prenotazione Auto
1. Accedere alla sezione "Auto Aziendale"
2. Selezionare date nel calendario o compilare form manualmente
3. Inserire destinazione e note
4. Allegare eventuale giustificativo
5. Inviare richiesta (stato: in attesa)
6. L'admin riceverà notifica per approvazione

### Richiesta Rimborso
1. Accedere alla sezione "Rimborsi"
2. Compilare form con dettagli spesa
3. Selezionare categoria (trasporto, vitto, etc.)
4. Caricare ricevuta obbligatoria
5. Inviare richiesta per approvazione

### Funzioni Admin
1. **Dashboard Admin**: Panoramica richieste in sospeso
2. **Approvazioni**: Revisione e approvazione/rifiuto richieste
3. **Report**: Generazione report mensili automatici
4. **Gestione Utenti**: Visualizzazione e modifica permessi

## 🔧 API Endpoints

### Autenticazione
```
POST /api/auth.php?action=login     - Login utente
POST /api/auth.php?action=logout    - Logout utente
GET  /api/auth.php?action=profile   - Profilo utente corrente
PUT  /api/auth.php?action=profile   - Aggiorna profilo
```

### Eventi
```
GET    /api/events.php                    - Lista eventi
POST   /api/events.php                    - Crea evento
PUT    /api/events.php?id=X               - Aggiorna evento
DELETE /api/events.php?id=X               - Elimina evento
GET    /api/events.php?action=calendar    - Eventi FullCalendar
```

### Auto Aziendale
```
GET    /api/auto.php                      - Lista prenotazioni
POST   /api/auto.php                      - Crea prenotazione
PUT    /api/auto.php?id=X                 - Aggiorna prenotazione
DELETE /api/auto.php?id=X                 - Elimina prenotazione
PUT    /api/auto.php?id=X&action=approve  - Approva (admin)
PUT    /api/auto.php?id=X&action=reject   - Rifiuta (admin)
GET    /api/auto.php?action=calendar      - Calendario auto
```

### Rimborsi
```
GET    /api/rimborsi.php                  - Lista rimborsi
POST   /api/rimborsi.php                  - Crea rimborso
PUT    /api/rimborsi.php?id=X             - Aggiorna rimborso
DELETE /api/rimborsi.php?id=X             - Elimina rimborso
PUT    /api/rimborsi.php?id=X&action=approve - Approva (admin)
PUT    /api/rimborsi.php?id=X&action=reject  - Rifiuta (admin)
```

## 🔍 Struttura Database

### Tabelle Principali

**users** - Gestione utenti e permessi
```sql
id, nome, email, password_hash, ruolo, 
puo_prenotare_auto, puo_chiedere_rimborso, attivo
```

**events** - Eventi del calendario
```sql
id, titolo, descrizione, start_time, end_time, 
location, user_id, tipo_evento, colore, all_day
```

**auto_reservations** - Prenotazioni auto aziendale
```sql
id, user_id, data_partenza, data_rientro, destinazione, 
note, file_giustificativo, stato, approvato_da
```

**rimborsi** - Richieste di rimborso
```sql
id, user_id, data_spesa, descrizione, importo, 
tipo_spesa, file_ricevuta, stato, approvato_da
```

**activity_logs** - Log attività per audit
```sql
id, user_id, azione, tabella_interessata, record_id, 
dati_precedenti, dati_nuovi, ip_address, user_agent
```

## 🛡️ Sicurezza e Manutenzione

### Checklist Sicurezza
- [x] Password hashing con algoritmi sicuri
- [x] Validazione e sanitizzazione input
- [x] Rate limiting per login
- [x] Controllo permessi per ogni azione
- [x] Log completo attività utenti
- [x] Validazione tipi file upload
- [x] Headers sicurezza HTTP
- [x] Protezione CSRF per form

### Manutenzione
```bash
# Backup database giornaliero
mysqldump -u root -p gestionale_formatori > backup_$(date +%Y%m%d).sql

# Pulizia log automatica (crontab)
0 2 * * 0 php /var/www/calendario/scripts/cleanup_logs.php

# Monitoraggio spazio upload
du -sh /var/www/calendario/uploads/

# Verifica integrità file
find /var/www/calendario -type f -name "*.php" -exec php -l {} \;
```

### Log e Monitoring
- **Application logs**: `/logs/app.log`
- **Access logs**: Configurare Apache/Nginx
- **Error logs**: Monitorare PHP error log
- **Database**: Abilitare slow query log MySQL

## 🔄 Aggiornamenti e Personalizzazioni

### Modifiche Tipiche
1. **Nuovi tipi evento**: Aggiornare enum in database e frontend
2. **Campi aggiuntivi**: Modificare schema database e form
3. **Nuovi ruoli**: Estendere sistema permessi
4. **Integrazioni**: API per sistemi esterni (HR, contabilità)

### Estensioni Future
- [ ] Notifiche email automatiche
- [ ] Integrazione calendario Outlook/Google
- [ ] App mobile companion
- [ ] Dashboard analytics avanzata
- [ ] Integrazione sistema contabilità
- [ ] Multi-azienda/tenant

## 📞 Supporto e Troubleshooting

### Problemi Comuni

**Errore connessione database:**
```
Verificare credenziali in api/config/database.php
Controllare che MySQL sia avviato
Verificare permessi utente database
```

**Upload file non funziona:**
```
Verificare permessi directory uploads/
Controllare php.ini: upload_max_filesize, post_max_size
Verificare spazio disco disponibile
```

**Sessioni scadono troppo presto:**
```
Aumentare SESSION_TIMEOUT in database.php
Verificare configurazione session.gc_maxlifetime in php.ini
```

**Calendario non carica eventi:**
```
Verificare API endpoints nel browser Network tab
Controllare log errori PHP
Verificare autenticazione utente
```

### Contatti
- **Sistema**: Gestionale Calendario Formatori v1.0
- **Ambiente**: Production-ready con MySQL + PHP
- **Licenza**: Proprietaria per uso aziendale

---

**🚀 Il sistema è ora pronto per il deployment su calendar.labcd.it!**

Seguire la checklist di sicurezza e modificare tutte le password di default prima dell'utilizzo in produzione.
