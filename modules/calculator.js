// ============================================
// MODULE CALCULATOR - Calculs mathématiques
// Pour ajouter des fonctions : modifier calculate()
// ============================================

const CalculatorModule = {
    name: "Calculator",
    version: "1.1",
    enabled: true,

    init() {
        console.log('✅ Module Calculateur chargé');
    },

    // Détecte si le message est un calcul
    canHandle(message) {
        const patterns = [
            /[\d]+\s*[\+\-\*\/\^]\s*[\d]+/,
            /sin|cos|tan|log|ln|sqrt|pi|π|abs/i,
            /calcul|calcule|résous/i
        ];
        return patterns.some(p => p.test(message));
    },

    // Traite le calcul
    handle(message) {
        const expr = this.extractExpression(message);
        const result = this.evaluate(expr);
        
        if (result.success) {
            return `📊 <strong>Calcul :</strong><br>
            <div class="result-block">${expr} = <strong>${result.result}</strong></div>`;
        }
        return null; // Le module suivant prendra le relais
    },

    extractExpression(text) {
        return text
            .replace(/calcule|calculer|résous|combien fait/gi, '')
            .replace(/\?/g, '').trim() || text;
    },

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    },

    evaluate(expression) {
        try {
            let expr = expression
                .replace(/×/g, '*').replace(/÷/g, '/')
                .replace(/π/gi, Math.PI).replace(/\^/g, '**')
                .replace(/sin\(/gi, 'Math.sin(')
                .replace(/cos\(/gi, 'Math.cos(')
                .replace(/tan\(/gi, 'Math.tan(')
                .replace(/log\(/gi, 'Math.log10(')
                .replace(/ln\(/gi, 'Math.log(')
                .replace(/sqrt\(/gi, 'Math.sqrt(')
                .replace(/(\d+)!/g, (_, n) => this.factorial(parseInt(n)))
                .replace(/(\d+)%/g, '($1/100)');

            let result = Function('"use strict"; return (' + expr + ')')();
            
            if (isNaN(result) || !isFinite(result)) return { success: false };
            
            return {
                success: true,
                result: Number.isInteger(result) ? result : parseFloat(result.toFixed(10))
            };
        } catch (e) {
            return { success: false };
        }
    }
};
