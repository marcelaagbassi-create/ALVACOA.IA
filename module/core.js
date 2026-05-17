// ============================================
// MODULE CORE - Noyau central d'ALVACOA
// Ce module gère l'interface et le routage
// ============================================

const Core = {
    version: "1.0",
    chatMessages: null,
    chatInput: null,
    conversationHistory: [],

    init() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatInput.focus();
        
        // Message de bienvenue
        setTimeout(() => {
            this.addMessage('assistant', `
                👋 Bonjour ! Je suis <strong>ALVACOA v${this.version}</strong><br><br>
                🧮 <strong>Calculs</strong> • ✍️ <strong>Rédaction</strong> • 🧠 <strong>Apprentissage</strong><br><br>
                <em>Je suis modulaire : chaque fonctionnalité peut être étendue !</em>
            `);
        }, 500);
    },

    addMessage(type, content) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.innerHTML = `
            <div class="message-avatar">${type === 'user' ? '👤' : 'A'}</div>
            <div class="message-bubble">${content}</div>
        `;
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    },

    showTyping() {
        const div = document.createElement('div');
        div.className = 'message assistant';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="message-avatar">A</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    },

    removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    },

    sendMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        this.conversationHistory.push({ role: 'user', content: text });
        this.chatInput.value = '';
        this.showTyping();

        setTimeout(() => {
            this.removeTyping();
            // Router le message vers tous les modules
            const response = ModuleManager.processMessage(text);
            this.addMessage('assistant', response);
        }, 500 + Math.random() * 800);
    },

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
};
