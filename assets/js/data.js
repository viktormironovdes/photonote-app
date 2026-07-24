// ================================================================
// УПРАВЛЕНИЕ ДАННЫМИ (LOCALSTORAGE)
// ================================================================

let state = {
    references: [],
    schemes: [],
    equipment: [],
    cheatsheets: [],
    user: {
        name: 'Фотограф',
        email: '',
        avatar: null
    },
    currentPage: 'references',
    filteredReferences: [],
    selectedTags: [],
    searchQuery: '',
    referenceCount: 0,
    schemeCount: 0,
    equipmentCount: 0,
    cheatsheetCount: 0,
    isDetailEdit: false
};

function loadState() {
    try {
        const raw = localStorage.getItem('photoCheatsheetState');
        if (raw) {
            const data = JSON.parse(raw);
            state.references = data.references || [];
            state.schemes = data.schemes || [];
            state.equipment = data.equipment || [];
            state.cheatsheets = data.cheatsheets || [];
            state.user = data.user || {
                name: 'Фотограф',
                email: '',
                avatar: null
            };
            
            state.references.forEach(r => {
                if (!r.createdAt) r.createdAt = new Date().toISOString();
                if (!r.tags) r.tags = [];
                if (!r.schemeIds) r.schemeIds = [];
                if (!r.equipmentIds) r.equipmentIds = [];
                if (!r.cheatSheetIds) r.cheatSheetIds = [];
                if (r.isFavorite === undefined) r.isFavorite = false;
            });
            
            state.schemes.forEach(s => {
                if (!s.createdAt) s.createdAt = new Date().toISOString();
                if (!s.tags) s.tags = [];
            });
            
            state.equipment.forEach(e => {
                if (!e.createdAt) e.createdAt = new Date().toISOString();
            });
            
            state.cheatsheets.forEach(c => {
                if (!c.createdAt) c.createdAt = new Date().toISOString();
            });
            
            console.log('📊 Данные загружены:', {
                references: state.references.length,
                schemes: state.schemes.length,
                equipment: state.equipment.length,
                cheatsheets: state.cheatsheets.length
            });
        } else {
            console.log('📊 Данных нет, создаём демо');
            initDemoData();
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки состояния:', e);
        initDemoData();
    }
    updateCounts();
}

function saveState() {
    const data = {
        references: state.references,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets,
        user: state.user
    };
    localStorage.setItem('photoCheatsheetState', JSON.stringify(data));
    updateCounts();
    updateStorageSize();
}

function updateCounts() {
    state.referenceCount = state.references.length;
    state.schemeCount = state.schemes.length;
    state.equipmentCount = state.equipment.length;
    state.cheatsheetCount = state.cheatsheets.length;
    
    const refEl = document.getElementById('totalReferences');
    const schEl = document.getElementById('totalSchemes');
    const eqEl = document.getElementById('totalEquipment');
    const chEl = document.getElementById('totalCheatsheets');
    
    if (refEl) refEl.textContent = state.referenceCount;
    if (schEl) schEl.textContent = state.schemeCount;
    if (eqEl) eqEl.textContent = state.equipmentCount;
    if (chEl) chEl.textContent = state.cheatsheetCount;
}

function updateStorageSize() {
    const el = document.getElementById('debugStorageSize');
    if (el) {
        const size = getStorageSize();
        el.textContent = `📦 Размер данных: ${formatFileSize(size)}`;
    }
}

function initDemoData() {
    state.schemes = [
        {
            id: 'scheme_1',
            name: 'Рембрандт с октобоксом',
            image: null,
            description: 'Октобокс под 45° сверху справа, отражатель слева снизу для заполнения теней',
            tags: ['#студийная', '#портрет', '#рембрандт'],
            createdAt: new Date().toISOString()
        },
        {
            id: 'scheme_2',
            name: 'Бабочка (муляж)',
            image: null,
            description: 'Источник света прямо над объектом, чуть вперёд. Создаёт симметричные тени под носом',
            tags: ['#студийная', '#портрет', '#бабочка'],
            createdAt: new Date().toISOString()
        },
        {
            id: 'scheme_3',
            name: 'Контровой свет + заполнение',
            image: null,
            description: 'Контровой источник сзади-сбоку, заполняющий отражатель спереди',
            tags: ['#студийная', '#портрет', '#контровой'],
            createdAt: new Date().toISOString()
        }
    ];
    
    state.equipment = [
        {
            id: 'eq_1',
            type: 'camera',
            name: 'Sony A7IV',
            specs: '33 МП, Full Frame, 10 fps',
            image: null,
            createdAt: new Date().toISOString()
        },
        {
            id: 'eq_2',
            type: 'lens',
            name: 'Sony 85mm f/1.4 GM',
            specs: 'Портретный объектив, отличное боке',
            image: null,
            createdAt: new Date().toISOString()
        },
        {
            id: 'eq_3',
            type: 'light',
            name: 'Godox AD200 Pro',
            specs: '200Ws, TTL, 2.4G',
            image: null,
            createdAt: new Date().toISOString()
        }
    ];
    
    state.cheatsheets = [
        {
            id: 'cs_1',
            name: 'Правило 500 для астрофото',
            type: 'text',
            content: 'Правило 500: максимальная выдержка = 500 / фокусное расстояние (мм)\nНапример: для 24мм → 500/24 ≈ 20 секунд',
            image: null,
            createdAt: new Date().toISOString()
        },
        {
            id: 'cs_2',
            name: 'Соответствие ISO и выдержки',
            type: 'table',
            content: 'ISO 100 → 1/100\nISO 200 → 1/200\nISO 400 → 1/400\nISO 800 → 1/800\nISO 1600 → 1/1600',
            image: null,
            createdAt: new Date().toISOString()
        }
    ];
    
    state.references = [
        {
            id: 'ref_1',
            image: null,
            name: 'Портрет с рембрандтовским светом',
            description: 'Снимал на 85mm, f/2.8, ISO 100. Октобокс справа, отражатель слева',
            tags: ['#портрет', '#женский', '#студия', '#рембрандт', '#драматичный'],
            schemeIds: ['scheme_1'],
            equipmentIds: ['eq_1', 'eq_2', 'eq_3'],
            cheatSheetIds: [],
            isFavorite: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'ref_2',
            image: null,
            name: 'Предметка с круговым светом',
            description: 'Использовал круговой свет для создания мягких теней',
            tags: ['#предметка', '#студия', '#круглый_свет'],
            schemeIds: [],
            equipmentIds: ['eq_3'],
            cheatSheetIds: [],
            isFavorite: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 'ref_3',
            image: null,
            name: 'Уличный портрет в интерьере',
            description: 'Естественный свет из окна, отражатель для заполнения',
            tags: ['#портрет', '#мужской', '#интерьер', '#естественный_свет'],
            schemeIds: [],
            equipmentIds: ['eq_1', 'eq_2'],
            cheatSheetIds: ['cs_1'],
            isFavorite: false,
            createdAt: new Date().toISOString()
        }
    ];
    
    saveState();
}

function getReference(id) {
    return state.references.find(r => r.id === id);
}

function addReference(data) {
    const ref = {
        id: 'ref_' + generateUUID(),
        image: data.image || null,
        name: data.name || 'Без названия',
        description: data.description || '',
        tags: data.tags || [],
        schemeIds: data.schemeIds || [],
        equipmentIds: data.equipmentIds || [],
        cheatSheetIds: data.cheatSheetIds || [],
        isFavorite: data.isFavorite || false,
        createdAt: new Date().toISOString()
    };
    state.references.push(ref);
    saveState();
    return ref;
}

function updateReference(id, data) {
    const ref = getReference(id);
    if (!ref) return null;
    
    if (data.image !== undefined) ref.image = data.image;
    if (data.name !== undefined) ref.name = data.name;
    if (data.description !== undefined) ref.description = data.description;
    if (data.tags !== undefined) ref.tags = data.tags;
    if (data.schemeIds !== undefined) ref.schemeIds = data.schemeIds;
    if (data.equipmentIds !== undefined) ref.equipmentIds = data.equipmentIds;
    if (data.cheatSheetIds !== undefined) ref.cheatSheetIds = data.cheatSheetIds;
    if (data.isFavorite !== undefined) ref.isFavorite = data.isFavorite;
    
    saveState();
    return ref;
}

function deleteReference(id) {
    state.references = state.references.filter(r => r.id !== id);
    saveState();
}

function toggleFavorite(id) {
    const ref = getReference(id);
    if (ref) {
        ref.isFavorite = !ref.isFavorite;
        saveState();
        return ref.isFavorite;
    }
    return false;
}

function getScheme(id) {
    return state.schemes.find(s => s.id === id);
}

function addScheme(data) {
    const scheme = {
        id: 'scheme_' + generateUUID(),
        name: data.name || 'Без названия',
        image: data.image || null,
        description: data.description || '',
        tags: data.tags || [],
        createdAt: new Date().toISOString()
    };
    state.schemes.push(scheme);
    saveState();
    return scheme;
}

function updateScheme(id, data) {
    const scheme = getScheme(id);
    if (!scheme) return null;
    
    if (data.name !== undefined) scheme.name = data.name;
    if (data.image !== undefined) scheme.image = data.image;
    if (data.description !== undefined) scheme.description = data.description;
    if (data.tags !== undefined) scheme.tags = data.tags;
    
    saveState();
    return scheme;
}

function deleteScheme(id) {
    state.schemes = state.schemes.filter(s => s.id !== id);
    state.references.forEach(r => {
        r.schemeIds = r.schemeIds.filter(sid => sid !== id);
    });
    saveState();
}

function getSchemesForReference(refId) {
    const ref = getReference(refId);
    if (!ref) return [];
    return state.schemes.filter(s => ref.schemeIds.includes(s.id));
}

function getReferenceCountForScheme(schemeId) {
    return state.references.filter(r => r.schemeIds.includes(schemeId)).length;
}

function getEquipment(id) {
    return state.equipment.find(e => e.id === id);
}

function addEquipment(data) {
    const eq = {
        id: 'eq_' + generateUUID(),
        type: data.type || 'camera',
        name: data.name || 'Без названия',
        specs: data.specs || '',
        image: data.image || null,
        createdAt: new Date().toISOString()
    };
    state.equipment.push(eq);
    saveState();
    return eq;
}

function updateEquipment(id, data) {
    const eq = getEquipment(id);
    if (!eq) return null;
    
    if (data.type !== undefined) eq.type = data.type;
    if (data.name !== undefined) eq.name = data.name;
    if (data.specs !== undefined) eq.specs = data.specs;
    if (data.image !== undefined) eq.image = data.image;
    
    saveState();
    return eq;
}

function deleteEquipment(id) {
    state.equipment = state.equipment.filter(e => e.id !== id);
    state.references.forEach(r => {
        r.equipmentIds = r.equipmentIds.filter(eid => eid !== id);
    });
    saveState();
}

function getEquipmentForReference(refId) {
    const ref = getReference(refId);
    if (!ref) return [];
    return state.equipment.filter(e => ref.equipmentIds.includes(e.id));
}

function getCheatsheet(id) {
    return state.cheatsheets.find(c => c.id === id);
}

function addCheatsheet(data) {
    const cs = {
        id: 'cs_' + generateUUID(),
        name: data.name || 'Без названия',
        type: data.type || 'text',
        content: data.content || '',
        image: data.image || null,
        createdAt: new Date().toISOString()
    };
    state.cheatsheets.push(cs);
    saveState();
    return cs;
}

function updateCheatsheet(id, data) {
    const cs = getCheatsheet(id);
    if (!cs) return null;
    
    if (data.name !== undefined) cs.name = data.name;
    if (data.type !== undefined) cs.type = data.type;
    if (data.content !== undefined) cs.content = data.content;
    if (data.image !== undefined) cs.image = data.image;
    
    saveState();
    return cs;
}

function deleteCheatsheet(id) {
    state.cheatsheets = state.cheatsheets.filter(c => c.id !== id);
    state.references.forEach(r => {
        r.cheatSheetIds = r.cheatSheetIds.filter(cid => cid !== id);
    });
    saveState();
}

function getCheatsheetsForReference(refId) {
    const ref = getReference(refId);
    if (!ref) return [];
    return state.cheatsheets.filter(c => ref.cheatSheetIds.includes(c.id));
}

function exportAllDataJSON() {
    return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        references: state.references,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets,
        user: state.user
    }, null, 2);
}

function importAllData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (!data.references || !data.schemes || !data.equipment || !data.cheatsheets) {
            throw new Error('Неверный формат данных');
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
        return true;
    } catch (e) {
        console.error('❌ Ошибка импорта:', e);
        return false;
    }
}
