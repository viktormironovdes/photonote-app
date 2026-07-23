// ================================================================
// ПРОФИЛЬ И НАСТРОЙКИ
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

function exportAllData() {
    const data = exportAllDataJSON();
    if (!data) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_cheatsheet_backup_${getTodayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotification('Данные экспортированы!');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.references || !data.schemes || !data.equipment || !data.cheatsheets) {
                throw new Error('Неверный формат файла');
            }
            
            if (!confirm(`Импортировать данные?\n\n📸 ${data.references.length} референсов\n💡 ${data.schemes.length} схем\n📷 ${data.equipment.length} оборудования\n📋 ${data.cheatsheets.length} шпаргалок`)) {
                return;
            }
            
            state.references = data.references || [];
            state.schemes = data.schemes || [];
            state.equipment = data.equipment || [];
            state.cheatsheets = data.cheatsheets || [];
            state.user = data.user || {
                name: 'Фотограф',
                email: '',
                avatar: null
            };
            
            saveState();
            renderAll();
            showNotification('Данные импортированы!');
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