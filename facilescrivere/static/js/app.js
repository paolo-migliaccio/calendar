// Facilescrivere.it - Main Application JavaScript

// Global variables
let currentTemplate = null;
let userDictionary = { words: [], phrases: [] };
let isCheckingGrammar = false;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Inizializzazione Facilescrivere.it...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load user dictionary
    loadUserDictionary();
    
    // Update stats initially
    updateStats();
    
    console.log('Applicazione inizializzata con successo!');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    const textEditor = document.getElementById('text-editor');
    const documentTitle = document.getElementById('document-title');
    
    // Text editor events
    if (textEditor) {
        textEditor.addEventListener('input', updateStats);
        textEditor.addEventListener('paste', function() {
            // Update stats after paste
            setTimeout(updateStats, 100);
        });
    }
    
    // Document title events
    if (documentTitle) {
        documentTitle.addEventListener('input', function() {
            console.log('Titolo documento aggiornato:', this.value);
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveDocument();
        }
        
        // Ctrl+Enter to check grammar
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            checkGrammar();
        }
    });
}

/**
 * Load a document template
 */
async function loadTemplate(templateId) {
    console.log('Caricamento template:', templateId);
    
    try {
        if (templateId === 'custom') {
            // Load empty custom template
            currentTemplate = 'custom';
            document.getElementById('text-editor').value = '';
            document.getElementById('document-title').value = 'Nuovo Documento';
            updateStats();
            showMessage('Template vuoto caricato', 'success');
            return;
        }
        
        const response = await fetch(`/api/templates/${templateId}`);
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento del template');
        }
        
        const template = await response.json();
        
        // Load template into editor
        currentTemplate = templateId;
        document.getElementById('text-editor').value = template.template;
        document.getElementById('document-title').value = template.name;
        
        // Update stats
        updateStats();
        
        // Clear previous suggestions
        clearSuggestions();
        
        showMessage(`Template "${template.name}" caricato con successo`, 'success');
        
        // Scroll to writing area
        document.querySelector('.writing-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
    } catch (error) {
        console.error('Errore nel caricamento del template:', error);
        showMessage('Errore nel caricamento del template', 'error');
    }
}

/**
 * Check grammar and get suggestions
 */
async function checkGrammar() {
    if (isCheckingGrammar) {
        console.log('Controllo grammaticale già in corso...');
        return;
    }
    
    const textEditor = document.getElementById('text-editor');
    const text = textEditor.value.trim();
    
    if (!text) {
        showMessage('Inserisci del testo prima di controllare la grammatica', 'error');
        return;
    }
    
    isCheckingGrammar = true;
    showLoading(true);
    
    try {
        console.log('Controllo grammaticale in corso...');
        
        const response = await fetch('/api/check-grammar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error('Errore nel controllo grammaticale');
        }
        
        const result = await response.json();
        
        // Display suggestions
        displaySuggestions(result.suggestions);
        
        // Update stats
        updateStats();
        
        const suggestionCount = result.suggestions.length;
        if (suggestionCount > 0) {
            showMessage(`Trovati ${suggestionCount} suggerimenti per migliorare il testo`, 'success');
        } else {
            showMessage('Ottimo! Non sono stati trovati errori nel testo', 'success');
        }
        
    } catch (error) {
        console.error('Errore nel controllo grammaticale:', error);
        showMessage('Errore durante il controllo del testo', 'error');
    } finally {
        isCheckingGrammar = false;
        showLoading(false);
    }
}

/**
 * Display grammar suggestions
 */
function displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestions-list');
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsList.innerHTML = '<div class="no-suggestions">Nessun suggerimento disponibile</div>';
        return;
    }
    
    suggestionsList.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const suggestionElement = createSuggestionElement(suggestion, index);
        suggestionsList.appendChild(suggestionElement);
    });
}

/**
 * Create a suggestion element
 */
function createSuggestionElement(suggestion, index) {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `
        <div class="suggestion-type">${suggestion.type === 'spelling' ? 'Ortografia' : 'Formalità'}</div>
        <div class="suggestion-text">
            <strong>"${suggestion.original}"</strong> → <strong>"${suggestion.suggestion}"</strong>
        </div>
        <div class="suggestion-explanation">${suggestion.explanation}</div>
        <button class="btn btn-small" onclick="applySuggestion(${index}, '${suggestion.original}', '${suggestion.suggestion}')" style="margin-top: 10px;">
            ✓ Applica correzione
        </button>
    `;
    return div;
}

/**
 * Apply a suggestion to the text
 */
