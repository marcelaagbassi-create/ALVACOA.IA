// ============================================
// MODULE KNOWLEDGE - Connaissances générales
// Ajoutez vos connaissances ici !
// ============================================

const KnowledgeModule = {
    name: "Knowledge",
    version: "1.0",
    enabled: true,

    // Base de connaissances intégrée
    database: {
        "pythagore": "📐 <strong>Théorème de Pythagore :</strong> a² + b² = c²",
        "france": "🇫🇷 La France est un pays d'Europe. Capitale : <strong>Paris</strong>.",
        "javascript": "💛 JavaScript est un langage de programmation utilisé pour le web.",
        "html": "🌐 HTML est le langage de balisage pour créer des pages web.",
        "css": "🎨 CSS permet de styliser les pages web.",
        "alvacoa": "Je suis <strong>ALVACOA</strong>, une IA modulaire évolutive ! 🚀"
    },

    init() {
        console.log('✅ Module Connaissances chargé');
    },

    canHandle(message) {
        const msg = message.toLowerCase();
        return Object.keys(this.database).some(key => msg.includes(key));
    },

    handle(message) {
        const msg = message.toLowerCase();
        for (let [key, value] of Object.entries(this.database)) {
            if (msg.includes(key)) return value;
        }
        return null;
    }
};
