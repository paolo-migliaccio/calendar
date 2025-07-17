<?php
/**
 * API Eventi - Gestionale Calendario Formatori
 * 
 * Endpoints:
 * GET /api/events.php - Lista eventi
 * POST /api/events.php - Crea nuovo evento
 * PUT /api/events.php?id=X - Aggiorna evento
 * DELETE /api/events.php?id=X - Elimina evento
 * GET /api/events.php?action=calendar - Eventi per FullCalendar
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$eventId = $_GET['id'] ?? null;

// Autenticazione richiesta
$session = requireAuth();

switch ($method) {
    case 'GET':
        if ($action === 'calendar') {
            getCalendarEvents($db, $session);
        } elseif ($eventId) {
            getEvent($db, $eventId, $session);
        } else {
            getEvents($db, $session);
        }
        break;
        
    case 'POST':
        createEvent($db, $session);
        break;
        
    case 'PUT':
        if (!$eventId) {
            handleError('ID evento richiesto', 400);
        }
        updateEvent($db, $eventId, $session);
        break;
        
    case 'DELETE':
        if (!$eventId) {
            handleError('ID evento richiesto', 400);
        }
        deleteEvent($db, $eventId, $session);
        break;
        
    default:
        handleError('Metodo non supportato', 405);
}

/**
 * Ottiene tutti gli eventi
 */
