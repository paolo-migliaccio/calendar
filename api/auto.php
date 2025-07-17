<?php
/**
 * API Auto Aziendale - Gestionale Calendario Formatori
 * 
 * Endpoints:
 * GET /api/auto.php - Lista prenotazioni auto
 * POST /api/auto.php - Crea nuova prenotazione
 * PUT /api/auto.php?id=X - Aggiorna prenotazione
 * DELETE /api/auto.php?id=X - Elimina prenotazione
 * PUT /api/auto.php?id=X&action=approve - Approva prenotazione (admin)
 * PUT /api/auto.php?id=X&action=reject - Rifiuta prenotazione (admin)
 * GET /api/auto.php?action=calendar - Prenotazioni per calendario
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$reservationId = $_GET['id'] ?? null;

// Autenticazione richiesta
$session = requireAuth();

// Controllo permessi prenotazione auto
if (!$session['permissions']['puo_prenotare_auto'] && $method !== 'GET') {
    handleError('Non hai i permessi per gestire le prenotazioni auto', 403);
}

switch ($method) {
    case 'GET':
        if ($action === 'calendar') {
            getCalendarReservations($db, $session);
        } elseif ($reservationId) {
            getReservation($db, $reservationId, $session);
        } else {
            getReservations($db, $session);
        }
        break;
        
    case 'POST':
        createReservation($db, $session);
        break;
        
    case 'PUT':
        if (!$reservationId) {
            handleError('ID prenotazione richiesto', 400);
        }
        
        if ($action === 'approve') {
            approveReservation($db, $reservationId, $session);
        } elseif ($action === 'reject') {
            rejectReservation($db, $reservationId, $session);
        } else {
            updateReservation($db, $reservationId, $session);
        }
        break;
        
    case 'DELETE':
        if (!$reservationId) {
            handleError('ID prenotazione richiesto', 400);
        }
        deleteReservation($db, $reservationId, $session);
        break;
        
    default:
        handleError('Metodo non supportato', 405);
}

/**
 * Ottiene tutte le prenotazioni auto
 */
