// ================================================================
// РАБОТА СО СХЕМАМИ СВЕТА
// ================================================================

function renderSchemes() {
    const container = document.getElementById('schemesList');
    
    const searchInput = document.getElementById('schemesSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = state.schemes;
    if (searchQuery) {
        filtered = state.schemes.filter(s => {
            const searchable = (s.name + ' ' + (s.tags || []).join(' ')).toLowerCase();
            return searchable.includes(searchQuery);
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">💡</span>
                <p>${state.schemes.length === 0 ? 'Нет схем света' : 'Ничего не найдено'}</p>
                <p class="sub">${state.schemes.length === 0 ? 'Создайте свою первую схему' : 'Попробуйте другой поиск'}</p>
                <button class="btn" onclick="showAddSchemeModal()" style="margin-top:12px;max-width:280px;margin-left:auto;margin-right:auto;">➕ Добавить схему</button>
            </div>
        `;
        return;
    }
    
    // Используем ТУ ЖЕ сетку, что и для референсов
    container.innerHTML = filtered.map(scheme => {
        const count = getReferenceCountForScheme(scheme.id);
        return `
            <div class="reference-card" onclick="showSchemeDetail('${scheme.id}')">
                <div class="image-wrapper">
                    ${scheme.image ? `<img src="${scheme.image}" alt="${scheme.name}">` : `<div class="no-photo">💡</div>`}
                </div>
                <div class="info">
                    <div class="title">${scheme.name}</div>
                    <div class="tags">
                        ${(scheme.tags || []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        ${(scheme.tags || []).length > 2 ? `<span class="tag">+${(scheme.tags || []).length - 2}</span>` : ''}
                    </div>
                    <div class="meta">
                        <span>📸 ${count} референсов</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddSchemeModal() {
    document.getElementById('schemeModalTitle').textContent = '💡 Новая схема света';
    document.getElementById('editSchemeId').value = '';
    document.getElementById('schemeName').value = '';
    document.getElementById('schemeDescription').value = '';
    document.getElementById('schemeImagePreview').style.display = 'none';
    document.getElementById('schemeImagePreviewImg').src = '';
    document.getElementById('schemeImage').value = '';
    document.getElementById('schemeSelectedTags').innerHTML = '';
    
    document.getElementById('schemeModal').classList.add('show');
}

function previewSchemeImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('schemeImagePreview');
        const img = document.getElementById('schemeImagePreviewImg');
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function saveScheme() {
    const editId = document.getElementById('editSchemeId').value;
    const name = document.getElementById('schemeName').value.trim();
    const description = document.getElementById('schemeDescription').value.trim();
    const tags = getSchemeTagsFromModal();
    const imageInput = document.getElementById('schemeImage');
    
    if (!name) {
        alert('❌ Введите название схемы');
        return;
    }
    
    let image = null;
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image = e.target.result;
            saveSchemeData(editId, name, description, image, tags);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else if (editId) {
        const existing = getScheme(editId);
        image = existing ? existing.image : null;
        saveSchemeData(editId, name, description, image, tags);
    } else {
        saveSchemeData(editId, name, description, null, tags);
    }
}

function saveSchemeData(editId, name, description, image, tags) {
    if (editId) {
        updateScheme(editId, { name, description, image, tags });
        showNotification('Схема обновлена!');
    } else {
        addScheme({ name, description, image, tags });
        showNotification('Схема добавлена!');
    }
    
    closeSchemeModal();
    renderSchemes();
    renderReferences();
}

function closeSchemeModal() {
    document.getElementById('schemeModal').classList.remove('show');
}

function showSchemeDetail(schemeId) {
    const scheme = getScheme(schemeId);
    if (!scheme) return;
    
    const count = getReferenceCountForScheme(schemeId);
    const refs = state.references.filter(r => r.schemeIds.includes(schemeId));
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'schemeDetailModal';
    overlay.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0 20px;flex-shrink:0;">
                <h2 style="margin:0;">💡 ${scheme.name}</h2>
                <div>
                    <button class="edit-toggle" onclick="editSchemeFromDetail('${scheme.id}')" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px 8px;">✏️</button>
                    <button class="edit-toggle" onclick="this.closest('.modal-overlay').classList.remove('show')" style="background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;">✕</button>
                </div>
            </div>
            <div class="modal-scroll" style="padding:0 20px 20px 20px;">
                ${scheme.image ? `<img src="${scheme.image}" style="width:100%;max-height:300px;object-fit:contain;border-radius:12px;margin-bottom:12px;">` : ''}
                <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px;">${scheme.description || 'Нет описания'}</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
                    ${(scheme.tags || []).map(tag => `<span class="tag" style="background:var(--bg-hover);padding:2px 10px;border-radius:16px;font-size:12px;color:var(--text-muted);border:1px solid var(--border-color);">${tag}</span>`).join('')}
                    ${(scheme.tags || []).length === 0 ? '<span style="color:#666;font-size:13px;">Нет тегов</span>' : ''}
                </div>
                <div style="font-size:13px;color:var(--text-muted);">
                    📸 Используется в ${count} референсах
                </div>
                ${refs.length > 0 ? `
                    <div style="margin-top:8px;font-size:13px;color:var(--text-secondary);">
                        <div style="font-weight:500;margin-bottom:4px;">Связанные референсы:</div>
                        ${refs.map(r => `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="closeSchemeModalAndShowDetail('${r.id}')">📸 ${r.name}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Закрыть</button>
                <button class="btn btn-danger-action" onclick="deleteSchemeFromModal('${scheme.id}')">🗑 Удалить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
}

function editSchemeFromDetail(schemeId) {
    const scheme = getScheme(schemeId);
    if (!scheme) return;
    
    const modal = document.getElementById('schemeDetailModal');
    if (modal) modal.classList.remove('show');
    
    document.getElementById('schemeModalTitle').textContent = '✏️ Редактировать схему';
    document.getElementById('editSchemeId').value = scheme.id;
    document.getElementById('schemeName').value = scheme.name;
    document.getElementById('schemeDescription').value = scheme.description || '';
    document.getElementById('schemeImagePreview').style.display = scheme.image ? 'block' : 'none';
    if (scheme.image) {
        document.getElementById('schemeImagePreviewImg').src = scheme.image;
    }
    document.getElementById('schemeImage').value = '';
    
    const tagContainer = document.getElementById('schemeSelectedTags');
    tagContainer.innerHTML = '';
    (scheme.tags || []).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.innerHTML = `${tag} <span class="remove-tag" onclick="removeSchemeTag(this)">✕</span>`;
        tagContainer.appendChild(tagEl);
    });
    
    document.getElementById('schemeModal').classList.add('show');
}

function deleteSchemeFromModal(schemeId) {
    if (!confirm('Удалить эту схему? Это также отвяжет её от всех референсов.')) return;
    deleteScheme(schemeId);
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) modal.classList.remove('show');
    renderSchemes();
    renderReferences();
    showNotification('Схема удалена');
}

function closeSchemeModalAndShowDetail(refId) {
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) modal.classList.remove('show');
    openReferenceSlider(refId);
}
