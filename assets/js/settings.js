// ================================================================
// ПРОФИЛЬ, НАСТРОЙКИ, ЭКСПОРТ/ИМПОРТ
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
// ЭКСПОРТ ОТДЕЛЬНЫХ СУЩНОСТЕЙ
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
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `references_${getTodayStr()}.json`, '📸 Референсы');
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
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `schemes_${getTodayStr()}.json`, '💡 Схемы света');
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
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `equipment_${getTodayStr()}.json`, '📷 Оборудование');
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
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `cheatsheets_${getTodayStr()}.json`, '📋 Шпаргалки');
}

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
    
    const jsonString = JSON.stringify(data, null, 2);
    saveFileWithSharer(jsonString, `all_data_${getTodayStr()}.json`, '💾 Все данные');
}

// ================================================================
// СОХРАНЕНИЕ ФАЙЛА ЧЕРЕЗ @capgo/capacitor-file-sharer
// ================================================================

function saveFileWithSharer(jsonString, filename, title) {
    // Пробуем использовать Capacitor File Sharer (для Android APK)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            // Проверяем доступность плагина
            if (window.Capacitor.Plugins && window.Capacitor.Plugins.FileSharer) {
                const FileSharer = window.Capacitor.Plugins.FileSharer;
                
                // Конвертируем строку в Base64
                const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
                
                FileSharer.share({
                    filename: filename,
                    base64Data: base64Data,
                    contentType: 'application/json'
                }).then(() => {
                    showNotification(`✅ Файл "${filename}" сохранён!`, 'success');
                }).catch((err) => {
                    console.error('❌ Ошибка FileSharer:', err);
                    // Если плагин не сработал — запасной вариант
                    fallbackSave(jsonString, filename);
                });
            } else {
                console.log('⚠️ FileSharer плагин не найден, используем запасной вариант');
                fallbackSave(jsonString, filename);
            }
        } catch (e) {
            console.error('❌ Ошибка при вызове FileSharer:', e);
            fallbackSave(jsonString, filename);
        }
    } else {
        // Для браузера — загрузка через ссылку
        fallbackSave(jsonString, filename);
    }
}

// ================================================================
// ЗАПАСНОЙ ВАРИАНТ (для браузера или если плагин не работает)
// ================================================================

function fallbackSave(jsonString, filename) {
    // Пробуем через Capacitor Filesystem (если есть)
    if (window.Capacitor && window.Capacitor.isNativePlatform() && 
        window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        
        Filesystem.writeFile({
            path: filename,
            data: jsonString,
            directory: 'DOCUMENTS',
            encoding: 'utf8'
        }).then(() => {
            showNotification(`✅ Файл "${filename}" сохранён в Документы!`, 'success');
        }).catch(() => {
            // Если не получилось — скачиваем через браузер
            downloadJsonString(jsonString, filename);
        });
    } else {
        // Браузерная загрузка
        downloadJsonString(jsonString, filename);
    }
}

// ================================================================
// БРАУЗЕРНАЯ ЗАГРУЗКА (самый надёжный запасной вариант)
// ================================================================

function downloadJsonString(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotification(`📥 Файл "${filename}" скачан!`, 'success');
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

function renderAll() {
    renderReferences();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    updateCounts();
    updateStorageSize();
}
