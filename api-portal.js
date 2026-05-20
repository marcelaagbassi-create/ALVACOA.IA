// ============================================
// PORTAIL API ALVACOA
// Gestion des clés API développeur
// ============================================

let apiKeys = JSON.parse(localStorage.getItem('alvacoa_api_keys') || '[]');

function openAPIPortal() {
    toggleSidebar();
    document.getElementById('apiPortalModal').classList.add('active');
    document.getElementById('newKeyDisplay').style.display = 'none';
    document.getElementById('newKeyName').value = '';
    renderAPIKeys();
}

function closeAPIPortal() {
    document.getElementById('apiPortalModal').classList.remove('active');
}

function generateAPIKey() {
    const name = document.getElementById('newKeyName').value.trim() || 'Sans nom';
    const tier = document.getElementById('newKeyTier').value;
    const model = document.getElementById('newKeyModel').value;

    // Générer une clé unique
    const keyId = generateKeyId();
    const apiKey = `sk-alvacoa-v4-${keyId}`;
    const createdAt = new Date().toISOString();

    const newKey = {
        id: Date.now().toString(),
        name: name,
        key: apiKey,
        prefix: apiKey.substring(0, 20) + '...',
        tier: tier,
        model: model,
        createdAt: createdAt,
        usage: 0,
        limit: tier === 'basic' ? 100 : tier === 'pro' ? 1000 : Infinity,
        active: true
    };

    apiKeys.push(newKey);
    saveAPIKeys();

    // Afficher la clé générée
    document.getElementById('generatedKey').textContent = apiKey;
    document.getElementById('newKeyDisplay').style.display = 'block';
    document.getElementById('newKeyName').value = '';

    renderAPIKeys();

    // Notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔑 Clé API ALVACOA générée', {
            body: `Clé ${name} créée avec succès !`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%236366f1"/><text x="50" y="68" font-size="52" font-weight="bold" fill="white">A</text></svg>'
        });
    }
}

function generateKeyId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function renderAPIKeys() {
    const list = document.getElementById('apiKeysList');

    if (apiKeys.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Aucune clé générée</p>';
        return;
    }

    list.innerHTML = apiKeys.map(key => `
        <div class="api-key-item">
            <div class="key-info">
                <div class="key-name">${key.name}</div>
                <div class="key-meta">
                    <span class="key-prefix">${key.tier.toUpperCase()}</span>
                    ${key.prefix} • ${new Date(key.createdAt).toLocaleDateString('fr-FR')}
                    ${key.active ? '• <span style="color:var(--green);">✅ Active</span>' : '• <span style="color:var(--red);">❌ Inactive</span>'}
                </div>
            </div>
            <div class="key-actions">
                <button onclick="revokeAPIKey('${key.id}')" title="Révoquer">🗑️</button>
            </div>
        </div>
    `).join('');
}

function revokeAPIKey(id) {
    if (confirm('Révoquer cette clé API ? Elle ne pourra plus être utilisée.')) {
        apiKeys = apiKeys.filter(k => k.id !== id);
        saveAPIKeys();
        renderAPIKeys();
        document.getElementById('newKeyDisplay').style.display = 'none';
    }
}

function copyAPIKey() {
    const keyText = document.getElementById('generatedKey').textContent;
    navigator.clipboard.writeText(keyText).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copié !';
        copyBtn.style.background = '#22c55e';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = 'var(--accent)';
        }, 2000);
    }).catch(() => {
        // Fallback pour les navigateurs sans clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = keyText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

function saveAPIKeys() {
    localStorage.setItem('alvacoa_api_keys', JSON.stringify(apiKeys));
}

// Vérifier une clé API (pour usage externe)
function validateAPIKey(key) {
    const found = apiKeys.find(k => k.key === key && k.active);
    if (!found) return { valid: false, error: 'Clé invalide ou révoquée' };
    if (found.usage >= found.limit) return { valid: false, error: 'Limite de requêtes atteinte' };
    found.usage++;
    saveAPIKeys();
    return { valid: true, tier: found.tier, model: found.model };
}

// Exposer pour usage dans l'API
window.ALVACOA_API = {
    keys: apiKeys,
    validate: validateAPIKey,
    generate: generateAPIKey,
    revoke: revokeAPIKey
};

console.log('🔑 Portail API ALVACOA chargé');
console.log('📋 Clés existantes:', apiKeys.length);
