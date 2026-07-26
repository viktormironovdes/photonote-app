// ================================================================
// ПРОФИЛЬ, НАСТРОЙКИ, ЭКСПОРТ/ИМПОРТ + ПОДЕЛИТЬСЯ
// ================================================================

function loadProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const emailInput = document.getElementById('profileEmailInput');
    
    if (nameInput) nameInput.value = state.user.name || 'Фотограф';
    if (emailInput) emailInput.value = state.user.email || '';
    
    updateAvatarDisplay();
    updateCounts();
    updateStorageSize();
}

function saveProfile() {
    const name = document.getElementById('profileNameInput').value.trim() || 'Фотограф';
    const email = document.getElementById('profileEmailInput').value.trim();
    
    state.user.name = name;
    state.user.email = email;
    saveState();
    updateAvatarDisplay();
    showNotification('Профиль сохранён!');
}

function updateAvatarDisplay() {
    const letterEl = document.getElementById('avatarLetter');
    const imgEl = document.getElementById('avatarImage');
    
    if (!letterEl || !imgEl) return;
    
    if (state.user.avatar) {
        letterEl.style.display = 'none';
        imgEl.style.display = 'block';
        imgEl.src = state.user.avatar;
    } else {
        letterEl.style.display = 'block';
        imgEl.style.display = 'none';
        const name = state.user.name || 'Фотограф';
        letterEl.textContent = name.charAt(0).toUpperCase();
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            state.user.avatar = dataUrl;
            saveState();
            updateAvatarDisplay();
            showNotification('Аватар обновлён!');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ================================================================
// ЭКСПОРТ ОТДЕЛЬНЫХ СУЩНОСТЕЙ (для ПК и разработки)
// ================================================================

function exportReferences() {
    if (state.references.length === 0) {
        showNotification('Нет референсов для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'references',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.references.length,
        data: state.references
    };
    
    downloadJSON(data, `references_${getTodayStr()}.json`);
    showNotification(`Экспортировано ${state.references.length} референсов!`);
}

function exportSchemes() {
    if (state.schemes.length === 0) {
        showNotification('Нет схем для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'schemes',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.schemes.length,
        data: state.schemes
    };
    
    downloadJSON(data, `schemes_${getTodayStr()}.json`);
    showNotification(`Экспортировано ${state.schemes.length} схем!`);
}

function exportEquipment() {
    if (state.equipment.length === 0) {
        showNotification('Нет оборудования для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'equipment',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.equipment.length,
        data: state.equipment
    };
    
    downloadJSON(data, `equipment_${getTodayStr()}.json`);
    showNotification(`Экспортировано ${state.equipment.length} единиц оборудования!`);
}

function exportCheatsheets() {
    if (state.cheatsheets.length === 0) {
        showNotification('Нет шпаргалок для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'cheatsheets',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.cheatsheets.length,
        data: state.cheatsheets
    };
    
    downloadJSON(data, `cheatsheets_${getTodayStr()}.json`);
    showNotification(`Экспортировано ${state.cheatsheets.length} шпаргалок!`);
}

function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ================================================================
// ИМПОРТ ОТДЕЛЬНЫХ СУЩНОСТЕЙ
// ================================================================

function importReferences(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'references' || !data.data) {
                throw new Error('Неверный формат файла референсов');
            }
            
            const count = data.data.length;
            const action = confirm(`Найдено ${count} референсов.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
            
            if (action) {
                let added = 0;
                data.data.forEach(newRef => {
                    const exists = state.references.some(r => r.id === newRef.id);
                    if (!exists) {
                        state.references.push(newRef);
                        added++;
                    }
                });
                showNotification(`Добавлено ${added} новых референсов (${count - added} пропущено как дубликаты)`);
            } else {
                state.references = data.data;
                showNotification(`Заменено ${count} референсов`);
            }
            
            saveState();
            applyFilters();
            renderReferences();
            updateCounts();
            
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importSchemes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'schemes' || !data.data) {
                throw new Error('Неверный формат файла схем');
            }
            
            const count = data.data.length;
            const action = confirm(`Найдено ${count} схем.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
            
            if (action) {
                let added = 0;
                data.data.forEach(newScheme => {
                    const exists = state.schemes.some(s => s.id === newScheme.id);
                    if (!exists) {
                        state.schemes.push(newScheme);
                        added++;
                    }
                });
                showNotification(`Добавлено ${added} новых схем (${count - added} пропущено как дубликаты)`);
            } else {
                state.schemes = data.data;
                showNotification(`Заменено ${count} схем`);
            }
            
            saveState();
            renderSchemes();
            renderReferences();
            updateCounts();
            
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importEquipment(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'equipment' || !data.data) {
                throw new Error('Неверный формат файла оборудования');
            }
            
            const count = data.data.length;
            const action = confirm(`Найдено ${count} единиц оборудования.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
            
            if (action) {
                let added = 0;
                data.data.forEach(newEq => {
                    const exists = state.equipment.some(e => e.id === newEq.id);
                    if (!exists) {
                        state.equipment.push(newEq);
                        added++;
                    }
                });
                showNotification(`Добавлено ${added} новых единиц (${count - added} пропущено как дубликаты)`);
            } else {
                state.equipment = data.data;
                showNotification(`Заменено ${count} единиц оборудования`);
            }
            
            saveState();
            renderEquipment();
            renderReferences();
            updateCounts();
            
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importCheatsheets(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'cheatsheets' || !data.data) {
                throw new Error('Неверный формат файла шпаргалок');
            }
            
            const count = data.data.length;
            const action = confirm(`Найдено ${count} шпаргалок.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
            
            if (action) {
                let added = 0;
                data.data.forEach(newCs => {
                    const exists = state.cheatsheets.some(c => c.id === newCs.id);
                    if (!exists) {
                        state.cheatsheets.push(newCs);
                        added++;
                    }
                });
                showNotification(`Добавлено ${added} новых шпаргалок (${count - added} пропущено как дубликаты)`);
            } else {
                state.cheatsheets = data.data;
                showNotification(`Заменено ${count} шпаргалок`);
            }
            
            saveState();
            renderCheatsheets();
            renderReferences();
            updateCounts();
            
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ЭКСПОРТ/ИМПОРТ ВСЕХ ДАННЫХ (для полного бэкапа)
// ================================================================

function exportAllData() {
    const data = {
        type: 'all',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        references: state.references,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets,
        user: state.user
    };
    
    downloadJSON(data, `all_data_${getTodayStr()}.json`);
    showNotification('Все данные экспортированы!');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type !== 'all' || !data.references) {
                throw new Error('Неверный формат файла');
            }
            
            const total = (data.references?.length || 0) + 
                         (data.schemes?.length || 0) + 
                         (data.equipment?.length || 0) + 
                         (data.cheatsheets?.length || 0);
            
            const action = confirm(`Найдено ${total} записей.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
            
            if (action) {
                let added = { refs: 0, schemes: 0, eq: 0, cs: 0 };
                
                (data.references || []).forEach(newRef => {
                    if (!state.references.some(r => r.id === newRef.id)) {
                        state.references.push(newRef);
                        added.refs++;
                    }
                });
                
                (data.schemes || []).forEach(newScheme => {
                    if (!state.schemes.some(s => s.id === newScheme.id)) {
                        state.schemes.push(newScheme);
                        added.schemes++;
                    }
                });
                
                (data.equipment || []).forEach(newEq => {
                    if (!state.equipment.some(e => e.id === newEq.id)) {
                        state.equipment.push(newEq);
                        added.eq++;
                    }
                });
                
                (data.cheatsheets || []).forEach(newCs => {
                    if (!state.cheatsheets.some(c => c.id === newCs.id)) {
                        state.cheatsheets.push(newCs);
                        added.cs++;
                    }
                });
                
                showNotification(`Добавлено: 📸${added.refs} 💡${added.schemes} 📷${added.eq} 📋${added.cs}`);
            } else {
                state.references = data.references || [];
                state.schemes = data.schemes || [];
                state.equipment = data.equipment || [];
                state.cheatsheets = data.cheatsheets || [];
                if (data.user) {
                    state.user = data.user;
                }
                showNotification('Все данные заменены!');
            }
            
            saveState();
            renderAll();
            updateCounts();
            
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ФУНКЦИИ "ПОДЕЛИТЬСЯ" (Web Share API) - ТОЛЬКО В ПРОФИЛЕ
// ================================================================

function shareReferencesData() {
    if (state.references.length === 0) {
        showNotification('Нет референсов для публикации', 'warning');
        return;
    }
    
    if (!navigator.share) {
        showNotification('Функция "Поделиться" не поддерживается вашим браузером', 'warning');
        return;
    }
    
    const data = {
        type: 'references',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.references.length,
        data: state.references
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `references_${getTodayStr()}.json`, { type: 'application/json' });
    
    navigator.share({
        title: 'Мои референсы',
        text: `📸 ${state.references.length} референсов`,
        files: [file]
    }).then(() => {
        console.log('✅ Данные отправлены!');
    }).catch(err => {
        if (err.name !== 'AbortError') {
            console.error('❌ Ошибка:', err);
            showNotification('Ошибка при публикации', 'error');
        }
    });
}

function shareSchemesData() {
    if (state.schemes.length === 0) {
        showNotification('Нет схем для публикации', 'warning');
        return;
    }
    
    if (!navigator.share) {
        showNotification('Функция "Поделиться" не поддерживается вашим браузером', 'warning');
        return;
    }
    
    const data = {
        type: 'schemes',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.schemes.length,
        data: state.schemes
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `schemes_${getTodayStr()}.json`, { type: 'application/json' });
    
    navigator.share({
        title: 'Мои схемы света',
        text: `💡 ${state.schemes.length} схем`,
        files: [file]
    }).catch(err => {
        if (err.name !== 'AbortError') {
            console.error('❌ Ошибка:', err);
        }
    });
}

function shareEquipmentData() {
    if (state.equipment.length === 0) {
        showNotification('Нет оборудования для публикации', 'warning');
        return;
    }
    
    if (!navigator.share) {
        showNotification('Функция "Поделиться" не поддерживается вашим браузером', 'warning');
        return;
    }
    
    const data = {
        type: 'equipment',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.equipment.length,
        data: state.equipment
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `equipment_${getTodayStr()}.json`, { type: 'application/json' });
    
    navigator.share({
        title: 'Моё оборудование',
        text: `📷 ${state.equipment.length} единиц`,
        files: [file]
    }).catch(err => {
        if (err.name !== 'AbortError') {
            console.error('❌ Ошибка:', err);
        }
    });
}

function shareCheatsheetsData() {
    if (state.cheatsheets.length === 0) {
        showNotification('Нет шпаргалок для публикации', 'warning');
        return;
    }
    
    if (!navigator.share) {
        showNotification('Функция "Поделиться" не поддерживается вашим браузером', 'warning');
        return;
    }
    
    const data = {
        type: 'cheatsheets',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: state.cheatsheets.length,
        data: state.cheatsheets
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `cheatsheets_${getTodayStr()}.json`, { type: 'application/json' });
    
    navigator.share({
        title: 'Мои шпаргалки',
        text: `📋 ${state.cheatsheets.length} шпаргалок`,
        files: [file]
    }).catch(err => {
        if (err.name !== 'AbortError') {
            console.error('❌ Ошибка:', err);
        }
    });
}

function renderAll() {
    renderReferences();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    updateCounts();
    updateStorageSize();
}
