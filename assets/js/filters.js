// ================================================================
// ФИЛЬТРАЦИЯ И ПОИСК РЕФЕРЕНСОВ
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
    
    // НОВЫЕ ФИЛЬТРЫ ДЛЯ ПОРТРЕТОВ
    const portraitType = document.getElementById('filterPortraitType')?.value || 'all';
    const colorType = document.getElementById('filterColorType')?.value || 'all';
    const framing = document.getElementById('filterFraming')?.value || 'all';
    const pose = document.getElementById('filterPose')?.value || 'all';
    
    state.filters.portraitType = portraitType;
    state.filters.colorType = colorType;
    state.filters.framing = framing;
    state.filters.pose = pose;
    
    let filtered = state.references.filter(ref => {
        // Поиск по названию и описанию
        if (searchQuery) {
            const searchable = (ref.name + ' ' + ref.description).toLowerCase();
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
        
        return true;
    });
    
    state.filteredReferences = filtered;
    renderReferences(filtered);
    updateFilterCount(filtered.length);
}

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
    
    if (portraitTypeSelect) portraitTypeSelect.value = 'all';
    if (colorTypeSelect) colorTypeSelect.value = 'all';
    if (framingSelect) framingSelect.value = 'all';
    if (poseSelect) poseSelect.value = 'all';
    
    state.filters.portraitType = 'all';
    state.filters.colorType = 'all';
    state.filters.framing = 'all';
    state.filters.pose = 'all';
    
    applyFilters();
}

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
