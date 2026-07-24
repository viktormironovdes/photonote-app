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
    console.log('🔀 Навигация на страницу:', page);
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Показываем нужную
    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
        console.log('✅ Показана страница:', page);
    } else {
        console.error('❌ Страница не найдена:', page);
        return;
    }
    
    // Обновляем навигацию
    document.querySelectorAll('.bottom-nav .tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.bottom-nav .tab[data-page="${page}"]`);
    if (tab) {
        tab.classList.add('active');
        console.log('✅ Активирована кнопка:', page);
    }
    
    // Обновляем заголовок
    const titles = {
        references: '📸 Референсы',
        schemes: '💡 Схемы света',
        equipment: '📷 Оборудование',
        cheatsheets: '📋 Шпаргалки',
        profile: '👤 Профиль'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = titles[page] || 'PhotoNote';
    }
    
    // Скрываем кнопки шапки
    const backBtn = document.getElementById('headerBackBtn');
    const editBtn = document.getElementById('headerEditBtn');
    if (backBtn) backBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    
    state.currentPage = page;
    
    // Рендерим нужную страницу
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
        default:
            console.warn('⚠️ Неизвестная страница:', page);
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

function toggleEditMode() {
    state.isDetailEdit = !state.isDetailEdit;
    if (sliderRefs.length > 0 && sliderCurrentIndex < sliderRefs.length) {
        const ref = sliderRefs[sliderCurrentIndex];
        if (!state.isDetailEdit) {
            saveSliderEdit(ref.id);
        } else {
            renderSliderContent();
        }
    }
}