function getEvents($db, $session) {
    try {
        $whereClause = '';
        $params = [];
        
        // I formatori vedono solo i propri eventi, gli admin tutti
        if ($session['user_role'] !== 'admin') {
            $whereClause = 'WHERE e.user_id = ?';
            $params[] = $session['user_id'];
        }
        
        // Filtri aggiuntivi
        if (isset($_GET['start']) && isset($_GET['end'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'e.start_time >= ? AND e.end_time <= ?';
            $params[] = $_GET['start'];
            $params[] = $_GET['end'];
        }
        
        if (isset($_GET['tipo'])) {
            $whereClause .= ($whereClause ? ' AND ' : 'WHERE ');
            $whereClause .= 'e.tipo_evento = ?';
            $params[] = $_GET['tipo'];
        }
        
        $sql = "
            SELECT e.*, u.nome as formatore_nome
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            $whereClause
            ORDER BY e.start_time DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll();
        
        jsonResponse($events, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero eventi: ' . $e->getMessage());
        handleError('Errore recupero eventi', 500);
    }
}

/**
 * Ottiene eventi per FullCalendar
 */
function getCalendarEvents($db, $session) {
    try {
        $start = $_GET['start'] ?? date('Y-m-01');
        $end = $_GET['end'] ?? date('Y-m-t');
        
        $whereClause = 'WHERE e.start_time >= ? AND e.start_time <= ?';
        $params = [$start, $end];
        
        // I formatori vedono solo i propri eventi, gli admin tutti
        if ($session['user_role'] !== 'admin') {
            $whereClause .= ' AND e.user_id = ?';
            $params[] = $session['user_id'];
        }
        
        $sql = "
            SELECT 
                e.id,
                e.titolo as title,
                e.descrizione,
                e.start_time as start,
                e.end_time as end,
                e.location,
                e.tipo_evento,
                e.colore as backgroundColor,
                e.all_day as allDay,
                u.nome as formatore,
                'event' as resourceType
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            $whereClause
            ORDER BY e.start_time
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll();
        
        // Formatta per FullCalendar
        $calendarEvents = array_map(function($event) {
            return [
                'id' => $event['id'],
                'title' => $event['title'],
                'start' => $event['start'],
                'end' => $event['end'],
                'backgroundColor' => $event['backgroundColor'],
                'borderColor' => $event['backgroundColor'],
                'allDay' => (bool)$event['allDay'],
                'extendedProps' => [
                    'description' => $event['descrizione'],
                    'location' => $event['location'],
                    'tipo_evento' => $event['tipo_evento'],
                    'formatore' => $event['formatore'],
                    'resourceType' => $event['resourceType']
                ]
            ];
        }, $events);
        
        jsonResponse($calendarEvents, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero eventi calendario: ' . $e->getMessage());
        handleError('Errore recupero eventi calendario', 500);
    }
}

/**
 * Ottiene un singolo evento
 */
function getEvent($db, $eventId, $session) {
    try {
        $sql = "
            SELECT e.*, u.nome as formatore_nome
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        ";
        
        // Controllo permessi: formatori vedono solo i propri eventi
        if ($session['user_role'] !== 'admin') {
            $sql .= " AND e.user_id = ?";
            $params = [$eventId, $session['user_id']];
        } else {
            $params = [$eventId];
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $event = $stmt->fetch();
        
        if (!$event) {
            handleError('Evento non trovato', 404);
        }
        
        jsonResponse($event, 200);
        
    } catch (Exception $e) {
        Logger::error('Errore recupero evento: ' . $e->getMessage());
        handleError('Errore recupero evento', 500);
    }
}

/**
 * Crea nuovo evento
 */
function createEvent($db, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    // Validazione campi obbligatori
    $required = ['titolo', 'start_time', 'end_time', 'tipo_evento'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            handleError("Campo '$field' richiesto", 400);
        }
    }
    
    // Validazione date
    $startTime = new DateTime($input['start_time']);
    $endTime = new DateTime($input['end_time']);
    
    if ($startTime >= $endTime) {
        handleError('La data di fine deve essere successiva alla data di inizio', 400);
    }
    
    try {
        // Controllo sovrapposizioni per lo stesso formatore
        $userId = $session['user_role'] === 'admin' && isset($input['user_id']) 
            ? $input['user_id'] 
            : $session['user_id'];
            
        if (checkEventOverlap($db, $userId, $input['start_time'], $input['end_time'])) {
            handleError('Conflitto con un evento esistente per questo formatore', 409);
        }
        
        // Mappa colori per tipo evento
        $colorMap = [
            'corso-interno' => '#4caf50',
            'evento-pubblico' => '#ff9800',
            'riunione' => '#2196f3',
            'formazione' => '#9c27b0'
        ];
        
        $sql = "
            INSERT INTO events 
            (titolo, descrizione, start_time, end_time, location, user_id, tipo_evento, colore, all_day)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            Security::sanitizeInput($input['titolo']),
            Security::sanitizeInput($input['descrizione'] ?? ''),
            $input['start_time'],
            $input['end_time'],
            Security::sanitizeInput($input['location'] ?? ''),
            $userId,
            $input['tipo_evento'],
            $colorMap[$input['tipo_evento']] ?? '#3f51b5',
            isset($input['all_day']) ? (bool)$input['all_day'] : false
        ]);
        
        $eventId = $db->lastInsertId();
        
        Logger::info('Evento creato', [
            'event_id' => $eventId,
            'user_id' => $session['user_id'],
            'titolo' => $input['titolo']
        ]);
        
        // Recupera l'evento creato per la risposta
        $stmt = $db->prepare("
            SELECT e.*, u.nome as formatore_nome
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        ");
        $stmt->execute([$eventId]);
        $newEvent = $stmt->fetch();
        
        jsonResponse($newEvent, 201, 'Evento creato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore creazione evento: ' . $e->getMessage());
        handleError('Errore creazione evento', 500);
    }
}

/**
 * Aggiorna evento esistente
 */
function updateEvent($db, $eventId, $session) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Dati non validi', 400);
    }
    
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id FROM events WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$eventId, $session['user_id']];
        } else {
            $checkParams = [$eventId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $existingEvent = $stmt->fetch();
        
        if (!$existingEvent) {
            handleError('Evento non trovato o accesso negato', 404);
        }
        
        // Costruisce query di aggiornamento dinamica
        $allowedFields = [
            'titolo', 'descrizione', 'start_time', 'end_time', 
            'location', 'tipo_evento', 'all_day'
        ];
        
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'tipo_evento') {
                    // Aggiorna anche il colore
                    $colorMap = [
                        'corso-interno' => '#4caf50',
                        'evento-pubblico' => '#ff9800',
                        'riunione' => '#2196f3',
                        'formazione' => '#9c27b0'
                    ];
                    $updateFields[] = "colore = ?";
                    $updateValues[] = $colorMap[$input[$field]] ?? '#3f51b5';
                }
                
                $updateFields[] = "$field = ?";
                $updateValues[] = in_array($field, ['titolo', 'descrizione', 'location']) 
                    ? Security::sanitizeInput($input[$field])
                    : $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            handleError('Nessun campo da aggiornare', 400);
        }
        
        // Validazione date se presenti
        if (isset($input['start_time']) && isset($input['end_time'])) {
            $startTime = new DateTime($input['start_time']);
            $endTime = new DateTime($input['end_time']);
            
            if ($startTime >= $endTime) {
                handleError('La data di fine deve essere successiva alla data di inizio', 400);
            }
            
            // Controllo sovrapposizioni (escludi evento corrente)
            if (checkEventOverlap($db, $existingEvent['user_id'], $input['start_time'], $input['end_time'], $eventId)) {
                handleError('Conflitto con un evento esistente per questo formatore', 409);
            }
        }
        
        $updateValues[] = $eventId;
        
        $sql = "UPDATE events SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateValues);
        
        Logger::info('Evento aggiornato', [
            'event_id' => $eventId,
            'user_id' => $session['user_id'],
            'fields' => array_keys($input)
        ]);
        
        // Recupera evento aggiornato
        $stmt = $db->prepare("
            SELECT e.*, u.nome as formatore_nome
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        ");
        $stmt->execute([$eventId]);
        $updatedEvent = $stmt->fetch();
        
        jsonResponse($updatedEvent, 200, 'Evento aggiornato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore aggiornamento evento: ' . $e->getMessage());
        handleError('Errore aggiornamento evento', 500);
    }
}

