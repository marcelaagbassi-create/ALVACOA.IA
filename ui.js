// ============ UI - GESTION DES MODALES ============

// Fermer les modales avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        if (document.getElementById('sidebar').classList.contains('open')) {
            toggleSidebar();
        }
    }
});

// Fermer en cliquant en dehors
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Fermer le sidebar en cliquant sur l'overlay
document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);

// Ajuster la hauteur du textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

// Empêcher le zoom sur double-tap
document.addEventListener('dblclick', function(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
    }
}, { passive: false });

console.log('ALVACOA UI chargé');
