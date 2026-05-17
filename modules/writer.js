// ============================================
// MODULE WRITER - Rédaction de textes
// Pour ajouter des types de textes : modifier handle()
// ============================================

const WriterModule = {
    name: "Writer",
    version: "1.0",
    enabled: true,

    init() {
        console.log('✅ Module Rédaction chargé');
    },

    canHandle(message) {
        return /rédige|rédiger|écris|écrire|ecris|ecrire/i.test(message);
    },

    handle(message) {
        const msg = message.toLowerCase();

        if (/email|mail|courriel/i.test(msg)) {
            return `✍️ <strong>Email professionnel :</strong><br>
            <div class="result-block">
                <strong>Objet :</strong> [Sujet]<br><br>
                Bonjour [Destinataire],<br><br>
                [Votre message ici]<br><br>
                Cordialement,<br>
                [Votre nom]
            </div>`;
        }

        if (/histoire|conte/i.test(msg)) {
            return `📖 <strong>Histoire :</strong><br><br>
            Il était une fois une IA nommée ALVACOA. Chaque jour, elle apprenait de nouvelles choses grâce aux humains qui l'entraînaient avec patience. Sa connaissance grandissait, et son utilité aussi...<br><br>
            ✨ <em>Voulez-vous que je continue ?</em>`;
        }

        if (/poème|poeme|poésie/i.test(msg)) {
            return `📝 <strong>Poème :</strong><br><br>
            <em>Dans le monde des données et des calculs,<br>
            ALVACOA apprend sans recul,<br>
            Chaque question la fait grandir,<br>
            Pour mieux vous servir et vous chérir.</em>`;
        }

        return `✍️ Je peux rédiger :<br>• <strong>Email</strong> • <strong>Histoire</strong> • <strong>Poème</strong><br>Que préférez-vous ?`;
    }
};
