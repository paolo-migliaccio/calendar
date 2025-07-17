-- Schema Database Gestionale Calendario Formatori
-- Versione: 1.0
-- Compatibilità: MySQL 5.7+

-- Crea database se non esistente
CREATE DATABASE IF NOT EXISTS gestionale_formatori CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestionale_formatori;

-- Tabella utenti
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ruolo ENUM('admin', 'formatore') NOT NULL DEFAULT 'formatore',
    puo_prenotare_auto BOOLEAN DEFAULT TRUE,
    puo_chiedere_rimborso BOOLEAN DEFAULT TRUE,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_ruolo (ruolo),
    INDEX idx_attivo (attivo)
);

-- Tabella eventi/calendario
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titolo VARCHAR(200) NOT NULL,
    descrizione TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location VARCHAR(200),
    user_id INT NOT NULL,
    tipo_evento ENUM('corso-interno', 'evento-pubblico', 'riunione', 'formazione') NOT NULL,
    colore VARCHAR(7) DEFAULT '#3f51b5',
    all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_tipo_evento (tipo_evento),
    INDEX idx_start_time (start_time),
    INDEX idx_date_range (start_time, end_time)
);

-- Tabella prenotazioni auto aziendale
CREATE TABLE auto_reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    data_partenza DATETIME NOT NULL,
    data_rientro DATETIME NOT NULL,
    destinazione VARCHAR(200) NOT NULL,
    note TEXT,
    file_giustificativo VARCHAR(255),
    stato ENUM('in-attesa', 'approvato', 'rifiutato', 'completato') DEFAULT 'in-attesa',
    motivo_rifiuto TEXT,
    approvato_da INT,
    approvato_il TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approvato_da) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_stato (stato),
    INDEX idx_data_partenza (data_partenza),
    INDEX idx_date_range (data_partenza, data_rientro),
    
    -- Controllo sovrapposizioni
    CONSTRAINT chk_date_order CHECK (data_rientro > data_partenza)
);

-- Tabella rimborsi spese
CREATE TABLE rimborsi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    data_spesa DATE NOT NULL,
    descrizione TEXT NOT NULL,
    importo DECIMAL(10,2) NOT NULL,
    tipo_spesa ENUM('trasporto', 'vitto', 'alloggio', 'materiali', 'altro') NOT NULL,
    file_ricevuta VARCHAR(255),
    stato ENUM('in-attesa', 'approvato', 'rifiutato') DEFAULT 'in-attesa',
    motivo_rifiuto TEXT,
    approvato_da INT,
    approvato_il TIMESTAMP NULL,
    note_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approvato_da) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_stato (stato),
    INDEX idx_data_spesa (data_spesa),
    INDEX idx_tipo_spesa (tipo_spesa),
    
    CONSTRAINT chk_importo_positivo CHECK (importo > 0)
);

-- Tabella log attività (per audit)
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    azione VARCHAR(100) NOT NULL,
    tabella_interessata VARCHAR(50),
    record_id INT,
    dati_precedenti JSON,
    dati_nuovi JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_azione (azione),
    INDEX idx_tabella (tabella_interessata),
    INDEX idx_created_at (created_at)
);

-- Tabella configurazioni sistema
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chiave VARCHAR(100) UNIQUE NOT NULL,
    valore TEXT,
    descrizione TEXT,
    tipo ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_chiave (chiave)
);

