// ================================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ - ИНИЦИАЛИЗАЦИЯ
// Версия 0.1.0 — Коллекции
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📸 PhotoNote инициализация...');
    console.log('📌 Версия: 0.1.0 — Коллекции');
    
    // 1. Загружаем состояние
    loadState();
    console.log('📊 Данные загружены:', {
        collections: state.collections.length,
        references: state.references.length,
        schemes: state.schemes.length,
        equipment: state.equipment.length,
        cheatsheets: state.cheatsheets.length
    });
    
    // 2. Навигация по нижнему меню
    document.querySelectorAll('.bottom-nav .tab').forEach(tab => {
        // Обработчик клика мышкой
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const page = this.dataset.page;
            console.log('🖱️ Клик по кнопке:', page);
            if (page === 'detail') return;
            navigateTo(page);
        });
        
        // Обработчик касания на телефоне
        tab.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const page = this.dataset.page;
            console.log('👆 Касание по кнопке:', page);
            if (page === 'detail') return;
            navigateTo(page);
        });
    });
    
    // 3. Закрытие модалок по клику на фон
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                console.log('❌ Закрыта модалка');
            }
        });
    });
    
    // 4. Поиск с дебаунсом (глобальный)
    const searchInput = document.getElementById('referencesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        console.log('🔍 Глобальный поиск настроен');
    }
    
    // 5. Поиск внутри коллекции (дебаунс)
    const collectionSearch = document.getElementById('collectionSearch');
    if (collectionSearch) {
        collectionSearch.addEventListener('input', debounce(applyCollectionFilters, 300));
        console.log('🔍 Поиск внутри коллекции настроен');
    }
    
    // 6. Загрузка главной страницы (Коллекции)
    console.log('🚀 Загрузка главной страницы...');
    navigateTo('collections');
    
    // 7. Принудительное обновление аватара
    setTimeout(updateAvatarDisplay, 100);
    
    // 8. Обновление размера хранилища
    setTimeout(updateStorageSize, 200);
    
    console.log('✅ PhotoNote готова к работе!');
});

// ================================================================
// ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: клик по всему документу
// ================================================================
document.addEventListener('click', function(e) {
    const tab = e.target.closest('.bottom-nav .tab');
    if (tab) {
        console.log('🔄 Клик через делегирование:', tab.dataset.page);
    }
});

document.addEventListener('touchstart', function(e) {
    const tab = e.target.closest('.bottom-nav .tab');
    if (tab) {
        console.log('🔄 Касание через делегирование:', tab.dataset.page);
    }
});

// ================================================================
// ОБРАБОТЧИК ДЛЯ ЗАКРЫТИЯ МОДАЛОК ПО ESC
// ================================================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay.show');
        openModals.forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// ================================================================
// ОБНОВЛЕНИЕ ПРИ ВОЗВРАТЕ НА ГЛАВНУЮ
// ================================================================
window.addEventListener('pageshow', function() {
    // Обновляем данные при возврате на страницу
    if (state.currentPage === 'collections') {
        renderCollections();
    }
});

// ================================================================
// ПОДДЕРЖКА СИСТЕМНОЙ КНОПКИ "НАЗАД" (ANDROID)
// ================================================================
window.addEventListener('popstate', function() {
    if (state.currentPage === 'collection_detail') {
        navigateTo('collections');
    } else if (state.currentPage === 'detail') {
        closeSlider();
    }
});
