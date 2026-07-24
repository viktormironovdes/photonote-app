// ================================================================
// РАБОТА С ОБОРУДОВАНИЕМ
// ================================================================

function renderEquipment() {
    const container = document.getElementById('equipmentList');
    
    const searchInput = document.getElementById('equipmentSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = state.equipment;
    if (searchQuery) {
        filtered = state.equipment.filter(e => {
            const searchable = (e.name + ' ' + e.specs + ' ' + e.type).toLowerCase();
            return searchable.includes(searchQuery);
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📷</span>
                <p>${state.equipment.length === 0 ? 'Нет оборудования' : 'Ничего не найдено'}</p>
                <p class="sub">${state.equipment.length === 0 ? 'Добавьте камеры, объективы и свет' : 'Попробуйте другой поиск'}</p>
                <button class="btn" onclick="showAddEquipmentModal()" style="margin-top:12px;max-width:280px;margin-left:auto;margin-right:auto;">➕ Добавить оборудование</button>
            </div>
        `;
        return;
    }
    
    const typeIcons = {
        camera: '📷',
        lens: '🔭',
        light: '💡',
        accessory: '🔧'
    };
    
    // Список вместо карточек
    container.innerHTML = filtered.map(eq => {
        const count = state.references.filter(r => r.equipmentIds.includes(eq.id)).length;
        return `
            <div class="list-item" onclick="showEquipmentDetail('${eq.id}')" style="background:var(--bg-card);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:12px;">
                <div style="font-size:24px;flex-shrink:0;">${typeIcons[eq.type] || '📷'}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:15px;color:var(--text-primary);">${eq.name}</div>
                    <div style="font-size:13px;color:var(--text-muted);">${eq.type} ${eq.specs ? '· ' + truncate(eq.specs, 30) : ''}</div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);flex-shrink:0;">📸 ${count}</div>
            </div>
        `;
    }).join('');
}

function showAddEquipmentModal() {
    document.getElementById('equipmentModalTitle').textContent = '📷 Новое оборудование';
    document.getElementById('editEquipmentId').value = '';
    document.getElementById('equipmentType').value = 'camera';
    document.getElementById('equipmentName').value = '';
    document.getElementById('equipmentSpecs').value = '';
    document.getElementById('equipmentImagePreview').style.display = 'none';
    document.getElementById('equipmentImagePreviewImg').src = '';
    document.getElementById('equipmentImage').value = '';
    
    document.getElementById('equipmentModal').classList.add('show');
}

function previewEquipmentImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('equipmentImagePreview');
        const img = document.getElementById('equipmentImagePreviewImg');
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function saveEquipment() {
    const editId = document.getElementById('editEquipmentId').value;
    const type = document.getElementById('equipmentType').value;
    const name = document.getElementById('equipmentName').value.trim();
    const specs = document.getElementById('equipmentSpecs').value.trim();
    const imageInput = document.getElementById('equipmentImage');
    
    if (!name) {
        alert('❌ Введите название модели');
        return;
    }
    
    let image = null;
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image = e.target.result;
            saveEquipmentData(editId, type, name, specs, image);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else if (editId) {
        const existing = getEquipment(editId);
        image = existing ? existing.image : null;
        saveEquipmentData(editId, type, name, specs, image);
    } else {
        saveEquipmentData(editId, type, name, specs, null);
    }
}

function saveEquipmentData(editId, type, name, specs, image) {
    if (editId) {
        updateEquipment(editId, { type, name, specs, image });
        showNotification('Оборудование обновлено!');
    } else {
        addEquipment({ type, name, specs, image });
        showNotification('Оборудование добавлено!');
    }
    
    closeEquipmentModal();
    renderEquipment();
    renderReferences();
}

function closeEquipmentModal() {
    document.getElementById('equipmentModal').classList.remove('show');
}

function showEquipmentDetail(equipmentId) {
    const eq = getEquipment(equipmentId);
    if (!eq) return;
    
    const refs = state.references.filter(r => r.equipmentIds.includes(eq.id));
    const typeIcons = {
        camera: '📷',
        lens: '🔭',
        light: '💡',
        accessory: '🔧'
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'equipmentDetailModal';
    overlay.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0 20px;flex-shrink:0;">
                <h2 style="margin:0;">${typeIcons[eq.type] || '📷'} ${eq.name}</h2>
                <div>
                    <button class="edit-toggle" onclick="editEquipmentFromDetail('${eq.id}')" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px 8px;">✏️</button>
                    <button class="edit-toggle" onclick="this.closest('.modal-overlay').classList.remove('show')" style="background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;">✕</button>
                </div>
            </div>
            <div class="modal-scroll" style="padding:0 20px 20px 20px;">
                ${eq.image ? `<img src="${eq.image}" style="width:100%;max-height:250px;object-fit:contain;border-radius:12px;margin-bottom:12px;">` : ''}
                <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;">
                    <span style="color:var(--text-muted);">Тип:</span> ${eq.type}
                </div>
                ${eq.specs ? `<div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px;">${eq.specs}</div>` : ''}
                <div style="font-size:13px;color:var(--text-muted);">
                    📸 Используется в ${refs.length} референсах
                </div>
                ${refs.length > 0 ? `
                    <div style="margin-top:8px;font-size:13px;color:var(--text-secondary);">
                        <div style="font-weight:500;margin-bottom:4px;">Связанные референсы:</div>
                        ${refs.map(r => `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="closeEquipmentModalAndShowDetail('${r.id}')">📸 ${r.name}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Закрыть</button>
                <button class="btn btn-danger-action" onclick="deleteEquipmentFromModal('${eq.id}')">🗑 Удалить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
}

function editEquipmentFromDetail(equipmentId) {
    const eq = getEquipment(equipmentId);
    if (!eq) return;
    
    const modal = document.getElementById('equipmentDetailModal');
    if (modal) modal.classList.remove('show');
    
    document.getElementById('equipmentModalTitle').textContent = '✏️ Редактировать оборудование';
    document.getElementById('editEquipmentId').value = eq.id;
    document.getElementById('equipmentType').value = eq.type;
    document.getElementById('equipmentName').value = eq.name;
    document.getElementById('equipmentSpecs').value = eq.specs || '';
    document.getElementById('equipmentImagePreview').style.display = eq.image ? 'block' : 'none';
    if (eq.image) {
        document.getElementById('equipmentImagePreviewImg').src = eq.image;
    }
    document.getElementById('equipmentImage').value = '';
    
    document.getElementById('equipmentModal').classList.add('show');
}

function deleteEquipmentFromModal(equipmentId) {
    if (!confirm('Удалить это оборудование? Это также отвяжет его от всех референсов.')) return;
    deleteEquipment(equipmentId);
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) modal.classList.remove('show');
    renderEquipment();
    renderReferences();
    showNotification('Оборудование удалено');
}

function closeEquipmentModalAndShowDetail(refId) {
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) modal.classList.remove('show');
    openReferenceSlider(refId);
}
