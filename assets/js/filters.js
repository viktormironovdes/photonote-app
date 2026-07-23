// ================================================================
// ФИЛЬТРАЦИЯ И ПОИСК РЕФЕРЕНСОВ
// ================================================================

function applyFilters() {
    const searchQuery = document.getElementById('referencesSearch')?.value?.toLowerCase() || '';
    state.searchQuery = searchQuery;
    
    const tagItems = document.querySelectorAll('#selectedTags .tag-item');
    const selectedTags = [];
    tagItems.forEach(item => {
        const text = item.textContent.replace('✕', '').trim();
        if (text) selectedTags.push(text);
    });
    state.selectedTags = selectedTags;
    
    let filtered = state.references.filter(ref => {
        if (searchQuery) {
            const searchable = (ref.name + ' ' + ref.description).toLowerCase();
            if (!searchable.includes(searchQuery)) return false;
        }
        
        if (selectedTags.length > 0) {
            const refTags = ref.tags || [];
            const hasAllTags = selectedTags.every(tag => refTags.includes(tag));
            if (!hasAllTags) return false;
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