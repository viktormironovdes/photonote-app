// ================================================================
// ПРОФИЛЬ, НАСТРОЙКИ, ЭКСПОРТ/ИМПОРТ
// Версия 0.1.1 — дизайн-система + настройка шрифтов
// ================================================================

// ================================================================
// ПРОВЕРКА ДОСТУПНОСТИ ПЛАГИНОВ
// ================================================================

function isFileSharerAvailable() {
    return window.Capacitor && window.Capacitor.isNativePlatform() && 
           window.Capacitor.Plugins && window.Capacitor.Plugins.FileSharer;
}

function isFilesystemAvailable() {
    return window.Capacitor && window.Capacitor.isNativePlatform() && 
           window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
}

// ================================================================
// НАСТРОЙКИ ШРИФТА
// ================================================================

// Состояние размера шрифта (1-5)
let fontSizeLevel = 3; // По умолчанию средний

// Маппинг уровней к размерам
const FONT_SIZES = {
    1: { // Маленький
        h1: '20px', h2: '16px', h3: '14px',
        body: '13px', small: '12px', tiny: '10px', micro: '9px'
    },
    2: { // Стандарт
        h1: '24px', h2: '19px', h3: '16px',
        body: '14px', small: '13px', tiny: '11px', micro: '10px'
    },
    3: { // Средний (по умолчанию)
        h1: '28px', h2: '22px', h3: '18px',
        body: '16px', small: '14px', tiny: '12px', micro: '10px'
    },
    4: { // Крупный
        h1: '32px', h2: '26px', h3: '20px',
        body: '18px', small: '16px', tiny: '13px', micro: '11px'
    },
    5: { // Очень крупный
        h1: '36px', h2: '30px', h3: '24px',
        body: '20px', small: '18px', tiny: '14px', micro: '12px'
    }
};

function loadFontSize() {
    try {
        const saved = localStorage.getItem('phonote_fontSize');
        if (saved) {
            fontSizeLevel = parseInt(saved);
            if (fontSizeLevel < 1 || fontSizeLevel > 5) fontSizeLevel = 3;
        }
    } catch (e) {
        fontSizeLevel = 3;
    }
    applyFontSize(fontSizeLevel);
}

function saveFontSize(level) {
    fontSizeLevel = level;
    localStorage.setItem('phonote_fontSize', String(level));
    applyFontSize(level);
}

function applyFontSize(level) {
    const sizes = FONT_SIZES[level] || FONT_SIZES[3];
    const root = document.documentElement;
    
    root.style.setProperty('--font-size-h1', sizes.h1);
    root.style.setProperty('--font-size-h2', sizes.h2);
    root.style.setProperty('--font-size-h3', sizes.h3);
    root.style.setProperty('--font-size-body', sizes.body);
    root.style.setProperty('--font-size-small', sizes.small);
    root.style.setProperty('--font-size-tiny', sizes.tiny);
    root.style.setProperty('--font-size-micro', sizes.micro);
    
    // Обновляем активную кнопку в интерфейсе
    document.querySelectorAll('.btn-size').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
    });
}

function setFontSize(level) {
    if (level < 1 || level > 5) return;
    saveFontSize(level);
    showNotification(`Размер шрифта: ${['Маленький', 'Стандартный', 'Средний', 'Крупный', 'Очень крупный'][level - 1]}`, 'info');
}

function getFontSizeLabel(level) {
    const labels = ['', 'Маленький', 'Стандартный', 'Средний', 'Крупный', 'Очень крупный'];
    return labels[level] || 'Средний';
}

// ================================================================
// ПРОФИЛЬ
// ================================================================

function loadProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const emailInput = document.getElementById('profileEmailInput');
    
    if (nameInput) nameInput.value = state.user.name || 'Фотограф';
    if (emailInput) emailInput.value = state.user.email || '';
    
    // Загружаем настройки шрифта
    loadFontSize();
    
    // Обновляем UI кнопок размера шрифта
    document.querySelectorAll('.btn-size').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.level) === fontSizeLevel);
    });
    
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
// ЭКСПОРТ (СОХРАНЕНИЕ НА УСТРОЙСТВО) — через Filesystem + FileSharer.save()
// ================================================================

