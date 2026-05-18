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
let currentTab = 'alvacoa'; // 'alvacoa' ou 'linkchat'
let linkchatContacts = JSON.parse(localStorage.getItem('alvacoa_contacts') || '[]');
let activeContact = null;
let username = localStorage.getItem('alvacoa_username') || 'Moi';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

function saveKnowledge() { localStorage.setItem('alvacoa_knowledge', JSON.stringify(knowledgeBase)); }
function saveHistory() { localStorage.setItem('alvacoa_chat_history', JSON.stringify(chatHistory)); }
function saveContacts() { localStorage.setItem('alvacoa_contacts', JSON.stringify(linkchatContacts)); }

// ============ SWITCH TAB ============
function switchTab(tab) {
    currentTab = tab;
    document.getElementById('pillAlvacoa').classList.toggle('active', tab === 'alvacoa');
    document.getElementById('pillLinkchat').classList.toggle('active', tab === 'linkchat');
    document.getElementById('modelSelect').style.display = tab === 'alvacoa' ? '' : 'none';
    document.getElementById('apiToggleBtn').style.display = tab === 'alvacoa' ? '' : 'none';
    document.getElementById('callBtn').style.display = tab === 'linkchat' && activeContact ? '' : 'none';
    
    if (tab === 'alvacoa') {
        document.getElementById('headerTitle').textContent = 'ALVACOA';
        document.getElementById('headerStatus').textContent = useAPI ? `API: ${selectedModel}` : 'Assistant IA';
        document.getElementById('headerAvatar').textContent = 'A';
        chatInput.placeholder = 'Message ou dictée vocale...';
    } else {
        document.getElementById('headerTitle').textContent = activeContact ? activeContact.name : 'Linkchat!';
        document.getElementById('headerStatus').textContent = activeContact ? 'En ligne' : 'Messagerie';
        document.getElementById('headerAvatar').textContent = activeContact ? activeContact.name[0].toUpperCase() : 'L';
        chatInput.placeholder = 'Votre message...';
    }
    
    loadMessages();
    updateSidebarContacts();
}

function loadMessages() {
    chatMessages.innerHTML = '';
    if (currentTab === 'alvacoa') {
        currentSession.forEach(msg => {
            addMessageToDOM(msg.type, msg.content, msg.source, msg.attachment);
        });
    } else if (activeContact && activeContact.messages) {
        activeContact.messages.forEach(msg => {
            addMessageToDOM(msg.from === 'me' ? 'user' : 'contact', msg.content, 'linkchat', msg.attachment, msg.from === 'contact' ? activeContact.name : null);
        });
    }
    if (chatMessages.children.length === 0) {
        chatMessages.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-avatar">${currentTab === 'alvacoa' ? 'A' : 'L'}</div>
                <h3>${currentTab === 'alvacoa' ? 'ALVACOA' : 'Linkchat!'}</h3>
                <p>${currentTab === 'alvacoa' ? 'Assistant IA • Calculs • Rédaction • Apprentissage' : 'Messagerie instantanée • Discutez avec vos contacts'}</p>
            </div>`;
    }
}

function addMessageToDOM(type, content, source = 'local', attachment = null, senderName = null) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    let attachmentHTML = '';
    if (attachment) {
        if (attachment.type === 'image') attachmentHTML = `<img src="${attachment.url}" loading="lazy">`;
        else if (attachment.type === 'video') attachmentHTML = `<video src="${attachment.url}" controls></video>`;
        else attachmentHTML = `<div class="file-attachment">📄 ${attachment.name}</div>`;
    }
    const badge = (type === 'assistant' || type === 'contact') ? `<span class="badge ${source}">${source.toUpperCase()}</span>` : '';
    const avatarContent = type === 'user' ? username[0].toUpperCase() : (senderName ? senderName[0].toUpperCase() : 'A');
    div.innerHTML = `
        <div class="msg-avatar">${avatarContent}</div>
        <div class="msg-bubble">${senderName ? `<strong style="color:var(--accent);font-size:11px;">${senderName}</strong><br>` : ''}${attachmentHTML}${content}${badge}</div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(type, content, source = 'local', attachment = null, senderName = null) {
    addMessageToDOM(type, content, source, attachment, senderName);
    if (currentTab === 'alvacoa') {
        currentSession.push({ type, content, source, attachment, timestamp: Date.now() });
    } else if (activeContact) {
        if (!activeContact.messages) activeContact.messages = [];
        activeContact.messages.push({ from: type === 'user' ? 'me' : 'contact', content, attachment, timestamp: Date.now() });
        saveContacts();
    }
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="msg-avatar">A</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
function removeTyping() { const el = document.getElementById('typingIndicator'); if (el) el.remove(); }

// ============ API ============
async function getAPIResponse(message) {
    try {
        const res = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message, model:selectedModel}) });
        const data = await res.json();
        return data.content || 'Pas de réponse.';
    } catch(e) { return `Erreur API: ${e.message}`; }
}

