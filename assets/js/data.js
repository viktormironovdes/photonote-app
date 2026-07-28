// ================================================================
// УПРАВЛЕНИЕ ДАННЫМИ (LOCALSTORAGE)
// Версия 0.1.1 — EXIF-метаданные
// ================================================================

let state = {
    collections: [],
    references: [],
    schemes: [],
    equipment: [],
    cheatsheets: [],
    user: {
        name: 'Фотограф',
        email: '',
        avatar: null
    },
    currentPage: 'collections',
    currentCollectionId: null,
    filteredReferences: [],
    selectedTags: [],
    searchQuery: '',
    referenceCount: 0,
    schemeCount: 0,
    equipmentCount: 0,
    cheatsheetCount: 0,
    collectionCount: 0,
    isDetailEdit: false,
    isNSFWEnabled: false,
    filters: {
        portraitType: 'all',
        colorType: 'all',
        framing: 'all',
        pose: 'all'
    }
};

function loadState() {
    try {
        const raw = localStorage.getItem('photoCheatsheetState');
        if (raw) {
            const data = JSON.parse(raw);
            state.collections = data.collections || [];
            state.references = data.references || [];
            state.schemes = data.schemes || [];
            state.equipment = data.equipment || [];
            state.cheatsheets = data.cheatsheets || [];
            state.user = data.user || {
                name: 'Фотограф',
                email: '',
                avatar: null
            };
            state.isNSFWEnabled = data.isNSFWEnabled || false;
            
            // Миграция старых референсов
            state.references.forEach(r => {
                if (!r.createdAt) r.createdAt = new Date().toISOString();
                if (!r.tags) r.tags = [];
                if (!r.schemeIds) r.schemeIds = [];
                if (!r.equipmentIds) r.equipmentIds = [];
                if (!r.cheatSheetIds) r.cheatSheetIds = [];
                if (r.isFavorite === undefined) r.isFavorite = false;
                if (r.isNSFW === undefined) r.isNSFW = false;
                if (!r.portraitType) r.portraitType = 'single';
                if (!r.colorType) r.colorType = 'color';
                if (!r.framing) r.framing = 'bust';
                if (!r.pose) r.pose = 'standing';
                // НОВОЕ: поле EXIF
                if (r.exif === undefined) r.exif = null;
                // НОВОЕ: если у референса нет collectionId, создаём коллекцию "Основная"
                if (!r.collectionId) {
                    let mainCollection = state.collections.find(c => c.name === 'Основная');
                    if (!mainCollection) {
                        mainCollection = {
                            id: 'col_' + generateUUID(),
                            name: 'Основная',
                            coverImage: null,
                            description: 'Все референсы',
                            referenceIds: [],
                            createdAt: new Date().toISOString()
                        };
                        state.collections.push(mainCollection);
                    }
                    r.collectionId = mainCollection.id;
                    if (!mainCollection.referenceIds.includes(r.id)) {
                        mainCollection.referenceIds.push(r.id);
                    }
                }
            });
            
            // Синхронизируем referenceIds в коллекциях
            state.collections.forEach(c => {
                c.referenceIds = c.referenceIds || [];
                c.referenceIds = c.referenceIds.filter(id => state.references.some(r => r.id === id));
            });
            
            // Загружаем фильтры если есть
            if (data.filters) {
                state.filters = data.filters;
            }
            
            console.log('📊 Данные загружены:', {
                collections: state.collections.length,
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
        collections: state.collections,
        references: state.references,
        schemes: state.schemes,
        equipment: state.equipment,
        cheatsheets: state.cheatsheets,
        user: state.user,
        filters: state.filters,
        isNSFWEnabled: state.isNSFWEnabled
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
    state.collectionCount = state.collections.length;
    
    const refEl = document.getElementById('totalReferences');
    const schEl = document.getElementById('totalSchemes');
    const eqEl = document.getElementById('totalEquipment');
    const chEl = document.getElementById('totalCheatsheets');
    const colEl = document.getElementById('totalCollections');
    
    if (refEl) refEl.textContent = state.referenceCount;
    if (schEl) schEl.textContent = state.schemeCount;
    if (eqEl) eqEl.textContent = state.equipmentCount;
    if (chEl) chEl.textContent = state.cheatsheetCount;
    if (colEl) colEl.textContent = state.collectionCount;
}

function updateStorageSize() {
    const el = document.getElementById('debugStorageSize');
    if (el) {
        const size = getStorageSize();
        el.textContent = `📦 Размер данных: ${formatFileSize(size)}`;
    }
}

function initDemoData() {
    // Создаём демо-коллекции
    state.collections = [
        {
            id: 'col_1',
            name: 'Портреты в студии',
            coverImage: null,
            description: 'Коллекция студийных портретов',
            referenceIds: [],
            createdAt: new Date().toISOString()
        },
        {
            id: 'col_2',
            name: 'Уличная съёмка',
            coverImage: null,
            description: 'Портреты на улице и в интерьерах',
            referenceIds: [],
            createdAt: new Date().toISOString()
        }
    ];
    
    state.schemes = [
        {
            id: 'scheme_1',
            name: 'Рембрандт с октобоксом',
            image: null,
            description: 'Октобокс под 45° сверху справа, отражатель слева снизу',
            tags: ['#студийная', '#портрет', '#рембрандт'],
            createdAt: new Date().toISOString()
        },
        {
            id: 'scheme_2',
            name: 'Бабочка (муляж)',
            image: null,
            description: 'Источник света прямо над объектом, чуть вперёд',
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
            content: 'Правило 500: максимальная выдержка = 500 / фокусное расстояние (мм)',
            image: null,
            createdAt: new Date().toISOString()
        },
        {
            id: 'cs_2',
            name: 'Соответствие ISO и выдержки',
            type: 'table',
            content: 'ISO 100 → 1/100\nISO 200 → 1/200\nISO 400 → 1/400',
            image: null,
            createdAt: new Date().toISOString()
        }
    ];
    
    // Создаём демо-референсы с привязкой к коллекциям и EXIF
    const refs = [
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
            isNSFW: false,
            portraitType: 'single',
            colorType: 'color',
            framing: 'bust',
            pose: 'standing',
            collectionId: 'col_1',
            exif: {
                camera: 'Sony A7IV',
                lens: 'Sony 85mm f/1.4 GM',
                focalLength: '85mm',
                aperture: 'f/2.8',
                exposureTime: '1/125',
                iso: '100',
                dateTime: '2026-07-28 14:30:00',
                flash: false
            },
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
            isNSFW: false,
            portraitType: 'single',
            colorType: 'color',
            framing: 'full',
            pose: 'standing',
            collectionId: 'col_1',
            exif: null,
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
            isNSFW: false,
            portraitType: 'single',
            colorType: 'bw',
            framing: 'waist',
            pose: 'sitting',
            collectionId: 'col_2',
            exif: {
                camera: 'Canon EOS R5',
                lens: '',
                focalLength: '50mm',
                aperture: 'f/1.8',
                exposureTime: '1/250',
                iso: '400',
                dateTime: '2026-07-27 16:45:00',
                flash: false
            },
            createdAt: new Date().toISOString()
        }
    ];
    
    state.references = refs;
    
    // Заполняем referenceIds в коллекциях
    state.collections.forEach(c => {
        c.referenceIds = state.references
            .filter(r => r.collectionId === c.id)
            .map(r => r.id);
    });
    
    saveState();
}

// ================================================================
// CRUD ДЛЯ КОЛЛЕКЦИЙ
// ================================================================

function getCollection(id) {
    return state.collections.find(c => c.id === id);
}

function getCollections() {
    return state.collections;
}

function getReferencesByCollection(collectionId) {
    return state.references.filter(r => r.collectionId === collectionId);
}

function addCollection(name, description = '', coverImage = null) {
    const collection = {
        id: 'col_' + generateUUID(),
        name: name || 'Новая коллекция',
        coverImage: coverImage,
        description: description,
        referenceIds: [],
        createdAt: new Date().toISOString()
    };
    state.collections.push(collection);
    saveState();
    return collection;
}

function updateCollection(id, data) {
    const collection = getCollection(id);
    if (!collection) return null;
    
    if (data.name !== undefined) collection.name = data.name;
    if (data.description !== undefined) collection.description = data.description;
    if (data.coverImage !== undefined) collection.coverImage = data.coverImage;
    
    saveState();
    return collection;
}

function deleteCollection(id) {
    const collection = getCollection(id);
    if (!collection) return;
    
    // Удаляем все референсы в этой коллекции
    const refsToDelete = state.references.filter(r => r.collectionId === id);
    refsToDelete.forEach(r => {
        state.references = state.references.filter(ref => ref.id !== r.id);
    });
    
    // Удаляем коллекцию
    state.collections = state.collections.filter(c => c.id !== id);
    saveState();
}

// ================================================================
// CRUD ДЛЯ РЕФЕРЕНСОВ
// ================================================================

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
        isNSFW: data.isNSFW || false,
        portraitType: data.portraitType || 'single',
        colorType: data.colorType || 'color',
        framing: data.framing || 'bust',
        pose: data.pose || 'standing',
        collectionId: data.collectionId || null,
        exif: data.exif || null,  // НОВОЕ: EXIF-данные
        createdAt: new Date().toISOString()
    };
    state.references.push(ref);
    
    // Добавляем ID в коллекцию
    if (ref.collectionId) {
        const collection = getCollection(ref.collectionId);
        if (collection && !collection.referenceIds.includes(ref.id)) {
            collection.referenceIds.push(ref.id);
        }
    }
    
    saveState();
    return ref;
}

function updateReference(id, data) {
    const ref = getReference(id);
    if (!ref) return null;
    
    // Если меняется коллекция — обновляем referenceIds
    if (data.collectionId !== undefined && data.collectionId !== ref.collectionId) {
        // Удаляем из старой коллекции
        const oldCollection = getCollection(ref.collectionId);
        if (oldCollection) {
            oldCollection.referenceIds = oldCollection.referenceIds.filter(rid => rid !== id);
        }
        // Добавляем в новую коллекцию
        const newCollection = getCollection(data.collectionId);
        if (newCollection && !newCollection.referenceIds.includes(id)) {
            newCollection.referenceIds.push(id);
        }
        ref.collectionId = data.collectionId;
    }
    
    if (data.image !== undefined) ref.image = data.image;
    if (data.name !== undefined) ref.name = data.name;
    if (data.description !== undefined) ref.description = data.description;
    if (data.tags !== undefined) ref.tags = data.tags;
    if (data.schemeIds !== undefined) ref.schemeIds = data.schemeIds;
    if (data.equipmentIds !== undefined) ref.equipmentIds = data.equipmentIds;
    if (data.cheatSheetIds !== undefined) ref.cheatSheetIds = data.cheatSheetIds;
    if (data.isFavorite !== undefined) ref.isFavorite = data.isFavorite;
    if (data.isNSFW !== undefined) ref.isNSFW = data.isNSFW;
    if (data.portraitType !== undefined) ref.portraitType = data.portraitType;
    if (data.colorType !== undefined) ref.colorType = data.colorType;
    if (data.framing !== undefined) ref.framing = data.framing;
    if (data.pose !== undefined) ref.pose = data.pose;
    if (data.exif !== undefined) ref.exif = data.exif;  // НОВОЕ
    
    saveState();
    return ref;
}

function deleteReference(id) {
    const ref = getReference(id);
    if (!ref) return;
    
    // Удаляем из коллекции
    const collection = getCollection(ref.collectionId);
    if (collection) {
        collection.referenceIds = collection.referenceIds.filter(rid => rid !== id);
    }
    
    state.references = state.references.filter(r => r.id !== id);
    saveState();
}

function copyReferenceToCollection(refId, targetCollectionId) {
    const ref = getReference(refId);
    if (!ref) return null;
    
    const targetCollection = getCollection(targetCollectionId);
    if (!targetCollection) return null;
    
    // Создаём КОПИЮ референса (новый ID)
    const newRef = {
        ...ref,
        id: 'ref_' + generateUUID(),
        collectionId: targetCollectionId,
        createdAt: new Date().toISOString(),
        isFavorite: false // копия не наследует избранное
    };
    
    state.references.push(newRef);
    targetCollection.referenceIds.push(newRef.id);
    
    saveState();
    return newRef;
}

function moveReferenceToCollection(refId, targetCollectionId) {
    const ref = getReference(refId);
    if (!ref) return null;
    
    const targetCollection = getCollection(targetCollectionId);
    if (!targetCollection) return null;
    
    // Удаляем из старой коллекции
    const oldCollection = getCollection(ref.collectionId);
    if (oldCollection) {
        oldCollection.referenceIds = oldCollection.referenceIds.filter(rid => rid !== refId);
    }
    
    // Добавляем в новую
    ref.collectionId = targetCollectionId;
    if (!targetCollection.referenceIds.includes(refId)) {
        targetCollection.referenceIds.push(refId);
    }
    
    saveState();
    return ref;
}

function toggleNSFW(id) {
    const ref = getReference(id);
    if (ref) {
        ref.isNSFW = !ref.isNSFW;
        saveState();
        return ref.isNSFW;
    }
    return false;
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

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений)
// ================================================================

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

function getSchemesByIds(ids) {
    return state.schemes.filter(s => ids.includes(s.id));
}

function getEquipmentByIds(ids) {
    return state.equipment.filter(e => ids.includes(e.id));
}

function getCheatsheetsByIds(ids) {
    return state.cheatsheets.filter(c => ids.includes(c.id));
}

function exportAllDataJSON() {
    return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        collections: state.collections,
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
        
        state.collections = data.collections || [];
        state.references = data.references || [];
        state.schemes = data.schemes || [];
        state.equipment = data.equipment || [];
        state.cheatsheets = data.cheatsheets || [];
        state.user = data.user || {
            name: 'Фотограф',
            email: '',
            avatar: null
        };
        
        // Миграция для импортированных данных
        state.references.forEach(r => {
            if (!r.portraitType) r.portraitType = 'single';
            if (!r.colorType) r.colorType = 'color';
            if (!r.framing) r.framing = 'bust';
            if (!r.pose) r.pose = 'standing';
            if (r.isNSFW === undefined) r.isNSFW = false;
            if (r.exif === undefined) r.exif = null;
            if (!r.collectionId) {
                let mainCollection = state.collections.find(c => c.name === 'Основная');
                if (!mainCollection) {
                    mainCollection = {
                        id: 'col_' + generateUUID(),
                        name: 'Основная',
                        coverImage: null,
                        description: 'Все референсы',
                        referenceIds: [],
                        createdAt: new Date().toISOString()
                    };
                    state.collections.push(mainCollection);
                }
                r.collectionId = mainCollection.id;
                if (!mainCollection.referenceIds.includes(r.id)) {
                    mainCollection.referenceIds.push(r.id);
                }
            }
        });
        
        // Синхронизируем referenceIds
        state.collections.forEach(c => {
            c.referenceIds = c.referenceIds || [];
            c.referenceIds = c.referenceIds.filter(id => state.references.some(r => r.id === id));
        });
        
        saveState();
        return true;
    } catch (e) {
        console.error('❌ Ошибка импорта:', e);
        return false;
    }
}
