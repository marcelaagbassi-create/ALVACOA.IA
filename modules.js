// ============ BASE DE CONNAISSANCES ENRICHIE ============
let knowledgeBase = JSON.parse(localStorage.getItem('alvacoa_knowledge')) || {
    // Salutations
    "bonjour": "Bonjour ! Je suis ALVACOA, votre assistante IA. Comment puis-je vous aider ?",
    "salut": "Salut ! Ravie de vous voir. Que puis-je faire pour vous ?",
    "bonsoir": "Bonsoir ! Comment s'est passée votre journée ?",
    "coucou": "Coucou ! Je suis là pour vous aider.",
    "hello": "Hello ! I speak French too. How can I help?",
    "qui es-tu": "Je suis <strong>ALVACOA</strong>, une IA avancée créée par David Laurens Kokoura (DAVIESLAY) depuis Abidjan. Je peux calculer, rédiger, apprendre et bien plus !",
    "merci": "Avec plaisir ! N'hésitez pas si vous avez besoin d'autre chose.",
    "merci beaucoup": "C'est tout naturel ! Je suis là pour ça.",
    
    // Aide
    "aide": "<strong>Guide ALVACOA :</strong>\n• Menu (☰) : Paramètres, Historique, À propos\n• Calculs : 15+8*3, sin(45)\n• Rédaction : « rédige un email »\n• Upload : photos, vidéos, fichiers\n• Micro : dictée vocale\n• API : Gemini, DeepSeek, Claude",
    
    // Connaissances générales
    "france": "La France est un pays d'Europe occidentale. Capitale : Paris. Population : ~68M.",
    "paris": "Paris est la capitale de la France. Tour Eiffel, Notre-Dame, Louvre, Arc de Triomphe.",
    "côte d'ivoire": "La Côte d'Ivoire est un pays d'Afrique de l'Ouest. Capitale : Yamoussoukro (politique), Abidjan (économique).",
    "abidjan": "Abidjan est la capitale économique de la Côte d'Ivoire. C'est la ville d'origine de DAVIESLAY !",
    "javascript": "JavaScript est un langage de programmation créé en 1995. Utilisé pour le web.",
    "python": "Python est un langage créé en 1991 par Guido van Rossum. Utilisé en IA et data science.",
    "html": "HTML structure les pages web. C'est le squelette d'un site.",
    "css": "CSS stylise les pages HTML : couleurs, polices, animations.",
    "api": "Une API permet à deux applications de communiquer. ALVACOA utilise une API pour Gemini/DeepSeek/Claude.",
    "github": "GitHub est une plateforme d'hébergement de code. Idéale pour collaborer.",
    "ia": "L'Intelligence Artificielle vise à créer des machines intelligentes.",
    
    // Mathématiques
    "pythagore": "Théorème de Pythagore : a² + b² = c² (triangle rectangle).",
    "pi": "π ≈ 3,14159. Rapport circonférence/diamètre d'un cercle.",
    "fibonacci": "Suite de Fibonacci : 0,1,1,2,3,5,8,13... Chaque nombre = somme des 2 précédents.",
    
    // Sciences
    "gravité": "La gravité est une force d'attraction. Sur Terre, g ≈ 9,81 m/s².",
    "lumière": "La lumière se déplace à ~300 000 km/s. Onde et particule (photon).",
    "adn": "L'ADN contient l'information génétique des êtres vivants.",
    
    // Divers
    "blague": "Pourquoi les devs n'aiment pas la nature ? Trop de bugs !",
    "citation": "« La seule façon de faire du bon travail est d'aimer ce que vous faites. » - Steve Jobs",
    "conseil": "Apprenez chaque jour quelque chose de nouveau. C'est ainsi qu'on grandit !",
    "davieslay": "DAVIESLAY est l'alias de David Laurens Kokoura, le créateur d'ALVACOA, basé à Abidjan en Côte d'Ivoire."
};

