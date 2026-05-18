document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        if (document.getElementById('sidebar').classList.contains('open')) toggleSidebar();
    }
});
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); }));
document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
console.log('🚀 ALVACOA PWA v3.0');
console.log('👤 David Laurens Kokoura • DAVIESLAY • Abidjan');
