<?php
/**
 * API Autenticazione - Gestionale Calendario Formatori
 * 
 * Endpoints:
 * POST /api/auth.php?action=login - Login utente
 * POST /api/auth.php?action=logout - Logout utente
 * GET /api/auth.php?action=profile - Profilo utente corrente
 * PUT /api/auth.php?action=profile - Aggiorna profilo
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Rate limiting per login
$clientIP = Security::getClientIP();
if ($action === 'login' && !Security::checkRateLimit($clientIP . '_login', 5, 300)) {
    handleError('Troppi tentativi di login. Riprova tra 5 minuti.', 429);
}

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            handleLogin($db);
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            handleError('Azione non valida', 400);
        }
        break;
        
    case 'GET':
        if ($action === 'profile') {
            getUserProfile($db);
        } else {
            handleError('Azione non valida', 400);
        }
        break;
        
    case 'PUT':
        if ($action === 'profile') {
            updateUserProfile($db);
        } else {
            handleError('Azione non valida', 400);
        }
        break;
        
    default:
        handleError('Metodo non supportato', 405);
}

/**
 * Gestisce il login dell'utente
 */
function handleLogin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        handleError('Email e password richieste', 400);
    }
    
    $email = Security::sanitizeInput($input['email']);
    $password = $input['password'];
    
    if (!Security::validateEmail($email)) {
        handleError('Email non valida', 400);
    }
    
    try {
        // Cerca utente
        $stmt = $db->prepare("
            SELECT id, nome, email, password_hash, ruolo, 
                   puo_prenotare_auto, puo_chiedere_rimborso, attivo
            FROM users 
            WHERE email = ? AND attivo = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !Security::verifyPassword($password, $user['password_hash'])) {
            Logger::warning('Tentativo di login fallito', [
                'email' => $email,
                'ip' => Security::getClientIP()
            ]);
            handleError('Credenziali non valide', 401);
        }
        
        // Avvia sessione
        session_start();
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['nome'];
        $_SESSION['user_role'] = $user['ruolo'];
        $_SESSION['permissions'] = [
            'puo_prenotare_auto' => (bool)$user['puo_prenotare_auto'],
            'puo_chiedere_rimborso' => (bool)$user['puo_chiedere_rimborso']
        ];
        $_SESSION['last_activity'] = time();
        $_SESSION['login_time'] = time();
        
        // Log successo
        logActivity($db, $user['id'], 'LOGIN', null, null, [
            'ip' => Security::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        Logger::info('Login effettuato', [
            'user_id' => $user['id'],
            'email' => $email,
            'ip' => Security::getClientIP()
        ]);
        
        // Rimuovi dati sensibili
        unset($user['password_hash']);
        
        jsonResponse($user, 200, 'Login effettuato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore durante login: ' . $e->getMessage());
        handleError('Errore durante il login', 500);
    }
}

/**
 * Gestisce il logout dell'utente
 */
function handleLogout() {
    session_start();
    
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        
        Logger::info('Logout effettuato', [
            'user_id' => $userId,
            'ip' => Security::getClientIP()
        ]);
    }
    
    session_destroy();
    
    jsonResponse(null, 200, 'Logout effettuato con successo');
}

/**
 * Ottiene il profilo dell'utente corrente
 */
function getUserProfile($db) {
    $session = requireAuth();
    
    try {
        $stmt = $db->prepare("
            SELECT id, nome, email, ruolo, 
                   puo_prenotare_auto, puo_chiedere_rimborso,
                   created_at, updated_at
            FROM users 
            WHERE id = ? AND attivo = 1
        ");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            handleError('Utente non trovato', 404);
        }
        
        // Aggiungi statistiche personali
        $stats = getUserStats($db, $session['user_id']);
        $user['stats'] = $stats;
        
        jsonResponse($user, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero profilo: ' . $e->getMessage());
        handleError('Errore recupero profilo', 500);
    }
}

/**
 * Aggiorna il profilo dell'utente
 */
function updateUserProfile($db) {
    $session = requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    $allowedFields = ['nome'];
    $updateFields = [];
    $updateValues = [];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = ?";
            $updateValues[] = Security::sanitizeInput($input[$field]);
        }
    }
    
    if (empty($updateFields)) {
        handleError('Nessun campo da aggiornare', 400);
    }
    
    try {
        $updateValues[] = $session['user_id'];
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateValues);
        
        if ($stmt->rowCount() > 0) {
            // Aggiorna sessione se nome cambiato
            if (isset($input['nome'])) {
                $_SESSION['user_name'] = $input['nome'];
            }
            
            Logger::info('Profilo aggiornato', [
                'user_id' => $session['user_id'],
                'fields' => array_keys($input)
            ]);
            
            jsonResponse(null, 200, 'Profilo aggiornato con successo');
        } else {
            jsonResponse(null, 200, 'Nessuna modifica effettuata');
        }
        
    } catch (Exception $e) {
        Logger::error('Errore aggiornamento profilo: ' . $e->getMessage());
        handleError('Errore aggiornamento profilo', 500);
    }
}

/**
 * Ottiene statistiche personali dell'utente
 */
function getUserStats($db, $userId) {
    try {
        $stats = [];
        
        // Eventi del mese corrente
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM events 
            WHERE user_id = ? 
            AND MONTH(start_time) = MONTH(CURDATE())
            AND YEAR(start_time) = YEAR(CURDATE())
        ");
        $stmt->execute([$userId]);
        $stats['eventi_mese'] = $stmt->fetchColumn();
        
        // Prenotazioni auto del mese
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM auto_reservations 
            WHERE user_id = ? 
            AND MONTH(data_partenza) = MONTH(CURDATE())
            AND YEAR(data_partenza) = YEAR(CURDATE())
        ");
        $stmt->execute([$userId]);
        $stats['auto_mese'] = $stmt->fetchColumn();
        
        // Rimborsi in attesa
        $stmt = $db->prepare("
            SELECT COUNT(*) as count, COALESCE(SUM(importo), 0) as totale
            FROM rimborsi 
            WHERE user_id = ? AND stato = 'in-attesa'
        ");
        $stmt->execute([$userId]);
        $rimborsi = $stmt->fetch();
        $stats['rimborsi_pendenti'] = $rimborsi['count'];
        $stats['importo_pendente'] = $rimborsi['totale'];
        
        // Rimborsi approvati mese corrente
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(importo), 0) as totale
            FROM rimborsi 
            WHERE user_id = ? 
            AND stato = 'approvato'
            AND MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
        ");
        $stmt->execute([$userId]);
        $stats['rimborsi_mese'] = $stmt->fetchColumn();
        
        return $stats;
        
    } catch (Exception $e) {
        Logger::error('Errore recupero statistiche: ' . $e->getMessage());
        return [];
    }
}

/**
 * Log attività utente
 */
function logActivity($db, $userId, $action, $table = null, $recordId = null, $data = []) {
    try {
        $stmt = $db->prepare("
            INSERT INTO activity_logs 
            (user_id, azione, tabella_interessata, record_id, dati_nuovi, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $action,
            $table,
            $recordId,
            !empty($data) ? json_encode($data) : null,
            Security::getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
    } catch (Exception $e) {
        Logger::error('Errore log attività: ' . $e->getMessage());
        // Non interrompiamo il flusso per errori di logging
    }
}
?>