-- Inserimento dati di esempio
INSERT INTO users (nome, email, password_hash, ruolo, puo_prenotare_auto, puo_chiedere_rimborso) VALUES
('Mario Rossi', 'mario.rossi@azienda.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE, TRUE),
('Giulia Bianchi', 'giulia.bianchi@azienda.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'formatore', TRUE, TRUE),
('Luca Verde', 'luca.verde@azienda.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'formatore', FALSE, TRUE),
('Anna Neri', 'anna.neri@azienda.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'formatore', TRUE, TRUE);

-- Eventi di esempio
INSERT INTO events (titolo, descrizione, start_time, end_time, location, user_id, tipo_evento, colore) VALUES
('Corso Excel Avanzato', 'Corso di formazione su Excel per dipendenti', '2024-02-15 09:00:00', '2024-02-15 17:00:00', 'Aula 1', 2, 'corso-interno', '#4caf50'),
('Workshop Pubblico Digital Marketing', 'Evento aperto al pubblico', '2024-02-20 14:00:00', '2024-02-20 18:00:00', 'Centro Congressi', 2, 'evento-pubblico', '#ff9800'),
('Riunione Team', 'Riunione settimanale del team formazione', '2024-02-22 10:00:00', '2024-02-22 11:30:00', 'Sala Riunioni', 1, 'riunione', '#2196f3'),
('Corso PowerPoint', 'Formazione su presentazioni efficaci', '2024-02-25 14:00:00', '2024-02-25 17:00:00', 'Aula 2', 3, 'formazione', '#9c27b0');

-- Prenotazioni auto di esempio
INSERT INTO auto_reservations (user_id, data_partenza, data_rientro, destinazione, note, stato) VALUES
(2, '2024-02-18 08:00:00', '2024-02-18 18:00:00', 'Milano - Corso formazione', 'Corso presso cliente importante', 'approvato'),
(3, '2024-02-25 09:00:00', '2024-02-25 17:00:00', 'Roma - Convegno', 'Partecipazione a convegno annuale', 'in-attesa');

-- Rimborsi di esempio
INSERT INTO rimborsi (user_id, data_spesa, descrizione, importo, tipo_spesa, stato) VALUES
(2, '2024-02-10', 'Pranzo durante trasferta Milano', 25.50, 'vitto', 'approvato'),
(2, '2024-02-12', 'Taxi aeroporto-hotel', 45.00, 'trasporto', 'in-attesa'),
(3, '2024-02-08', 'Materiali didattici per corso', 120.00, 'materiali', 'approvato'),
(4, '2024-02-14', 'Alloggio per convegno Roma', 85.00, 'alloggio', 'in-attesa');

-- Configurazioni sistema
INSERT INTO system_config (chiave, valore, descrizione, tipo) VALUES
('app_name', 'Gestionale Calendario Formatori', 'Nome dell\'applicazione', 'string'),
('max_file_size', '5242880', 'Dimensione massima file upload (5MB)', 'integer'),
('allowed_file_types', '["pdf","jpg","jpeg","png","doc","docx"]', 'Tipi di file consentiti', 'json'),
('auto_approval_limit', '500.00', 'Limite importo per approvazione automatica rimborsi', 'string'),
('notification_email', 'admin@azienda.it', 'Email per notifiche di sistema', 'string'),
('backup_retention_days', '30', 'Giorni di conservazione backup', 'integer'),
('session_timeout', '3600', 'Timeout sessione in secondi', 'integer');

-- Indici aggiuntivi per performance
CREATE INDEX idx_events_user_date ON events(user_id, start_time);
CREATE INDEX idx_auto_user_date ON auto_reservations(user_id, data_partenza);
CREATE INDEX idx_rimborsi_user_stato ON rimborsi(user_id, stato);

-- View per statistiche rapide
CREATE VIEW stats_overview AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE attivo = TRUE) as utenti_attivi,
    (SELECT COUNT(*) FROM events WHERE start_time >= CURDATE()) as eventi_futuri,
    (SELECT COUNT(*) FROM auto_reservations WHERE stato = 'in-attesa') as auto_pendenti,
    (SELECT COUNT(*) FROM rimborsi WHERE stato = 'in-attesa') as rimborsi_pendenti,
    (SELECT COALESCE(SUM(importo), 0) FROM rimborsi WHERE stato = 'approvato' AND MONTH(created_at) = MONTH(CURDATE())) as rimborsi_mese_corrente;

-- View per calendario completo
CREATE VIEW calendar_view AS
SELECT 
    e.id,
    e.titolo as title,
    e.descrizione as description,
    e.start_time as start,
    e.end_time as end,
    e.location,
    e.tipo_evento,
    e.colore as backgroundColor,
    u.nome as formatore,
    'event' as type
FROM events e
JOIN users u ON e.user_id = u.id
WHERE e.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)

UNION ALL

SELECT 
    ar.id,
    CONCAT('Auto: ', ar.destinazione) as title,
    ar.note as description,
    ar.data_partenza as start,
    ar.data_rientro as end,
    ar.destinazione as location,
    'auto-reservation' as tipo_evento,
    '#f44336' as backgroundColor,
    u.nome as formatore,
    'auto' as type
FROM auto_reservations ar
JOIN users u ON ar.user_id = u.id
WHERE ar.stato = 'approvato'
AND ar.data_partenza >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH);

-- Trigger per log attività
DELIMITER //

CREATE TRIGGER events_after_insert 
AFTER INSERT ON events 
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, azione, tabella_interessata, record_id, dati_nuovi)
    VALUES (NEW.user_id, 'INSERT', 'events', NEW.id, JSON_OBJECT(
        'titolo', NEW.titolo,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'tipo_evento', NEW.tipo_evento
    ));
END//

CREATE TRIGGER events_after_update
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, azione, tabella_interessata, record_id, dati_precedenti, dati_nuovi)
    VALUES (NEW.user_id, 'UPDATE', 'events', NEW.id, 
        JSON_OBJECT('titolo', OLD.titolo, 'start_time', OLD.start_time, 'end_time', OLD.end_time),
        JSON_OBJECT('titolo', NEW.titolo, 'start_time', NEW.start_time, 'end_time', NEW.end_time)
    );
END//

CREATE TRIGGER rimborsi_after_update
AFTER UPDATE ON rimborsi
FOR EACH ROW
BEGIN
    IF OLD.stato != NEW.stato THEN
        INSERT INTO activity_logs (user_id, azione, tabella_interessata, record_id, dati_precedenti, dati_nuovi)
        VALUES (NEW.approvato_da, 'STATUS_CHANGE', 'rimborsi', NEW.id,
            JSON_OBJECT('stato', OLD.stato),
            JSON_OBJECT('stato', NEW.stato, 'approvato_da', NEW.approvato_da)
        );
    END IF;
END//

DELIMITER ;

-- Stored procedure per pulizia log
DELIMITER //

CREATE PROCEDURE CleanOldLogs()
BEGIN
    DELETE FROM activity_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    SELECT ROW_COUNT() as deleted_rows;
END//

DELIMITER ;

-- Creazione utente applicazione (opzionale, per sicurezza)
-- CREATE USER 'calendario_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gestionale_formatori.* TO 'calendario_app'@'localhost';
-- FLUSH PRIVILEGES;

-- Commenti finali
-- Password di default per tutti gli utenti: "password123"
-- Ricordarsi di cambiare le password in produzione
-- Configurare backup automatici
-- Impostare SSL per connessioni sicure