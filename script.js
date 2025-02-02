let currentNote = null;
let autoSaveTimer = null;
let noteToDelete = null;
console.log('ntepd.com | github.com/ntepd | v-1.0.0');
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
    setupMarkdownPreview();
    createNewNote();
    loadThemePreference();
});

function setupEventListeners() {
    document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
    document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);
    
    const mobileMenuTrigger = document.querySelector('.mobile-menu-trigger');
    
    document.querySelector('.sidebar-backdrop').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('mobile-open');
        document.querySelector('.sidebar-backdrop').style.display = 'none';
    });

    mobileMenuTrigger.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        sidebar.classList.toggle('mobile-open');
        backdrop.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    });
    
    const editor = document.getElementById('editor');
    const previewDiv = document.createElement('div');
    previewDiv.className = 'markdown-preview';
    editor.parentNode.appendChild(previewDiv);

    editor.addEventListener('input', () => {
        updatePreview();
        updatePlaceholder();
        startAutoSave();
    });

    document.getElementById('titleInput').addEventListener('input', () => {
        startAutoSave();
    });

    editor.addEventListener('focus', () => {
        previewDiv.classList.remove('active');
        if (editor.textContent === getPlaceholderText()) {
            editor.textContent = '';
        }
    });

    editor.addEventListener('blur', () => {
        if (!editor.textContent.trim()) {
            editor.textContent = getPlaceholderText();
            previewDiv.innerHTML = marked.parse(getPlaceholderText());
        }
        previewDiv.classList.add('active');
    });

    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
    });
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (!sidebar.contains(e.target) && 
                !mobileMenuTrigger.contains(e.target) && 
                sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                backdrop.style.display = 'none';
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar').classList.remove('mobile-open');
            document.querySelector('.sidebar-backdrop').style.display = 'none';
        }
    });
}

function loadThemePreference() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

function startAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(() => {
        saveNote();
    }, 10000);
}

function getPlaceholderText() {
    return 'Start typing your note... (You can use markdown in this editor) | Changes here are stored as cookies, so if you clear your cookies, you will lose your notes.';
}

function updatePlaceholder() {
    const editor = document.getElementById('editor');
    if (!editor.textContent.trim() && document.activeElement !== editor) {
        editor.textContent = getPlaceholderText();
    }
}

function setupMarkdownPreview() {
    const editor = document.getElementById('editor');
    const previewDiv = document.querySelector('.markdown-preview');

    if (!previewDiv) {
        console.error('Preview div not found');
        return;
    }

    updatePreview();
    editor.addEventListener('input', updatePreview);
}

function updatePreview() {
    const editor = document.getElementById('editor');
    const previewDiv = document.querySelector('.markdown-preview');
    const content = editor.textContent;
    if (!content.trim()) {
        previewDiv.innerHTML = marked.parse(getPlaceholderText());
    } else {
        previewDiv.innerHTML = marked.parse(content);
    }
}

function showDeleteModal(note) {
    noteToDelete = note;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'block';
}

function hideDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'none';
    noteToDelete = null;
}

function confirmDelete() {
    if (noteToDelete) {
        deleteNote(noteToDelete.id);
        hideDeleteModal();
    }
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesList.appendChild(noteElement);
    });
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.innerHTML = `
        <span>${note.title || 'Untitled Note'}</span>
        <button class="delete-btn">Delete</button>
    `;
    
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteModal(note);
    });
    
    div.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
            selectNote(note);
        }
    });
    return div;
}

function createNewNote() {
    currentNote = null;
    document.getElementById('editor').textContent = getPlaceholderText();
    document.getElementById('titleInput').value = '';
    updatePreview();
}

function selectNote(note) {
    currentNote = note;
    document.getElementById('titleInput').value = note.title;
    document.getElementById('editor').textContent = note.content || '';
    updatePreview();
}

function saveNote() {
    const titleInput = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('editor').textContent;

    if (!content || content === getPlaceholderText()) {
        return;
    }

    const title = titleInput || "Untitled Note";
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');

    if (currentNote) {
        const index = notes.findIndex(n => n.id === currentNote.id);
        if (index !== -1) {
            notes[index] = { ...currentNote, title, content };
        }
    } else {
        const newNote = {
            id: Date.now(),
            title,
            content,
            created: new Date().toISOString()
        };
        notes.push(newNote);
        currentNote = newNote;
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

function deleteNote(id) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const filteredNotes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(filteredNotes));
    loadNotes();
    if (currentNote && currentNote.id === id) {
        createNewNote();
    }
}