// ============ ENVOI MESSAGE ============
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text && pendingFiles.length === 0) return;

    let attachment = null;
    if (pendingFiles.length > 0) {
        const f = pendingFiles[0];
        attachment = { type: f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : 'file', url: f.url, name: f.name };
    }

    const displayText = text || (attachment ? 'Fichier' : '');
    
    if (currentTab === 'alvacoa') {
        addMessage('user', displayText, 'local', attachment);
        chatInput.value = ''; pendingFiles = []; document.getElementById('previewGrid').innerHTML = ''; chatInput.style.height = 'auto';
        showTyping();
        let response, source = 'local';
        if (useAPI) { response = await getAPIResponse(text); source = selectedModel; }
        else { response = getLocalResponse(text); if (!response) response = "Je ne sais pas. Activez l'API ou apprenez-moi."; }
        setTimeout(() => { removeTyping(); addMessage('assistant', response, source); }, 400);
    } else {
        if (!activeContact) { addMessage('assistant', 'Sélectionnez un contact dans le menu.', 'local'); return; }
        addMessage('user', displayText, 'linkchat', attachment);
        chatInput.value = ''; pendingFiles = []; document.getElementById('previewGrid').innerHTML = ''; chatInput.style.height = 'auto';
        // Simuler réponse
        setTimeout(() => {
            addMessage('contact', `Reçu: ${text}`, 'linkchat', null, activeContact.name);
            saveContacts();
        }, 1000 + Math.random() * 2000);
    }
}

function handleKeyDown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

// ============ CONTACTS ============
function addContact() { document.getElementById('addContactModal').classList.add('active'); document.getElementById('contactName').focus(); }
function closeAddContact() { document.getElementById('addContactModal').classList.remove('active'); }
function saveContact() {
    const name = document.getElementById('contactName').value.trim();
    const id = document.getElementById('contactId').value.trim() || Date.now().toString();
    if (!name) return;
    linkchatContacts.push({ id, name, avatar: name[0].toUpperCase(), online: true, messages: [] });
    saveContacts();
    updateSidebarContacts();
    closeAddContact();
    document.getElementById('contactName').value = ''; document.getElementById('contactId').value = '';
}
function updateSidebarContacts() {
    const container = document.getElementById('sidebarContacts');
    container.innerHTML = linkchatContacts.map(c => `
        <div class="contact-item" onclick="openContact('${c.id}')">
            <div class="contact-avatar" style="background:${stringToColor(c.name)}">${c.avatar}</div>
            <span class="contact-name">${c.name}</span>
            <span class="contact-status ${c.online ? 'online' : 'offline'}"></span>
        </div>
    `).join('');
}
function openContact(id) {
    activeContact = linkchatContacts.find(c => c.id === id);
    switchTab('linkchat');
    toggleSidebar();
}
function stringToColor(str) { let hash=0; for(let i=0;i<str.length;i++){hash=str.charCodeAt(i)+((hash<<5)-hash);} return `hsl(${hash%360},60%,45%)`; }

// ============ UPLOAD ============
function openUploadMenu() { document.getElementById('uploadModal').classList.add('active'); updatePreviewGrid(); }
function closeUploadMenu() { document.getElementById('uploadModal').classList.remove('active'); }
function triggerFileInput(accept) { const i=document.getElementById('fileInput'); i.accept=accept; i.click(); }
function triggerCamera() { document.getElementById('cameraInput').click(); }
function handleFileSelect(e) {
    Array.from(e.target.files).forEach(f => { pendingFiles.push({name:f.name,type:f.type,size:f.size,url:URL.createObjectURL(f),file:f}); });
    updatePreviewGrid(); e.target.value='';
}
function updatePreviewGrid() {
    document.getElementById('previewGrid').innerHTML = pendingFiles.map((f,i) => {
        let p=''; if(f.type.startsWith('image/')) p=`<img src="${f.url}">`; else if(f.type.startsWith('video/')) p=`<video src="${f.url}"></video>`; else p='<span>📄</span>';
        return `<div class="preview-item">${p}<div class="remove-btn" onclick="removeFile(${i})">✕</div></div>`;
    }).join('');
}
function removeFile(i) { URL.revokeObjectURL(pendingFiles[i].url); pendingFiles.splice(i,1); updatePreviewGrid(); }
function confirmUpload() { closeUploadMenu(); if(pendingFiles.length>0||chatInput.value.trim()) sendMessage(); }

// ============ MICRO ============
async function toggleMicrophone() {
    const btn=document.getElementById('micBtn'), bars=document.getElementById('audioBars');
    if(isRecording){stopRecording();return;}
    try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        mediaRecorder=new MediaRecorder(stream); audioChunks=[];
        mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
        mediaRecorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());bars.classList.remove('active');chatInput.focus();};
        mediaRecorder.start(); isRecording=true; btn.classList.add('recording'); bars.classList.add('active');
    }catch(e){addMessage('assistant','Erreur micro: '+e.message,'local');}
}
function stopRecording(){if(mediaRecorder&&isRecording){mediaRecorder.stop();isRecording=false;document.getElementById('micBtn').classList.remove('recording');}}

