// ============ CONFIGURATION ============
const API_URL = localStorage.getItem('alvacoa_api_url') || 'https://alvacoa-api.onrender.com/chat';
let useAPI = false;
let selectedModel = localStorage.getItem('alvacoa_default_model') || 'gemini';
let pendingFiles = [];
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let chatHistory = JSON.parse(localStorage.getItem('alvacoa_chat_history') || '[]');
let currentSession = [];

// ============ CONNAISSANCES (importées depuis modules.js) ============
// knowledgeBase est défini dans modules.js

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

function saveKnowledge() {
    localStorage.setItem('alvacoa_knowledge', JSON.stringify(knowledgeBase));
}

function saveHistory() {
    localStorage.setItem('alvacoa_chat_history', JSON.stringify(chatHistory));
}

// ============ AFFICHAGE MESSAGES ============
function addMessage(type, content, source = 'local', attachment = null) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    
    let attachmentHTML = '';
    if (attachment) {
        if (attachment.type === 'image') {
            attachmentHTML = `<img src="${attachment.url}" alt="Image" loading="lazy" onclick="window.open('${attachment.url}')">`;
        } else if (attachment.type === 'video') {
            attachmentHTML = `<video src="${attachment.url}" controls></video>`;
        } else if (attachment.type === 'file') {
            attachmentHTML = `<div class="file-attachment">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                ${attachment.name || 'Fichier'}
            </div>`;
        }
    }

    const badge = type === 'assistant' ? 
        `<span class="badge ${source}">${source.toUpperCase()}</span>` : '';
    
    div.innerHTML = `
        <div class="msg-avatar">${type === 'user' ? '👤' : 'A'}</div>
        <div class="msg-bubble">${attachmentHTML}${content}${badge}</div>
    `;
    
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Sauvegarder dans l'historique de session
    currentSession.push({ type, content, source, timestamp: Date.now() });
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="msg-avatar">A</div>
        <div class="msg-bubble">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// ============ API ============
async function getAPIResponse(message, attachmentInfo = null) {
    try {
        let msgToSend = message;
        if (attachmentInfo) {
            msgToSend = `[Fichier joint: ${attachmentInfo.type} - ${attachmentInfo.name || 'sans nom'}]\n${message}`;
        }

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msgToSend, model: selectedModel })
        });
        const data = await res.json();
        return data.content || 'Pas de réponse API.';
    } catch(e) {
        return `Erreur API: ${e.message}`;
    }
}

// ============ ENVOI MESSAGE ============
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text && pendingFiles.length === 0) return;

    let attachment = null;
    if (pendingFiles.length > 0) {
        const file = pendingFiles[0];
        if (file.type.startsWith('image/')) {
            attachment = { type: 'image', url: file.url, name: file.name };
        } else if (file.type.startsWith('video/')) {
            attachment = { type: 'video', url: file.url, name: file.name };
        } else {
            attachment = { type: 'file', url: file.url, name: file.name };
        }
    }

    const displayText = text || (attachment ? 'Fichier joint' : '');
    addMessage('user', displayText, 'local', attachment);
    
    chatInput.value = '';
    pendingFiles = [];
    document.getElementById('previewGrid').innerHTML = '';
    chatInput.style.height = 'auto';

    showTyping();

    let response, source = 'local';

    if (useAPI) {
        response = await getAPIResponse(text, attachment);
        source = selectedModel;
    } else {
        response = getLocalResponse(text);
        if (!response) {
            response = "Je ne trouve pas la réponse. Activez l'API ou apprenez-moi !";
        }
    }

    setTimeout(() => {
        removeTyping();
        addMessage('assistant', response, source);
        
        // Sauvegarder la session dans l'historique
        if (currentSession.length >= 2) {
            chatHistory.push({
                id: Date.now(),
                date: new Date().toLocaleString('fr-FR'),
                preview: text.substring(0, 50),
                messages: [...currentSession]
            });
            // Garder les 50 dernières sessions
            if (chatHistory.length > 50) chatHistory.shift();
            saveHistory();
        }
    }, 400);
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ============ UPLOAD ============
function openUploadMenu() {
    document.getElementById('uploadModal').classList.add('active');
    updatePreviewGrid();
}

