// ================================================================
// ОТРИСОВКА ИНТЕРФЕЙСА (UI)
// Версия 0.1.1 — дизайн-система + настройка шрифтов
// ================================================================

// ================================================================
// ОТЛАДКА (ВРЕМЯ, ДАТА)
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

// ================================================================
// ПРИМЕНЕНИЕ НАСТРОЕК ШРИФТА
// ================================================================

function applyFontSettings() {
    // Загружаем сохранённый размер шрифта
    const saved = localStorage.getItem('phonote_fontSize');
    let level = 3;
    if (saved) {
        level = parseInt(saved);
        if (level < 1 || level > 5) level = 3;
    }
    
    // Применяем размеры
    const sizes = {
        1: { h1: '20px', h2: '16px', h3: '14px', body: '13px', small: '12px', tiny: '10px', micro: '9px' },
        2: { h1: '24px', h2: '19px', h3: '16px', body: '14px', small: '13px', tiny: '11px', micro: '10px' },
        3: { h1: '28px', h2: '22px', h3: '18px', body: '16px', small: '14px', tiny: '12px', micro: '10px' },
        4: { h1: '32px', h2: '26px', h3: '20px', body: '18px', small: '16px', tiny: '13px', micro: '11px' },
        5: { h1: '36px', h2: '30px', h3: '24px', body: '20px', small: '18px', tiny: '14px', micro: '12px' }
    };
    
    const s = sizes[level] || sizes[3];
    const root = document.documentElement;
    
    root.style.setProperty('--font-size-h1', s.h1);
    root.style.setProperty('--font-size-h2', s.h2);
    root.style.setProperty('--font-size-h3', s.h3);
    root.style.setProperty('--font-size-body', s.body);
    root.style.setProperty('--font-size-small', s.small);
    root.style.setProperty('--font-size-tiny', s.tiny);
    root.style.setProperty('--font-size-micro', s.micro);
    
    // Обновляем метку текущего размера
    const labelEl = document.getElementById('currentFontSizeLabel');
    if (labelEl) {
        const labels = ['', 'Маленький', 'Стандартный', 'Средний', 'Крупный', 'Очень крупный'];
        labelEl.textContent = labels[level] || 'Средний';
    }
    
    // Обновляем активную кнопку
    document.querySelectorAll('.btn-size').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
    });
}

// ================================================================
// НАВИГАЦИЯ
// ================================================================

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
            applyFontSettings();
            updateCounts();
            updateStorageSize();
            break;
        default:
            console.warn('⚠️ Неизвестная страница:', page);
    }
}

// ================================================================
// ОБНОВЛЕНИЕ СЧЁТЧИКОВ
// ================================================================

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

// ================================================================
// УВЕДОМЛЕНИЯ
// ================================================================

function showNotification(message, type = 'success') {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    alert(`${icons[type] || 'ℹ️'} ${message}`);
}

// ================================================================
// РЕЖИМ РЕДАКТИРОВАНИЯ
// ================================================================

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

// ================================================================
// ОБНОВЛЕНИЕ ВСЕХ СТРАНИЦ
// ================================================================

function renderAll() {
    renderCollections();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    updateCounts();
    updateStorageSize();
}