async function saveJsonToDevice(jsonString, filename, title) {
    try {
        if (!isFilesystemAvailable()) {
            console.warn('⚠️ Filesystem не доступен, используем fallback');
            fallbackSaveJson(jsonString, filename + '.json');
            return;
        }
        
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        
        const filePath = `PhotoNote/${filename}.json`;
        console.log('📝 Сохраняем JSON в Documents:', filePath);
        
        await Filesystem.writeFile({
            path: filePath,
            data: jsonString,
            directory: 'DOCUMENTS',
            encoding: 'utf8'
        });
        
        const uriResult = await Filesystem.getUri({
            path: filePath,
            directory: 'DOCUMENTS'
        });
        console.log('📁 URI файла:', uriResult.uri);
        
        const readResult = await Filesystem.readFile({
            path: filePath,
            directory: 'DOCUMENTS'
        });
        const jsonBase64 = readResult.data;
        
        if (isFileSharerAvailable()) {
            const FileSharer = window.Capacitor.Plugins.FileSharer;
            await FileSharer.save({
                filename: `${filename}.json`,
                base64Data: jsonBase64,
                contentType: 'application/json',
                android: {
                    saveDirectory: 'downloads',
                    relativePath: 'PhotoNote'
                }
            });
            showNotification(`✅ Файл "${filename}.json" сохранён в Загрузки!`, 'success');
        } else {
            downloadJsonString(jsonString, `${filename}.json`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        fallbackSaveJson(jsonString, filename + '.json');
    }
}

function fallbackSaveJson(jsonString, filename) {
    if (isFileSharerAvailable()) {
        const FileSharer = window.Capacitor.Plugins.FileSharer;
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        FileSharer.save({
            filename: filename,
            base64Data: base64Data,
            contentType: 'application/json',
            android: {
                saveDirectory: 'downloads',
                relativePath: 'PhotoNote'
            }
        }).then(() => {
            showNotification(`✅ Файл "${filename}" сохранён в Загрузки!`, 'success');
        }).catch((err) => {
            console.error('❌ Ошибка:', err);
            downloadJsonString(jsonString, filename);
        });
    } else {
        downloadJsonString(jsonString, filename);
    }
}

// ================================================================
// ПОДЕЛИТЬСЯ (ОТПРАВКА ЧЕРЕЗ МЕНЮ) — через FileSharer.share()
// ================================================================

async function shareJson(jsonString, filename, title) {
    try {
        if (!isFileSharerAvailable()) {
            fallbackShareJson(jsonString, filename + '.json');
            return;
        }
        
        const FileSharer = window.Capacitor.Plugins.FileSharer;
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        
        await FileSharer.share({
            filename: `${filename}.json`,
            base64Data: base64Data,
            contentType: 'application/json'
        });
        
        showNotification(`✅ Файл "${filename}.json" отправлен!`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        fallbackShareJson(jsonString, filename + '.json');
    }
}

function fallbackShareJson(jsonString, filename) {
    if (isFileSharerAvailable()) {
        const FileSharer = window.Capacitor.Plugins.FileSharer;
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        FileSharer.share({
            filename: filename,
            base64Data: base64Data,
            contentType: 'application/json'
        }).then(() => {
            showNotification(`✅ Файл "${filename}" отправлен!`, 'success');
        }).catch((err) => {
            console.error('❌ Ошибка:', err);
            downloadJsonString(jsonString, filename);
        });
    } else {
        downloadJsonString(jsonString, filename);
    }
}

// ================================================================
// ИМПОРТ ИЗ JSON
// ================================================================

async function importFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('❌ Ошибка чтения JSON:', error);
        showNotification('❌ Ошибка при чтении файла: ' + error.message, 'error');
        return null;
    }
}

// ================================================================
// ЭКСПОРТ ВСЕХ ДАННЫХ (СОХРАНЕНИЕ НА УСТРОЙСТВО)
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
    const filename = `phonote_all_data_${getTodayStr()}`;
    saveJsonToDevice(jsonString, filename, '💾 Все данные PhotoNote');
}

// ================================================================
// ПОДЕЛИТЬСЯ ВСЕМИ ДАННЫМИ
// ================================================================

