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

function navigateTo(page, params = {}) {
    console.log('🔀 Навигация на страницу:', page);
    
    // Сохраняем предыдущую страницу для кнопки "Назад"
    if (page !== 'collection_detail' && page !== 'detail') {
        state.previousPage = state.currentPage;
    }
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Определяем ID страницы
    let pageId = page;
    if (page === 'collection_detail') {
        pageId = 'collection-detail';
    }
    
    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.add('active');
        console.log('✅ Показана страница:', pageId);
    } else {
        console.error('❌ Страница не найдена:', pageId);
        return;
    }
    
    // Обновляем навигацию
    document.querySelectorAll('.bottom-nav .tab').forEach(t => t.classList.remove('active'));
    let tabPage = page;
    if (page === 'collection_detail') tabPage = 'collections';
    const tab = document.querySelector(`.bottom-nav .tab[data-page="${tabPage}"]`);
    if (tab) {
        tab.classList.add('active');
        console.log('✅ Активирована кнопка:', tabPage);
    }
    
    // Обновляем заголовок
    const titles = {
        collections: '📁 Коллекции',
        schemes: '💡 Схемы света',
        equipment: '📷 Оборудование',
        cheatsheets: '📋 Шпаргалки',
        profile: '👤 Профиль',
        collection_detail: '📁 Коллекция'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = titles[page] || titles[pageId] || 'PhotoNote';
    }
    
    // Управление кнопками шапки
    const backBtn = document.getElementById('headerBackBtn');
    const editBtn = document.getElementById('headerEditBtn');
    
    if (page === 'collection_detail' || page === 'detail') {
        backBtn.style.display = 'inline-block';
        backBtn.textContent = '← Назад';
        backBtn.onclick = function() {
            if (page === 'detail') {
                closeSlider();
            } else {
                navigateTo('collections');
            }
        };
    } else {
        backBtn.style.display = 'none';
    }
    editBtn.style.display = 'none';
    
    state.currentPage = page;
    
    // Рендерим нужную страницу
    switch(page) {
        case 'collections':
            renderCollections();
            break;
        case 'collection_detail':
            renderCollectionDetail();
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

function updateCollectionFilterCount(count) {
    const el = document.getElementById('collectionFilterCount');
    if (el) {
        const collection = getCollection(state.currentCollectionId);
        const total = collection ? getReferencesByCollection(state.currentCollectionId).length : 0;
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

function renderAll() {
    renderCollections();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    updateCounts();
    updateStorageSize();
}