function getReservations($db, $session) {
    try {
        $whereClause = '';
        $params = [];
        
        // I formatori vedono solo le proprie prenotazioni, gli admin tutte
        if ($session['user_role'] !== 'admin') {
            $whereClause = 'WHERE ar.user_id = ?';
            $params[] = $session['user_id'];
        }
        
        // Filtri aggiuntivi
        if (isset($_GET['stato'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'ar.stato = ?';
            $params[] = $_GET['stato'];
        }
        
        if (isset($_GET['start']) && isset($_GET['end'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'ar.data_partenza >= ? AND ar.data_rientro <= ?';
            $params[] = $_GET['start'];
            $params[] = $_GET['end'];
        }
        
        $sql = "
            SELECT ar.*, u.nome as user_nome, 
                   a.nome as approvatore_nome
            FROM auto_reservations ar
            LEFT JOIN users u ON ar.user_id = u.id
            LEFT JOIN users a ON ar.approvato_da = a.id
            $whereClause
            ORDER BY ar.data_partenza DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $reservations = $stmt->fetchAll();
        
        jsonResponse($reservations, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero prenotazioni auto: ' . $e->getMessage());
        handleError('Errore recupero prenotazioni auto', 500);
    }
}

/**
 * Ottiene prenotazioni per calendario
 */
function getCalendarReservations($db, $session) {
    try {
        $start = $_GET['start'] ?? date('Y-m-01');
        $end = $_GET['end'] ?? date('Y-m-t');
        
        $whereClause = 'WHERE ar.data_partenza >= ? AND ar.data_partenza <= ?';
        $params = [$start, $end];
        
        // Mostra solo prenotazioni approvate nel calendario pubblico
        // Gli admin possono vedere tutte, i formatori solo le proprie
        if ($session['user_role'] === 'admin') {
            $whereClause .= ' AND ar.stato IN ("approvato", "in-attesa")';
        } else {
            $whereClause .= ' AND ((ar.stato = "approvato") OR (ar.user_id = ? AND ar.stato IN ("in-attesa", "approvato")))';
            $params[] = $session['user_id'];
        }
        
        $sql = "
            SELECT 
                ar.id,
                CONCAT('Auto: ', ar.destinazione) as title,
                ar.note as description,
                ar.data_partenza as start,
                ar.data_rientro as end,
                ar.destinazione as location,
                ar.stato,
                '#f44336' as backgroundColor,
                u.nome as user_nome,
                'auto-reservation' as resourceType
            FROM auto_reservations ar
            LEFT JOIN users u ON ar.user_id = u.id
            $whereClause
            ORDER BY ar.data_partenza
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $reservations = $stmt->fetchAll();
        
        // Formatta per FullCalendar
        $calendarReservations = array_map(function($reservation) {
            $color = $reservation['stato'] === 'approvato' ? '#f44336' : '#ff9800';
            
            return [
                'id' => 'auto_' . $reservation['id'],
                'title' => $reservation['title'],
                'start' => $reservation['start'],
                'end' => $reservation['end'],
                'backgroundColor' => $color,
                'borderColor' => $color,
                'allDay' => false,
                'extendedProps' => [
                    'description' => $reservation['description'],
                    'location' => $reservation['location'],
                    'stato' => $reservation['stato'],
                    'user_nome' => $reservation['user_nome'],
                    'resourceType' => $reservation['resourceType']
                ]
            ];
        }, $reservations);
        
        jsonResponse($calendarReservations, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero calendario auto: ' . $e->getMessage());
        handleError('Errore recupero calendario auto', 500);
    }
}

/**
 * Ottiene una singola prenotazione
 */
function getReservation($db, $reservationId, $session) {
    try {
        $sql = "
            SELECT ar.*, u.nome as user_nome, 
                   a.nome as approvatore_nome
            FROM auto_reservations ar
            LEFT JOIN users u ON ar.user_id = u.id
            LEFT JOIN users a ON ar.approvato_da = a.id
            WHERE ar.id = ?
        ";
        
        // Controllo permessi: formatori vedono solo le proprie prenotazioni
        if ($session['user_role'] !== 'admin') {
            $sql .= " AND ar.user_id = ?";
            $params = [$reservationId, $session['user_id']];
        } else {
            $params = [$reservationId];
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $reservation = $stmt->fetch();
        
        if (!$reservation) {
            handleError('Prenotazione non trovata', 404);
        }
        
        jsonResponse($reservation, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero prenotazione auto: ' . $e->getMessage());
        handleError('Errore recupero prenotazione auto', 500);
    }
}

/**
 * Crea nuova prenotazione auto
 */
function createReservation($db, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    // Validazione campi obbligatori
    $required = ['data_partenza', 'data_rientro', 'destinazione'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            handleError("Campo '$field' richiesto", 400);
        }
    }
    
    // Validazione date
    $dataPartenza = new DateTime($input['data_partenza']);
    $dataRientro = new DateTime($input['data_rientro']);
    $now = new DateTime();
    
    if ($dataPartenza <= $now) {
        handleError('La data di partenza deve essere nel futuro', 400);
    }
    
    if ($dataPartenza >= $dataRientro) {
        handleError('La data di rientro deve essere successiva alla data di partenza', 400);
    }
    
    try {
        // Controllo sovrapposizioni
        if (checkAutoOverlap($db, $input['data_partenza'], $input['data_rientro'])) {
            handleError('Auto già prenotata per il periodo richiesto', 409);
        }
        
        // Gestione upload file (se presente)
        $fileGiustificativo = null;
        if (isset($_FILES['giustificativo']) && $_FILES['giustificativo']['error'] === UPLOAD_ERR_OK) {
            $fileGiustificativo = handleFileUpload($_FILES['giustificativo'], 'auto');
        }
        
        $sql = "
            INSERT INTO auto_reservations 
            (user_id, data_partenza, data_rientro, destinazione, note, file_giustificativo, stato)
            VALUES (?, ?, ?, ?, ?, ?, 'in-attesa')
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $session['user_id'],
            $input['data_partenza'],
            $input['data_rientro'],
            Security::sanitizeInput($input['destinazione']),
            Security::sanitizeInput($input['note'] ?? ''),
            $fileGiustificativo
        ]);
        
        $reservationId = $db->lastInsertId();
        
        Logger::info('Prenotazione auto creata', [
            'reservation_id' => $reservationId,
            'user_id' => $session['user_id'],
            'destinazione' => $input['destinazione']
        ]);
        
        // Recupera la prenotazione creata
        $stmt = $db->prepare("
            SELECT ar.*, u.nome as user_nome
            FROM auto_reservations ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = ?
        ");
        $stmt->execute([$reservationId]);
        $newReservation = $stmt->fetch();
        
        // Notifica admin (se configurato)
        notifyAdminNewReservation($newReservation);
        
        jsonResponse($newReservation, 201, 'Prenotazione auto creata con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore creazione prenotazione auto: ' . $e->getMessage());
        handleError('Errore creazione prenotazione auto', 500);
    }
}

/**
 * Aggiorna prenotazione esistente
 */
function updateReservation($db, $reservationId, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id, stato FROM auto_reservations WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$reservationId, $session['user_id']];
        } else {
            $checkParams = [$reservationId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $existingReservation = $stmt->fetch();
        
        if (!$existingReservation) {
            handleError('Prenotazione non trovata o accesso negato', 404);
        }
        
        // Non permettere modifiche a prenotazioni già approvate (solo admin può)
        if ($existingReservation['stato'] === 'approvato' && $session['user_role'] !== 'admin') {
            handleError('Non è possibile modificare prenotazioni già approvate', 403);
        }
        
        // Costruisce query di aggiornamento dinamica
        $allowedFields = ['data_partenza', 'data_rientro', 'destinazione', 'note'];
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = in_array($field, ['destinazione', 'note']) 
                    ? Security::sanitizeInput($input[$field])
                    : $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            handleError('Nessun campo da aggiornare', 400);
        }
        
        // Validazione date se presenti
        if (isset($input['data_partenza']) && isset($input['data_rientro'])) {
            $dataPartenza = new DateTime($input['data_partenza']);
            $dataRientro = new DateTime($input['data_rientro']);
            
            if ($dataPartenza >= $dataRientro) {
                handleError('La data di rientro deve essere successiva alla data di partenza', 400);
            }
            
            // Controllo sovrapposizioni (escludi prenotazione corrente)
            if (checkAutoOverlap($db, $input['data_partenza'], $input['data_rientro'], $reservationId)) {
                handleError('Auto già prenotata per il periodo richiesto', 409);
            }
        }
        
        $updateValues[] = $reservationId;
        
        $sql = "UPDATE auto_reservations SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateValues);
        
        Logger::info('Prenotazione auto aggiornata', [
            'reservation_id' => $reservationId,
            'user_id' => $session['user_id'],
            'fields' => array_keys($input)
        ]);
        
        // Recupera prenotazione aggiornata
        $stmt = $db->prepare("
            SELECT ar.*, u.nome as user_nome
            FROM auto_reservations ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = ?
        ");
        $stmt->execute([$reservationId]);
        $updatedReservation = $stmt->fetch();
        
        jsonResponse($updatedReservation, 200, 'Prenotazione aggiornata con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore aggiornamento prenotazione auto: ' . $e->getMessage());
        handleError('Errore aggiornamento prenotazione auto', 500);
    }
}

/**
 * Approva prenotazione (solo admin)
 */
function approveReservation($db, $reservationId, $session) {
    $session = requireAdmin(); // Solo admin possono approvare
    
    try {
        $stmt = $db->prepare("
            UPDATE auto_reservations 
            SET stato = 'approvato', approvato_da = ?, approvato_il = NOW()
            WHERE id = ? AND stato = 'in-attesa'
        ");
        
        $stmt->execute([$session['user_id'], $reservationId]);
        
        if ($stmt->rowCount() === 0) {
            handleError('Prenotazione non trovata o già elaborata', 404);
        }
        
        Logger::info('Prenotazione auto approvata', [
            'reservation_id' => $reservationId,
            'approved_by' => $session['user_id']
        ]);
        
        jsonResponse(null, 200, 'Prenotazione approvata con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore approvazione prenotazione auto: ' . $e->getMessage());
        handleError('Errore approvazione prenotazione auto', 500);
    }
}

/**
 * Rifiuta prenotazione (solo admin)
 */
function rejectReservation($db, $reservationId, $session) {
    $session = requireAdmin(); // Solo admin possono rifiutare
    
    $input = json_decode(file_get_contents('php://input'), true);
    $motivoRifiuto = $input['motivo_rifiuto'] ?? '';
    
    try {
        $stmt = $db->prepare("
            UPDATE auto_reservations 
            SET stato = 'rifiutato', approvato_da = ?, approvato_il = NOW(), motivo_rifiuto = ?
            WHERE id = ? AND stato = 'in-attesa'
        ");
        
        $stmt->execute([$session['user_id'], $motivoRifiuto, $reservationId]);
        
        if ($stmt->rowCount() === 0) {
            handleError('Prenotazione non trovata o già elaborata', 404);
        }
        
        Logger::info('Prenotazione auto rifiutata', [
            'reservation_id' => $reservationId,
            'rejected_by' => $session['user_id'],
            'reason' => $motivoRifiuto
        ]);
        
        jsonResponse(null, 200, 'Prenotazione rifiutata');
        
    } catch (Exception $e) {
        Logger::error('Errore rifiuto prenotazione auto: ' . $e->getMessage());
        handleError('Errore rifiuto prenotazione auto', 500);
    }
}

/**
 * Elimina prenotazione
 */
function deleteReservation($db, $reservationId, $session) {
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id, stato FROM auto_reservations WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$reservationId, $session['user_id']];
        } else {
            $checkParams = [$reservationId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $reservation = $stmt->fetch();
        
        if (!$reservation) {
            handleError('Prenotazione non trovata o accesso negato', 404);
        }
        
        // Non permettere eliminazione di prenotazioni approvate
        if ($reservation['stato'] === 'approvato' && $session['user_role'] !== 'admin') {
            handleError('Non è possibile eliminare prenotazioni approvate', 403);
        }
        
        // Elimina prenotazione
        $stmt = $db->prepare("DELETE FROM auto_reservations WHERE id = ?");
        $stmt->execute([$reservationId]);
        
        Logger::info('Prenotazione auto eliminata', [
            'reservation_id' => $reservationId,
            'user_id' => $session['user_id']
        ]);
        
        jsonResponse(null, 200, 'Prenotazione eliminata con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore eliminazione prenotazione auto: ' . $e->getMessage());
        handleError('Errore eliminazione prenotazione auto', 500);
    }
}

/**
 * Controlla sovrapposizioni prenotazioni auto
 */
function checkAutoOverlap($db, $dataPartenza, $dataRientro, $excludeReservationId = null) {
    try {
        $sql = "
            SELECT COUNT(*) as count
            FROM auto_reservations
            WHERE stato IN ('approvato', 'in-attesa')
            AND ((data_partenza < ? AND data_rientro > ?) OR 
                 (data_partenza < ? AND data_rientro > ?) OR
                 (data_partenza >= ? AND data_rientro <= ?))
        ";
        
        $params = [$dataRientro, $dataPartenza, $dataPartenza, $dataPartenza, $dataRientro, $dataPartenza, $dataRientro];
        
        if ($excludeReservationId) {
            $sql .= " AND id != ?";
            $params[] = $excludeReservationId;
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchColumn() > 0;
        
    } catch (Exception $e) {
        Logger::error('Errore controllo sovrapposizioni auto: ' . $e->getMessage());
        return false;
    }
}

/**
 * Gestisce upload file
 */
function handleFileUpload($file, $category) {
    try {
        if ($file['size'] > UPLOAD_MAX_SIZE) {
            throw new Exception('File troppo grande');
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
        Logger::error('Errore upload file: ' . $e->getMessage());
        return null;
    }
}

/**
 * Notifica admin per nuova prenotazione
 */
function notifyAdminNewReservation($reservation) {
    // Implementazione notifica email/sistema
    // Per ora solo log
    Logger::info('Nuova prenotazione auto in attesa di approvazione', [
        'reservation_id' => $reservation['id'],
        'user' => $reservation['user_nome'],
        'destinazione' => $reservation['destinazione']
    ]);
}
?>