from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import datetime
from pathlib import Path
import re
from werkzeug.utils import secure_filename
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'facilescrivere-secret-key-2024'
app.config['UPLOAD_FOLDER'] = 'user_documents'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class GrammarChecker:
    """Simple grammar and spell checker"""
    
    def __init__(self):
        # Common Italian errors and corrections
        self.corrections = {
            'qual è': 'qual è',  # common apostrophe error
            'qualè': 'qual è',
            'qualcosè': 'qualcos\'è',
            'perchè': 'perché',
            'perché': 'perché',
            'però': 'però',
            'città': 'città',
            'università': 'università',
            'felicità': 'felicità',
            'attività': 'attività',
            'società': 'società'
        }
        
        # Formal language suggestions
        self.formal_suggestions = {
            'ciao': 'saluti',
            'hey': 'gentile signore/signora',
            'ok': 'd\'accordo',
            'grazie mille': 'la ringrazio sentitamente',
            'ti scrivo': 'le scrivo',
            'puoi': 'può',
            'vuoi': 'desidera'
        }
    
    def check_text(self, text):
        """Check text for errors and return suggestions"""
        suggestions = []
        words = text.lower().split()
        
        for i, word in enumerate(words):
            # Remove punctuation for checking
            clean_word = re.sub(r'[^\w\']', '', word)
            
            # Check for corrections
            if clean_word in self.corrections:
                suggestions.append({
                    'type': 'spelling',
                    'original': word,
                    'suggestion': self.corrections[clean_word],
                    'position': i,
                    'explanation': f'Correzione ortografica suggerita'
                })
            
            # Check for formal language
            if clean_word in self.formal_suggestions:
                suggestions.append({
                    'type': 'formality',
                    'original': word,
                    'suggestion': self.formal_suggestions[clean_word],
                    'position': i,
                    'explanation': f'Suggerimento per linguaggio più formale'
                })
        
        return suggestions

# Initialize grammar checker
grammar_checker = GrammarChecker()

# Document templates
DOCUMENT_TEMPLATES = {
    'lettera_contestazione': {
        'name': 'Lettera di Contestazione',
        'template': '''Spett.le [Nome Azienda/Ente],

Oggetto: Contestazione [specificare il motivo]

Io sottoscritto/a [Nome e Cognome], nato/a a [Luogo] il [Data], residente in [Indirizzo completo], con la presente intendo contestare [specificare dettagliatamente il problema].

I fatti si sono svolti nel seguente modo: [descrivere i fatti cronologicamente].

Ritengo che [esporre le proprie ragioni e il diritto che si ritiene violato].

Pertanto, chiedo [specificare ciò che si richiede: rimborso, sostituzione, riparazione, etc.].

In attesa di un Vostro cortese riscontro, porgo distinti saluti.

[Luogo e data]
[Firma]''',
        'icon': '⚖️'
    },
    'email_formale': {
        'name': 'Email Formale',
        'template': '''Oggetto: [Specificare l'oggetto della comunicazione]

Gentile [Signore/Signora/Dottore] [Cognome],

La presente per [specificare il motivo della comunicazione].

[Corpo del messaggio - esporre chiaramente la richiesta o l'informazione]

In attesa di una Sua cortese risposta, La ringrazio per l'attenzione.

Distinti saluti,

[Nome e Cognome]
[Telefono]
[Email]''',
        'icon': '📧'
    },
    'lettera_auguri': {
        'name': 'Lettera di Auguri',
        'template': '''Caro/a [Nome],

In occasione di [specificare l'occasione: compleanno, matrimonio, laurea, etc.], desidero porgerti i miei più sinceri auguri.

[Aggiungere un messaggio personale e affettuoso]

Ti auguro ogni bene e tanta felicità.

Con affetto,
[Il tuo nome]

[Data]''',
        'icon': '🎉'
    },
    'richiesta_informazioni': {
        'name': 'Richiesta Informazioni',
        'template': '''Spett.le [Nome Azienda/Ufficio],

Oggetto: Richiesta informazioni riguardo [specificare l'argomento]

Io sottoscritto/a [Nome e Cognome], vorrei ricevere informazioni dettagliate riguardo [specificare l'oggetto della richiesta].

In particolare, mi interesserebbe sapere:
- [Prima domanda]
- [Seconda domanda]
- [Terza domanda]

Vi sarei grato/a se poteste fornirmi tutte le informazioni necessarie e i documenti eventualmente richiesti.

Resto in attesa di una Vostra cortese risposta.

Distinti saluti,

[Nome e Cognome]
[Telefono]
[Email]
[Data]''',
        'icon': 'ℹ️'
    },
    'curriculum_semplice': {
        'name': 'Curriculum Vitae Semplice',
        'template': '''CURRICULUM VITAE

INFORMAZIONI PERSONALI
Nome e Cognome: [Inserire nome e cognome]
Data di nascita: [gg/mm/aaaa]
Luogo di nascita: [Inserire città]
Residenza: [Inserire indirizzo completo]
Telefono: [Inserire numero]
Email: [Inserire email]

ISTRUZIONE
[Anno] - [Titolo di studio] presso [Nome istituto/università]

ESPERIENZA LAVORATIVA
[Periodo] - [Ruolo] presso [Nome azienda]
Principali mansioni: [Descrivere brevemente le attività svolte]

COMPETENZE
- [Competenza 1]
- [Competenza 2]
- [Competenza 3]

LINGUE STRANIERE
- [Lingua]: [Livello]

Autorizzo il trattamento dei miei dati personali ai sensi del Decreto Legislativo 30 giugno 2003, n. 196 e del GDPR (Regolamento UE 2016/679).

[Luogo e data]
[Firma]''',
        'icon': '📄'
    },
    'condoglianze': {
        'name': 'Messaggio di Condoglianze',
        'template': '''Cara/o [Nome] e famiglia,

Ho appreso con grande dispiacere della scomparsa di [Nome del defunto].

[Aggiungere un ricordo personale o parole di conforto]

Vi sono vicino/a in questo momento di dolore e vi porgo le mie più sentite condoglianze.

Con affetto e partecipazione,

[Il tuo nome]
[Data]''',
        'icon': '🕊️'
    }
}

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', templates=DOCUMENT_TEMPLATES)

