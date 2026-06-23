const API_URL = localStorage.getItem('alvacoa_api_url') || 'https://alvacoa-api.onrender.com/chat';
let useAPI = false;
let selectedModel = localStorage.getItem('alvacoa_default_model') || 'mistral-small';
let pendingFiles = [];
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let chatHistory = JSON.parse(localStorage.getItem('alvacoa_chat_history') || '[]');
let currentSession = [];
let currentTab = 'alvacoa';
let linkchatContacts = JSON.parse(localStorage.getItem('alvacoa_contacts') || '[]');
let activeContact = null;
let username = localStorage.getItem('alvacoa_username') || 'Moi';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

function saveKnowledge() { localStorage.setItem('alvacoa_knowledge', JSON.stringify(knowledgeBase)); }
function saveHistory() { localStorage.setItem('alvacoa_chat_history', JSON.stringify(chatHistory)); }
function saveContacts() { localStorage.setItem('alvacoa_contacts', JSON.stringify(linkchatContacts)); }

// PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('✅ SW enregistré');
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        document.getElementById('updateBanner').style.display = 'flex';
                    }
                });
            });
        }).catch(e => console.error('❌ SW:', e));
    });
}
function updateApp() { navigator.serviceWorker.ready.then(reg => { reg.waiting?.postMessage({ type: 'SKIP_WAITING' }); }); window.location.reload(); }
function clearPWACache() { if (navigator.serviceWorker.controller) { navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' }); addMessage('assistant', '🧹 Cache vidé !', 'local'); } }

// Icône PWA
function setupPWAIcon() {
    const icon512 = localStorage.getItem('alvacoa_icon_512');
    const icon192 = localStorage.getItem('alvacoa_icon_192');
    if (icon512 && icon192) {
        updateIconLink('icon', '512x512', icon512);
        updateIconLink('icon', '192x192', icon192);
        updateIconLink('apple-touch-icon', '192x192', icon192);
        updateManifestIcons(icon192, icon512);
    }
}
function updateIconLink(rel, sizes, href) {
    let link = document.querySelector(`link[rel="${rel}"][sizes="${sizes}"]`);
    if (!link) { link = document.createElement('link'); link.rel = rel; link.sizes = sizes; link.type = 'image/png'; document.head.appendChild(link); }
    link.href = href;
}
function updateManifestIcons(icon192, icon512) {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        manifestLink.href = 'data:application/json,' + encodeURIComponent(JSON.stringify({
            name: "ALVACOA", short_name: "ALVACOA", start_url: "/", display: "standalone",
            background_color: "#0a0a1a", theme_color: "#6366f1",
            icons: [
                { src: icon192, sizes: "192x192", type: "image/png", purpose: "any maskable" },
                { src: icon512, sizes: "512x512", type: "image/png", purpose: "any maskable" }
            ]
        }));
    }
}
function generatePWAIcon() {
    const canvas = document.getElementById('iconCanvas'); const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#6366f1'); gradient.addColorStop(0.5, '#a855f7'); gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(384, 0); ctx.quadraticCurveTo(512, 0, 512, 128); ctx.lineTo(512, 384); ctx.quadraticCurveTo(512, 512, 384, 512); ctx.lineTo(128, 512); ctx.quadraticCurveTo(0, 512, 0, 384); ctx.lineTo(0, 128); ctx.quadraticCurveTo(0, 0, 128, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 280px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', 256, 280);
    const icon512 = canvas.toDataURL('image/png');
    const canvas192 = document.createElement('canvas'); canvas192.width = 192; canvas192.height = 192; const ctx192 = canvas192.getContext('2d');
    const img = new Image();
    img.onload = function() { ctx192.drawImage(img, 0, 0, 192, 192); const icon192 = canvas192.toDataURL('image/png'); localStorage.setItem('alvacoa_icon_512', icon512); localStorage.setItem('alvacoa_icon_192', icon192); updateIconLink('icon', '512x512', icon512); updateIconLink('icon', '192x192', icon192); updateIconLink('apple-touch-icon', '192x192', icon192); updateManifestIcons(icon192, icon512); }
    img.src = icon512;
}
function downloadFile(dataUrl, filename) { const link = document.createElement('a'); link.download = filename; link.href = dataUrl; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
function regenerateIcons() { localStorage.removeItem('alvacoa_icon_512'); localStorage.removeItem('alvacoa_icon_192'); generatePWAIcon(); }

// Switch Tab
function switchTab(tab) {
    currentTab = tab;
    document.getElementById('pillAlvacoa').classList.toggle('active', tab === 'alvacoa');
    document.getElementById('pillLinkchat').classList.toggle('active', tab === 'linkchat');
    document.getElementById('modelSelect').style.display = tab === 'alvacoa' ? '' : 'none';
    document.getElementById('apiToggleBtn').style.display = tab === 'alvacoa' ? '' : 'none';
    if (tab === 'alvacoa') { document.getElementById('headerTitle').textContent = 'ALVACOA'; document.getElementById('headerStatus').textContent = useAPI ? `API: ${selectedModel}` : 'Assistant IA'; }
    else { document.getElementById('headerTitle').textContent = activeContact ? activeContact.name : 'Linkchat!'; document.getElementById('headerStatus').textContent = activeContact ? 'En ligne' : 'Hors ligne'; }
    loadMessages(); updateSidebarContacts();
}
function loadMessages() {
    chatMessages.innerHTML = '';
    const msgs = currentTab === 'alvacoa' ? currentSession : (activeContact?.messages || []);
    msgs.forEach(msg => { const type = currentTab === 'alvacoa' ? msg.type : (msg.from === 'me' ? 'user' : 'contact'); const sender = currentTab === 'linkchat' && msg.from === 'contact' ? activeContact.name : null; addMessageToDOM(type, msg.content, msg.source || 'local', msg.attachment || null, sender); });
    if (!msgs.length) { chatMessages.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-secondary);text-align:center;padding:20px;"><div style="font-size:34px;opacity:0.06;">A</div><div>Aucun message</div></div>`; }
}
function addMessageToDOM(type, content, source = 'local', attachment = null, senderName = null) {
    const div = document.createElement('div'); div.className = `message ${type}`;
    let attHTML = ''; if (attachment) { if (attachment.type === 'image') attHTML = `<img src="${attachment.url}" loading="lazy">`; else if (attachment.type === 'video') attHTML = `<video src="${attachment.url}" controls></video>`; else attHTML = `<a href="${attachment.url}" download>${attachment.name}</a>`; }
    const badge = (type === 'assistant' || type === 'contact') ? `<span class="badge ${source}">${source.toUpperCase()}</span>` : '';
    const av = type === 'user' ? username[0].toUpperCase() : (senderName ? senderName[0].toUpperCase() : 'A');
    div.innerHTML = `<div class="msg-avatar">${av}</div><div class="msg-bubble">${senderName ? `<strong style="color:var(--accent);font-size:11px;">${senderName}</strong><br>` : ''}${attHTML}${content ? `<div class="msg-text">${content}</div>` : ''}${badge}</div>`;
    chatMessages.appendChild(div); chatMessages.scrollTop = chatMessages.scrollHeight;
}
function addMessage(type, content, source = 'local', attachment = null, senderName = null) {
    addMessageToDOM(type, content, source, attachment, senderName);
    if (currentTab === 'alvacoa') currentSession.push({ type, content, source, attachment, timestamp: Date.now() });
    else if (activeContact) { if (!activeContact.messages) activeContact.messages = []; activeContact.messages.push({ from: type === 'user' ? 'me' : 'contact', content, attachment, timestamp: Date.now() }); }
}
function showTyping() { const d = document.createElement('div'); d.className = 'message assistant'; d.id = 'typingIndicator'; d.innerHTML = '<div class="msg-avatar">A</div><div class="msg-bubble"><div class="msg-text">...</div></div>'; chatMessages.appendChild(d); chatMessages.scrollTop = chatMessages.scrollHeight; }
function removeTyping() { const e = document.getElementById('typingIndicator'); if (e) e.remove(); }

// API
async function getAPIResponse(msg) {
    if (selectedModel === 'alvacoa') return getLocalResponse(msg) || "🤔 Mode ALVACOA local.";
    try { const r = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg, model:selectedModel}) }); const d = await r.json(); return d.content || JSON.stringify(d); }
    catch(e) { return `Erreur API: ${e.message}`; }
}