// ============ SIDEBAR ============
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebarOverlay').classList.toggle('active');}
function openSettings(){toggleSidebar();document.getElementById('settingsModal').classList.add('active');document.getElementById('knowledgeCount').textContent=Object.keys(knowledgeBase).length;document.getElementById('apiUrlSetting').value=API_URL;document.getElementById('defaultModelSelect').value=selectedModel;document.getElementById('themeSelect').value=document.body.classList.contains('light-theme')?'light':'dark';document.getElementById('usernameSetting').value=username;}
function closeSettings(){document.getElementById('settingsModal').classList.remove('active');}
function saveSettings(){
    API_URL=document.getElementById('apiUrlSetting').value;selectedModel=document.getElementById('defaultModelSelect').value;username=document.getElementById('usernameSetting').value||'Moi';
    localStorage.setItem('alvacoa_api_url',API_URL);localStorage.setItem('alvacoa_default_model',selectedModel);localStorage.setItem('alvacoa_username',username);
    closeSettings();addMessage('assistant','Paramètres sauvegardés !','local');
}
function changeTheme(){const t=document.getElementById('themeSelect').value;document.body.classList.toggle('light-theme',t==='light');localStorage.setItem('alvacoa_theme',t);}
function changeFontSize(){const s=document.getElementById('fontSizeSelect').value;const sizes={small:'13px',medium:'14px',large:'16px'};document.documentElement.style.setProperty('--font-size',sizes[s]);localStorage.setItem('alvacoa_font_size',s);}
function clearAllData(){if(confirm('Effacer TOUT ?')){localStorage.clear();knowledgeBase={};chatHistory=[];currentSession=[];linkchatContacts=[];chatMessages.innerHTML='';saveKnowledge();saveHistory();saveContacts();addMessage('assistant','Données effacées.','local');closeSettings();}}
function openHistory(){toggleSidebar();document.getElementById('historyModal').classList.add('active');document.getElementById('historyList').innerHTML=chatHistory.length?chatHistory.slice().reverse().map(h=>`<div class="history-item" onclick="loadHistory('${h.id}')"><div>${h.preview}</div><div class="history-date">${h.date}</div></div>`).join(''):'<p style="color:var(--text-muted);text-align:center;padding:20px;">Vide</p>';}
function closeHistory(){document.getElementById('historyModal').classList.remove('active');}
function loadHistory(id){const s=chatHistory.find(h=>h.id==id);if(s){chatMessages.innerHTML='';currentSession=[];s.messages.forEach(m=>addMessage(m.type,m.content,m.source));closeHistory();}}
function openAbout(){toggleSidebar();document.getElementById('aboutModal').classList.add('active');}
function closeAbout(){document.getElementById('aboutModal').classList.remove('active');}
function exportData(){toggleSidebar();const d={knowledge:knowledgeBase,history:chatHistory,contacts:linkchatContacts,settings:{apiUrl:API_URL,model:selectedModel,username}};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='alvacoa_backup.json';a.click();addMessage('assistant','Exporté !','local');}
function toggleAPIMode(){useAPI=!useAPI;const b=document.getElementById('apiToggleBtn');b.classList.toggle('active',useAPI);document.getElementById('headerStatus').textContent=useAPI?`API: ${selectedModel}`:'Assistant IA';}
function changeModel(){selectedModel=document.getElementById('modelSelect').value;if(useAPI)document.getElementById('headerStatus').textContent=`API: ${selectedModel}`;}
function openTrainModal(){document.getElementById('trainModal').classList.add('active');document.getElementById('trainQuestion').focus();}
function closeTrainModal(){document.getElementById('trainModal').classList.remove('active');}
function trainAI(){const q=document.getElementById('trainQuestion').value.trim().toLowerCase();const a=document.getElementById('trainAnswer').value.trim();if(!q||!a)return;knowledgeBase[q]=a;saveKnowledge();addMessage('assistant',`Appris: "${q}"`,'local');document.getElementById('trainQuestion').value='';document.getElementById('trainAnswer').value='';closeTrainModal();}
function initiateCall(){addMessage('assistant','Appel simulé vers '+activeContact.name,'local');}

// ============ INIT ============
function init(){
    const theme=localStorage.getItem('alvacoa_theme')||'dark';document.body.classList.toggle('light-theme',theme==='light');
    const fs=localStorage.getItem('alvacoa_font_size')||'medium';const sizes={small:'13px',medium:'14px',large:'16px'};document.documentElement.style.setProperty('--font-size',sizes[fs]);
    selectedModel=localStorage.getItem('alvacoa_default_model')||'gemini';document.getElementById('modelSelect').value=selectedModel;
    username=localStorage.getItem('alvacoa_username')||'Moi';
    updateSidebarContacts();
    switchTab('alvacoa');
    chatInput.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';});
}
init();
