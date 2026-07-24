// ================================================================
// ОТРИСОВКА ИНТЕРФЕЙСА (UI)
// ================================================================

function updateDebugInfo() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour12: false });
    const dateStr = now.toLocaleDateString('ru-RU');
    
    const debugTime = document.getElementById('debugTime');
    const debugDate = document.getElementById('debugDate');
    
    if (debugTime) debugTime.textContent = timeStr;
    if (debugDate) debugDate.textContent = dateStr;
}
setInterval(updateDebugInfo, 1000);
updateDebugInfo();

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.bottom-nav .tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.bottom-nav .tab[data-page="${page}"]`);
    if (tab) tab.classList.add('active');
    
    const titles = {
        references: '📸 Референсы',
        schemes: '💡 Схемы света',
        equipment: '📷 Оборудование',
        cheatsheets: '📋 Шпаргалки',
        profile: '👤 Профиль'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'PhotoNote';
    
    document.getElementById('headerBackBtn').style.display = 'none';
    document.getElementById('headerEditBtn').style.display = 'none';
    
    state.currentPage = page;
    
    switch(page) {
        case 'references':
            renderReferences();
            break;
        case 'schemes':
            renderSchemes();
            break;
        case 'equipment':
            renderEquipment();
            break;
        case 'cheatsheets':
            renderCheatsheets();
            break;
        case 'profile':
            loadProfile();
            updateCounts();
            updateStorageSize();
            break;
    }
}

function updateFilterCount(count) {
    const el = document.getElementById('filterCount');
    if (el) {
        const total = state.references.length;
        el.textContent = `${count} из ${total} референсов`;
    }
}

function showNotification(message, type = 'success') {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    alert(`${icons[type] || 'ℹ️'} ${message}`);
}
