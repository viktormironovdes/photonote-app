// ================================================================
// РАБОТА С РЕФЕРЕНСАМИ
// ================================================================

let sliderRefs = [];
let sliderCurrentIndex = 0;
let sliderMenuOpen = false;

function renderReferences(references = null) {
    const container = document.getElementById('referencesGrid');
    const list = references || state.filteredReferences || state.references;
    
    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📸</span>
                <p>Нет референсов</p>
                <p class="sub">Добавьте свой первый референс</p>
                <button class="btn" onclick="showAddReferenceModal()" style="margin-top:12px;max-width:280px;margin-left:auto;margin-right:auto;">➕ Добавить референс</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = list.map(ref => `
        <div class="reference-card" onclick="openReferenceSlider('${ref.id}')">
            <div class="image-wrapper">
                ${ref.image ? `<img src="${ref.image}" alt="${ref.name}" loading="lazy">` : `<div class="no-photo">📸</div>`}
                ${ref.isFavorite ? '<span class="favorite-badge">❤️</span>' : ''}
            </div>
            <div class="info">
                <div class="title">${ref.name}</div>
                <div class="tags">
                    ${(ref.tags || []).slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    ${(ref.tags || []).length > 3 ? `<span class="tag">+${(ref.tags || []).length - 3}</span>` : ''}
                </div>
                <div class="meta">
                    <span>💡 ${ref.schemeIds?.length || 0}</span>
                    <span>📷 ${ref.equipmentIds?.length || 0}</span>
                    <span>📋 ${ref.cheatSheetIds?.length || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function openReferenceSlider(referenceId) {
    const refs = state.filteredReferences.length > 0 ? state.filteredReferences : state.references;
    
    if (refs.length === 0) {
        showNotification('Нет референсов для показа', 'warning');
        return;
    }
    
    let startIndex = refs.findIndex(r => r.id === referenceId);
    if (startIndex === -1) startIndex = 0;
    
    sliderRefs = refs;
    sliderCurrentIndex = startIndex;
    sliderMenuOpen = false;
    
    document.getElementById('sliderOverlay').classList.add('show');
    renderSliderContent();
}

function closeSlider() {
    document.getElementById('sliderOverlay').classList.remove('show');
    sliderRefs = [];
    sliderCurrentIndex = 0;
    sliderMenuOpen = false;
}

function renderSliderContent() {
    if (sliderRefs.length === 0 || sliderCurrentIndex < 0 || sliderCurrentIndex >= sliderRefs.length) {
        return;
    }
    
    const ref = sliderRefs[sliderCurrentIndex];
    const container = document.getElementById('sliderContent');
    const info = document.getElementById('sliderInfo');
    const title = document.getElementById('sliderTitle');
    const menu = document.getElementById('sliderMenu');
    
    info.textContent = `${sliderCurrentIndex + 1} / ${sliderRefs.length}`;
    title.textContent = ref.name || 'Без названия';
    
    container.innerHTML = `
        ${ref.image ? `<img src="${ref.image}" alt="${ref.name}" onclick="toggleSliderMenu()">` : `<div class="no-photo" onclick="toggleSliderMenu()">📸</div>`}
    `;
    
    renderSliderMenu(ref);
    
    if (!sliderMenuOpen) {
        menu.classList.remove('open');
    } else {
        menu.classList.add('open');
    }
}

function renderSliderMenu(ref) {
    const menuContent = document.getElementById('sliderMenuContent');
    const isEdit = state.isDetailEdit || false;
    
    const schemes = getSchemesForReference(ref.id);
    const equipment = getEquipmentForReference(ref.id);
    const cheatsheets = getCheatsheetsForReference(ref.id);
    
    let html = `
        <div class="slider-menu-header">
            <div class="slider-menu-title">
                <span class="slider-menu-title-text">${ref.isFavorite ? '❤️ ' : ''}${ref.name}</span>
                <button class="slider-menu-edit" onclick="event.stopPropagation(); toggleSliderEdit()">
                    ${isEdit ? '💾' : '✏️'}
                </button>
            </div>
            <button class="slider-menu-close-btn" onclick="event.stopPropagation(); closeSlider()">✕</button>
        </div>
        <div class="slider-menu-body">
    `;
    
    if (isEdit) {
        html += `
            <div class="slider-field">
                <span class="slider-label">📖 Описание</span>
                <textarea id="sliderDescription" rows="2">${ref.description || ''}</textarea>
            </div>
        `;
    } else if (ref.description) {
        html += `
            <div class="slider-field">
                <span class="slider-label">📖 Описание</span>
                <span class="slider-value">${ref.description}</span>
            </div>
        `;
    }
    
    html += `
        <div class="slider-field">
            <span class="slider-label">🏷️ Теги</span>
            <div class="slider-tags">
                ${isEdit ? `
                    <div class="tag-input-wrapper" style="margin-top:4px;">
                        <input id="sliderTagInput" placeholder="Введите тег и нажмите Enter..." onkeydown="addSliderTagFromInput(event)" style="flex:1;background:transparent;border:none;color:var(--text-primary);font-size:13px;outline:none;padding:4px 0;">
                        <div class="selected-tags" id="sliderSelectedTags">
                            ${(ref.tags || []).map(tag => `
                                <span class="tag-item">${tag} <span class="remove-tag" onclick="removeSliderTag(this)">✕</span></span>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="slider-tags-list">
                        ${(ref.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        ${(ref.tags || []).length === 0 ? '<span style="color:#666;font-size:13px;">Нет тегов</span>' : ''}
                    </div>
                `}
            </div>
        </div>
    `;
    
    // СВЯЗИ С КНОПКАМИ ДОБАВЛЕНИЯ
    html += `
        <div class="slider-connections">
            <div class="connection-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="connection-label">💡 Схемы (${schemes.length})</span>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); showAddSchemeToReference('${ref.id}')" style="padding:2px 10px;font-size:11px;width:auto;">➕ Добавить</button>
                </div>
                <div class="connection-items">
                    ${schemes.length > 0 ? schemes.map(s => `
                        <span class="connection-item" style="${isEdit ? 'padding-right:4px;' : ''}" onclick="event.stopPropagation(); showSchemeDetail('${s.id}')">
                            ${s.name}
                            ${isEdit ? `<span class="remove-tag" onclick="event.stopPropagation(); removeSchemeFromReference('${ref.id}','${s.id}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;margin-left:4px;">✕</span>` : ''}
                        </span>
                    `).join('') : '<span style="color:#666;font-size:12px;">Нет привязанных схем</span>'}
                </div>
                ${schemes.length > 0 && !isEdit ? `
                    <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">🖱️ Нажмите на схему для просмотра</div>
                ` : ''}
            </div>
            
            <div class="connection-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="connection-label">📷 Оборудование (${equipment.length})</span>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); showAddEquipmentToReference('${ref.id}')" style="padding:2px 10px;font-size:11px;width:auto;">➕ Добавить</button>
                </div>
                <div class="connection-items">
                    ${equipment.length > 0 ? equipment.map(e => `
                        <span class="connection-item" style="${isEdit ? 'padding-right:4px;' : ''}" onclick="event.stopPropagation(); showEquipmentDetail('${e.id}')">
                            ${e.name}
                            ${isEdit ? `<span class="remove-tag" onclick="event.stopPropagation(); removeEquipmentFromReference('${ref.id}','${e.id}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;margin-left:4px;">✕</span>` : ''}
                        </span>
                    `).join('') : '<span style="color:#666;font-size:12px;">Нет привязанного оборудования</span>'}
                </div>
                ${equipment.length > 0 && !isEdit ? `
                    <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">🖱️ Нажмите на оборудование для просмотра</div>
                ` : ''}
            </div>
            
            <div class="connection-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="connection-label">📋 Шпаргалки (${cheatsheets.length})</span>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); showAddCheatsheetToReference('${ref.id}')" style="padding:2px 10px;font-size:11px;width:auto;">➕ Добавить</button>
                </div>
                <div class="connection-items">
                    ${cheatsheets.length > 0 ? cheatsheets.map(c => `
                        <span class="connection-item" style="${isEdit ? 'padding-right:4px;' : ''}" onclick="event.stopPropagation(); showCheatsheetDetail('${c.id}')">
                            ${c.name}
                            ${isEdit ? `<span class="remove-tag" onclick="event.stopPropagation(); removeCheatsheetFromReference('${ref.id}','${c.id}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;margin-left:4px;">✕</span>` : ''}
                        </span>
                    `).join('') : '<span style="color:#666;font-size:12px;">Нет привязанных шпаргалок</span>'}
                </div>
                ${cheatsheets.length > 0 && !isEdit ? `
                    <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">🖱️ Нажмите на шпаргалку для просмотра</div>
                ` : ''}
            </div>
        </div>
    `;
    
    // ПОДГРУЗКА СХЕМ (полноценные картинки)
    if (schemes.length > 0 && !isEdit) {
        html += `
            <div style="margin-top:12px;border-top:1px solid var(--border-color);padding-top:12px;">
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">💡 Схемы освещения:</div>
                <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;padding-right:4px;">
                    ${schemes.map(s => `
                        <div style="background:var(--bg-input);border-radius:8px;padding:8px;border:1px solid var(--border-color);cursor:pointer;" onclick="showSchemeDetail('${s.id}')">
                            <div style="font-weight:500;font-size:13px;color:var(--text-primary);margin-bottom:4px;">${s.name}</div>
                            ${s.image ? `<img src="${s.image}" style="width:100%;max-height:150px;object-fit:contain;border-radius:4px;">` : ''}
                            ${s.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${truncate(s.description, 60)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="slider-actions">
            <button class="btn btn-sm btn-success" onclick="toggleFavoriteFromSlider()">
                ${ref.isFavorite ? '❤️ В избранном' : '🤍 В избранное'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteReferenceFromSlider()">
                🗑 Удалить
            </button>
        </div>
    `;
    
    html += `</div>`;
    
    menuContent.innerHTML = html;
}

// ================================================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ СВЯЗЕЙ В СЛАЙДЕРЕ
// ================================================================

function showAddSchemeToReference(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>💡 Добавить схему</h2>
            <div class="modal-scroll">
                <div class="checkbox-grid">
                    ${state.schemes.map(s => `
                        <label>
                            <input type="checkbox" value="${s.id}" ${ref.schemeIds.includes(s.id) ? 'checked' : ''}>
                            ${s.name}
                        </label>
                    `).join('')}
                    ${state.schemes.length === 0 ? '<p style="padding:0 20px;color:#666;font-size:13px;">Нет схем. Сначала создайте схему.</p>' : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="saveSchemeLinks('${refId}', this)">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function saveSchemeLinks(refId, btn) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const checkboxes = btn.closest('.modal-content').querySelectorAll('input[type="checkbox"]:checked');
    const schemeIds = [];
    checkboxes.forEach(cb => schemeIds.push(cb.value));
    
    ref.schemeIds = schemeIds;
    saveState();
    
    const modal = btn.closest('.modal-overlay');
    if (modal) modal.classList.remove('show');
    
    renderSliderContent();
    renderSchemes();
    applyFilters();
    showNotification('Схемы обновлены!');
}

function removeSchemeFromReference(refId, schemeId) {
    const ref = getReference(refId);
    if (!ref) return;
    ref.schemeIds = ref.schemeIds.filter(id => id !== schemeId);
    saveState();
    renderSliderContent();
    renderSchemes();
    applyFilters();
}

function showAddEquipmentToReference(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>📷 Добавить оборудование</h2>
            <div class="modal-scroll">
                <div class="checkbox-grid">
                    ${state.equipment.map(e => `
                        <label>
                            <input type="checkbox" value="${e.id}" ${ref.equipmentIds.includes(e.id) ? 'checked' : ''}>
                            ${e.name}
                        </label>
                    `).join('')}
                    ${state.equipment.length === 0 ? '<p style="padding:0 20px;color:#666;font-size:13px;">Нет оборудования. Сначала добавьте оборудование.</p>' : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="saveEquipmentLinks('${refId}', this)">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function saveEquipmentLinks(refId, btn) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const checkboxes = btn.closest('.modal-content').querySelectorAll('input[type="checkbox"]:checked');
    const equipmentIds = [];
    checkboxes.forEach(cb => equipmentIds.push(cb.value));
    
    ref.equipmentIds = equipmentIds;
    saveState();
    
    const modal = btn.closest('.modal-overlay');
    if (modal) modal.classList.remove('show');
    
    renderSliderContent();
    renderEquipment();
    applyFilters();
    showNotification('Оборудование обновлено!');
}

function removeEquipmentFromReference(refId, equipmentId) {
    const ref = getReference(refId);
    if (!ref) return;
    ref.equipmentIds = ref.equipmentIds.filter(id => id !== equipmentId);
    saveState();
    renderSliderContent();
    renderEquipment();
    applyFilters();
}

function showAddCheatsheetToReference(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>📋 Добавить шпаргалку</h2>
            <div class="modal-scroll">
                <div class="checkbox-grid">
                    ${state.cheatsheets.map(c => `
                        <label>
                            <input type="checkbox" value="${c.id}" ${ref.cheatSheetIds.includes(c.id) ? 'checked' : ''}>
                            ${c.name}
                        </label>
                    `).join('')}
                    ${state.cheatsheets.length === 0 ? '<p style="padding:0 20px;color:#666;font-size:13px;">Нет шпаргалок. Сначала создайте шпаргалку.</p>' : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="saveCheatsheetLinks('${refId}', this)">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function saveCheatsheetLinks(refId, btn) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const checkboxes = btn.closest('.modal-content').querySelectorAll('input[type="checkbox"]:checked');
    const cheatSheetIds = [];
    checkboxes.forEach(cb => cheatSheetIds.push(cb.value));
    
    ref.cheatSheetIds = cheatSheetIds;
    saveState();
    
    const modal = btn.closest('.modal-overlay');
    if (modal) modal.classList.remove('show');
    
    renderSliderContent();
    renderCheatsheets();
    applyFilters();
    showNotification('Шпаргалки обновлены!');
}

function removeCheatsheetFromReference(refId, cheatsheetId) {
    const ref = getReference(refId);
    if (!ref) return;
    ref.cheatSheetIds = ref.cheatSheetIds.filter(id => id !== cheatsheetId);
    saveState();
    renderSliderContent();
    renderCheatsheets();
    applyFilters();
}

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ СЛАЙДЕРА
// ================================================================

function toggleSliderMenu() {
    const menu = document.getElementById('sliderMenu');
    sliderMenuOpen = !sliderMenuOpen;
    menu.classList.toggle('open');
}

function toggleSliderEdit() {
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

function saveSliderEdit(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const description = document.getElementById('sliderDescription')?.value?.trim() || '';
    
    const tagContainer = document.getElementById('sliderSelectedTags');
    const tags = [];
    if (tagContainer) {
        tagContainer.querySelectorAll('.tag-item').forEach(item => {
            const text = item.textContent.replace('✕', '').trim();
            if (text) tags.push(text);
        });
    }
    
    updateReference(refId, {
        description: description,
        tags: tags
    });
    
    state.isDetailEdit = false;
    renderSliderContent();
    applyFilters();
    renderReferences();
    showNotification('Референс обновлён!');
}

function addSliderTagFromInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('sliderTagInput');
        const tag = input.value.trim();
        if (tag) {
            const container = document.getElementById('sliderSelectedTags');
            const existing = container.querySelectorAll('.tag-item');
            for (let item of existing) {
                if (item.textContent.replace('✕', '').trim() === tag) {
                    input.value = '';
                    return;
                }
            }
            const tagEl = document.createElement('span');
            tagEl.className = 'tag-item';
            tagEl.innerHTML = `${tag} <span class="remove-tag" onclick="removeSliderTag(this)">✕</span>`;
            container.appendChild(tagEl);
            input.value = '';
        }
    }
}

function removeSliderTag(element) {
    const tagItem = element.closest('.tag-item');
    if (tagItem) tagItem.remove();
}

function toggleFavoriteFromSlider() {
    if (sliderRefs.length === 0 || sliderCurrentIndex < 0 || sliderCurrentIndex >= sliderRefs.length) {
        return;
    }
    const ref = sliderRefs[sliderCurrentIndex];
    toggleFavorite(ref.id);
    renderSliderContent();
    applyFilters();
    renderReferences();
}

function deleteReferenceFromSlider() {
    if (sliderRefs.length === 0 || sliderCurrentIndex < 0 || sliderCurrentIndex >= sliderRefs.length) {
        return;
    }
    const ref = sliderRefs[sliderCurrentIndex];
    if (!confirm(`Удалить "${ref.name}"?`)) return;
    
    deleteReference(ref.id);
    
    sliderRefs = sliderRefs.filter(r => r.id !== ref.id);
    
    if (sliderRefs.length === 0) {
        closeSlider();
        applyFilters();
        renderReferences();
        showNotification('Референс удалён');
        return;
    }
    
    if (sliderCurrentIndex >= sliderRefs.length) {
        sliderCurrentIndex = sliderRefs.length - 1;
    }
    
    renderSliderContent();
    applyFilters();
    renderReferences();
    showNotification('Референс удалён');
}

function sliderPrev() {
    if (sliderRefs.length === 0) return;
    sliderCurrentIndex = (sliderCurrentIndex - 1 + sliderRefs.length) % sliderRefs.length;
    sliderMenuOpen = false;
    document.getElementById('sliderMenu').classList.remove('open');
    renderSliderContent();
}

function sliderNext() {
    if (sliderRefs.length === 0) return;
    sliderCurrentIndex = (sliderCurrentIndex + 1) % sliderRefs.length;
    sliderMenuOpen = false;
    document.getElementById('sliderMenu').classList.remove('open');
    renderSliderContent();
}

function closeSliderAndNavigate(page) {
    closeSlider();
    setTimeout(() => navigateTo(page), 300);
}

document.addEventListener('keydown', function(e) {
    const slider = document.getElementById('sliderOverlay');
    if (!slider.classList.contains('show')) return;
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sliderPrev();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sliderNext();
    } else if (e.key === 'Escape') {
        closeSlider();
    } else if (e.key === ' ') {
        e.preventDefault();
        toggleSliderMenu();
    }
});

let touchStartXSlider = 0;
let touchStartYSlider = 0;
let touchEndXSlider = 0;
let touchEndYSlider = 0;

document.addEventListener('touchstart', function(e) {
    const slider = document.getElementById('sliderOverlay');
    if (!slider.classList.contains('show')) return;
    touchStartXSlider = e.changedTouches[0].screenX;
    touchStartYSlider = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    const slider = document.getElementById('sliderOverlay');
    if (!slider.classList.contains('show')) return;
    touchEndXSlider = e.changedTouches[0].screenX;
    touchEndYSlider = e.changedTouches[0].screenY;
    handleSliderSwipe();
});

function handleSliderSwipe() {
    const diffX = touchStartXSlider - touchEndXSlider;
    const diffY = touchStartYSlider - touchEndYSlider;
    const threshold = 50;
    
    if (Math.abs(diffY) > Math.abs(diffX)) {
        return;
    }
    
    if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
            sliderNext();
        } else {
            sliderPrev();
        }
    }
}

// ================================================================
// МОДАЛКА ДОБАВЛЕНИЯ РЕФЕРЕНСА
// ================================================================

function showAddReferenceModal() {
    document.getElementById('referenceModalTitle').textContent = '➕ Новый референс';
    document.getElementById('editReferenceId').value = '';
    document.getElementById('refName').value = '';
    document.getElementById('refDescription').value = '';
    document.getElementById('refImagePreview').style.display = 'none';
    document.getElementById('refImagePreviewImg').src = '';
    document.getElementById('refImage').value = '';
    document.getElementById('refSelectedTags').innerHTML = '';
    document.getElementById('refFavorite').checked = false;
    document.getElementById('refImageCompressed').value = '';
    
    renderRefCheckboxes();
    document.getElementById('referenceModal').classList.add('show');
}

function renderRefCheckboxes(refId = null) {
    const ref = refId ? getReference(refId) : null;
    
    const schemeContainer = document.getElementById('refSchemeCheckboxes');
    if (state.schemes.length === 0) {
        schemeContainer.innerHTML = '<p style="padding:0 20px;color:#666;font-size:13px;">Нет схем. Сначала создайте схему.</p>';
    } else {
        schemeContainer.innerHTML = `
            <div class="checkbox-grid">
                ${state.schemes.map(s => `
                    <label>
                        <input type="checkbox" value="${s.id}" ${ref && ref.schemeIds?.includes(s.id) ? 'checked' : ''}>
                        ${s.name}
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    const equipmentContainer = document.getElementById('refEquipmentCheckboxes');
    if (state.equipment.length === 0) {
        equipmentContainer.innerHTML = '<p style="padding:0 20px;color:#666;font-size:13px;">Нет оборудования. Сначала добавьте оборудование.</p>';
    } else {
        equipmentContainer.innerHTML = `
            <div class="checkbox-grid">
                ${state.equipment.map(e => `
                    <label>
                        <input type="checkbox" value="${e.id}" ${ref && ref.equipmentIds?.includes(e.id) ? 'checked' : ''}>
                        ${e.name}
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    const cheatsheetContainer = document.getElementById('refCheatsheetCheckboxes');
    if (state.cheatsheets.length === 0) {
        cheatsheetContainer.innerHTML = '<p style="padding:0 20px;color:#666;font-size:13px;">Нет шпаргалок. Сначала создайте шпаргалку.</p>';
    } else {
        cheatsheetContainer.innerHTML = `
            <div class="checkbox-grid">
                ${state.cheatsheets.map(c => `
                    <label>
                        <input type="checkbox" value="${c.id}" ${ref && ref.cheatSheetIds?.includes(c.id) ? 'checked' : ''}>
                        ${c.name}
                    </label>
                `).join('')}
            </div>
        `;
    }
}

function previewReferenceImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    compressImage(file, 1200, 1200, function(compressedBase64) {
        const preview = document.getElementById('refImagePreview');
        const img = document.getElementById('refImagePreviewImg');
        img.src = compressedBase64;
        preview.style.display = 'block';
        document.getElementById('refImageCompressed').value = compressedBase64;
    });
}

function saveReference() {
    const editId = document.getElementById('editReferenceId').value;
    const name = document.getElementById('refName').value.trim();
    const description = document.getElementById('refDescription').value.trim();
    const isFavorite = document.getElementById('refFavorite').checked;
    const imageInput = document.getElementById('refImage');
    const compressedImage = document.getElementById('refImageCompressed')?.value || null;
    const tags = getRefTagsFromModal();
    
    const schemeIds = [];
    document.querySelectorAll('#refSchemeCheckboxes input:checked').forEach(cb => {
        schemeIds.push(cb.value);
    });
    
    const equipmentIds = [];
    document.querySelectorAll('#refEquipmentCheckboxes input:checked').forEach(cb => {
        equipmentIds.push(cb.value);
    });
    
    const cheatSheetIds = [];
    document.querySelectorAll('#refCheatsheetCheckboxes input:checked').forEach(cb => {
        cheatSheetIds.push(cb.value);
    });
    
    if (!name) {
        alert('❌ Введите название референса');
        return;
    }
    
    let image = null;
    
    if (compressedImage) {
        image = compressedImage;
        saveReferenceData(editId, name, description, image, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite);
    } else if (imageInput.files && imageInput.files[0]) {
        compressImage(imageInput.files[0], 1200, 1200, function(compressedBase64) {
            saveReferenceData(editId, name, description, compressedBase64, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite);
        });
    } else if (editId) {
        const existing = getReference(editId);
        image = existing ? existing.image : null;
        saveReferenceData(editId, name, description, image, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite);
    } else {
        saveReferenceData(editId, name, description, null, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite);
    }
}

function saveReferenceData(editId, name, description, image, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite) {
    if (editId) {
        updateReference(editId, {
            name, description, image, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite
        });
        showNotification('Референс обновлён!');
    } else {
        addReference({
            name, description, image, tags, schemeIds, equipmentIds, cheatSheetIds, isFavorite
        });
        showNotification('Референс добавлен!');
    }
    
    closeReferenceModal();
    applyFilters();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
}

function closeReferenceModal() {
    document.getElementById('referenceModal').classList.remove('show');
    document.getElementById('refImageCompressed').value = '';
}
