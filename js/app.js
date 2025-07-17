/**
 * Gestionale Calendario Formatori
 * Sistema completo per la gestione di eventi, prenotazioni auto e rimborsi
 */

class CalendarioFormatori {
    constructor() {
        // Stato dell'applicazione
        this.currentUser = null;
        this.calendar = null;
        this.autoCalendar = null;
        this.events = [];
        this.autoReservations = [];
        this.rimborsi = [];
        this.users = [];
        
        // Mock data per la demo
        this.initMockData();
        
        // Inizializzazione
        this.init();
    }

    /**
     * Inizializza i dati mock per la demo
     */
    initMockData() {
        // Utenti di esempio
        this.users = [
            {
                id: 1,
                nome: 'Mario Rossi',
                email: 'mario.rossi@azienda.it',
                ruolo: 'admin',
                password: 'admin123',
                puo_prenotare_auto: true,
                puo_chiedere_rimborso: true
            },
            {
                id: 2,
                nome: 'Giulia Bianchi',
                email: 'giulia.bianchi@azienda.it',
                ruolo: 'formatore',
                password: 'formatore123',
                puo_prenotare_auto: true,
                puo_chiedere_rimborso: true
            },
            {
                id: 3,
                nome: 'Luca Verde',
                email: 'luca.verde@azienda.it',
                ruolo: 'formatore',
                password: 'formatore123',
                puo_prenotare_auto: false,
                puo_chiedere_rimborso: true
            }
        ];

        // Eventi di esempio
        this.events = [
            {
                id: 1,
                title: 'Corso Excel Avanzato',
                description: 'Corso di formazione su Excel per dipendenti',
                start: '2024-02-15T09:00:00',
                end: '2024-02-15T17:00:00',
                location: 'Aula 1',
                user_id: 2,
                tipo_evento: 'corso-interno',
                backgroundColor: '#4caf50'
            },
            {
                id: 2,
                title: 'Workshop Pubblico Digital Marketing',
                description: 'Evento aperto al pubblico',
                start: '2024-02-20T14:00:00',
                end: '2024-02-20T18:00:00',
                location: 'Centro Congressi',
                user_id: 2,
                tipo_evento: 'evento-pubblico',
                backgroundColor: '#ff9800'
            },
            {
                id: 3,
                title: 'Riunione Team',
                description: 'Riunione settimanale del team formazione',
                start: '2024-02-22T10:00:00',
                end: '2024-02-22T11:30:00',
                location: 'Sala Riunioni',
                user_id: 1,
                tipo_evento: 'riunione',
                backgroundColor: '#2196f3'
            }
        ];

        // Prenotazioni auto di esempio
        this.autoReservations = [
            {
                id: 1,
                user_id: 2,
                start: '2024-02-18T08:00:00',
                end: '2024-02-18T18:00:00',
                destinazione: 'Milano - Corso formazione',
                note: 'Corso presso cliente',
                stato: 'approvato',
                title: 'Auto: Milano',
                backgroundColor: '#f44336'
            }
        ];

        // Rimborsi di esempio
        this.rimborsi = [
            {
                id: 1,
                user_id: 2,
                data: '2024-02-10',
                descrizione: 'Pranzo durante trasferta Milano',
                importo: 25.50,
                tipo: 'vitto',
                stato: 'approvato'
            },
            {
                id: 2,
                user_id: 2,
                data: '2024-02-12',
                descrizione: 'Taxi aeroporto-hotel',
                importo: 45.00,
                tipo: 'trasporto',
                stato: 'in-attesa'
            }
        ];
    }

    /**
     * Inizializzazione dell'applicazione
     */
    init() {
        this.checkAuth();
        this.initEventListeners();
        this.initModals();
        this.showToast('Sistema inizializzato correttamente', 'success');
    }

    /**
     * Controllo autenticazione
     */
    checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    /**
     * Mostra il modal di login
     */
    showLogin() {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }

    /**
     * Mostra l'applicazione principale
     */
    showMainApp() {
        // Nascondi login modal se aperto
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }

        // Aggiorna UI con dati utente
        this.updateUserInterface();
        
        // Inizializza calendari
        this.initCalendar();
        this.initAutoCalendar();
        
        // Carica dati
        this.loadRimborsiTable();
        this.loadFormatori();
        
