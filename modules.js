let knowledgeBase = JSON.parse(localStorage.getItem('alvacoa_knowledge')) || {
    "bonjour": "Bonjour ! Je suis ALVACOA v4.0 avec modèles récents !",
    "salut": "Salut ! Ravie de vous voir.",
    "qui es-tu": "Je suis <strong>ALVACOA</strong>, créée par David Laurens Kokoura (DAVIESLAY) à Abidjan. J'utilise Gemini 2.5 Flash, DeepSeek V2 et Claude 3.5 Sonnet.",
    "merci": "Avec plaisir !",
    "aide": "📚 Guide :\n• ⚡ Gemini 2.5 Flash : rapide et gratuit\n• 🐋 DeepSeek V2 : puissant\n• 🧬 Claude 3.5 Sonnet : avancé\n• 🔑 ALVACOA Local : mode hors-ligne",
    "api": "🔑 Générez vos clés API dans Menu > API Keys pour intégrer ALVACOA !",
    "côte d'ivoire": "🇨🇮 Côte d'Ivoire, Afrique de l'Ouest. Abidjan.",
    "abidjan": "Abidjan, ville de DAVIESLAY !",
    "davieslay": "DAVIESLAY = David Laurens Kokoura, créateur d'ALVACOA.",
    "pythagore": "a² + b² = c²", "pi": "π ≈ 3,14159",
    "blague": "Pourquoi les devs détestent la nature ? Trop de bugs !",
    "gemini": "⚡ Gemini 2.5 Flash est le dernier modèle de Google, ultra-rapide et gratuit.",
    "deepseek": "🐋 DeepSeek V2 est un modèle puissant avec un excellent rapport qualité-prix.",
    "claude": "🧬 Claude 3.5 Sonnet d'Anthropic excelle en raisonnement et création de contenu."
};
function factorial(n) { if (n < 0) return NaN; if (n === 0 || n === 1) return 1; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function evaluateMath(expr) { try { let e = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/π/gi,Math.PI).replace(/\^/g,'**').replace(/sin\(/gi,'Math.sin(').replace(/cos\(/gi,'Math.cos(').replace(/tan\(/gi,'Math.tan(').replace(/log\(/gi,'Math.log10(').replace(/ln\(/gi,'Math.log(').replace(/sqrt\(/gi,'Math.sqrt(').replace(/(\d+)!/g,(_,n)=>factorial(parseInt(n))).replace(/(\d+)%/g,'($1/100)'); let r = Function('"use strict"; return (' + e + ')')(); if (isNaN(r) || !isFinite(r)) return null; return Number.isInteger(r) ? r : parseFloat(r.toFixed(10)); } catch(e) { return null; } }
function isMathExpression(t) { return /[\d]+\s*[\+\-\*\/\^]/.test(t) || /sin|cos|tan|log|ln|sqrt|pi|π/i.test(t); }
function getLocalResponse(msg) { const m = msg.toLowerCase().trim(); if (isMathExpression(msg)) { const ex = msg.replace(/calcule|calculer|résous/gi,'').replace(/\?/g,'').trim(); const r = evaluateMath(ex); if (r !== null) return `<strong>Calcul :</strong><br><div class="result-block">${ex} = <strong>${r}</strong></div>`; } if (/rédige|rédiger|écris|écrire/i.test(m)) { if (/email/i.test(m)) return `<strong>Email :</strong><br><div class="result-block">Objet: ...<br>Bonjour,<br>...<br>Cordialement,</div>`; return "Email, Histoire, Poème ?"; } if (knowledgeBase[m]) return knowledgeBase[m]; const words = m.split(/\s+/); let best = null, bs = 0; for (let [k,v] of Object.entries(knowledgeBase)) { let s = 0; for (let w of words) if (k.includes(w) || w.includes(k)) s++; if (s > bs) { bs = s; best = v; } } if (bs > 0.5) return best; const al = msg.match(/(.+?) (?:est|signifie|veut dire) (.+)/i); if (al) { knowledgeBase[al[1].trim().toLowerCase()] = al[2].trim(); saveKnowledge(); return `🧠 Appris: "${al[1].trim()}"`; } return null; }