// Envoi
async function sendMessage() {
    const text = chatInput.value.trim(); if (!text && pendingFiles.length === 0) return;
    let att = null; if (pendingFiles.length > 0) { const f = pendingFiles[0]; att = { type: f.type.startsWith('image/')?'image':f.type.startsWith('video/')?'video':'file', url: f.url, name: f.name }; }
    const display = text || (att ? 'Fichier' : '');
    if (currentTab === 'alvacoa') {
        addMessage('user', display, 'local', att); chatInput.value = ''; pendingFiles = []; document.getElementById('previewGrid').innerHTML = ''; chatInput.style.height = 'auto'; showTyping();
        let r, s = 'local'; if (useAPI) { r = await getAPIResponse(text); s = selectedModel; } else { r = getLocalResponse(text); if (!r) r = "Je ne sais pas. Activez l'API ou apprenez-moi."; }
        setTimeout(() => { removeTyping(); addMessage('assistant', r, s); }, 400);
    } else {
        if (!activeContact) { addMessage('assistant', 'Sélectionnez un contact.', 'local'); return; }
        addMessage('user', display, 'linkchat', att); chatInput.value = ''; pendingFiles = []; document.getElementById('previewGrid').innerHTML = ''; chatInput.style.height = 'auto';
        setTimeout(() => { addMessage('contact', `Reçu: ${text}`, 'linkchat', null, activeContact.name); saveContacts(); }, 1000);
    }
}
function handleKeyDown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

