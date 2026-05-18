// UI - Gestion des modales et raccourcis
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        if (document.getElementById('sidebar').classList.contains('open')) toggleSidebar();
    }
});
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
});
document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
console.log('🚀 ALVACOA v3.0 - Messagerie + IA');
console.log('👤 Créateur: David Laurens Kokoura (DAVIESLAY)');
console.log('📍 Abidjan, Côte d\'Ivoire');
