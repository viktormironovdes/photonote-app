// ================================================================
// ФИЛЬТРАЦИЯ, ПОИСК И NSFW-ФИЛЬТР
// ================================================================

// ================================================================
// ГЛОБАЛЬНЫЙ ПОИСК (НА ГЛАВНОМ ЭКРАНЕ КОЛЛЕКЦИЙ)
// ================================================================

function applyFilters() {
    const searchQuery = document.getElementById('referencesSearch')?.value?.toLowerCase() || '';
    state.searchQuery = searchQuery;
    
    // Теги
    const tagItems = document.querySelectorAll('#selectedTags .tag-item');
    const selectedTags = [];
    tagItems.forEach(item => {
        const text = item.textContent.replace('✕', '').trim();
        if (text) selectedTags.push(text);
    });
    state.selectedTags = selectedTags;
    
    // Фильтры портретов
    const portraitType = document.getElementById('filterPortraitType')?.value || 'all';
    const colorType = document.getElementById('filterColorType')?.value || 'all';
    const framing = document.getElementById('filterFraming')?.value || 'all';
    const pose = document.getElementById('filterPose')?.value || 'all';
    
    state.filters.portraitType = portraitType;
    state.filters.colorType = colorType;
    state.filters.framing = framing;
    state.filters.pose = pose;
    
    // NSFW-фильтр (по умолчанию выключен)
    const nsfwEnabled = document.getElementById('filterNSFW')?.checked || false;
    state.isNSFWEnabled = nsfwEnabled;
    
    let filtered = state.references.filter(ref => {
        // Поиск по названию и описанию
        if (searchQuery) {
            const searchable = (ref.name + ' ' + ref.description + ' ' + (ref.tags || []).join(' ')).toLowerCase();
            if (!searchable.includes(searchQuery)) return false;
        }
        
        // Фильтр по тегам (AND - должны быть ВСЕ выбранные теги)
        if (selectedTags.length > 0) {
            const refTags = ref.tags || [];
            const hasAllTags = selectedTags.every(tag => refTags.includes(tag));
            if (!hasAllTags) return false;
        }
        
        // Фильтр по типу портрета
        if (portraitType !== 'all' && ref.portraitType !== portraitType) {
            return false;
        }
        
        // Фильтр по цветности
        if (colorType !== 'all' && ref.colorType !== colorType) {
            return false;
        }
        
        // Фильтр по кадрированию
        if (framing !== 'all' && ref.framing !== framing) {
            return false;
        }
        
        // Фильтр по позе
        if (pose !== 'all' && ref.pose !== pose) {
            return false;
        }
        
        // NSFW-фильтр (если выключен — скрываем NSFW-референсы)
        if (!nsfwEnabled && ref.isNSFW) {
            return false;
        }
        
        return true;
    });
    
    state.filteredReferences = filtered;
    
    // Рендерим результаты на главном экране коллекций
    renderGlobalSearchResults(filtered);
    updateFilterCount(filtered.length);
}

// ================================================================
// ОТРИСОВКА РЕЗУЛЬТАТОВ ГЛОБАЛЬНОГО ПОИСКА
// ================================================================

