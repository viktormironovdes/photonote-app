// ================================================================
// РАБОТА С КОЛЛЕКЦИЯМИ
// ================================================================

let selectedCoverImage = null;

// ================================================================
// РЕНДЕРИНГ СПИСКА КОЛЛЕКЦИЙ (ГЛАВНЫЙ ЭКРАН)
// ================================================================

function renderCollections() {
    const container = document.getElementById('collectionsGrid');
    if (!container) return;
    
    if (state.collections.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📁</span>
                <p>Нет коллекций</p>
                <p class="sub">Создайте свою первую коллекцию</p>
                <button class="btn" onclick="showAddCollectionModal()" style="margin-top:12px;max-width:280px;margin-left:auto;margin-right:auto;">➕ Создать коллекцию</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.collections.map(collection => {
        const refs = getReferencesByCollection(collection.id);
        const count = refs.length;
        const nsfwCount = refs.filter(r => r.isNSFW).length;
        const coverImage = getCollectionCover(collection);
        
        return `
            <div class="collection-card" onclick="openCollection('${collection.id}')">
                <div class="collection-cover" style="background-image: url('${coverImage || ''}');">
                    ${!coverImage ? `<div class="collection-cover-placeholder">📁</div>` : ''}
                    <div class="collection-cover-overlay">
                        <div class="collection-name">${collection.name}</div>
                        <div class="collection-meta">
                            <span>📸 ${count} референсов</span>
                            ${nsfwCount > 0 ? `<span class="nsfw-badge">🔞 ${nsfwCount}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="collection-actions">
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); editCollection('${collection.id}')" style="width:auto;padding:4px 12px;font-size:12px;">✏️</button>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); exportCollection('${collection.id}')" style="width:auto;padding:4px 12px;font-size:12px;">📤</button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteCollectionConfirm('${collection.id}')" style="width:auto;padding:4px 12px;font-size:12px;">🗑</button>
                </div>
            </div>
        `;
    }).join('');
}

// ================================================================
// ПОЛУЧЕНИЕ ОБЛОЖКИ КОЛЛЕКЦИИ
// ================================================================

function getCollectionCover(collection) {
    if (collection.coverImage) return collection.coverImage;
    
    // Если обложка не задана — берём первое фото из коллекции
    const refs = getReferencesByCollection(collection.id);
    const firstWithImage = refs.find(r => r.image);
    return firstWithImage ? firstWithImage.image : null;
}

// ================================================================
// ОТКРЫТИЕ КОЛЛЕКЦИИ
// ================================================================

function openCollection(collectionId) {
    state.currentCollectionId = collectionId;
    state.currentPage = 'collection_detail';
    navigateTo('collection_detail');
}

// ================================================================
// МОДАЛКА СОЗДАНИЯ КОЛЛЕКЦИИ
// ================================================================

function showAddCollectionModal() {
    document.getElementById('collectionModalTitle').textContent = '📁 Новая коллекция';
    document.getElementById('editCollectionId').value = '';
    document.getElementById('collectionName').value = '';
    document.getElementById('collectionDescription').value = '';
    document.getElementById('collectionCoverPreview').style.display = 'none';
    document.getElementById('collectionCoverPreviewImg').src = '';
    document.getElementById('collectionCoverInput').value = '';
    selectedCoverImage = null;
    
    document.getElementById('collectionModal').classList.add('show');
}

function previewCollectionCover(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    compressImage(file, 800, 600, function(compressedBase64) {
        const preview = document.getElementById('collectionCoverPreview');
        const img = document.getElementById('collectionCoverPreviewImg');
        img.src = compressedBase64;
        preview.style.display = 'block';
        selectedCoverImage = compressedBase64;
    });
}

function saveCollection() {
    const editId = document.getElementById('editCollectionId').value;
    const name = document.getElementById('collectionName').value.trim();
    const description = document.getElementById('collectionDescription').value.trim();
    
    if (!name) {
        alert('❌ Введите название коллекции');
        return;
    }
    
    if (editId) {
        // Редактирование
        updateCollection(editId, {
            name: name,
            description: description,
            coverImage: selectedCoverImage
        });
        showNotification('Коллекция обновлена!');
    } else {
        // Создание
        addCollection(name, description, selectedCoverImage);
        showNotification('Коллекция создана!');
    }
    
    closeCollectionModal();
    renderCollections();
    renderAll();
}

function closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('show');
    selectedCoverImage = null;
}

// ================================================================
// РЕДАКТИРОВАНИЕ КОЛЛЕКЦИИ
// ================================================================

function editCollection(collectionId) {
    const collection = getCollection(collectionId);
    if (!collection) return;
    
    document.getElementById('collectionModalTitle').textContent = '✏️ Редактировать коллекцию';
    document.getElementById('editCollectionId').value = collection.id;
    document.getElementById('collectionName').value = collection.name;
    document.getElementById('collectionDescription').value = collection.description || '';
    
    if (collection.coverImage) {
        const preview = document.getElementById('collectionCoverPreview');
        const img = document.getElementById('collectionCoverPreviewImg');
        img.src = collection.coverImage;
        preview.style.display = 'block';
        selectedCoverImage = collection.coverImage;
    } else {
        document.getElementById('collectionCoverPreview').style.display = 'none';
        selectedCoverImage = null;
    }
    
    document.getElementById('collectionCoverInput').value = '';
    
    document.getElementById('collectionModal').classList.add('show');
}

// ================================================================
// УДАЛЕНИЕ КОЛЛЕКЦИИ
// ================================================================

function deleteCollectionConfirm(collectionId) {
    const collection = getCollection(collectionId);
    if (!collection) return;
    
    const refs = getReferencesByCollection(collectionId);
    const count = refs.length;
    
    if (!confirm(`Удалить коллекцию "${collection.name}"?\n\nВ ней ${count} референсов. Они будут удалены безвозвратно.`)) return;
    
    deleteCollection(collectionId);
    renderCollections();
    renderAll();
    showNotification('Коллекция удалена');
}

// ================================================================
// ЭКСПОРТ КОЛЛЕКЦИИ
// ================================================================

function exportCollection(collectionId) {
    const collection = getCollection(collectionId);
    if (!collection) return;
    
    const refs = getReferencesByCollection(collectionId);
    if (refs.length === 0) {
        showNotification('В коллекции нет референсов для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'collection',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        collection: {
            name: collection.name,
            description: collection.description,
            coverImage: collection.coverImage
        },
        references: refs,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `collection_${collection.name}_${getTodayStr()}.json`, `📁 Коллекция: ${collection.name}`);
}

// ================================================================
// ИМПОРТ КОЛЛЕКЦИИ
// ================================================================

function importCollection(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'collection' || !data.collection || !data.references) {
                throw new Error('Неверный формат файла коллекции');
            }
            
            const count = data.references.length;
            if (!confirm(`Найдено ${count} референсов.\n\nИмпортировать коллекцию "${data.collection.name}"?`)) return;
            
            // Проверяем, есть ли коллекция с таким именем
            let existing = state.collections.find(c => c.name === data.collection.name);
            if (existing) {
                if (!confirm(`Коллекция "${data.collection.name}" уже существует.\n\n"OK" — добавить референсы в неё\n"Отмена" — создать коллекцию с суффиксом " (копия)"`)) {
                    data.collection.name = data.collection.name + ' (копия)';
                }
            }
            
            // Создаём коллекцию
            const newCollection = addCollection(
                data.collection.name,
                data.collection.description || '',
                data.collection.coverImage || null
            );
            
            // Импортируем схемы, оборудование, шпаргалки (если нет дубликатов)
            const schemeMap = {};
            (data.schemes || []).forEach(s => {
                const exists = state.schemes.some(ex => ex.id === s.id);
                if (!exists) {
                    const newScheme = addScheme(s);
                    schemeMap[s.id] = newScheme.id;
                } else {
                    schemeMap[s.id] = s.id;
                }
            });
            
            const equipmentMap = {};
            (data.equipment || []).forEach(e => {
                const exists = state.equipment.some(ex => ex.id === e.id);
                if (!exists) {
                    const newEq = addEquipment(e);
                    equipmentMap[e.id] = newEq.id;
                } else {
                    equipmentMap[e.id] = e.id;
                }
            });
            
            const cheatsheetMap = {};
            (data.cheatsheets || []).forEach(c => {
                const exists = state.cheatsheets.some(ex => ex.id === c.id);
                if (!exists) {
                    const newCs = addCheatsheet(c);
                    cheatsheetMap[c.id] = newCs.id;
                } else {
                    cheatsheetMap[c.id] = c.id;
                }
            });
            
            // Импортируем референсы
            let added = 0;
            data.references.forEach(r => {
                // Проверяем дубликаты по ID
                const exists = state.references.some(ex => ex.id === r.id);
                if (!exists) {
                    // Маппим связи
                    const newSchemeIds = (r.schemeIds || []).map(id => schemeMap[id] || id);
                    const newEquipmentIds = (r.equipmentIds || []).map(id => equipmentMap[id] || id);
                    const newCheatSheetIds = (r.cheatSheetIds || []).map(id => cheatsheetMap[id] || id);
                    
                    const newRef = {
                        ...r,
                        id: 'ref_' + generateUUID(),
                        collectionId: newCollection.id,
                        schemeIds: newSchemeIds,
                        equipmentIds: newEquipmentIds,
                        cheatSheetIds: newCheatSheetIds,
                        createdAt: new Date().toISOString()
                    };
                    
                    state.references.push(newRef);
                    newCollection.referenceIds.push(newRef.id);
                    added++;
                }
            });
            
            saveState();
            renderCollections();
            renderAll();
            showNotification(`✅ Импортировано ${added} референсов в коллекцию "${newCollection.name}"`);
            
        } catch (err) {
            showNotification('❌ Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ОТРИСОВКА ДЕТАЛЬНОЙ СТРАНИЦЫ КОЛЛЕКЦИИ
// ================================================================

function renderCollectionDetail() {
    const container = document.getElementById('collectionDetailContent');
    if (!container) return;
    
    const collectionId = state.currentCollectionId;
    const collection = getCollection(collectionId);
    
    if (!collection) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📁</span>
                <p>Коллекция не найдена</p>
                <button class="btn" onclick="navigateTo('collections')">← Назад</button>
            </div>
        `;
        return;
    }
    
    const refs = getReferencesByCollection(collectionId);
    const coverImage = getCollectionCover(collection);
    
    // Шапка коллекции
    let html = `
        <div class="collection-detail-header" style="position:relative;background:var(--bg-card);border-radius:var(--radius);padding:20px;margin-bottom:16px;border:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:16px;">
                <div style="width:80px;height:80px;border-radius:12px;overflow:hidden;background:var(--bg-input);flex-shrink:0;">
                    ${coverImage ? `<img src="${coverImage}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:var(--text-muted);">📁</div>`}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:20px;font-weight:700;color:var(--text-primary);">${collection.name}</div>
                    <div style="font-size:14px;color:var(--text-muted);">${collection.description || 'Нет описания'}</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">📸 ${refs.length} референсов</div>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                    <button class="btn btn-sm btn-outline" onclick="editCollection('${collection.id}')" style="width:auto;padding:6px 14px;">✏️</button>
                    <button class="btn btn-sm btn-outline" onclick="addReferenceToCollection('${collection.id}')" style="width:auto;padding:6px 14px;">➕</button>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                <input class="search-bar" id="collectionSearch" placeholder="🔍 Поиск внутри коллекции..." oninput="renderCollectionReferences()" style="flex:1;min-width:150px;">
                <button class="btn btn-sm btn-outline" onclick="openCollectionGlobalSearch()" style="width:auto;padding:6px 14px;">🌐 Глобальный поиск</button>
            </div>
        </div>
    `;
    
    // Сетка референсов
    html += `<div id="collectionReferencesGrid" class="references-grid"></div>`;
    
    container.innerHTML = html;
    renderCollectionReferences();
}

function renderCollectionReferences() {
    const container = document.getElementById('collectionReferencesGrid');
    if (!container) return;
    
    const collectionId = state.currentCollectionId;
    const collection = getCollection(collectionId);
    if (!collection) return;
    
    const searchInput = document.getElementById('collectionSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    let refs = getReferencesByCollection(collectionId);
    
    // Поиск внутри коллекции
    if (searchQuery) {
        refs = refs.filter(r => {
            const searchable = (r.name + ' ' + r.description + ' ' + (r.tags || []).join(' ')).toLowerCase();
            return searchable.includes(searchQuery);
        });
    }
    
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
    
    container.innerHTML = refs.map(ref => {
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
        
        return `
            <div class="reference-card" onclick="openReferenceSlider('${ref.id}')">
                <div class="image-wrapper">
                    ${ref.image ? `<img src="${ref.image}" alt="${ref.name}" loading="lazy">` : `<div class="no-photo">📸</div>`}
                    ${ref.isFavorite ? '<span class="favorite-badge">❤️</span>' : ''}
                    ${ref.isNSFW ? '<span class="nsfw-badge" style="position:absolute;bottom:8px;left:8px;background:rgba(200,50,50,0.85);color:#fff;padding:2px 8px;border-radius:12px;font-size:10px;">🔞</span>' : ''}
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
        `;
    }).join('');
}

// ================================================================
// ГЛОБАЛЬНЫЙ ПОИСК (ИЗ КОЛЛЕКЦИИ)
// ================================================================

function openCollectionGlobalSearch() {
    const searchInput = document.getElementById('collectionSearch');
    const query = searchInput ? searchInput.value : '';
    navigateTo('collections');
    setTimeout(() => {
        const globalSearch = document.getElementById('referencesSearch');
        if (globalSearch) {
            globalSearch.value = query;
            applyFilters();
        }
    }, 100);
}

// ================================================================
// ДОБАВЛЕНИЕ РЕФЕРЕНСА В КОЛЛЕКЦИЮ
// ================================================================

function addReferenceToCollection(collectionId) {
    // Открываем модалку добавления референса с предустановленной коллекцией
    showAddReferenceModal(collectionId);
}

// ================================================================
// КОПИРОВАНИЕ РЕФЕРЕНСА В КОЛЛЕКЦИЮ
// ================================================================

function showCopyToCollectionModal(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const currentCollectionId = ref.collectionId;
    const availableCollections = state.collections.filter(c => c.id !== currentCollectionId);
    
    if (availableCollections.length === 0) {
        showNotification('Нет других коллекций для копирования', 'warning');
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>📋 Копировать в коллекцию</h2>
            <div class="modal-scroll">
                <div style="padding:0 20px;">
                    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">Выберите коллекцию для копирования референса:</p>
                    ${availableCollections.map(c => `
                        <div onclick="executeCopyToCollection('${refId}','${c.id}')" style="padding:12px 16px;background:var(--bg-card);border-radius:12px;margin-bottom:8px;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);">
                            <div style="font-weight:600;color:var(--text-primary);">📁 ${c.name}</div>
                            <div style="font-size:13px;color:var(--text-muted);">${getReferencesByCollection(c.id).length} референсов</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function executeCopyToCollection(refId, targetCollectionId) {
    const newRef = copyReferenceToCollection(refId, targetCollectionId);
    if (newRef) {
        const modal = document.querySelector('.modal-overlay.show');
        if (modal) modal.classList.remove('show');
        showNotification('✅ Референс скопирован!');
        renderCollectionReferences();
        renderCollections();
        renderAll();
    }
}

// ================================================================
// ПЕРЕМЕЩЕНИЕ РЕФЕРЕНСА В КОЛЛЕКЦИЮ
// ================================================================

function showMoveToCollectionModal(refId) {
    const ref = getReference(refId);
    if (!ref) return;
    
    const currentCollectionId = ref.collectionId;
    const availableCollections = state.collections.filter(c => c.id !== currentCollectionId);
    
    if (availableCollections.length === 0) {
        showNotification('Нет других коллекций для перемещения', 'warning');
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>📤 Переместить в коллекцию</h2>
            <div class="modal-scroll">
                <div style="padding:0 20px;">
                    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">Выберите коллекцию для перемещения референса:</p>
                    ${availableCollections.map(c => `
                        <div onclick="executeMoveToCollection('${refId}','${c.id}')" style="padding:12px 16px;background:var(--bg-card);border-radius:12px;margin-bottom:8px;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);">
                            <div style="font-weight:600;color:var(--text-primary);">📁 ${c.name}</div>
                            <div style="font-size:13px;color:var(--text-muted);">${getReferencesByCollection(c.id).length} референсов</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function executeMoveToCollection(refId, targetCollectionId) {
    const ref = moveReferenceToCollection(refId, targetCollectionId);
    if (ref) {
        const modal = document.querySelector('.modal-overlay.show');
        if (modal) modal.classList.remove('show');
        showNotification('✅ Референс перемещён!');
        renderCollectionReferences();
        renderCollections();
        renderAll();
    }
}