// ============ CALCULS ============
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function evaluateMath(expr) {
    try {
        let e = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/,/g,'.')
            .replace(/π/gi, Math.PI).replace(/pi/gi, Math.PI)
            .replace(/\^/g,'**')
            .replace(/sin\(/gi,'Math.sin(').replace(/cos\(/gi,'Math.cos(')
            .replace(/tan\(/gi,'Math.tan(').replace(/log\(/gi,'Math.log10(')
            .replace(/ln\(/gi,'Math.log(').replace(/sqrt\(/gi,'Math.sqrt(')
            .replace(/abs\(/gi,'Math.abs(')
            .replace(/(\d+)!/g,(_,n)=>factorial(parseInt(n)))
            .replace(/(\d+)%/g,'($1/100)');
        let r = Function('"use strict"; return (' + e + ')')();
        if (isNaN(r) || !isFinite(r)) return null;
        return Number.isInteger(r) ? r : parseFloat(r.toFixed(10));
    } catch(e) { return null; }
}

function isMathExpression(text) {
    return /[\d]+\s*[\+\-\*\/\^]/.test(text) || 
           /sin|cos|tan|log|ln|sqrt|abs|pi|π|factorielle/i.test(text) ||
           /calcul|calcule|résous|combien fait/i.test(text);
}

// ============ RÉPONSE LOCALE ============
function getLocalResponse(msg) {
    const m = msg.toLowerCase().trim();

    // Calculs
    if (isMathExpression(msg)) {
        const expr = msg.replace(/calcule|calculer|résous|combien fait|peux-tu calculer/gi,'').replace(/\?/g,'').trim();
        const r = evaluateMath(expr);
        if (r !== null) {
            return `<strong>Calcul :</strong><br><div class="result-block">${expr.replace(/\*/g,'×')} = <strong>${r}</strong></div>`;
        }
    }

    // Rédaction
    if (/rédige|rédiger|écris|écrire|ecris|ecrire/i.test(m)) {
        if (/email|mail|courriel/i.test(m)) {
            return `<strong>Email professionnel :</strong><br><div class="result-block"><strong>Objet :</strong> [Sujet]<br><br>Bonjour [Destinataire],<br><br>[Votre message]<br><br>Cordialement,<br>[Votre nom]</div>`;
        }
        if (/histoire|conte|raconte/i.test(m)) {
            return "Il était une fois une IA nommée ALVACOA, créée par DAVIESLAY à Abidjan. Chaque jour, elle apprenait et grandissait...";
        }
        if (/poème|poeme|poésie|vers/i.test(m)) {
            return "<em>Dans le flux des données, ALVACOA veille,<br>Créée par DAVIESLAY, sage et sans pareille.</em>";
        }
        return "Je peux rédiger : Email, Histoire, Poème, Article. Lequel ?";
    }

    // Recherche exacte
    if (knowledgeBase[m]) return knowledgeBase[m];

    // Recherche par mots-clés
    const words = m.split(/\s+/);
    let bestScore = 0, bestAnswer = null;
    for (let [key, value] of Object.entries(knowledgeBase)) {
        const keyWords = key.split(/\s+/);
        let score = 0;
        for (let uw of words)
            for (let kw of keyWords)
                if (uw.includes(kw) || kw.includes(uw)) score += 1;
        if (score > bestScore) { bestScore = score; bestAnswer = value; }
    }
    if (bestScore > 0.5) return bestAnswer;

    // Auto-apprentissage
    const autoLearn = msg.match(/(.+?) (?:est|signifie|veut dire|désigne) (.+)/i);
    if (autoLearn) {
        const key = autoLearn[1].trim().toLowerCase();
        const value = autoLearn[2].trim();
        knowledgeBase[key] = value;
        saveKnowledge();
        return `Appris automatiquement ! "${key}" → ${value}`;
    }

    return null;
          }
