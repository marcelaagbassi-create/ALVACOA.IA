// Identique à la version précédente (connaissances + calculs)
let knowledgeBase = JSON.parse(localStorage.getItem('alvacoa_knowledge')) || {
    "bonjour": "Bonjour ! Je suis ALVACOA. Messagerie + IA à votre service.",
    "salut": "Salut ! Ravie de vous voir.",
    "qui es-tu": "Je suis <strong>ALVACOA</strong>, créée par David Laurens Kokoura (DAVIESLAY) à Abidjan. Je suis à la fois une messagerie et une IA.",
    "merci": "Avec plaisir !",
    "aide": "📚 <strong>Guide :</strong>\n• ALVACOA : Assistant IA (calculs, rédaction, apprentissage)\n• Linkchat! : Messagerie instantanée\n• Menu ☰ : Paramètres, Historique, Contacts",
    "côte d'ivoire": "🇨🇮 Côte d'Ivoire, Afrique de l'Ouest. Capitales : Yamoussoukro (politique), Abidjan (économique).",
    "abidjan": "Abidjan, capitale économique ivoirienne. Ville natale de DAVIESLAY !",
    "davieslay": "DAVIESLAY = David Laurens Kokoura, créateur d'ALVACOA, basé à Abidjan.",
    "linkchat": "Linkchat! est la fonctionnalité de messagerie d'ALVACOA. Ajoutez des contacts et discutez !",
    "javascript": "JavaScript, langage de programmation web créé en 1995.",
    "python": "Python, langage créé en 1991. Utilisé en IA.",
    "pythagore": "a² + b² = c² dans un triangle rectangle.",
    "pi": "π ≈ 3,14159",
    "blague": "Pourquoi les devs détestent la nature ? Trop de bugs !",
    "citation": "« Le succès n'est pas final, l'échec n'est pas fatal. » - Winston Churchill"
};

function factorial(n) { if(n<0)return NaN; if(n===0||n===1)return 1; let r=1; for(let i=2;i<=n;i++)r*=i; return r; }
function evaluateMath(expr) {
    try {
        let e = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/π/gi,Math.PI).replace(/\^/g,'**')
            .replace(/sin\(/gi,'Math.sin(').replace(/cos\(/gi,'Math.cos(').replace(/tan\(/gi,'Math.tan(')
            .replace(/log\(/gi,'Math.log10(').replace(/ln\(/gi,'Math.log(').replace(/sqrt\(/gi,'Math.sqrt(')
            .replace(/(\d+)!/g,(_,n)=>factorial(parseInt(n))).replace(/(\d+)%/g,'($1/100)');
        let r = Function('"use strict"; return (' + e + ')')();
        if(isNaN(r)||!isFinite(r))return null;
        return Number.isInteger(r)?r:parseFloat(r.toFixed(10));
    } catch(e) { return null; }
}
function isMathExpression(t) { return /[\d]+\s*[\+\-\*\/\^]/.test(t) || /sin|cos|tan|log|ln|sqrt|pi|π/i.test(t) || /calcul|calcule|résous/i.test(t); }
function getLocalResponse(msg) {
    const m = msg.toLowerCase().trim();
    if(isMathExpression(msg)) { const expr=msg.replace(/calcule|calculer|résous|combien fait/gi,'').replace(/\?/g,'').trim(); const r=evaluateMath(expr); if(r!==null) return `<strong>Calcul :</strong><br><div class="result-block">${expr}=<strong>${r}</strong></div>`; }
    if(/rédige|rédiger|écris|écrire/i.test(m)) { if(/email/i.test(m)) return `<strong>Email :</strong><br><div class="result-block">Objet: ...<br>Bonjour,<br>...<br>Cordialement,</div>`; return "Email, Histoire, Poème ?"; }
    if(knowledgeBase[m]) return knowledgeBase[m];
    const words=m.split(/\s+/); let best=null,bs=0;
    for(let[k,v] of Object.entries(knowledgeBase)) { let s=0; for(let w of words) if(k.includes(w)||w.includes(k)) s++; if(s>bs){bs=s;best=v;} }
    if(bs>0.5) return best;
    const al=msg.match(/(.+?) (?:est|signifie|veut dire) (.+)/i);
    if(al){knowledgeBase[al[1].trim().toLowerCase()]=al[2].trim();saveKnowledge();return `Appris: "${al[1].trim()}"`;}
    return null;
}
