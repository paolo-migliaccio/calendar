<?php
/**
 * Configurazione Database - Gestionale Calendario Formatori
 * 
 * @author Sistema Gestionale
 * @version 1.0
 */

// Configurazione database
define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_formatori');
define('DB_USER', 'root'); // Cambiare in produzione
define('DB_PASS', ''); // Cambiare in produzione
define('DB_CHARSET', 'utf8mb4');

// Configurazioni sicurezza
define('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');
define('JWT_EXPIRE_TIME', 3600); // 1 ora
define('SESSION_TIMEOUT', 3600); // 1 ora

// Configurazioni upload
define('UPLOAD_MAX_SIZE', 5242880); // 5MB
define('UPLOAD_PATH', '../uploads/');
define('ALLOWED_FILE_TYPES', ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']);

// Configurazioni email (per notifiche)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@domain.com');
define('SMTP_PASSWORD', 'your-app-password');
define('FROM_EMAIL', 'noreply@azienda.it');
define('FROM_NAME', 'Gestionale Calendario Formatori');

class Database {
    private $conn;
    
    /**
     * Connessione al database
     */
    public function connect() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch(PDOException $e) {
            error_log("Errore connessione database: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Errore connessione database']);
            exit();
        }
        
        return $this->conn;
    }
    
    /**
     * Ottiene l'istanza della connessione
     */
    public function getConnection() {
        return $this->conn;
    }
    
    /**
     * Chiude la connessione
     */
    public function close() {
        $this->conn = null;
    }
}

/**
 * Classe per gestione errori e logging
 */
class Logger {
    private static $logFile = '../logs/app.log';
    
    /**
     * Log info
     */
    public static function info($message, $context = []) {
        self::writeLog('INFO', $message, $context);
    }
    
    /**
     * Log errore
     */
    public static function error($message, $context = []) {
        self::writeLog('ERROR', $message, $context);
    }
    
    /**
     * Log warning
     */
    public static function warning($message, $context = []) {
        self::writeLog('WARNING', $message, $context);
    }
    
    /**
     * Scrive nel file di log
     */
    private static function writeLog($level, $message, $context) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' | Context: ' . json_encode($context) : '';
        $logEntry = "[{$timestamp}] {$level}: {$message}{$contextStr}" . PHP_EOL;
        
        // Crea directory logs se non esiste
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Classe utilità per sicurezza
 */
class Security {
    
    /**
     * Sanitizza input
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Valida email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    /**
     * Verifica password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Genera token sicuro
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Valida tipo file
     */
    public static function validateFileType($filename) {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($extension, ALLOWED_FILE_TYPES);
    }
    
    /**
     * Ottiene IP client
     */
    public static function getClientIP() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    if (filter_var($ip, FILTER_VALIDATE_IP, 
                        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Rate limiting semplice
     */
    public static function checkRateLimit($identifier, $maxRequests = 60, $timeWindow = 3600) {
        $file = '../cache/rate_limit_' . md5($identifier);
        $now = time();
        
        // Crea directory cache se non esiste
        $cacheDir = dirname($file);
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        
        $requests = [];
        if (file_exists($file)) {
            $requests = json_decode(file_get_contents($file), true) ?: [];
        }
        
        // Rimuovi richieste fuori dal time window
        $requests = array_filter($requests, function($timestamp) use ($now, $timeWindow) {
            return ($now - $timestamp) < $timeWindow;
        });
        
        // Controlla limite
        if (count($requests) >= $maxRequests) {
            return false;
        }
        
        // Aggiungi richiesta corrente
        $requests[] = $now;
        file_put_contents($file, json_encode($requests));
        
        return true;
    }
}

/**
 * Funzioni di utilità globali
 */

/**
 * Risposta JSON standardizzata
 */
function jsonResponse($data, $status = 200, $message = '') {
    http_response_code($status);
    header('Content-Type: application/json');
    
    $response = [
        'success' => $status < 400,
        'status' => $status,
        'data' => $data
    ];
    
    if (!empty($message)) {
        $response['message'] = $message;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Gestione errori
 */
function handleError($message, $status = 400, $logLevel = 'error') {
    Logger::$logLevel($message, [
        'ip' => Security::getClientIP(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
    ]);
    
    jsonResponse(null, $status, $message);
}

/**
 * Controlla se utente è autenticato
 */
function requireAuth() {
    session_start();
    
    if (!isset($_SESSION['user_id']) || 
        !isset($_SESSION['last_activity']) ||
        (time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
        
        session_destroy();
        handleError('Accesso richiesto', 401);
    }
    
    $_SESSION['last_activity'] = time();
    return $_SESSION;
}

/**
 * Controlla se utente è admin
 */
function requireAdmin() {
    $session = requireAuth();
    
    if ($session['user_role'] !== 'admin') {
        handleError('Accesso negato: privilegi amministratore richiesti', 403);
    }
    
    return $session;
}

/**
 * CORS headers
 */
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Imposta CORS per tutte le richieste
setCorsHeaders();

// Gestione errori PHP
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    Logger::error("PHP Error: $message", [
        'file' => $file,
        'line' => $line,
        'severity' => $severity
    ]);
    
    if ($severity === E_ERROR || $severity === E_CORE_ERROR || $severity === E_COMPILE_ERROR) {
        handleError('Errore interno del server', 500);
    }
    
    return true;
});

// Gestione eccezioni non catturate
set_exception_handler(function($exception) {
    Logger::error("Uncaught Exception: " . $exception->getMessage(), [
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ]);
    
    handleError('Errore interno del server', 500);
});

// Imposta timezone
date_default_timezone_set('Europe/Rome');

// Start output buffering per evitare problemi con header
ob_start();
?>