@app.route('/api/check-grammar', methods=['POST'])
def check_grammar():
    """Check grammar and provide suggestions"""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    suggestions = grammar_checker.check_text(text)
    
    return jsonify({
        'suggestions': suggestions,
        'word_count': len(text.split()),
        'character_count': len(text)
    })

@app.route('/api/templates')
def get_templates():
    """Get available document templates"""
    return jsonify(DOCUMENT_TEMPLATES)

@app.route('/api/templates/<template_id>')
def get_template(template_id):
    """Get specific template"""
    if template_id not in DOCUMENT_TEMPLATES:
        return jsonify({'error': 'Template not found'}), 404
    
    return jsonify(DOCUMENT_TEMPLATES[template_id])

@app.route('/api/save-document', methods=['POST'])
def save_document():
    """Save user document"""
    data = request.get_json()
    title = data.get('title', 'Documento senza titolo')
    content = data.get('content', '')
    template_used = data.get('template', 'custom')
    
    # Create document record
    document = {
        'id': datetime.datetime.now().strftime('%Y%m%d_%H%M%S'),
        'title': title,
        'content': content,
        'template_used': template_used,
        'created_at': datetime.datetime.now().isoformat(),
        'word_count': len(content.split()),
        'character_count': len(content)
    }
    
    # Save to file (in production, use a proper database)
    filename = f"document_{document['id']}.json"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(document, f, ensure_ascii=False, indent=2)
    
    return jsonify({'success': True, 'document_id': document['id']})

@app.route('/api/export-pdf', methods=['POST'])
def export_pdf():
    """Export document as PDF"""
    data = request.get_json()
    title = data.get('title', 'Documento')
    content = data.get('content', '')
    
    # Create PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, title)
    
    # Add content (simple text wrapping)
    p.setFont("Helvetica", 12)
    lines = content.split('\n')
    y_position = 720
    
    for line in lines:
        if y_position < 50:  # New page if needed
            p.showPage()
            y_position = 750
        
        # Simple line wrapping
        if len(line) > 80:
            words = line.split(' ')
            current_line = ''
            for word in words:
                if len(current_line + word) < 80:
                    current_line += word + ' '
                else:
                    p.drawString(50, y_position, current_line.strip())
                    y_position -= 15
                    current_line = word + ' '
            if current_line:
                p.drawString(50, y_position, current_line.strip())
                y_position -= 15
        else:
            p.drawString(50, y_position, line)
            y_position -= 15
    
    p.save()
    
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{title}.pdf",
        mimetype='application/pdf'
    )

@app.route('/api/user-dictionary', methods=['GET', 'POST'])
def user_dictionary():
    """Manage user's personal dictionary"""
    dict_file = os.path.join(app.config['UPLOAD_FOLDER'], 'user_dictionary.json')
    
    if request.method == 'GET':
        # Load existing dictionary
        if os.path.exists(dict_file):
            with open(dict_file, 'r', encoding='utf-8') as f:
                dictionary = json.load(f)
        else:
            dictionary = {'words': [], 'phrases': []}
        
        return jsonify(dictionary)
    
    elif request.method == 'POST':
        # Add new word/phrase to dictionary
        data = request.get_json()
        word_type = data.get('type', 'words')  # 'words' or 'phrases'
        entry = data.get('entry', '')
        
        if not entry:
            return jsonify({'error': 'No entry provided'}), 400
        
        # Load existing dictionary
        if os.path.exists(dict_file):
            with open(dict_file, 'r', encoding='utf-8') as f:
                dictionary = json.load(f)
        else:
            dictionary = {'words': [], 'phrases': []}
        
        # Add entry if not exists
        if entry not in dictionary[word_type]:
            dictionary[word_type].append(entry)
            
            # Save updated dictionary
            with open(dict_file, 'w', encoding='utf-8') as f:
                json.dump(dictionary, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'dictionary': dictionary})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)