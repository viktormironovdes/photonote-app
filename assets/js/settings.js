// ================================================================
// ПРОФИЛЬ И НАСТРОЙКИ
// ================================================================

let Share = null;
let isNative = false;

// Проверяем наличие Capacitor
if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    isNative = true;
    console.log('📱 Запущено на нативной платформе (Android)');
    
    // Получаем Share плагин
    if (window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
        Share = window.Capacitor.Plugins.Share;
        console.log('✅ Capacitor Share загружен');
    } else {
        console.warn('⚠️ Capacitor Share не найден');
    }
} else {
    console.log('💻 Запущено в браузере (Web)');
}

function saveProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const emailInput = document.getElementById('profileEmailInput');
    
    if (!nameInput || !emailInput) {
        console.error('❌ Profile inputs not found');
        return;
    }
    
    const newName = nameInput.value.trim() || 'Вы';
    const newEmail = emailInput.value.trim();
    
    console.log('💾 Saving profile:', { name: newName, email: newEmail });
    
    state.user.name = newName;
    state.user.email = newEmail;
    
    state.user.notifications = {
        push: document.getElementById('notifPush')?.checked ?? true,
        email: document.getElementById('notifEmail')?.checked ?? false,
    };
    
    saveState();
    updateAvatarDisplay();
    alert('✅ Профиль сохранён!');
}

function loadProfile() {
    console.log('📂 Loading profile...');
    
    if (!state.user.name || state.user.name.trim() === '') {
        state.user.name = 'Вы';
        saveState();
    }
    
    document.getElementById('profileNameInput').value = state.user.name || 'Вы';
    document.getElementById('profileEmailInput').value = state.user.email || '';
    document.getElementById('notifPush').checked = state.user.notifications?.push ?? true;
    document.getElementById('notifEmail').checked = state.user.notifications?.email ?? false;
    
    updateAvatarDisplay();
}