        // Mostra sezione calendario di default
        this.showSection('calendar');
    }

    /**
     * Aggiorna l'interfaccia utente in base al ruolo
     */
    updateUserInterface() {
        document.getElementById('userWelcome').textContent = `Benvenuto, ${this.currentUser.nome}`;
        
        // Mostra/nascondi sezione admin
        const adminMenu = document.getElementById('menuAdmin');
        if (this.currentUser.ruolo === 'admin') {
            adminMenu.style.display = 'block';
        } else {
            adminMenu.style.display = 'none';
        }

        // Aggiorna permessi UI
        this.updatePermissions();
    }

    /**
     * Aggiorna i permessi dell'interfaccia
     */
    updatePermissions() {
        const autoSection = document.getElementById('autoSection');
        const rimborsiSection = document.getElementById('rimborsiSection');
        
        if (!this.currentUser.puo_prenotare_auto) {
            document.getElementById('menuAuto').style.opacity = '0.5';
        }
        
        if (!this.currentUser.puo_chiedere_rimborso) {
            document.getElementById('menuRimborsi').style.opacity = '0.5';
        }
    }

    /**
     * Inizializza gli event listeners
     */
    initEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation menu
        document.getElementById('menuCalendario').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('calendar');
        });

        document.getElementById('menuAuto').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentUser?.puo_prenotare_auto) {
                this.showSection('auto');
            } else {
                this.showToast('Non hai i permessi per accedere a questa sezione', 'error');
            }
        });

        document.getElementById('menuRimborsi').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentUser?.puo_chiedere_rimborso) {
                this.showSection('rimborsi');
            } else {
                this.showToast('Non hai i permessi per accedere a questa sezione', 'error');
            }
        });

        document.getElementById('menuAdmin').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentUser?.ruolo === 'admin') {
                this.showSection('admin');
            }
        });

        // Calendar view buttons
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.changeCalendarView(view);
                
                // Update button states
                document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // User menu
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Event management
        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.openEventModal();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        document.getElementById('deleteEventBtn').addEventListener('click', () => {
            this.deleteEvent();
        });

        // Auto reservation
        document.getElementById('autoReservationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAutoReservation();
        });

        // Rimborso form
        document.getElementById('rimborsoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRimborso();
        });

        // Admin buttons
        document.getElementById('manageUsersBtn')?.addEventListener('click', () => {
            this.showToast('Funzionalità in sviluppo', 'info');
        });

        document.getElementById('reviewReimbursementsBtn')?.addEventListener('click', () => {
            this.reviewReimbursements();
        });

        document.getElementById('generateReportsBtn')?.addEventListener('click', () => {
            this.generateReports();
        });
    }

    /**
     * Inizializza i modali
     */
    initModals() {
        // Gestione MDL per i nuovi elementi
        setTimeout(() => {
            if (window.componentHandler) {
                window.componentHandler.upgradeDom();
            }
        }, 100);
    }

    /**
     * Gestisce il login
     */
    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            this.showToast(`Benvenuto, ${user.nome}!`, 'success');
        } else {
            this.showToast('Credenziali non valide', 'error');
        }
    }

    /**
     * Logout
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        location.reload();
    }

    /**
     * Mostra una sezione specifica con animazioni moderne
     */
    showSection(section) {
        // Rimuovi classe active dalle sezioni correnti
        document.querySelectorAll('.section-content').forEach(el => {
            el.classList.remove('active');
            setTimeout(() => {
                el.style.display = 'none';
            }, 150);
        });

        // Rimuovi classe active dai menu
        document.querySelectorAll('.mdl-navigation__link').forEach(el => {
            el.classList.remove('active');
        });

        // Mostra sezione selezionata con animazione
        const sectionMap = {
            'calendar': 'calendarSection',
            'auto': 'autoSection',
            'rimborsi': 'rimborsiSection',
            'admin': 'adminSection'
        };

        const sectionId = sectionMap[section];
        if (sectionId) {
            const sectionEl = document.getElementById(sectionId);
            
            setTimeout(() => {
                sectionEl.style.display = 'block';
                sectionEl.classList.add('fade-in-up');
                
                // Trigger reflow per l'animazione
                sectionEl.offsetHeight;
                sectionEl.classList.add('active');
                
                // Rimuovi classe animazione dopo completamento
                setTimeout(() => {
                    sectionEl.classList.remove('fade-in-up');
                }, 500);
            }, 150);
            
            // Aggiungi classe active al menu
            const menuId = 'menu' + section.charAt(0).toUpperCase() + section.slice(1);
            document.getElementById(menuId)?.classList.add('active');
        }

        // Refresh calendari se necessario
        if (section === 'calendar' && this.calendar) {
            setTimeout(() => this.calendar.render(), 300);
        }
        if (section === 'auto' && this.autoCalendar) {
            setTimeout(() => this.autoCalendar.render(), 300);
        }
    }

    /**
     * Inizializza il calendario principale
     */
    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'it',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: this.events,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            weekends: true,
            select: (selectInfo) => {
                this.openEventModal(selectInfo);
            },
            eventClick: (clickInfo) => {
                this.openEventModal(null, clickInfo.event);
            },
            editable: true,
            eventDrop: (dropInfo) => {
                this.updateEventTiming(dropInfo.event);
            },
            eventResize: (resizeInfo) => {
                this.updateEventTiming(resizeInfo.event);
            }
        });

        this.calendar.render();
    }

    /**
     * Inizializza il calendario auto aziendale
     */
    initAutoCalendar() {
        const autoCalendarEl = document.getElementById('autoCalendar');
        
        this.autoCalendar = new FullCalendar.Calendar(autoCalendarEl, {
            initialView: 'timeGridWeek',
            locale: 'it',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
            },
            events: this.autoReservations,
            selectable: true,
            selectMirror: true,
            allDaySlot: false,
            slotMinTime: '06:00:00',
            slotMaxTime: '22:00:00',
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '18:00'
            },
            select: (selectInfo) => {
                this.prefillAutoForm(selectInfo);
            },
            eventClick: (clickInfo) => {
                this.showAutoReservationDetails(clickInfo.event);
            }
        });

        this.autoCalendar.render();
    }

    /**
     * Pre-compila il form auto con le date selezionate
     */
    prefillAutoForm(selectInfo) {
        const startDate = selectInfo.start.toISOString().slice(0, 16);
        const endDate = selectInfo.end.toISOString().slice(0, 16);
        
        document.getElementById('autoStartDate').value = startDate;
        document.getElementById('autoEndDate').value = endDate;
        
        this.showToast('Date selezionate nel form prenotazione', 'info');
    }

    /**
     * Mostra dettagli prenotazione auto
     */
    showAutoReservationDetails(event) {
        const reservation = this.autoReservations.find(r => r.id == event.id);
        if (reservation) {
            const user = this.users.find(u => u.id === reservation.user_id);
            alert(`Prenotazione Auto
            
Utente: ${user?.nome || 'N/A'}
Destinazione: ${reservation.destinazione}
Note: ${reservation.note || 'Nessuna nota'}
Stato: ${reservation.stato}

Dal: ${new Date(reservation.start).toLocaleString('it-IT')}
Al: ${new Date(reservation.end).toLocaleString('it-IT')}`);
        }
    }

    /**
     * Apre il modal per eventi
     */
    openEventModal(selectInfo = null, event = null) {
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        const form = document.getElementById('eventForm');
        
        // Reset form
        form.reset();
        document.getElementById('eventId').value = '';
        document.getElementById('deleteEventBtn').style.display = 'none';
        
        if (event) {
            // Modalità modifica
            document.getElementById('eventModalTitle').innerHTML = '<i class="material-icons">edit</i> Modifica Evento';
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.extendedProps.description || '';
            document.getElementById('eventStart').value = event.start.toISOString().slice(0, 16);
            document.getElementById('eventEnd').value = event.end?.toISOString().slice(0, 16) || '';
            document.getElementById('eventLocation').value = event.extendedProps.location || '';
            document.getElementById('eventType').value = event.extendedProps.tipo_evento || '';
            document.getElementById('eventFormatore').value = event.extendedProps.user_id || '';
            document.getElementById('deleteEventBtn').style.display = 'inline-block';
        } else if (selectInfo) {
            // Modalità creazione con date preselezionate
            document.getElementById('eventModalTitle').innerHTML = '<i class="material-icons">add</i> Nuovo Evento';
            document.getElementById('eventStart').value = selectInfo.start.toISOString().slice(0, 16);
            document.getElementById('eventEnd').value = selectInfo.end.toISOString().slice(0, 16);
        } else {
            // Modalità creazione vuota
            document.getElementById('eventModalTitle').innerHTML = '<i class="material-icons">add</i> Nuovo Evento';
        }
        
        modal.show();
    }

    /**
     * Salva un evento
     */
    saveEvent() {
        const eventId = document.getElementById('eventId').value;
        const eventData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            start: document.getElementById('eventStart').value,
            end: document.getElementById('eventEnd').value,
            location: document.getElementById('eventLocation').value,
            tipo_evento: document.getElementById('eventType').value,
            user_id: parseInt(document.getElementById('eventFormatore').value) || this.currentUser.id
        };

        // Definisci colore in base al tipo
        const colorMap = {
            'corso-interno': '#4caf50',
            'evento-pubblico': '#ff9800',
            'riunione': '#2196f3',
            'formazione': '#9c27b0'
        };
        eventData.backgroundColor = colorMap[eventData.tipo_evento] || '#3f51b5';

        if (eventId) {
            // Modifica evento esistente
            const index = this.events.findIndex(e => e.id == eventId);
            if (index !== -1) {
                this.events[index] = { ...this.events[index], ...eventData };
                this.showToast('Evento modificato con successo', 'success');
            }
        } else {
            // Nuovo evento
            eventData.id = Date.now();
            this.events.push(eventData);
            this.showToast('Evento creato con successo', 'success');
        }

        // Aggiorna calendario
        this.calendar.removeAllEvents();
        this.calendar.addEventSource(this.events);

        // Chiudi modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
        modal.hide();
    }

    /**
     * Elimina un evento
     */
    deleteEvent() {
        const eventId = document.getElementById('eventId').value;
        if (eventId && confirm('Sei sicuro di voler eliminare questo evento?')) {
            this.events = this.events.filter(e => e.id != eventId);
            
            // Aggiorna calendario
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.events);
            
            // Chiudi modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
            modal.hide();
            
            this.showToast('Evento eliminato con successo', 'success');
        }
    }

    /**
     * Aggiorna timing evento (drag & drop)
     */
    updateEventTiming(event) {
        const eventIndex = this.events.findIndex(e => e.id == event.id);
        if (eventIndex !== -1) {
            this.events[eventIndex].start = event.start.toISOString();
            this.events[eventIndex].end = event.end?.toISOString() || event.start.toISOString();
            this.showToast('Evento aggiornato', 'success');
        }
    }

    /**
     * Salva prenotazione auto
     */
    saveAutoReservation() {
        const formData = {
            id: Date.now(),
            user_id: this.currentUser.id,
            start: document.getElementById('autoStartDate').value,
            end: document.getElementById('autoEndDate').value,
            destinazione: document.getElementById('autoDestination').value,
            note: document.getElementById('autoNotes').value,
            stato: 'in-attesa',
            title: `Auto: ${document.getElementById('autoDestination').value}`,
            backgroundColor: '#f44336'
        };

        // Verifica sovrapposizioni
        const hasConflict = this.autoReservations.some(reservation => {
            const newStart = new Date(formData.start);
            const newEnd = new Date(formData.end);
            const existingStart = new Date(reservation.start);
            const existingEnd = new Date(reservation.end);
            
            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (hasConflict) {
            this.showToast('Conflitto con prenotazione esistente', 'error');
            return;
        }

        this.autoReservations.push(formData);
        
        // Aggiorna calendario auto
        this.autoCalendar.removeAllEvents();
        this.autoCalendar.addEventSource(this.autoReservations);
        
        // Reset form
        document.getElementById('autoReservationForm').reset();
        
        this.showToast('Prenotazione auto inviata con successo', 'success');
    }

    /**
     * Salva richiesta rimborso
     */
    saveRimborso() {
        const rimborsoData = {
            id: Date.now(),
            user_id: this.currentUser.id,
            data: document.getElementById('rimborsoDate').value,
            descrizione: document.getElementById('rimborsoDescription').value,
            importo: parseFloat(document.getElementById('rimborsoAmount').value),
            tipo: document.getElementById('rimborsoType').value,
            stato: 'in-attesa'
        };

        this.rimborsi.push(rimborsoData);
        
        // Aggiorna tabella
        this.loadRimborsiTable();
        
        // Reset form
        document.getElementById('rimborsoForm').reset();
        
        this.showToast('Richiesta rimborso inviata con successo', 'success');
    }

    /**
     * Carica la tabella rimborsi
     */
    loadRimborsiTable() {
        const tbody = document.getElementById('rimborsiTableBody');
        tbody.innerHTML = '';

        const userRimborsi = this.currentUser.ruolo === 'admin' 
            ? this.rimborsi 
            : this.rimborsi.filter(r => r.user_id === this.currentUser.id);

        userRimborsi.forEach(rimborso => {
            const user = this.users.find(u => u.id === rimborso.user_id);
            const row = document.createElement('tr');
            
            const statusClass = {
                'in-attesa': 'status-pending',
                'approvato': 'status-approved',
                'rifiutato': 'status-rejected'
            }[rimborso.stato] || 'status-pending';

            row.innerHTML = `
                <td>${new Date(rimborso.data).toLocaleDateString('it-IT')}</td>
                <td>${rimborso.descrizione}</td>
                <td>€ ${rimborso.importo.toFixed(2)}</td>
                <td><span class="badge bg-secondary">${rimborso.tipo}</span></td>
                <td><span class="badge-status ${statusClass}">${rimborso.stato}</span></td>
                <td>
                    ${this.currentUser.ruolo === 'admin' && rimborso.stato === 'in-attesa' ? `
                        <button class="btn btn-sm btn-success me-1" onclick="app.approveRimborso(${rimborso.id})">
                            <i class="material-icons">check</i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.rejectRimborso(${rimborso.id})">
                            <i class="material-icons">close</i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewRimborso(${rimborso.id})">
                            <i class="material-icons">visibility</i>
                        </button>
                    `}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    /**
     * Approva rimborso (solo admin)
     */
    approveRimborso(rimborsoId) {
        const index = this.rimborsi.findIndex(r => r.id === rimborsoId);
        if (index !== -1) {
            this.rimborsi[index].stato = 'approvato';
            this.loadRimborsiTable();
            this.showToast('Rimborso approvato', 'success');
        }
    }

    /**
     * Rifiuta rimborso (solo admin)
     */
    rejectRimborso(rimborsoId) {
        const index = this.rimborsi.findIndex(r => r.id === rimborsoId);
        if (index !== -1) {
            this.rimborsi[index].stato = 'rifiutato';
            this.loadRimborsiTable();
            this.showToast('Rimborso rifiutato', 'warning');
        }
    }

    /**
     * Visualizza dettagli rimborso
     */
    viewRimborso(rimborsoId) {
        const rimborso = this.rimborsi.find(r => r.id === rimborsoId);
        if (rimborso) {
            alert(`Dettagli Rimborso
            
Data: ${new Date(rimborso.data).toLocaleDateString('it-IT')}
Descrizione: ${rimborso.descrizione}
Importo: € ${rimborso.importo.toFixed(2)}
Tipo: ${rimborso.tipo}
Stato: ${rimborso.stato}`);
        }
    }

    /**
     * Carica formatori nel select
     */
    loadFormatori() {
        const select = document.getElementById('eventFormatore');
        select.innerHTML = '<option value="">Seleziona formatore...</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nome;
            select.appendChild(option);
        });
    }

    /**
     * Rivedi rimborsi (admin)
     */
    reviewReimbursements() {
        const pending = this.rimborsi.filter(r => r.stato === 'in-attesa');
        this.showToast(`Ci sono ${pending.length} rimborsi in attesa di approvazione`, 'info');
        this.showSection('rimborsi');
    }

    /**
     * Genera report (admin)
     */
    generateReports() {
        const report = {
            totalEvents: this.events.length,
            totalAutoReservations: this.autoReservations.length,
            totalReimbursements: this.rimborsi.length,
            pendingReimbursements: this.rimborsi.filter(r => r.stato === 'in-attesa').length,
            totalReimbursementAmount: this.rimborsi
                .filter(r => r.stato === 'approvato')
                .reduce((sum, r) => sum + r.importo, 0)
        };

        const reportText = `Report Gestionale Formatori

📅 Eventi totali: ${report.totalEvents}
🚗 Prenotazioni auto: ${report.totalAutoReservations}
💰 Rimborsi totali: ${report.totalReimbursements}
⏳ Rimborsi in attesa: ${report.pendingReimbursements}
💵 Importo rimborsi approvati: € ${report.totalReimbursementAmount.toFixed(2)}

Generato il: ${new Date().toLocaleString('it-IT')}`;

        // Crea e scarica file di testo
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Report generato e scaricato', 'success');
    }

    /**
     * Cambia vista calendario
     */
    changeCalendarView(view) {
        if (this.calendar) {
            this.calendar.changeView(view);
        }
        if (this.autoCalendar) {
            this.autoCalendar.changeView(view);
        }
    }

    /**
     * Mostra notifica toast moderna
     */
    showToast(message, type = 'info') {
        // Crea container se non esiste
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Crea toast con animazione moderna
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        toast.innerHTML = `
            <div class="toast-body">
                <i class="material-icons">${this.getToastIcon(type)}</i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Anima ingresso
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        // Rimuovi toast dopo 4 secondi con animazione
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Ottiene icona per toast
     */
    getToastIcon(type) {
        const icons = {
            'success': 'check_circle',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        return icons[type] || 'info';
    }
}

// Inizializza app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalendarioFormatori();
});

// Credenziali di demo (rimuovere in produzione)
console.log(`
🔐 CREDENZIALI DEMO:

👨‍💼 Admin:
Email: mario.rossi@azienda.it
Password: admin123

👩‍🏫 Formatore:
Email: giulia.bianchi@azienda.it
Password: formatore123

👨‍🏫 Formatore (limitato):
Email: luca.verde@azienda.it
Password: formatore123
`);