function applySuggestion(index, original, suggestion) {
    const textEditor = document.getElementById('text-editor');
    const text = textEditor.value;
    
    // Replace first occurrence of the original text with the suggestion
    const regex = new RegExp(escapeRegExp(original), 'i');
    const newText = text.replace(regex, suggestion);
    
    if (newText !== text) {
        textEditor.value = newText;
        updateStats();
        showMessage('Correzione applicata con successo', 'success');
        
        // Remove the applied suggestion from the list
        const suggestionElement = document.querySelector(`.suggestion-item:nth-child(${index + 1})`);
        if (suggestionElement) {
            suggestionElement.style.opacity = '0.5';
            suggestionElement.style.pointerEvents = 'none';
            
            const button = suggestionElement.querySelector('button');
            if (button) {
                button.textContent = '✓ Applicata';
                button.disabled = true;
            }
        }
    } else {
        showMessage('Impossibile applicare la correzione automaticamente', 'error');
    }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clear suggestions
 */
function clearSuggestions() {
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '<div class="no-suggestions">Seleziona un template o scrivi del testo, poi clicca "Controlla Testo" per ricevere suggerimenti</div>';
}

/**
 * Save document
 */
async function saveDocument() {
    const title = document.getElementById('document-title').value || 'Documento senza titolo';
    const content = document.getElementById('text-editor').value;
    
    if (!content.trim()) {
        showMessage('Non è possibile salvare un documento vuoto', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/save-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                content: content,
                template: currentTemplate || 'custom'
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nel salvataggio del documento');
        }
        
        const result = await response.json();
        showMessage(`Documento "${title}" salvato con successo`, 'success');
        console.log('Documento salvato con ID:', result.document_id);
        
    } catch (error) {
        console.error('Errore nel salvataggio:', error);
        showMessage('Errore durante il salvataggio del documento', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Export document as PDF
 */
async function exportPDF() {
    const title = document.getElementById('document-title').value || 'Documento';
    const content = document.getElementById('text-editor').value;
    
    if (!content.trim()) {
        showMessage('Non è possibile esportare un documento vuoto', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/export-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'esportazione PDF');
        }
        
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showMessage(`PDF "${title}" esportato con successo`, 'success');
        
    } catch (error) {
        console.error('Errore nell\'esportazione PDF:', error);
        showMessage('Errore durante l\'esportazione del PDF', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Clear text editor
 */
function clearText() {
    if (confirm('Sei sicuro di voler cancellare tutto il testo?')) {
        document.getElementById('text-editor').value = '';
        document.getElementById('document-title').value = '';
        currentTemplate = null;
        updateStats();
        clearSuggestions();
        showMessage('Testo cancellato', 'success');
    }
}

/**
 * Update word and character count
 */
function updateStats() {
    const textEditor = document.getElementById('text-editor');
    const text = textEditor.value;
    
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;
    
    document.getElementById('word-count').textContent = `${wordCount} parole`;
    document.getElementById('char-count').textContent = `${charCount} caratteri`;
}

/**
 * Load user dictionary
 */
async function loadUserDictionary() {
    try {
        const response = await fetch('/api/user-dictionary');
        
        if (response.ok) {
            userDictionary = await response.json();
            displayUserDictionary();
        }
    } catch (error) {
        console.error('Errore nel caricamento del dizionario utente:', error);
    }
}

/**
 * Add word/phrase to user dictionary
 */
async function addToDictionary() {
    const newWordInput = document.getElementById('new-word');
    const wordTypeSelect = document.getElementById('word-type');
    
    const entry = newWordInput.value.trim();
    const type = wordTypeSelect.value;
    
    if (!entry) {
        showMessage('Inserisci una parola o frase da aggiungere', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/user-dictionary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                entry: entry,
                type: type
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'aggiunta al dizionario');
        }
        
        const result = await response.json();
        userDictionary = result.dictionary;
        
        // Clear input and update display
        newWordInput.value = '';
        displayUserDictionary();
        
        showMessage(`"${entry}" aggiunto al dizionario personale`, 'success');
        
    } catch (error) {
        console.error('Errore nell\'aggiunta al dizionario:', error);
        showMessage('Errore durante l\'aggiunta al dizionario', 'error');
    }
}

/**
 * Display user dictionary
 */
function displayUserDictionary() {
    const wordsContainer = document.getElementById('user-words');
    const phrasesContainer = document.getElementById('user-phrases');
    
    // Display words
    wordsContainer.innerHTML = '';
    if (userDictionary.words && userDictionary.words.length > 0) {
        userDictionary.words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            wordsContainer.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Nessuna parola salvata';
        li.style.fontStyle = 'italic';
        li.style.opacity = '0.6';
        wordsContainer.appendChild(li);
    }
    
    // Display phrases
    phrasesContainer.innerHTML = '';
    if (userDictionary.phrases && userDictionary.phrases.length > 0) {
        userDictionary.phrases.forEach(phrase => {
            const li = document.createElement('li');
            li.textContent = phrase;
            phrasesContainer.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Nessuna frase salvata';
        li.style.fontStyle = 'italic';
        li.style.opacity = '0.6';
        phrasesContainer.appendChild(li);
    }
}

/**
 * Show loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

/**
 * Show message to user
 */
function showMessage(text, type = 'success') {
    const messageId = type === 'success' ? 'success-message' : 'error-message';
    const textId = type === 'success' ? 'success-text' : 'error-text';
    
    const messageElement = document.getElementById(messageId);
    const textElement = document.getElementById(textId);
    
    textElement.textContent = text;
    messageElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideMessage(messageId);
    }, 5000);
}

/**
 * Hide message
 */
function hideMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    messageElement.classList.remove('show');
}

/**
 * Handle Enter key in new word input
 */
document.addEventListener('keydown', function(e) {
    if (e.target.id === 'new-word' && e.key === 'Enter') {
        e.preventDefault();
        addToDictionary();
    }
});

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    // ESC key to close overlays
    if (e.key === 'Escape') {
        showLoading(false);
        hideMessage('success-message');
        hideMessage('error-message');
    }
});

// Auto-save functionality (optional)
let autoSaveTimer;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        const content = document.getElementById('text-editor').value;
        if (content.trim()) {
            console.log('Auto-salvataggio...');
            // Could implement auto-save here
        }
    }, 30000); // Auto-save every 30 seconds
}

// Schedule auto-save on text change
document.getElementById('text-editor')?.addEventListener('input', scheduleAutoSave);

console.log('Facilescrivere.it JavaScript caricato completamente');