function shareAllData() {
    if (state.references.length === 0 && state.collections.length === 0) {
        showNotification('Нет данных для публикации', 'warning');
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
    const filename = `phonote_all_data_${getTodayStr()}`;
    shareJson(jsonString, filename, '📤 Все данные PhotoNote');
}

// ================================================================
// ИМПОРТ ВСЕХ ДАННЫХ
// ================================================================

async function importAllData(event) {
    const data = await importFromJson(event);
    if (!data) return;
    
    try {
        if (data.type !== 'all' || !data.references) {
            throw new Error('Неверный формат файла');
        }
        
        const total = (data.references?.length || 0) + 
                     (data.collections?.length || 0) + 
                     (data.schemes?.length || 0) + 
                     (data.equipment?.length || 0) + 
                     (data.cheatsheets?.length || 0);
        
        const action = confirm(`Найдено ${total} записей.\n\n"OK" - Добавить к существующим\n"Отмена" - Заменить все`);
        
        if (action) {
            let added = { refs: 0, collections: 0, schemes: 0, eq: 0, cs: 0 };
            
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
            
            showNotification(`Добавлено: 📁${added.collections} 📸${added.refs} 💡${added.schemes} 📷${added.eq} 📋${added.cs}`);
        } else {
            state.collections = data.collections || [];
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
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
    
    event.target.value = '';
}

// ================================================================
// ЭКСПОРТ ОТДЕЛЬНЫХ СУЩНОСТЕЙ (СОХРАНЕНИЕ НА УСТРОЙСТВО)
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
    const filename = `phonote_references_${getTodayStr()}`;
    saveJsonToDevice(jsonString, filename, '📸 Референсы');
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
    const filename = `phonote_schemes_${getTodayStr()}`;
    saveJsonToDevice(jsonString, filename, '💡 Схемы света');
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
    const filename = `phonote_equipment_${getTodayStr()}`;
    saveJsonToDevice(jsonString, filename, '📷 Оборудование');
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
    const filename = `phonote_cheatsheets_${getTodayStr()}`;
    saveJsonToDevice(jsonString, filename, '📋 Шпаргалки');
}

// ================================================================
// ПОДЕЛИТЬСЯ ОТДЕЛЬНЫМИ СУЩНОСТЯМИ
// ================================================================

function shareReferences() {
    if (state.references.length === 0) {
        showNotification('Нет референсов для публикации', 'warning');
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
    const filename = `phonote_references_${getTodayStr()}`;
    shareJson(jsonString, filename, '📸 Референсы');
}

function shareSchemes() {
    if (state.schemes.length === 0) {
        showNotification('Нет схем для публикации', 'warning');
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
    const filename = `phonote_schemes_${getTodayStr()}`;
    shareJson(jsonString, filename, '💡 Схемы света');
}

function shareEquipment() {
    if (state.equipment.length === 0) {
        showNotification('Нет оборудования для публикации', 'warning');
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
    const filename = `phonote_equipment_${getTodayStr()}`;
    shareJson(jsonString, filename, '📷 Оборудование');
}

function shareCheatsheets() {
    if (state.cheatsheets.length === 0) {
        showNotification('Нет шпаргалок для публикации', 'warning');
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
    const filename = `phonote_cheatsheets_${getTodayStr()}`;
    shareJson(jsonString, filename, '📋 Шпаргалки');
}

// ================================================================
// ИМПОРТ ОТДЕЛЬНЫХ СУЩНОСТЕЙ
// ================================================================

async function importReferences(event) {
    const data = await importFromJson(event);
    if (!data) return;
    
    try {
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
        renderCollections();
        updateCounts();
        
    } catch (err) {
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
    
    event.target.value = '';
}

async function importSchemes(event) {
    const data = await importFromJson(event);
    if (!data) return;
    
    try {
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
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
    
    event.target.value = '';
}

async function importEquipment(event) {
    const data = await importFromJson(event);
    if (!data) return;
    
    try {
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
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
    
    event.target.value = '';
}

async function importCheatsheets(event) {
    const data = await importFromJson(event);
    if (!data) return;
    
    try {
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
        showNotification('❌ Ошибка импорта: ' + err.message, 'error');
    }
    
    event.target.value = '';
}

// ================================================================
// БРАУЗЕРНАЯ ЗАГРУЗКА (запасной вариант для ПК)
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

function renderAll() {
    renderReferences();
    renderSchemes();
    renderEquipment();
    renderCheatsheets();
    renderCollections();
    updateCounts();
    updateStorageSize();
}