function closeUploadMenu() {
    document.getElementById('uploadModal').classList.remove('active');
}

function triggerFileInput(accept) {
    const input = document.getElementById('fileInput');
    input.accept = accept;
    input.click();
}

function triggerCamera() {
    document.getElementById('cameraInput').click();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    for (let file of files) {
        const url = URL.createObjectURL(file);
        pendingFiles.push({ name: file.name, type: file.type, size: file.size, url, file });
    }
    updatePreviewGrid();
    event.target.value = '';
}

function updatePreviewGrid() {
    const grid = document.getElementById('previewGrid');
    grid.innerHTML = pendingFiles.map((file, index) => {
        let preview = '';
        if (file.type.startsWith('image/')) preview = `<img src="${file.url}" alt="${file.name}">`;
        else if (file.type.startsWith('video/')) preview = `<video src="${file.url}"></video>`;
        else preview = `<span style="font-size:20px;">📄</span>`;
        return `<div class="preview-item">${preview}<div class="remove-btn" onclick="removeFile(${index})">✕</div></div>`;
    }).join('');
}

function removeFile(index) {
    URL.revokeObjectURL(pendingFiles[index].url);
    pendingFiles.splice(index, 1);
    updatePreviewGrid();
}

function confirmUpload() {
    closeUploadMenu();
    if (pendingFiles.length > 0 || chatInput.value.trim()) {
        sendMessage();
    }
}

// ============ MICRO ============
async function toggleMicrophone() {
    const micBtn = document.getElementById('micBtn');
    const audioBars = document.getElementById('audioBars');
    
    if (isRecording) {
        stopRecording();
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            audioBars.classList.remove('active');
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Transcription simulée (à remplacer par une vraie API de transcription)
            const transcribedText = await transcribeAudio(audioBlob);
            chatInput.value = transcribedText || '';
            chatInput.focus();
            
            addMessage('assistant', transcribedText ? 
                'Transcription terminée. Appuyez sur Envoyer.' : 
                'Audio enregistré. Transcription non disponible.', 'local');
        };

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        audioBars.classList.add('active');

    } catch (error) {
        addMessage('assistant', `Erreur micro: ${error.message}`, 'local');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('micBtn').classList.remove('recording');
    }
}

async function transcribeAudio(audioBlob) {
    // Simulation - À remplacer par l'API Web Speech ou une API externe
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(''); // Retourne vide pour l'instant
        }, 500);
    });
}

// ============ SIDEBAR ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// ============ PARAMÈTRES ============
function openSettings() {
    toggleSidebar();
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('knowledgeCount').textContent = Object.keys(knowledgeBase).length;
    document.getElementById('apiUrlSetting').value = API_URL;
    document.getElementById('defaultModelSelect').value = selectedModel;
    document.getElementById('themeSelect').value = document.body.classList.contains('light-theme') ? 'light' : 'dark';
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    API_URL = document.getElementById('apiUrlSetting').value;
    selectedModel = document.getElementById('defaultModelSelect').value;
    localStorage.setItem('alvacoa_api_url', API_URL);
    localStorage.setItem('alvacoa_default_model', selectedModel);
    document.getElementById('modelSelect').value = selectedModel;
    closeSettings();
    addMessage('assistant', 'Paramètres sauvegardés !', 'local');
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('alvacoa_theme', theme);
}

function changeFontSize() {
    const size = document.getElementById('fontSizeSelect').value;
    const sizes = { small: '13px', medium: '14px', large: '16px' };
    document.documentElement.style.setProperty('--font-size', sizes[size]);
    localStorage.setItem('alvacoa_font_size', size);
}

function clearAllData() {
    if (confirm('Effacer TOUTES les données ? Cette action est irréversible.')) {
        localStorage.clear();
        knowledgeBase = {};
        chatHistory = [];
        currentSession = [];
        chatMessages.innerHTML = '';
        saveKnowledge();
        saveHistory();
        addMessage('assistant', 'Toutes les données ont été effacées.', 'local');
        closeSettings();
    }
}