function renderGlobalSearchResults(filtered) {
    const container = document.getElementById('globalSearchResults');
    if (!container) return;
    
    // Если поиск пустой — показываем коллекции
    if (!state.searchQuery && state.selectedTags.length === 0 && 
        state.filters.portraitType === 'all' && state.filters.colorType === 'all' &&
        state.filters.framing === 'all' && state.filters.pose === 'all') {
        container.innerHTML = '';
        renderCollections();
        return;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">🔍</span>
                <p>Ничего не найдено</p>
                <p class="sub">Попробуйте изменить параметры поиска</p>
            </div>
        `;
        // Скрываем коллекции
        document.getElementById('collectionsGrid').innerHTML = '';
        return;
    }
    
    // Группируем по коллекциям
    const grouped = {};
    filtered.forEach(ref => {
        const colId = ref.collectionId || 'unknown';
        if (!grouped[colId]) grouped[colId] = [];
        grouped[colId].push(ref);
    });
    
    let html = `
        <div style="margin-bottom:12px;font-size:14px;color:var(--text-muted);">
            🔍 Найдено ${filtered.length} референсов в ${Object.keys(grouped).length} коллекциях
            ${state.isNSFWEnabled ? ' (🔞 NSFW показаны)' : ''}
        </div>
    `;
    
    // Сортируем коллекции по названию
    const sortedColIds = Object.keys(grouped).sort((a, b) => {
        const colA = getCollection(a);
        const colB = getCollection(b);
        const nameA = colA ? colA.name : 'Без коллекции';
        const nameB = colB ? colB.name : 'Без коллекции';
        return nameA.localeCompare(nameB);
    });
    
    sortedColIds.forEach(colId => {
        const collection = getCollection(colId);
        const refs = grouped[colId];
        const colName = collection ? collection.name : 'Без коллекции';
        const colIcon = collection ? '📁' : '📂';
        
        html += `
            <div style="margin-bottom:16px;background:var(--bg-card);border-radius:var(--radius);padding:12px;border:1px solid var(--border-color);">
                <div style="font-weight:600;font-size:15px;color:var(--text-primary);margin-bottom:8px;cursor:pointer;" onclick="${collection ? `openCollection('${colId}')` : ''}">
                    ${colIcon} ${colName} (${refs.length})
                </div>
                <div class="references-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
                    ${refs.map(ref => `
                        <div class="reference-card" onclick="openReferenceSlider('${ref.id}')" style="cursor:pointer;">
                            <div class="image-wrapper">
                                ${ref.image ? `<img src="${ref.image}" alt="${ref.name}" loading="lazy">` : `<div class="no-photo">📸</div>`}
                                ${ref.isFavorite ? '<span class="favorite-badge">❤️</span>' : ''}
                                ${ref.isNSFW ? '<span class="nsfw-badge" style="position:absolute;bottom:8px;left:8px;background:rgba(200,50,50,0.85);color:#fff;padding:2px 8px;border-radius:12px;font-size:10px;z-index:2;">🔞</span>' : ''}
                            </div>
                            <div class="info">
                                <div class="title">${ref.name}</div>
                                <div class="tags">
                                    ${(ref.tags || []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                                    ${(ref.tags || []).length > 2 ? `<span class="tag">+${(ref.tags || []).length - 2}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    // Скрываем коллекции
    document.getElementById('collectionsGrid').innerHTML = '';
}

// ================================================================
// ПОИСК ВНУТРИ КОЛЛЕКЦИИ
// ================================================================

function applyCollectionFilters() {
    const searchInput = document.getElementById('collectionSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    const collectionId = state.currentCollectionId;
    const collection = getCollection(collectionId);
    if (!collection) return;
    
    let refs = getReferencesByCollection(collectionId);
    
    if (searchQuery) {
        refs = refs.filter(r => {
            const searchable = (r.name + ' ' + r.description + ' ' + (r.tags || []).join(' ')).toLowerCase();
            return searchable.includes(searchQuery);
        });
    }
    
    // Рендерим внутри коллекции
    const container = document.getElementById('collectionReferencesGrid');
    if (!container) return;
    
    if (refs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:30px 20px;">
                <span class="icon-big">📸</span>
                <p>${searchQuery ? 'Ничего не найдено' : 'Нет референсов в этой коллекции'}</p>
                <p class="sub">${searchQuery ? 'Попробуйте другой поиск' : 'Добавьте первый референс'}</p>
                ${!searchQuery ? `<button class="btn" onclick="addReferenceToCollection('${collectionId}')" style="margin-top:8px;max-width:200px;">➕ Добавить референс</button>` : ''}
            </div>
        `;
        return;
    }
    
    const typeIcons = {
        single: '👤',
        pair: '👥',
        group: '👥'
    };
    const colorIcons = {
        color: '🌈',
        bw: '⚫'
    };
    const framingIcons = {
        head: '👤',
        bust: '👤',
        waist: '👤',
        knee: '👤',
        full: '👤'
    };
    const poseIcons = {
        standing: '🧍',
        sitting: '🪑',
        lying: '🛌',
        moving: '🏃',
        mixed: '🔄'
    };
    
    container.innerHTML = refs.map(ref => `
        <div class="reference-card" onclick="openReferenceSlider('${ref.id}')">
            <div class="image-wrapper">
                ${ref.image ? `<img src="${ref.image}" alt="${ref.name}" loading="lazy">` : `<div class="no-photo">📸</div>`}
                ${ref.isFavorite ? '<span class="favorite-badge">❤️</span>' : ''}
                ${ref.isNSFW ? '<span class="nsfw-badge" style="position:absolute;bottom:8px;left:8px;background:rgba(200,50,50,0.85);color:#fff;padding:2px 8px;border-radius:12px;font-size:10px;z-index:2;">🔞</span>' : ''}
            </div>
            <div class="info">
                <div class="title">${ref.name}</div>
                <div class="tags">
                    ${(ref.tags || []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    ${(ref.tags || []).length > 2 ? `<span class="tag">+${(ref.tags || []).length - 2}</span>` : ''}
                </div>
                <div class="meta">
                    <span>${typeIcons[ref.portraitType] || '👤'}</span>
                    <span>${colorIcons[ref.colorType] || '🌈'}</span>
                    <span>${framingIcons[ref.framing] || '📐'}</span>
                    <span>${poseIcons[ref.pose] || '🧍'}</span>
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

// ================================================================
// ТЕГИ (глобальные фильтры)
// ================================================================

function addTagFromInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('tagInput');
        const tag = input.value.trim();
        if (tag) {
            addTag(tag);
            input.value = '';
        }
    }
}

function addTag(tag) {
    const container = document.getElementById('selectedTags');
    const existing = container.querySelectorAll('.tag-item');
    for (let item of existing) {
        if (item.textContent.replace('✕', '').trim() === tag) {
            return;
        }
    }
    
    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.innerHTML = `${tag} <span class="remove-tag" onclick="removeTag(this)">✕</span>`;
    container.appendChild(tagEl);
    
    applyFilters();
}

function removeTag(element) {
    const tagItem = element.closest('.tag-item');
    if (tagItem) {
        tagItem.remove();
        applyFilters();
    }
}

function clearAllFilters() {
    document.getElementById('referencesSearch').value = '';
    document.getElementById('selectedTags').innerHTML = '';
    state.selectedTags = [];
    state.searchQuery = '';
    
    // Сбрасываем фильтры портретов
    const portraitTypeSelect = document.getElementById('filterPortraitType');
    const colorTypeSelect = document.getElementById('filterColorType');
    const framingSelect = document.getElementById('filterFraming');
    const poseSelect = document.getElementById('filterPose');
    const nsfwCheckbox = document.getElementById('filterNSFW');
    
    if (portraitTypeSelect) portraitTypeSelect.value = 'all';
    if (colorTypeSelect) colorTypeSelect.value = 'all';
    if (framingSelect) framingSelect.value = 'all';
    if (poseSelect) poseSelect.value = 'all';
    if (nsfwCheckbox) nsfwCheckbox.checked = false;
    
    state.filters.portraitType = 'all';
    state.filters.colorType = 'all';
    state.filters.framing = 'all';
    state.filters.pose = 'all';
    state.isNSFWEnabled = false;
    
    applyFilters();
}

// ================================================================
// ТЕГИ В МОДАЛКЕ РЕФЕРЕНСА
// ================================================================

function addRefTagFromInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('refTagInput');
        const tag = input.value.trim();
        if (tag) {
            addRefTag(tag);
            input.value = '';
        }
    }
}

function addRefTag(tag) {
    const container = document.getElementById('refSelectedTags');
    const existing = container.querySelectorAll('.tag-item');
    for (let item of existing) {
        if (item.textContent.replace('✕', '').trim() === tag) {
            return;
        }
    }
    
    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.innerHTML = `${tag} <span class="remove-tag" onclick="removeRefTag(this)">✕</span>`;
    container.appendChild(tagEl);
}

function removeRefTag(element) {
    const tagItem = element.closest('.tag-item');
    if (tagItem) tagItem.remove();
}

function getRefTagsFromModal() {
    const container = document.getElementById('refSelectedTags');
    const tags = [];
    container.querySelectorAll('.tag-item').forEach(item => {
        const text = item.textContent.replace('✕', '').trim();
        if (text) tags.push(text);
    });
    return tags;
}

// ================================================================
// ТЕГИ В МОДАЛКЕ СХЕМЫ
// ================================================================

function addSchemeTagFromInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('schemeTagInput');
        const tag = input.value.trim();
        if (tag) {
            addSchemeTag(tag);
            input.value = '';
        }
    }
}

function addSchemeTag(tag) {
    const container = document.getElementById('schemeSelectedTags');
    const existing = container.querySelectorAll('.tag-item');
    for (let item of existing) {
        if (item.textContent.replace('✕', '').trim() === tag) {
            return;
        }
    }
    
    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.innerHTML = `${tag} <span class="remove-tag" onclick="removeSchemeTag(this)">✕</span>`;
    container.appendChild(tagEl);
}

function removeSchemeTag(element) {
    const tagItem = element.closest('.tag-item');
    if (tagItem) tagItem.remove();
}

function getSchemeTagsFromModal() {
    const container = document.getElementById('schemeSelectedTags');
    const tags = [];
    container.querySelectorAll('.tag-item').forEach(item => {
        const text = item.textContent.replace('✕', '').trim();
        if (text) tags.push(text);
    });
    return tags;
}
