<?php
/**
 * API Rimborsi - Gestionale Calendario Formatori
 * 
 * Endpoints:
 * GET /api/rimborsi.php - Lista rimborsi
 * POST /api/rimborsi.php - Crea nuova richiesta rimborso
 * PUT /api/rimborsi.php?id=X - Aggiorna rimborso
 * DELETE /api/rimborsi.php?id=X - Elimina rimborso
 * PUT /api/rimborsi.php?id=X&action=approve - Approva rimborso (admin)
 * PUT /api/rimborsi.php?id=X&action=reject - Rifiuta rimborso (admin)
 * GET /api/rimborsi.php?action=report - Report rimborsi (admin)
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$rimborsoId = $_GET['id'] ?? null;

// Autenticazione richiesta
$session = requireAuth();

// Controllo permessi rimborsi
if (!$session['permissions']['puo_chiedere_rimborso'] && $method !== 'GET') {
    handleError('Non hai i permessi per gestire le richieste di rimborso', 403);
}

switch ($method) {
    case 'GET':
        if ($action === 'report') {
            generateReport($db, $session);
        } elseif ($rimborsoId) {
            getRimborso($db, $rimborsoId, $session);
        } else {
            getRimborsi($db, $session);
        }
        break;
        
    case 'POST':
        createRimborso($db, $session);
        break;
        
    case 'PUT':
        if (!$rimborsoId) {
            handleError('ID rimborso richiesto', 400);
        }
        
        if ($action === 'approve') {
            approveRimborso($db, $rimborsoId, $session);
        } elseif ($action === 'reject') {
            rejectRimborso($db, $rimborsoId, $session);
        } else {
            updateRimborso($db, $rimborsoId, $session);
        }
        break;
        
    case 'DELETE':
        if (!$rimborsoId) {
            handleError('ID rimborso richiesto', 400);
        }
        deleteRimborso($db, $rimborsoId, $session);
        break;
        
    default:
        handleError('Metodo non supportato', 405);
}

/**
 * Ottiene tutti i rimborsi
 */
