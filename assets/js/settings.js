// ================================================================
// ПРОФИЛЬ, НАСТРОЙКИ, ЭКСПОРТ/ИМПОРТ (С ZIP-АРХИВАМИ)
// Версия 0.1.2 — ZIP-архивы для экспорта/импорта
// ================================================================

// ================================================================
// ПРОФИЛЬ
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
// ЭКСПОРТ ВСЕХ ДАННЫХ (В ZIP-АРХИВЕ)
// ================================================================

function exportAllData() {
    if (state.references.length === 0 && state.collections.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    const data = {
        type: 'all',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        collections: state.collections,
        references: state.references,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets,
        user: state.user
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const filename = `phonote_backup_${getTodayStr()}.zip`;
    
    // Пробуем использовать Capacitor Zip плагин
    if (window.Capacitor && window.Capacitor.isNativePlatform() &&
        window.Capacitor.Plugins && window.Capacitor.Plugins.Zip) {
        
        const Zip = window.Capacitor.Plugins.Zip;
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        
        // Сначала сохраняем JSON во временный файл
        Filesystem.writeFile({
            path: 'data.json',
            data: jsonString,
            directory: 'CACHE',
            encoding: 'utf8'
        }).then(() => {
            // Затем упаковываем его в ZIP
            return Zip.zip({
                source: 'data.json',
                destination: filename,
                directory: 'CACHE'
            });
        }).then(() => {
            // Читаем ZIP как Base64
            return Filesystem.readFile({
                path: filename,
                directory: 'CACHE'
            });
        }).then((result) => {
            // Отправляем через FileSharer
            const base64Data = result.data;
            if (window.Capacitor.Plugins.FileSharer) {
                const FileSharer = window.Capacitor.Plugins.FileSharer;
                FileSharer.share({
                    filename: filename,
                    base64Data: base64Data,
                    contentType: 'application/zip'
                }).then(() => {
                    showNotification('✅ Архив экспортирован!', 'success');
                    // Чистим временные файлы
                    Filesystem.deleteFile({
                        path: 'data.json',
                        directory: 'CACHE'
                    }).catch(() => {});
                    Filesystem.deleteFile({
                        path: filename,
                        directory: 'CACHE'
                    }).catch(() => {});
                }).catch((err) => {
                    console.error('❌ Ошибка экспорта:', err);
                    fallbackExport(jsonString, filename);
                });
            } else {
                fallbackExport(jsonString, filename);
            }
        }).catch((err) => {
            console.error('❌ Ошибка ZIP:', err);
            fallbackExport(jsonString, filename);
        });
    } else {
        // Запасной вариант (для браузера)
        fallbackExport(jsonString, filename);
    }
}

// ================================================================
// ЗАПАСНОЙ ВАРИАНТ ЭКСПОРТА (БЕЗ ZIP)
// ================================================================

function fallbackExport(jsonString, filename) {
    // Скачиваем как обычный JSON (для браузера)
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.zip', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotification(`📥 Файл "${filename.replace('.zip', '.json')}" скачан!`, 'success');
}

// ================================================================
// ИМПОРТ ВСЕХ ДАННЫХ (ИЗ ZIP-АРХИВА)
// ================================================================

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверяем, ZIP это или JSON
    const isZip = file.name.endsWith('.zip');
    
    if (isZip) {
        importFromZip(file);
    } else {
        importFromJson(file);
    }
}

// ================================================================
// ИМПОРТ ИЗ ZIP-АРХИВА
// ================================================================

function importFromZip(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result.split(',')[1] || e.target.result;
        
        if (window.Capacitor && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.Zip) {
            
            const Zip = window.Capacitor.Plugins.Zip;
            const Filesystem = window.Capacitor.Plugins.Filesystem;
            
            // Сохраняем ZIP во временную папку
            Filesystem.writeFile({
                path: 'import.zip',
                data: base64Data,
                directory: 'CACHE'
            }).then(() => {
                // Распаковываем
                return Zip.unzip({
                    source: 'import.zip',
                    destination: 'import',
                    directory: 'CACHE'
                });
            }).then(() => {
                // Читаем data.json из распакованной папки
                return Filesystem.readFile({
                    path: 'import/data.json',
                    directory: 'CACHE'
                });
            }).then((result) => {
                const jsonString = result.data;
                processImportedData(jsonString);
                // Чистим временные файлы
                Filesystem.deleteFile({
                    path: 'import.zip',
                    directory: 'CACHE'
                }).catch(() => {});
                Filesystem.deleteFile({
                    path: 'import/data.json',
                    directory: 'CACHE'
                }).catch(() => {});
                Filesystem.rmdir({
                    path: 'import',
                    directory: 'CACHE'
                }).catch(() => {});
            }).catch((err) => {
                console.error('❌ Ошибка распаковки:', err);
                showNotification('❌ Ошибка распаковки архива', 'error');
            });
        } else {
            // Запасной вариант для браузера
            showNotification('Импорт ZIP доступен только в мобильном приложении', 'warning');
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ================================================================
// ИМПОРТ ИЗ JSON-ФАЙЛА (для совместимости)
// ================================================================

function importFromJson(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonString = e.target.result;
            processImportedData(jsonString);
        } catch (err) {
            showNotification('Ошибка импорта: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ОБРАБОТКА ИМПОРТИРОВАННЫХ ДАННЫХ
// ================================================================

function processImportedData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        
        if (data.type !== 'all' || !data.references) {
            throw new Error('Неверный формат данных');
        }
        
        const total = (data.references?.length || 0) + 
                     (data.schemes?.length || 0) + 
                     (data.equipment?.length || 0) + 
                     (data.cheatsheets?.length || 0) +
                     (data.collections?.length || 0);
        
        const action = confirm(`Найдено ${total} записей.\n\n"OK" — Добавить к существующим\n"Отмена" — Заменить все`);
        
        if (action) {
            let added = { refs: 0, schemes: 0, eq: 0, cs: 0, collections: 0 };
            
            (data.collections || []).forEach(newCol => {
                if (!state.collections.some(c => c.id === newCol.id)) {
                    state.collections.push(newCol);
                    added.collections++;
                }
            });
            
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
            
            showNotification(`✅ Добавлено: 📁${added.collections} 📸${added.refs} 💡${added.schemes} 📷${added.eq} 📋${added.cs}`);
        } else {
            state.collections = data.collections || [];
            state.references = data.references || [];
            state.schemes = data.schemes || [];
            state.equipment = data.equipment || [];
            state.cheatsheets = data.cheatsheets || [];
            if (data.user) {
                state.user = data.user;
            }
            showNotification('✅ Все данные заменены!');
        }
        
        saveState();
        renderAll();
        updateCounts();
        
    } catch (err) {
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
}

// ================================================================
// ЭКСПОРТ КОЛЛЕКЦИИ (В ZIP-АРХИВЕ)
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
    const filename = `collection_${collection.name}_${getTodayStr()}.zip`;
    
    // Используем ту же логику с ZIP
    if (window.Capacitor && window.Capacitor.isNativePlatform() &&
        window.Capacitor.Plugins && window.Capacitor.Plugins.Zip) {
        
        const Zip = window.Capacitor.Plugins.Zip;
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        
        Filesystem.writeFile({
            path: 'data.json',
            data: jsonString,
            directory: 'CACHE',
            encoding: 'utf8'
        }).then(() => {
            return Zip.zip({
                source: 'data.json',
                destination: filename,
                directory: 'CACHE'
            });
        }).then(() => {
            return Filesystem.readFile({
                path: filename,
                directory: 'CACHE'
            });
        }).then((result) => {
            const base64Data = result.data;
            if (window.Capacitor.Plugins.FileSharer) {
                const FileSharer = window.Capacitor.Plugins.FileSharer;
                FileSharer.share({
                    filename: filename,
                    base64Data: base64Data,
                    contentType: 'application/zip'
                }).then(() => {
                    showNotification('✅ Архив коллекции экспортирован!', 'success');
                    Filesystem.deleteFile({
                        path: 'data.json',
                        directory: 'CACHE'
                    }).catch(() => {});
                    Filesystem.deleteFile({
                        path: filename,
                        directory: 'CACHE'
                    }).catch(() => {});
                }).catch((err) => {
                    console.error('❌ Ошибка экспорта:', err);
                    fallbackExport(jsonString, filename);
                });
            }
        }).catch((err) => {
            console.error('❌ Ошибка ZIP:', err);
            fallbackExport(jsonString, filename);
        });
    } else {
        fallbackExport(jsonString, filename);
    }
}

function renderAll() {
    renderCollections();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    updateCounts();
    updateStorageSize();
}
