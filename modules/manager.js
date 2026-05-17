// ============================================
// MODULE MANAGER - Gestionnaire de modules
// C'est lui qui décide quel module répond
// ============================================

const ModuleManager = {
    modules: [],

    init() {
        // Enregistrer tous les modules
        this.register(CalculatorModule);
        this.register(WriterModule);
        this.register(ModuleTrainer);
        this.register(KnowledgeModule);
        
        console.log('📦 Module Manager initialisé');
    },

    register(module) {
        if (module && module.enabled !== false) {
            this.modules.push(module);
        }
    },

    // Traite un message à travers tous les modules
    processMessage(message) {
        for (let module of this.modules) {
            if (module.canHandle && module.canHandle(message)) {
                const response = module.handle(message);
                if (response) {
                    console.log(`✅ Répondu par : ${module.name}`);
                    return response;
                }
            }
        }
        
        // Aucun module n'a répondu
        return `🤔 Je ne sais pas encore répondre à cela.<br>
        <strong>Apprenez-moi</strong> en cliquant sur 🧠 <strong>Apprendre</strong> !`;
    },

    list() {
        return this.modules.map(m => ({
            name: m.name,
            version: m.version,
            enabled: m.enabled
        }));
    },

    showPanel() {
        const panel = document.getElementById('modulePanel');
        const list = document.getElementById('moduleList');
        
        list.innerHTML = this.modules.map(m => `
            <div class="module-item">
                <div class="module-name">📦 ${m.name} v${m.version}</div>
                <div class="module-status">✅ Actif</div>
            </div>
        `).join('');
        
        panel.classList.add('active');
    },

    hidePanel() {
        document.getElementById('modulePanel').classList.remove('active');
    }
};