// ============ HISTORIQUE ============
function openHistory() {
    toggleSidebar();
    document.getElementById('historyModal').classList.add('active');
    const list = document.getElementById('historyList');
    
    if (chatHistory.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Aucun historique</p>';
    } else {
        list.innerHTML = chatHistory.slice().reverse().map(h => `
            <div class="history-item" onclick="loadHistory('${h.id}')">
                <div>${h.preview}</div>
                <div class="history-date">${h.date}</div>
            </div>
        `).join('');
    }
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('active');
}

function loadHistory(id) {
    const session = chatHistory.find(h => h.id == id);
    if (session) {
        chatMessages.innerHTML = '';
        currentSession = [];
        session.messages.forEach(msg => {
            addMessage(msg.type, msg.content, msg.source);
        });
        closeHistory();
    }
}

// ============ À PROPOS ============
function openAbout() {
    toggleSidebar();
    document.getElementById('aboutModal').classList.add('active');
}

function closeAbout() {
    document.getElementById('aboutModal').classList.remove('active');
}

function exportData() {
    toggleSidebar();
    const data = {
        knowledge: knowledgeBase,
        history: chatHistory,
        settings: {
            apiUrl: API_URL,
            model: selectedModel,
            theme: document.body.classList.contains('light-theme') ? 'light' : 'dark'
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alvacoa_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    addMessage('assistant', 'Données exportées avec succès !', 'local');
}

// ============ MODE API ============
function toggleAPIMode() {
    useAPI = !useAPI;
    const btn = document.getElementById('apiToggleBtn');
    const display = document.getElementById('modeDisplay');
    
    if (useAPI) {
        btn.classList.add('active');
        display.textContent = `API: ${selectedModel}`;
        addMessage('assistant', `API activée avec ${selectedModel} !`, selectedModel);
    } else {
        btn.classList.remove('active');
        display.textContent = 'Mode Local';
        addMessage('assistant', 'Mode Local activé.', 'local');
    }
}

function changeModel() {
    selectedModel = document.getElementById('modelSelect').value;
    if (useAPI) {
        document.getElementById('modeDisplay').textContent = `API: ${selectedModel}`;
    }
}

// ============ APPRENTISSAGE ============
function openTrainModal() {
    document.getElementById('trainModal').classList.add('active');
    document.getElementById('trainQuestion').focus();
}

function closeTrainModal() {
    document.getElementById('trainModal').classList.remove('active');
}

function trainAI() {
    const question = document.getElementById('trainQuestion').value.trim().toLowerCase();
    const answer = document.getElementById('trainAnswer').value.trim();
    if (!question || !answer) return;
    
    knowledgeBase[question] = answer;
    saveKnowledge();
    addMessage('assistant', `Appris: "${question}" (${Object.keys(knowledgeBase).length} connaissances)`, 'local');
    
    document.getElementById('trainQuestion').value = '';
    document.getElementById('trainAnswer').value = '';
    closeTrainModal();
}

// ============ INITIALISATION ============
function init() {
    // Restaurer le thème
    const savedTheme = localStorage.getItem('alvacoa_theme') || 'dark';
    document.body.classList.toggle('light-theme', savedTheme === 'light');
    
    // Restaurer la taille de police
    const savedFontSize = localStorage.getItem('alvacoa_font_size') || 'medium';
    const sizes = { small: '13px', medium: '14px', large: '16px' };
    document.documentElement.style.setProperty('--font-size', sizes[savedFontSize]);
    
    // Restaurer le modèle
    selectedModel = localStorage.getItem('alvacoa_default_model') || 'gemini';
    document.getElementById('modelSelect').value = selectedModel;
    
    setTimeout(() => {
        addMessage('assistant', `
            <strong>ALVACOA v3.0</strong><br>
            Menu • API • Micro • Upload • Apprentissage<br>
            <em>${Object.keys(knowledgeBase).length} connaissances chargées</em>
        `, 'local');
    }, 400);
    
    chatInput.focus();
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
}

init();