/**
 * Elimina evento
 */
function deleteEvent($db, $eventId, $session) {
    try {
        // Verifica esistenza e permessi
        $checkSql = "SELECT user_id, titolo FROM events WHERE id = ?";
        if ($session['user_role'] !== 'admin') {
            $checkSql .= " AND user_id = ?";
            $checkParams = [$eventId, $session['user_id']];
        } else {
            $checkParams = [$eventId];
        }
        
        $stmt = $db->prepare($checkSql);
        $stmt->execute($checkParams);
        $event = $stmt->fetch();
        
        if (!$event) {
            handleError('Evento non trovato o accesso negato', 404);
        }
        
        // Elimina evento
        $stmt = $db->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$eventId]);
        
        Logger::info('Evento eliminato', [
            'event_id' => $eventId,
            'user_id' => $session['user_id'],
            'titolo' => $event['titolo']
        ]);
        
        jsonResponse(null, 200, 'Evento eliminato con successo');
        
    } catch (Exception $e) {
        Logger::error('Errore eliminazione evento: ' . $e->getMessage());
        handleError('Errore eliminazione evento', 500);
    }
}

/**
 * Controlla sovrapposizioni eventi
 */
function checkEventOverlap($db, $userId, $startTime, $endTime, $excludeEventId = null) {
    try {
        $sql = "
            SELECT COUNT(*) as count
            FROM events
            WHERE user_id = ?
            AND ((start_time < ? AND end_time > ?) OR 
                 (start_time < ? AND end_time > ?) OR
                 (start_time >= ? AND end_time <= ?))
        ";
        
        $params = [$userId, $endTime, $startTime, $startTime, $startTime, $endTime, $startTime, $endTime];
        
        if ($excludeEventId) {
            $sql .= " AND id != ?";
            $params[] = $excludeEventId;
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchColumn() > 0;
        
    } catch (Exception $e) {
        Logger::error('Errore controllo sovrapposizioni: ' . $e->getMessage());
        return false; // In caso di errore, permettiamo la creazione
    }
}
?>