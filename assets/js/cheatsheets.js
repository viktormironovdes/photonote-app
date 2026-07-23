// ================================================================
// РАБОТА СО ШПАРГАЛКАМИ
// ================================================================

function renderCheatsheets() {
    const container = document.getElementById('cheatsheetsList');
    
    if (state.cheatsheets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📋</span>
                <p>Нет шпаргалок</p>
                <p class="sub">Создайте памятки и таблицы</p>
            </div>
        `;
        return;
    }
    
    const typeIcons = {
        table: '📊',
        text: '📝',
        infographic: '🖼️'
    };
    
    container.innerHTML = state.cheatsheets.map(cs => {
        const count = state.references.filter(r => r.cheatSheetIds.includes(cs.id)).length;
        return `
            <div class="reference-card" onclick="showCheatsheetDetail('${cs.id}')">
                <div class="image-wrapper">
                    ${cs.image ? `<img src="${cs.image}" alt="${cs.name}">` : `<div class="no-photo">${typeIcons[cs.type] || '📋'}</div>`}
                </div>
                <div class="info">
                    <div class="title">${cs.name}</div>
                    <div class="tags">
                        <span class="tag">${cs.type}</span>
                    </div>
                    <div class="meta">
                        <span>📸 ${count} референсов</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddCheatsheetModal() {
    document.getElementById('cheatsheetModalTitle').textContent = '📋 Новая шпаргалка';
    document.getElementById('editCheatsheetId').value = '';
    document.getElementById('cheatsheetName').value = '';
    document.getElementById('cheatsheetType').value = 'text';
    document.getElementById('cheatsheetText').value = '';
    document.getElementById('cheatsheetImagePreview').style.display = 'none';
    document.getElementById('cheatsheetImage').value = '';
    
    document.getElementById('cheatsheetModal').classList.add('show');
}

function previewCheatsheetImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('cheatsheetImagePreview');
        const img = document.getElementById('cheatsheetImagePreviewImg');
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function saveCheatsheet() {
    const editId = document.getElementById('editCheatsheetId').value;
    const name = document.getElementById('cheatsheetName').value.trim();
    const type = document.getElementById('cheatsheetType').value;
    const content = document.getElementById('cheatsheetText').value.trim();
    const imageInput = document.getElementById('cheatsheetImage');
    
    if (!name) {
        alert('❌ Введите название шпаргалки');
        return;
    }
    
    let image = null;
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image = e.target.result;
            saveCheatsheetData(editId, name, type, content, image);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else if (editId) {
        const existing = getCheatsheet(editId);
        image = existing ? existing.image : null;
        saveCheatsheetData(editId, name, type, content, image);
    } else {
        saveCheatsheetData(editId, name, type, content, null);
    }
}

function saveCheatsheetData(editId, name, type, content, image) {
    if (editId) {
        updateCheatsheet(editId, { name, type, content, image });
        showNotification('Шпаргалка обновлена!');
    } else {
        addCheatsheet({ name, type, content, image });
        showNotification('Шпаргалка добавлена!');
    }
    
    closeCheatsheetModal();
    renderCheatsheets();
    renderReferences();
}

function closeCheatsheetModal() {
    document.getElementById('cheatsheetModal').classList.remove('show');
}

function showCheatsheetDetail(cheatsheetId) {
    const cs = getCheatsheet(cheatsheetId);
    if (!cs) return;
    
    const refs = state.references.filter(r => r.cheatSheetIds.includes(cs.id));
    const typeIcons = {
        table: '📊',
        text: '📝',
        infographic: '🖼️'
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0 20px;flex-shrink:0;">
                <h2 style="margin:0;">${typeIcons[cs.type] || '📋'} ${cs.name}</h2>
                <button class="edit-toggle" onclick="this.closest('.modal-overlay').classList.remove('show')" style="background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;">✕</button>
            </div>
            <div class="modal-scroll" style="padding:0 20px 20px 20px;">
                ${cs.image ? `<img src="${cs.image}" style="width:100%;max-height:300px;object-fit:contain;border-radius:12px;margin-bottom:12px;">` : ''}
                <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;">
                    <span style="color:var(--text-muted);">Тип:</span> ${cs.type}
                </div>
                ${cs.content ? `
                    <div style="font-size:14px;color:var(--text-primary);background:var(--bg-input);padding:12px;border-radius:10px;margin:8px 0;white-space:pre-wrap;border:1px solid var(--border-color);">
                        ${cs.content}
                    </div>
                ` : ''}
                <div style="font-size:13px;color:var(--text-muted);">
                    📸 Используется в ${refs.length} референсах
                </div>
                ${refs.length > 0 ? `
                    <div style="margin-top:8px;font-size:13px;color:var(--text-secondary);">
                        <div style="font-weight:500;margin-bottom:4px;">Связанные референсы:</div>
                        ${refs.map(r => `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="closeModalAndShowDetail('${r.id}')">📸 ${r.name}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Закрыть</button>
                <button class="btn btn-danger-action" onclick="deleteCheatsheetFromModal('${cs.id}')">🗑 Удалить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
}

function deleteCheatsheetFromModal(cheatsheetId) {
    if (!confirm('Удалить эту шпаргалку? Это также отвяжет её от всех референсов.')) return;
    deleteCheatsheet(cheatsheetId);
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) modal.classList.remove('show');
    renderCheatsheets();
    renderReferences();
    showNotification('Шпаргалка удалена');
}