// Contacts
function addContact() { document.getElementById('addContactModal').classList.add('active'); }
function closeAddContact() { document.getElementById('addContactModal').classList.remove('active'); }
function saveContact() { const n = document.getElementById('contactName').value.trim(); if (!n) return; linkchatContacts.push({ id: Date.now().toString(), name: n, avatar: n[0].toUpperCase(), online: true, messages: [] }); saveContacts(); updateSidebarContacts(); closeAddContact(); }
function updateSidebarContacts() { document.getElementById('sidebarContacts').innerHTML = linkchatContacts.map(c => `<div class="contact-item" onclick="openContact('${c.id}')"><div class="contact-avatar">${c.avatar}</div><div class="contact-name">${c.name}</div></div>`).join(''); }
function openContact(id) { activeContact = linkchatContacts.find(c => c.id === id); switchTab('linkchat'); toggleSidebar(); }

// Upload
function openUploadMenu() { document.getElementById('uploadModal').classList.add('active'); updatePreviewGrid(); }
function closeUploadMenu() { document.getElementById('uploadModal').classList.remove('active'); }
function triggerFileInput(a) { const i = document.getElementById('fileInput'); i.accept = a; i.click(); }
function triggerCamera() { document.getElementById('cameraInput').click(); }
function handleFileSelect(e) { Array.from(e.target.files).forEach(f => { pendingFiles.push({ name:f.name, type:f.type, size:f.size, url:URL.createObjectURL(f), file:f }); }); updatePreviewGrid(); }
function updatePreviewGrid() { document.getElementById('previewGrid').innerHTML = pendingFiles.map((f,i) => { let p = ''; if (f.type.startsWith('image/')) p = `<img src="${f.url}">`; else if (f.type.startsWith('video/')) p = `<video src="${f.url}" controls></video>`; else p = `<div class="file-item">${f.name}</div>`; return `<div class="preview-item">${p}<button onclick="removeFile(${i})">✕</button></div>`; }).join(''); }
function removeFile(i) { URL.revokeObjectURL(pendingFiles[i].url); pendingFiles.splice(i,1); updatePreviewGrid(); }
function confirmUpload() { closeUploadMenu(); if (pendingFiles.length > 0 || chatInput.value.trim()) sendMessage(); }

// Micro
async function toggleMicrophone() { const btn = document.getElementById('micBtn'), bars = document.getElementById('audioBars'); if (isRecording) { stopRecording(); return; } try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder = new MediaRecorder(stream); audioChunks = []; mediaRecorder.ondataavailable = e => audioChunks.push(e.data); mediaRecorder.onstop = async () => { const blob = new Blob(audioChunks, { type: 'audio/webm' }); const url = URL.createObjectURL(blob); pendingFiles.push({ name: `recording-${Date.now()}.webm`, type: 'audio/webm', size: blob.size, url, file: blob }); updatePreviewGrid(); }; mediaRecorder.start(); isRecording = true; btn.classList.add('recording'); } catch(e) { addMessage('assistant', `Erreur micro: ${e.message}`, 'local'); } }
function stopRecording() { if (mediaRecorder && isRecording) { mediaRecorder.stop(); isRecording = false; document.getElementById('micBtn').classList.remove('recording'); } }

