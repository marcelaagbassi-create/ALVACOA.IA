// ============================================
// MODULE TRAINER - Apprentissage
// Sauvegarde dans localStorage
// ============================================

const ModuleTrainer = {
    name: "Trainer",
    version: "1.0",
    knowledgeBase: {},

    init() {
        this.load();
        console.log('✅ Module Apprentissage chargé (' + Object.keys(this.knowledgeBase).length + ' entrées)');
    },

    load() {
        const saved = localStorage.getItem('alvacoa_knowledge');
        this.knowledgeBase = saved ? JSON.parse(saved) : {
            "bonjour": "Bonjour ! 👋 Je suis ALVACOA. Comment puis-je vous aider ?",
            "qui es-tu": "Je suis <strong>ALVACOA</strong>, une IA modulaire et auto-apprenante ! 🧠",
            "merci": "Avec plaisir ! 🙌"
        };
    },

    save() {
        const question = document.getElementById('trainQuestion').value.trim().toLowerCase();
        const answer = document.getElementById('trainAnswer').value.trim();
        
        if (!question || !answer) return alert('Remplissez les deux champs');
        
        this.knowledgeBase[question] = answer;
        localStorage.setItem('alvacoa_knowledge', JSON.stringify(this.knowledgeBase));
        
        Core.addMessage('assistant', `🧠 <strong>Appris !</strong> Question : "${question}"`);
        
        document.getElementById('trainQuestion').value = '';
        document.getElementById('trainAnswer').value = '';
        this.close();
    },

    canHandle(message) {
        const msg = message.toLowerCase().trim();
        return this.knowledgeBase.hasOwnProperty(msg) || this.findBestMatch(msg) !== null;
    },

    findBestMatch(message) {
        const msg = message.toLowerCase().trim();
        if (this.knowledgeBase[msg]) return this.knowledgeBase[msg];

        const userWords = msg.split(/\s+/);
        let bestScore = 0;
        let bestAnswer = null;

        for (let [key, value] of Object.entries(this.knowledgeBase)) {
            const keyWords = key.split(/\s+/);
            let score = 0;
            for (let uw of userWords) {
                for (let kw of keyWords) {
                    if (uw.includes(kw) || kw.includes(uw)) score += 1;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = value;
            }
        }

        return bestScore > 0.5 ? bestAnswer : null;
    },

    handle(message) {
        const answer = this.findBestMatch(message);
        if (answer) {
            // Auto-apprentissage contextuel
            if (/c'est|signifie|veut dire|la réponse/i.test(message)) {
                return this.autoLearn(message, answer);
            }
            return answer;
        }
        return null;
    },

    autoLearn(message, existingAnswer) {
        const match = message.match(/(.+?) (?:est|signifie|veut dire) (.+)/i);
        if (match) {
            const key = match[1].trim().toLowerCase();
            const value = match[2].trim();
            this.knowledgeBase[key] = value;
            localStorage.setItem('alvacoa_knowledge', JSON.stringify(this.knowledgeBase));
            return `🧠 <strong>Auto-appris !</strong> "${key}" → ${value}`;
        }
        return existingAnswer;
    },

    open() {
        document.getElementById('trainModal').classList.add('active');
        document.getElementById('trainQuestion').focus();
    },

    close() {
        document.getElementById('trainModal').classList.remove('active');
    }
};
