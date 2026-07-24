// ================================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ - ИНИЦИАЛИЗАЦИЯ
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📸 PhotoNote инициализация...');
    
    loadState();
    console.log('📊 Данные загружены:', {
        references: state.references.length,
        schemes: state.schemes.length,
        equipment: state.equipment.length,
        cheatsheets: state.cheatsheets.length
    });
    
    // ================================================================
    // НАВИГАЦИЯ ПО МЕНЮ (поддержка клика и касания)
    // ================================================================
    const tabs = document.querySelectorAll('.bottom-nav .tab');
    console.log('🔍 Найдено кнопок меню:', tabs.length);
    
    tabs.forEach((tab, index) => {
        const page = tab.dataset.page;
        console.log(`  ${index + 1}. Кнопка: ${page}`);
        
        // Обработчик клика мышкой
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetPage = this.dataset.page;
            console.log('🖱️ Клик по кнопке:', targetPage);
            if (targetPage === 'detail') return;
            navigateTo(targetPage);
        });
        
        // Обработчик касания на телефоне
        tab.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetPage = this.dataset.page;
            console.log('👆 Касание по кнопке:', targetPage);
            if (targetPage === 'detail') return;
            navigateTo(targetPage);
        });
    });
    
    // ================================================================
    // ЗАКРЫТИЕ МОДАЛОК
    // ================================================================
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                console.log('❌ Закрыта модалка');
            }
        });
    });
    
    // ================================================================
    // ПОИСК С ДЕБАУНСОМ
    // ================================================================
    const searchInput = document.getElementById('referencesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        console.log('🔍 Поиск настроен');
    }
    
    // ================================================================
    // ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ
    // ================================================================
    console.log('🚀 Загрузка главной страницы...');
    navigateTo('references');
    
    setTimeout(updateAvatarDisplay, 100);
    
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