function getRimborsi($db, $session) {
    try {
        $whereClause = '';
        $params = [];
        
        // I formatori vedono solo i propri rimborsi, gli admin tutti
        if ($session['user_role'] !== 'admin') {
            $whereClause = 'WHERE r.user_id = ?';
            $params[] = $session['user_id'];
        }
        
        // Filtri aggiuntivi
        if (isset($_GET['stato'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'r.stato = ?';
            $params[] = $_GET['stato'];
        }
        
        if (isset($_GET['tipo_spesa'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'r.tipo_spesa = ?';
            $params[] = $_GET['tipo_spesa'];
        }
        
        if (isset($_GET['data_da']) && isset($_GET['data_a'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'r.data_spesa >= ? AND r.data_spesa <= ?';
            $params[] = $_GET['data_da'];
            $params[] = $_GET['data_a'];
        }
        
        $sql = "
            SELECT r.*, u.nome as user_nome, 
                   a.nome as approvatore_nome
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN users a ON r.approvato_da = a.id
            $whereClause
            ORDER BY r.created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rimborsi = $stmt->fetchAll();
        
        // Calcola statistiche
        $stats = calculateRimborsiStats($db, $session);
        
        jsonResponse([
            'rimborsi' => $rimborsi,
            'stats' => $stats
        ], 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero rimborsi: ' . $e->getMessage());
        handleError('Errore recupero rimborsi', 500);
    }
}

/**
 * Ottiene un singolo rimborso
 */
function getRimborso($db, $rimborsoId, $session) {
    try {
        $sql = "
            SELECT r.*, u.nome as user_nome, 
                   a.nome as approvatore_nome
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN users a ON r.approvato_da = a.id
            WHERE r.id = ?
        ";
        
        // Controllo permessi: formatori vedono solo i propri rimborsi
        if ($session['user_role'] !== 'admin') {
            $sql .= " AND r.user_id = ?";
            $params = [$rimborsoId, $session['user_id']];
        } else {
            $params = [$rimborsoId];
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rimborso = $stmt->fetch();
        
        if (!$rimborso) {
            handleError('Rimborso non trovato', 404);
        }
        
        jsonResponse($rimborso, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero rimborso: ' . $e->getMessage());
        handleError('Errore recupero rimborso', 500);
    }
}

/**
 * Crea nuova richiesta rimborso
 */
function createRimborso($db, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    // Validazione campi obbligatori
    $required = ['data_spesa', 'descrizione', 'importo', 'tipo_spesa'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            handleError("Campo '$field' richiesto", 400);
        }
    }
    
    // Validazione importo
    $importo = floatval($input['importo']);
    if ($importo <= 0) {
        handleError('L\'importo deve essere maggiore di zero', 400);
    }
    
    if ($importo > 10000) { // Limite di sicurezza
        handleError('L\'importo supera il limite massimo consentito', 400);
    }
    
    // Validazione data
    $dataSpesa = new DateTime($input['data_spesa']);
    $now = new DateTime();
    $maxDaysBack = 365; // Massimo 1 anno indietro
    
    if ($dataSpesa > $now) {
        handleError('La data della spesa non può essere nel futuro', 400);
    }
    
    if ($dataSpesa < $now->modify("-$maxDaysBack days")) {
        handleError('La data della spesa è troppo vecchia', 400);
    }
    
    try {
        // Gestione upload ricevuta (obbligatorio)
        $fileRicevuta = null;
        if (isset($_FILES['ricevuta']) && $_FILES['ricevuta']['error'] === UPLOAD_ERR_OK) {
            $fileRicevuta = handleFileUpload($_FILES['ricevuta'], 'rimborsi');
            if (!$fileRicevuta) {
                handleError('Errore caricamento ricevuta', 400);
            }
        } else {
            handleError('Ricevuta obbligatoria', 400);
        }
        
        $sql = "
            INSERT INTO rimborsi 
            (user_id, data_spesa, descrizione, importo, tipo_spesa, file_ricevuta, stato)
            VALUES (?, ?, ?, ?, ?, ?, 'in-attesa')
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $session['user_id'],
            $input['data_spesa'],
            Security::sanitizeInput($input['descrizione']),
            $importo,
            $input['tipo_spesa'],
            $fileRicevuta
        ]);
        
        $rimborsoId = $db->lastInsertId();
        
        Logger::info('Richiesta rimborso creata', [
            'rimborso_id' => $rimborsoId,
            'user_id' => $session['user_id'],
            'importo' => $importo,
            'tipo_spesa' => $input['tipo_spesa']
        ]);
        
        // Recupera il rimborso creato
        $stmt = $db->prepare("
            SELECT r.*, u.nome as user_nome
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$rimborsoId]);
        $newRimborso = $stmt->fetch();
        
        // Notifica admin (se configurato)
        notifyAdminNewRimborso($newRimborso);
        
        jsonResponse($newRimborso, 201, 'Richiesta rimborso creata con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore creazione rimborso: ' . $e->getMessage());
        handleError('Errore creazione rimborso', 500);
    }
}

/**
 * Aggiorna rimborso esistente
 */
function updateRimborso($db, $rimborsoId, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id, stato FROM rimborsi WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$rimborsoId, $session['user_id']];
        } else {
            $checkParams = [$rimborsoId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $existingRimborso = $stmt->fetch();
        
        if (!$existingRimborso) {
            handleError('Rimborso non trovato o accesso negato', 404);
        }
        
        // Non permettere modifiche a rimborsi già elaborati (solo admin può)
        if (in_array($existingRimborso['stato'], ['approvato', 'rifiutato']) && $session['user_role'] !== 'admin') {
            handleError('Non è possibile modificare rimborsi già elaborati', 403);
        }
        
        // Costruisce query di aggiornamento dinamica
        $allowedFields = ['data_spesa', 'descrizione', 'importo', 'tipo_spesa'];
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'importo') {
                    $importo = floatval($input[$field]);
                    if ($importo <= 0 || $importo > 10000) {
                        handleError('Importo non valido', 400);
                    }
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $importo;
                } elseif (in_array($field, ['descrizione'])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = Security::sanitizeInput($input[$field]);
                } else {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $input[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            handleError('Nessun campo da aggiornare', 400);
        }
        
        $updateValues[] = $rimborsoId;
        
        $sql = "UPDATE rimborsi SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateValues);
        
        Logger::info('Rimborso aggiornato', [
            'rimborso_id' => $rimborsoId,
            'user_id' => $session['user_id'],
            'fields' => array_keys($input)
        ]);
        
        // Recupera rimborso aggiornato
        $stmt = $db->prepare("
            SELECT r.*, u.nome as user_nome
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$rimborsoId]);
        $updatedRimborso = $stmt->fetch();
        
        jsonResponse($updatedRimborso, 200, 'Rimborso aggiornato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore aggiornamento rimborso: ' . $e->getMessage());
        handleError('Errore aggiornamento rimborso', 500);
    }
}

/**
 * Approva rimborso (solo admin)
 */
function approveRimborso($db, $rimborsoId, $session) {
    $session = requireAdmin(); // Solo admin possono approvare
    
    $input = json_decode(file_get_contents('php://input'), true);
    $noteAdmin = $input['note_admin'] ?? '';
    
    try {
        $stmt = $db->prepare("
            UPDATE rimborsi 
            SET stato = 'approvato', approvato_da = ?, approvato_il = NOW(), note_admin = ?
            WHERE id = ? AND stato = 'in-attesa'
        ");
        
        $stmt->execute([$session['user_id'], $noteAdmin, $rimborsoId]);
        
        if ($stmt->rowCount() === 0) {
            handleError('Rimborso non trovato o già elaborato', 404);
        }
        
        Logger::info('Rimborso approvato', [
            'rimborso_id' => $rimborsoId,
            'approved_by' => $session['user_id']
        ]);
        
        // Recupera dati rimborso per notifica
        $stmt = $db->prepare("
            SELECT r.*, u.nome as user_nome, u.email as user_email
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$rimborsoId]);
        $rimborso = $stmt->fetch();
        
        // Notifica utente (se configurato)
        notifyUserRimborsoApproved($rimborso);
        
        jsonResponse(null, 200, 'Rimborso approvato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore approvazione rimborso: ' . $e->getMessage());
        handleError('Errore approvazione rimborso', 500);
    }
}

/**
 * Rifiuta rimborso (solo admin)
 */
function rejectRimborso($db, $rimborsoId, $session) {
    $session = requireAdmin(); // Solo admin possono rifiutare
    
    $input = json_decode(file_get_contents('php://input'), true);
    $motivoRifiuto = $input['motivo_rifiuto'] ?? '';
    $noteAdmin = $input['note_admin'] ?? '';
    
    if (empty($motivoRifiuto)) {
        handleError('Motivo del rifiuto richiesto', 400);
    }
    
    try {
        $stmt = $db->prepare("
            UPDATE rimborsi 
            SET stato = 'rifiutato', approvato_da = ?, approvato_il = NOW(), 
                motivo_rifiuto = ?, note_admin = ?
            WHERE id = ? AND stato = 'in-attesa'
        ");
        
        $stmt->execute([$session['user_id'], $motivoRifiuto, $noteAdmin, $rimborsoId]);
        
        if ($stmt->rowCount() === 0) {
            handleError('Rimborso non trovato o già elaborato', 404);
        }
        
        Logger::info('Rimborso rifiutato', [
            'rimborso_id' => $rimborsoId,
            'rejected_by' => $session['user_id'],
            'reason' => $motivoRifiuto
        ]);
        
        // Recupera dati rimborso per notifica
        $stmt = $db->prepare("
            SELECT r.*, u.nome as user_nome, u.email as user_email
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$rimborsoId]);
        $rimborso = $stmt->fetch();
        
        // Notifica utente (se configurato)
        notifyUserRimborsoRejected($rimborso);
        
        jsonResponse(null, 200, 'Rimborso rifiutato');
        
    } catch (Exception $e) {
        Logger::error('Errore rifiuto rimborso: ' . $e->getMessage());
        handleError('Errore rifiuto rimborso', 500);
    }
}

/**
 * Elimina rimborso
 */
function deleteRimborso($db, $rimborsoId, $session) {
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id, stato, file_ricevuta FROM rimborsi WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$rimborsoId, $session['user_id']];
        } else {
            $checkParams = [$rimborsoId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $rimborso = $stmt->fetch();
        
        if (!$rimborso) {
            handleError('Rimborso non trovato o accesso negato', 404);
        }
        
        // Non permettere eliminazione di rimborsi approvati
        if ($rimborso['stato'] === 'approvato' && $session['user_role'] !== 'admin') {
            handleError('Non è possibile eliminare rimborsi approvati', 403);
        }
        
        // Elimina file ricevuta se presente
        if ($rimborso['file_ricevuta']) {
            $filePath = UPLOAD_PATH . $rimborso['file_ricevuta'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }
        
        // Elimina rimborso
        $stmt = $db->prepare("DELETE FROM rimborsi WHERE id = ?");
        $stmt->execute([$rimborsoId]);
        
        Logger::info('Rimborso eliminato', [
            'rimborso_id' => $rimborsoId,
            'user_id' => $session['user_id']
        ]);
        
        jsonResponse(null, 200, 'Rimborso eliminato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore eliminazione rimborso: ' . $e->getMessage());
        handleError('Errore eliminazione rimborso', 500);
    }
}

/**
 * Genera report rimborsi (admin)
 */
function generateReport($db, $session) {
    $session = requireAdmin(); // Solo admin possono generare report
    
    try {
        $dataInizio = $_GET['data_inizio'] ?? date('Y-m-01');
        $dataFine = $_GET['data_fine'] ?? date('Y-m-t');
        
        // Report dettagliato
        $sql = "
            SELECT 
                r.*,
                u.nome as user_nome,
                a.nome as approvatore_nome
            FROM rimborsi r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN users a ON r.approvato_da = a.id
            WHERE r.data_spesa >= ? AND r.data_spesa <= ?
            ORDER BY r.data_spesa DESC, r.created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$dataInizio, $dataFine]);
        $rimborsi = $stmt->fetchAll();
        
        // Statistiche aggregate
        $stats = [
            'periodo' => ['inizio' => $dataInizio, 'fine' => $dataFine],
            'totale_richieste' => 0,
            'importo_totale' => 0,
            'importo_approvato' => 0,
            'importo_in_attesa' => 0,
            'importo_rifiutato' => 0,
            'per_stato' => [],
            'per_tipo' => [],
            'per_utente' => []
        ];
        
        foreach ($rimborsi as $rimborso) {
            $stats['totale_richieste']++;
            $stats['importo_totale'] += $rimborso['importo'];
            
            // Per stato
            if (!isset($stats['per_stato'][$rimborso['stato']])) {
                $stats['per_stato'][$rimborso['stato']] = ['count' => 0, 'importo' => 0];
            }
            $stats['per_stato'][$rimborso['stato']]['count']++;
            $stats['per_stato'][$rimborso['stato']]['importo'] += $rimborso['importo'];
            
            // Importi per stato
            switch ($rimborso['stato']) {
                case 'approvato':
                    $stats['importo_approvato'] += $rimborso['importo'];
                    break;
                case 'in-attesa':
                    $stats['importo_in_attesa'] += $rimborso['importo'];
                    break;
                case 'rifiutato':
                    $stats['importo_rifiutato'] += $rimborso['importo'];
                    break;
            }
            
            // Per tipo spesa
            if (!isset($stats['per_tipo'][$rimborso['tipo_spesa']])) {
                $stats['per_tipo'][$rimborso['tipo_spesa']] = ['count' => 0, 'importo' => 0];
            }
            $stats['per_tipo'][$rimborso['tipo_spesa']]['count']++;
            $stats['per_tipo'][$rimborso['tipo_spesa']]['importo'] += $rimborso['importo'];
            
            // Per utente
            if (!isset($stats['per_utente'][$rimborso['user_nome']])) {
                $stats['per_utente'][$rimborso['user_nome']] = ['count' => 0, 'importo' => 0, 'importo_approvato' => 0];
            }
            $stats['per_utente'][$rimborso['user_nome']]['count']++;
            $stats['per_utente'][$rimborso['user_nome']]['importo'] += $rimborso['importo'];
            if ($rimborso['stato'] === 'approvato') {
                $stats['per_utente'][$rimborso['user_nome']]['importo_approvato'] += $rimborso['importo'];
            }
        }
        
        Logger::info('Report rimborsi generato', [
            'user_id' => $session['user_id'],
            'periodo' => $dataInizio . ' - ' . $dataFine,
            'totale_richieste' => $stats['totale_richieste']
        ]);
        
        jsonResponse([
            'rimborsi' => $rimborsi,
            'statistiche' => $stats
        ], 200);
        
    } catch (Exception $e) {
        Logger::error('Errore generazione report rimborsi: ' . $e->getMessage());
        handleError('Errore generazione report rimborsi', 500);
    }
}

/**
 * Calcola statistiche rimborsi
 */
function calculateRimborsiStats($db, $session) {
    try {
        $stats = [];
        $userId = $session['user_role'] === 'admin' ? null : $session['user_id'];
        
        // Totali per stato
        $whereClause = $userId ? 'WHERE user_id = ?' : '';
        $params = $userId ? [$userId] : [];
        
        $sql = "
            SELECT 
                stato,
                COUNT(*) as count,
                COALESCE(SUM(importo), 0) as totale
            FROM rimborsi 
            $whereClause
            GROUP BY stato
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();
        
        foreach ($results as $result) {
            $stats[$result['stato']] = [
                'count' => $result['count'],
                'totale' => $result['totale']
            ];
        }
        
        // Totale mese corrente
        $whereClause = 'WHERE MONTH(data_spesa) = MONTH(CURDATE()) AND YEAR(data_spesa) = YEAR(CURDATE())';
        $params = [];
        
        if ($userId) {
            $whereClause .= ' AND user_id = ?';
            $params[] = $userId;
        }
        
        $sql = "
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(importo), 0) as totale
            FROM rimborsi 
            $whereClause
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $meseCorrente = $stmt->fetch();
        
        $stats['mese_corrente'] = $meseCorrente;
        
        return $stats;
        
    } catch (Exception $e) {
        Logger::error('Errore calcolo statistiche rimborsi: ' . $e->getMessage());
        return [];
    }
}