// Sidebar
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
function openSettings() { toggleSidebar(); document.getElementById('settingsModal').classList.add('active'); document.getElementById('apiUrlSetting').value = API_URL; document.getElementById('defaultModelSelect').value = selectedModel; document.getElementById('usernameSetting').value = username; }
function closeSettings() { document.getElementById('settingsModal').classList.remove('active'); }
function saveSettings() { localStorage.setItem('alvacoa_api_url', document.getElementById('apiUrlSetting').value); localStorage.setItem('alvacoa_default_model', document.getElementById('defaultModelSelect').value); localStorage.setItem('alvacoa_username', document.getElementById('usernameSetting').value); API_URL = localStorage.getItem('alvacoa_api_url') || API_URL; selectedModel = localStorage.getItem('alvacoa_default_model') || selectedModel; username = localStorage.getItem('alvacoa_username') || username; document.getElementById('headerStatus').textContent = useAPI ? `API: ${selectedModel}` : 'Assistant IA'; closeSettings(); }
function changeTheme() { const t = document.getElementById('themeSelect').value; document.body.classList.toggle('light-theme', t === 'light'); localStorage.setItem('alvacoa_theme', t); const metaTheme = document.querySelector('meta[name="theme-color"]'); if (metaTheme) metaTheme.content = t === 'light' ? '#ffffff' : '#6366f1'; }
function changeFontSize() { const s = document.getElementById('fontSizeSelect').value; const sizes = { small:'13px', medium:'14px', large:'16px' }; document.documentElement.style.setProperty('--font-size', sizes[s] || sizes.medium); localStorage.setItem('alvacoa_font_size', s); }
function clearAllData() { if (confirm('Effacer TOUT ?')) { localStorage.clear(); location.reload(); } }
function openHistory() { toggleSidebar(); document.getElementById('historyModal').classList.add('active'); document.getElementById('historyList').innerHTML = chatHistory.length ? chatHistory.slice().reverse().map(h => `<div class="history-item" onclick="loadHistory('${h.id}')">${new Date(h.created).toLocaleString()} - ${h.title || 'Session'}</div>`).join('') : '<p style="color:var(--text-muted);padding:20px;text-align:center;">Aucun historique</p>'; }
function closeHistory() { document.getElementById('historyModal').classList.remove('active'); }
function loadHistory(id) { const s = chatHistory.find(h => h.id == id); if (s) { chatMessages.innerHTML = ''; currentSession = []; s.messages.forEach(m => addMessage(m.type, m.content, m.source)); } }
function openAbout() { toggleSidebar(); document.getElementById('aboutModal').classList.add('active'); }
function closeAbout() { document.getElementById('aboutModal').classList.remove('active'); }
function exportData() { toggleSidebar(); const d = { knowledge: knowledgeBase, history: chatHistory, contacts: linkchatContacts }; const b = new Blob([JSON.stringify(d)], { type:'application/json' }); downloadFile(URL.createObjectURL(b), 'alvacoa-data.json'); }
function toggleAPIMode() { useAPI = !useAPI; document.getElementById('apiToggleBtn').classList.toggle('active', useAPI); document.getElementById('headerStatus').textContent = useAPI ? `API: ${selectedModel}` : 'Assistant IA'; }
function changeModel() { selectedModel = document.getElementById('modelSelect').value; if (useAPI) document.getElementById('headerStatus').textContent = `API: ${selectedModel}`; }
function openTrainModal() { document.getElementById('trainModal').classList.add('active'); }
function closeTrainModal() { document.getElementById('trainModal').classList.remove('active'); }
function trainAI() { const q = document.getElementById('trainQuestion').value.trim().toLowerCase(); const a = document.getElementById('trainAnswer').value.trim(); if (!q || !a) return; if (!window.knowledgeBase) window.knowledgeBase = {}; window.knowledgeBase[q] = a; saveKnowledge(); addMessage('assistant', '✅ Connaissance enregistrée.', 'local'); closeTrainModal(); }
function initiateCall() { if (activeContact) addMessage('assistant', '📞 Appel vers ' + (activeContact?.name || '...') + '...', 'local'); }

// Init
function init() {
    const theme = localStorage.getItem('alvacoa_theme') || 'dark'; document.body.classList.toggle('light-theme', theme === 'light');
    const fs = localStorage.getItem('alvacoa_font_size') || 'medium'; const sizes = { small:'13px', medium:'14px', large:'16px' }; document.documentElement.style.setProperty('--font-size', sizes[fs] || sizes.medium);
    selectedModel = localStorage.getItem('alvacoa_default_model') || 'gemini-1.5-flash'; document.getElementById('modelSelect').value = selectedModel;
    username = localStorage.getItem('alvacoa_username') || 'Moi';
    setupPWAIcon();
    if (!localStorage.getItem('alvacoa_icon_512')) { setTimeout(generatePWAIcon, 1500); }
    updateSidebarContacts(); switchTab('alvacoa');
    chatInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });
    console.log('🚀 ALVACOA v4.0 • Gemini 1.5 Flash • Mistral Small • DeepSeek V2 • Claude 3.5 Sonnet');
}
init();