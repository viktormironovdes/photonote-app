// ================================================================
// СЛАЙДЕР - ДОПОЛНИТЕЛЬНАЯ ЛОГИКА
// ================================================================

/**
 * Обновить информацию слайдера
 */
function updateSliderInfo() {
    const info = document.getElementById('sliderInfo');
    const title = document.getElementById('sliderTitle');
    
    if (sliderRefs.length === 0) {
        if (info) info.textContent = '0 / 0';
        if (title) title.textContent = '';
        return;
    }
    
    const ref = sliderRefs[sliderCurrentIndex];
    if (info) info.textContent = `${sliderCurrentIndex + 1} / ${sliderRefs.length}`;
    if (title) title.textContent = ref?.name || 'Без названия';
}

/**
 * Показать уведомление внутри слайдера
 */
function showSliderNotification(message, type = 'info') {
    const container = document.getElementById('sliderContent');
    const notification = document.createElement('div');
    notification.className = 'slider-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        z-index: 10;
        animation: fadeIn 0.3s ease;
    `;
    container.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

/**
 * Обработка клика по фото в слайдере для открытия меню
 */
document.addEventListener('click', function(e) {
    const slider = document.getElementById('sliderOverlay');
    if (!slider.classList.contains('show')) return;
    
    const photo = slider.querySelector('.slider-content img, .slider-content .no-photo');
    if (photo && photo.contains(e.target)) {
        toggleSliderMenu();
    }
});

/**
 * Закрыть слайдер при клике вне фото и меню
 */
document.addEventListener('click', function(e) {
    const slider = document.getElementById('sliderOverlay');
    if (!slider.classList.contains('show')) return;
    
    const content = slider.querySelector('.slider-content');
    const menu = slider.querySelector('.slider-menu');
    const closeBtn = slider.querySelector('.slider-close');
    
    if (closeBtn && closeBtn.contains(e.target)) {
        closeSlider();
        return;
    }
    
    // Если клик по фону, но не по фото и не по меню
    if (!content?.contains(e.target) && !menu?.contains(e.target)) {
        // Закрываем только если меню открыто
        if (sliderMenuOpen) {
            toggleSliderMenu();
        }
    }
});