/**
 * Gestisce upload file ricevuta
 */
function handleFileUpload($file, $category) {
    try {
        if ($file['size'] > UPLOAD_MAX_SIZE) {
            throw new Exception('File troppo grande (max 5MB)');
        }
        
        if (!Security::validateFileType($file['name'])) {
            throw new Exception('Tipo file non consentito');
        }
        
        $uploadDir = UPLOAD_PATH . $category . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileName = uniqid() . '_' . basename($file['name']);
        $uploadPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            return $category . '/' . $fileName;
        }
        
        throw new Exception('Errore caricamento file');
        
    } catch (Exception $e) {
        Logger::error('Errore upload ricevuta: ' . $e->getMessage());
        return null;
    }
}

/**
 * Notifica admin per nuovo rimborso
 */
function notifyAdminNewRimborso($rimborso) {
    Logger::info('Nuova richiesta rimborso in attesa di approvazione', [
        'rimborso_id' => $rimborso['id'],
        'user' => $rimborso['user_nome'],
        'importo' => $rimborso['importo'],
        'tipo_spesa' => $rimborso['tipo_spesa']
    ]);
}

/**
 * Notifica utente rimborso approvato
 */
function notifyUserRimborsoApproved($rimborso) {
    Logger::info('Rimborso approvato - notifica utente', [
        'rimborso_id' => $rimborso['id'],
        'user' => $rimborso['user_nome'],
        'importo' => $rimborso['importo']
    ]);
}

/**
 * Notifica utente rimborso rifiutato
 */
function notifyUserRimborsoRejected($rimborso) {
    Logger::info('Rimborso rifiutato - notifica utente', [
        'rimborso_id' => $rimborso['id'],
        'user' => $rimborso['user_nome'],
        'motivo' => $rimborso['motivo_rifiuto']
    ]);
}
?>