function updateAvatarDisplay() {
    const letterEl = document.getElementById('avatarLetter');
    const imgEl = document.getElementById('avatarImage');
    
    if (!letterEl || !imgEl) {
        console.error('❌ Элементы аватарки не найдены');
        return;
    }
    
    if (state.user.avatar) {
        letterEl.style.display = 'none';
        imgEl.style.display = 'block';
        imgEl.src = state.user.avatar;
    } else {
        letterEl.style.display = 'block';
        imgEl.style.display = 'none';
        const name = state.user.name || 'Вы';
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
            alert('✅ Аватар обновлён!');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function showDisplaySettingsModal() {
    const settings = state.user.display_settings || {};
    document.getElementById('settingsPlacement').checked = settings.show_placement !== undefined ? settings.show_placement : true;
    document.getElementById('settingsCondition').checked = settings.show_condition !== undefined ? settings.show_condition : true;
    document.getElementById('settingsLight').checked = settings.show_light !== undefined ? settings.show_light : true;
    document.getElementById('settingsWatering').checked = settings.show_watering !== undefined ? settings.show_watering : true;
    document.getElementById('settingsFertilizing').checked = settings.show_fertilizing !== undefined ? settings.show_fertilizing : true;
    document.getElementById('settingsLatinName').checked = settings.show_latin_name || false;
    document.getElementById('settingsPlantingDate').checked = settings.show_planting_date || false;
    document.getElementById('settingsFertilizingPeriod').checked = settings.show_fertilizing_period || false;
    document.getElementById('settingsLastRepotting').checked = settings.show_last_repotting || false;
    document.getElementById('settingsNotes').checked = settings.show_notes || false;
    document.getElementById('settingsCareInfo').checked = settings.show_care_info || false;
    document.getElementById('displaySettingsModal').classList.add('show');
}

function closeDisplaySettingsModal() {
    document.getElementById('displaySettingsModal').classList.remove('show');
}

function saveDisplaySettings() {
    state.user.display_settings = {
        show_placement: document.getElementById('settingsPlacement').checked,
        show_condition: document.getElementById('settingsCondition').checked,
        show_light: document.getElementById('settingsLight').checked,
        show_watering: document.getElementById('settingsWatering').checked,
        show_fertilizing: document.getElementById('settingsFertilizing').checked,
        show_latin_name: document.getElementById('settingsLatinName').checked,
        show_planting_date: document.getElementById('settingsPlantingDate').checked,
        show_fertilizing_period: document.getElementById('settingsFertilizingPeriod').checked,
        show_last_repotting: document.getElementById('settingsLastRepotting').checked,
        show_notes: document.getElementById('settingsNotes').checked,
        show_care_info: document.getElementById('settingsCareInfo').checked,
    };
    saveState();
    if (state.detailFlowerId) {
        renderDetailPage(state.detailFlowerId);
    }
}

// ================================================================
// ЭКСПОРТ КОЛЛЕКЦИЙ (ЧЕРЕЗ SHARE)
// ================================================================

function showExportBaseModal() {
    if (state.bases.length === 0) { 
        alert('❌ Нет коллекций для экспорта'); 
        return; 
    }
    const select = document.getElementById('exportBaseSelect');
    select.innerHTML = state.bases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('');
    document.getElementById('exportBaseModal').classList.add('show');
}

function closeExportBaseModal() {
    document.getElementById('exportBaseModal').classList.remove('show');
}

async function executeExportBase() {
    const baseId = document.getElementById('exportBaseSelect').value;
    const base = getBase(baseId);
    if (!base) return;
    const flowers = getFlowersByBase(baseId);
    const data = { base, flowers, exportedAt: new Date().toISOString() };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `collection_${base.name}_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Экспорт коллекции через Share:', { baseId, fileName, isNative });

    try {
        if (isNative && Share) {
            console.log('📱 Используем Capacitor Share для экспорта на Android');
            
            await Share.share({
                title: `Коллекция: ${base.name}`,
                text: `📋 Коллекция "${base.name}"\n🌱 Растений: ${flowers.length}\n📅 Экспортировано: ${new Date().toLocaleDateString('ru-RU')}\n\nДанные прилагаются в виде файла.`,
                files: [{
                    data: jsonString,
                    mimeType: 'application/json',
                    fileName: fileName
                }]
            });
            
            console.log('✅ Окно "Поделиться" открыто');
            alert('✅ Открыто окно "Поделиться"! Выберите куда сохранить или отправить файл.');
            closeExportBaseModal();
            
        } else {
            console.log('💻 Используем браузерное скачивание');
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция экспортирована!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
            closeExportBaseModal();
        }
    } catch (error) {
        console.error('❌ Критическая ошибка экспорта:', error);
        
        try {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция экспортирована!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
            closeExportBaseModal();
        } catch (fallbackError) {
            alert(`❌ Ошибка при экспорте: ${error.message}`);
        }
    }
}

function importBase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.base || !data.flowers) { alert('Неверный формат'); return; }
            if (state.bases.some(b => b.name === data.base.name && b.owner === 'Вы')) {
                if (!confirm(`Коллекция "${data.base.name}" уже существует. Создать копию?`)) return;
                data.base.name = data.base.name + ' (копия)';
            }
            const newBaseId = 'base_' + generateUUID();
            data.base.id = newBaseId;
            data.base.owner = 'Вы';
            state.bases.push(data.base);
            data.flowers.forEach(f => {
                const newId = 'flower_' + generateUUID();
                f.id = newId;
                f.base_id = newBaseId;
                if (!f.latin_name) f.latin_name = '';
                if (!f.planting_date) f.planting_date = new Date().toISOString().slice(0, 7);
                if (!f.fertilizing_start) f.fertilizing_start = 3;
                if (!f.fertilizing_end) f.fertilizing_end = 10;
                if (!f.catalog_name) f.catalog_name = f.name;
                if (!f.catalog_icon) f.catalog_icon = '🌿';
                if (!f.catalog_description) f.catalog_description = '';
                if (!f.history) f.history = [];
                state.flowers.push(f);
            });
            saveState();
            renderAll();
            renderCare();
            renderCalendar();
            alert('✅ Коллекция импортирована');
        } catch (err) { alert('Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ЭКСПОРТ ВСЕХ ДАННЫХ (ЧЕРЕЗ SHARE)
// ================================================================

async function exportAllData() {
    const data = { bases: state.bases, flowers: state.flowers, user: state.user };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `all_data_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Экспорт всех данных через Share:', { fileName, isNative });

    try {
        if (isNative && Share) {
            await Share.share({
                title: 'Все данные PhytoNote',
                text: `📋 Полный экспорт данных PhytoNote\n📁 Коллекций: ${state.bases.length}\n🌱 Растений: ${state.flowers.length}\n📅 Экспортировано: ${new Date().toLocaleDateString('ru-RU')}\n\nДанные прилагаются в виде файла.`,
                files: [{
                    data: jsonString,
                    mimeType: 'application/json',
                    fileName: fileName
                }]
            });
            
            alert('✅ Открыто окно "Поделиться"! Выберите куда сохранить или отправить файл.');
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Все данные экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка при экспорте: ${error.message}`);
    }
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.bases && data.flowers) {
                state.bases = data.bases;
                state.flowers = data.flowers;
                state.user = data.user || {
                    name: 'Вы',
                    email: '',
                    avatar: null,
                    notifications: { push: true, email: false },
                    display_settings: {
                        show_placement: true,
                        show_condition: true,
                        show_light: true,
                        show_watering: true,
                        show_fertilizing: true,
                        show_latin_name: false,
                        show_planting_date: false,
                        show_fertilizing_period: false,
                        show_last_repotting: false,
                        show_notes: false,
                        show_care_info: false,
                    }
                };
                saveState();
                renderAll();
                renderCare();
                renderCalendar();
                alert('✅ Данные успешно импортированы!');
            } else {
                alert('❌ Неверный формат файла');
            }
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function getLogs() {
    try {
        const raw = localStorage.getItem('appLogs');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

async function exportLogs() {
    const logs = getLogs();
    if (logs.length === 0) {
        alert('Логи пусты');
        return;
    }
    const jsonString = JSON.stringify(logs, null, 2);
    const fileName = `phytonote_logs_${new Date().toISOString().split('T')[0]}.json`;

    try {
        if (isNative && Share) {
            await Share.share({
                title: 'Логи PhytoNote',
                text: `📋 Логи приложения\n📅 Экспортировано: ${new Date().toLocaleDateString('ru-RU')}\n📄 Записей: ${logs.length}`,
                files: [{
                    data: jsonString,
                    mimeType: 'application/json',
                    fileName: fileName
                }]
            });
            alert('✅ Открыто окно "Поделиться"!');
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Логи экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка при экспорте: ${error.message}`);
    }
}
