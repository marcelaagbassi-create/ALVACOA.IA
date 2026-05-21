let apiKeys = JSON.parse(localStorage.getItem('alvacoa_api_keys') || '[]');
function openAPIPortal() { toggleSidebar(); document.getElementById('apiPortalModal').classList.add('active'); document.getElementById('newKeyDisplay').style.display = 'none'; document.getElementById('newKeyName').value = ''; renderAPIKeys(); }
function closeAPIPortal() { document.getElementById('apiPortalModal').classList.remove('active'); }
function generateKeyId() { const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'; let r = ''; for (let i = 0; i < 32; i++) r += chars.charAt(Math.floor(Math.random() * chars.length)); return r; }
function generateAPIKey() {
    const name = document.getElementById('newKeyName').value.trim() || 'Sans nom';
    const tier = document.getElementById('newKeyTier').value;
    const model = document.getElementById('newKeyModel').value;
    const keyId = generateKeyId(); const apiKey = `sk-alvacoa-v4-${keyId}`;
    const newKey = { id: Date.now().toString(), name, key: apiKey, prefix: apiKey.substring(0, 20) + '...', tier, model, createdAt: new Date().toISOString(), usage: 0, limit: tier === 'basic' ? 100 : tier === 'pro' ? 1000 : Infinity, active: true };
    apiKeys.push(newKey); saveAPIKeys();
    document.getElementById('generatedKey').textContent = apiKey; document.getElementById('newKeyDisplay').style.display = 'block'; document.getElementById('newKeyName').value = '';
    renderAPIKeys();
}
function renderAPIKeys() { const list = document.getElementById('apiKeysList'); if (apiKeys.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Aucune clé</p>'; return; } list.innerHTML = apiKeys.map(key => `<div class="api-key-item"><div class="key-info"><div class="key-name">${key.name}</div><div class="key-meta"><span class="key-prefix">${key.tier.toUpperCase()}</span> ${key.prefix} • ${new Date(key.createdAt).toLocaleDateString('fr-FR')} ${key.active ? '• <span style="color:var(--green);">✅ Active</span>' : '• <span style="color:var(--red);">❌ Inactive</span>'}</div></div><div class="key-actions"><button onclick="revokeAPIKey('${key.id}')" title="Révoquer">🗑️</button></div></div>`).join(''); }
function revokeAPIKey(id) { if (confirm('Révoquer cette clé ?')) { apiKeys = apiKeys.filter(k => k.id !== id); saveAPIKeys(); renderAPIKeys(); document.getElementById('newKeyDisplay').style.display = 'none'; } }
function copyAPIKey() { const keyText = document.getElementById('generatedKey').textContent; navigator.clipboard.writeText(keyText).then(() => { const btn = document.querySelector('.copy-btn'); const orig = btn.innerHTML; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copié !'; btn.style.background = '#22c55e'; setTimeout(() => { btn.innerHTML = orig; btn.style.background = 'var(--accent)'; }, 2000); }).catch(() => { const ta = document.createElement('textarea'); ta.value = keyText; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }); }
function saveAPIKeys() { localStorage.setItem('alvacoa_api_keys', JSON.stringify(apiKeys)); }
