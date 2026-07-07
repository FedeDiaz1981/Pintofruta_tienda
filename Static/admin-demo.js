const STORAGE_KEY = "pintofruta-static-site-content-v2";
const LEGACY_STORAGE_KEY = "pintofruta-static-site-content-v1";
const BLOCKED_NAV_IDS = new Set(["diets", "promotions", "imported"]);

const defaultState = {
    sessionRole: "admin",
    viewMode: "public",
    activeAdminPanel: "products",
    panelSearchQuery: "",
    activeModalAction: "view",
    headerNavigation: window.PF_BASE_CONTENT?.headerNavigation || { searchScopes: [], sections: [] },
    heroSlides: [
        {
            id: 1,
            order: 1,
            title: "Sierra de los Padres",
            subtitle: "Destacados de temporada con visual principal del home.",
            badge: "Campana activa",
            image: "Content/Images/Banners/Banner SM 1.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/1015-sierra-de-los-padres",
            active: true,
            homeSpotlight: true
        },
        {
            id: 2,
            order: 2,
            title: "Suma",
            subtitle: "Oferta destacada con acceso directo a la galeria.",
            badge: "Promo",
            image: "Content/Images/Banners/Banner Suma 2.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/954-suma",
            active: true,
            homeSpotlight: false
        },
        {
            id: 3,
            order: 3,
            title: "Un Mate",
            subtitle: "Contenido editable para comunicar lanzamientos o marcas.",
            badge: "Lanzamiento",
            image: "Content/Images/Banners/Un Mate Banner 3.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/984-un-mate",
            active: true,
            homeSpotlight: false
        },
        {
            id: 4,
            order: 4,
            title: "Qu Cocoiogo",
            subtitle: "Banner de marca con link a categoria especifica.",
            badge: "Marca",
            image: "Content/Images/Banners/Banner QU Cocoiogo 4.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/644-qu",
            active: true,
            homeSpotlight: false
        },
        {
            id: 5,
            order: 5,
            title: "Meraki",
            subtitle: "Slide pensado para mostrar una nueva campana visual.",
            badge: "Nuevo",
            image: "Content/Images/Banners/Meraki Banner.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/129-meraki",
            active: true,
            homeSpotlight: false
        },
        {
            id: 6,
            order: 6,
            title: "Veg Abundancia",
            subtitle: "Cierre del carrusel con foco en la lista de productos.",
            badge: "Promo",
            image: "Content/Images/Banners/Banner VA 6.jpg",
            imageMobile: "",
            link: "galeria.html?source=/Galeria/657-veg-abundancia",
            active: true,
            homeSpotlight: false
        }
    ],
    products: [],
    brands: [],
    categories: [
        { id: 1, name: "Catalogo importado", slug: "catalogo-importado", visible: true },
    ],
    users: [
        { id: 1, name: "Laura Gomez", email: "laura@demo.com", role: "admin", canSeePrices: true, active: true },
        { id: 2, name: "Sofia Perez", email: "sofia@demo.com", role: "customer", canSeePrices: true, active: true },
        { id: 3, name: "Martin Ruiz", email: "martin@demo.com", role: "customer", canSeePrices: false, active: true },
        { id: 4, name: "Muestra Inactiva", email: "inactive@demo.com", role: "customer", canSeePrices: true, active: false },
    ],
    nextIds: { product: 1, category: 2, user: 5, heroSlide: 7 },
};

let state = loadState();

const els = {};
let productImageDirectoryHandle = null;
let brandImageDirectoryHandle = null;
const LOCAL_SAVE_SERVER = "http://127.0.0.1:8787";

document.addEventListener("DOMContentLoaded", async () => {
    bindElements();
    state = await loadInitialState();
    state.brands = Array.isArray(state.brands) && state.brands.length ? state.brands : deriveBrandsFromProducts();
    bindEvents();
    syncForms();
    renderAll();
});

function bindElements() {
    const ids = [
        "panelApp", "panelSidebar", "panelTitle", "topbarProducts", "topbarCategories", "topbarUsers", "topbarCount", "panelKicker",
        "panelTableTitle", "panelKpis", "panelSearch", "panelCreate", "panelEditorSlot", "panelTable", "panelTableHead", "panelTableBody",
        "featuredPublic", "featuredMember", "featuredDiff", "storefrontGrid", "adminLock",
        "adminLauncher", "adminModalBackdrop", "adminModalTitle", "adminModalKicker", "closeAdminModal",
        "downloadJsonCard",
        "productForm", "productId", "productSku", "productDetail", "productPresentation", "productCategory", "productBrand", "productImage", "productImageFile", "productImageCurrent", "productFeatured", "productTrending", "productVegano", "productKosher", "productTesteadoEnAnimales", "productPublicPrice",
        "productMemberPrice", "productTable", "resetProductForm",
        "categoryForm", "categoryId", "categoryName", "categorySlug", "categoryVisible", "categoryList", "resetCategoryForm",
        "userForm", "userId", "userName", "userEmail", "userRole", "userCanSeePrices", "userActive", "userTable", "resetUserForm",
        "heroForm", "heroId", "heroTitle", "heroSubtitle", "heroImage", "heroImageMobile", "heroLink", "heroBadge", "heroOrder", "heroActive", "heroHomeSpotlight",
        "heroTable", "resetHeroForm", "navForm", "navRecordId", "navRecordType", "navParentSectionField", "navParentSection",
        "navRecordLabel", "navRecordHref", "saveNavRecord", "resetNavForm", "navScopesList", "navSectionsList", "downloadTemplate",
        "downloadCatalog", "priceFile", "importPrices", "importState", "downloadJson", "topbarBrands", "brandForm", "brandId", "brandCode", "brandName", "brandImage", "brandImageFile", "brandImageCurrent", "brandFeatured", "resetBrandForm", "brandTable",
        "brandPanelForm", "brandPanelId", "brandPanelCode", "brandPanelName", "resetBrandPanelForm"
    ];
    ids.forEach((id) => {
        els[id] = document.getElementById(id);
    });
}

function bindEvents() {
    els.panelSidebar.addEventListener("click", handlePanelSidebarClick);
    els.panelApp.querySelectorAll("[data-accordion-toggle]").forEach((button) => {
        button.addEventListener("click", handleSidebarAccordionToggle);
    });
    els.panelSearch.addEventListener("input", handlePanelSearch);
    els.panelCreate.addEventListener("click", handlePanelCreate);
    els.panelTable.addEventListener("click", handlePanelTableClick);
    els.viewModeButtons = document.querySelectorAll(".toggle-btn");
    els.viewModeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.viewMode = button.dataset.view;
            persistAndRender();
        });
    });

    els.productForm.addEventListener("submit", saveProduct);
    els.brandForm.addEventListener("submit", saveBrand);
    if (els.brandPanelForm) {
        els.brandPanelForm.addEventListener("submit", saveBrandPanel);
    }
    els.categoryForm.addEventListener("submit", saveCategory);
    els.userForm.addEventListener("submit", saveUser);
    els.heroForm.addEventListener("submit", saveHeroSlide);
    els.navForm.addEventListener("submit", saveNavigationRecord);

    els.resetProductForm.addEventListener("click", () => {
        els.productForm.reset();
        clearHiddenFormField("productId");
        clearHiddenFormField("productImage");
        els.productFeatured.checked = false;
        if (els.productTrending) {
            els.productTrending.checked = false;
        }
        if (els.productImageFile) {
            els.productImageFile.value = "";
        }
        if (els.productImage) {
            els.productImage.value = "";
        }
        updateProductImageStatus("");
        els.productVegano.value = "false";
        els.productKosher.value = "false";
        els.productTesteadoEnAnimales.value = "false";
        populateBrandSelect();
        els.productBrand.value = "";
    });
    els.resetBrandForm.addEventListener("click", () => {
        resetBrandForm();
    });
    if (els.brandImageFile) {
        els.brandImageFile.addEventListener("change", () => {
            const file = els.brandImageFile.files && els.brandImageFile.files[0];
            updateBrandImageStatus(file ? file.name : els.brandImage.value || "");
        });
    }
    if (els.resetBrandPanelForm) {
        els.resetBrandPanelForm.addEventListener("click", () => {
            resetBrandPanelForm();
        });
    }
    els.resetCategoryForm.addEventListener("click", () => {
        els.categoryForm.reset();
        clearHiddenFormField("categoryId");
        els.categoryVisible.checked = true;
    });
    els.resetUserForm.addEventListener("click", () => {
        els.userForm.reset();
        clearHiddenFormField("userId");
        els.userRole.value = "customer";
        els.userCanSeePrices.checked = true;
        els.userActive.checked = true;
    });
    els.resetHeroForm.addEventListener("click", () => {
        els.heroForm.reset();
        clearHiddenFormField("heroId");
        els.heroActive.checked = true;
        els.heroOrder.value = nextHeroOrder();
    });
    els.resetNavForm.addEventListener("click", () => {
        resetNavigationForm();
    });
    els.navRecordType.addEventListener("change", syncNavigationFormState);
    if (els.productImageFile) {
        els.productImageFile.addEventListener("change", () => {
            const file = els.productImageFile.files && els.productImageFile.files[0];
            updateProductImageStatus(file ? file.name : els.productImage.value || "");
        });
    }

    els.downloadTemplate.addEventListener("click", downloadTemplate);
    els.downloadCatalog.addEventListener("click", downloadCatalog);
    els.importPrices.addEventListener("click", importPriceFile);
    els.downloadJson.addEventListener("click", downloadJson);
    els.downloadJsonCard.addEventListener("click", downloadJson);

    els.adminLauncher.addEventListener("click", handleLauncherClick);
    els.closeAdminModal.addEventListener("click", closeAdminModal);
    els.adminModalBackdrop.addEventListener("click", handleBackdropClick);

    document.addEventListener("keydown", handleAdminKeydown);
}

function handlePanelSidebarClick(event) {
    const button = event.target.closest("[data-panel-nav]");
    if (!button) return;
    const panel = button.dataset.panelNav;
    state.activeAdminPanel = panel;
    state.panelSearchQuery = "";
    els.panelSearch.value = "";
    persistAndRender();
    if (panel === "bulk") {
        openAdminModal("bulk", "view");
    } else {
        closeAdminModal();
    }
}

function handleSidebarAccordionToggle(event) {
    const button = event.currentTarget;
    const accordion = button.closest(".sidebar-accordion");
    if (!accordion) return;
    const isOpen = accordion.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
}

function handlePanelSearch(event) {
    state.panelSearchQuery = event.target.value;
    renderMainPanel();
}

function handlePanelCreate() {
    state.activeModalAction = "create";
    if (state.activeAdminPanel === "bulk") {
        openAdminModal("bulk", "view");
        return;
    }
    if (state.activeAdminPanel === "brands") {
        resetBrandForm();
        openAdminModal("brands", "create");
        return;
    }
    if (state.activeAdminPanel === "navigation") {
        resetNavigationForm();
        openAdminModal("navigation", "create");
        return;
    }
    openAdminModal(state.activeAdminPanel);
}

function openEditor(type, id) {
    if (type === "brand") {
        editBrand(id);
        return;
    }
    if (type === "navigation-scope") {
        editNavigationScope(id);
        return;
    }
    if (type === "navigation-group") {
        editNavigationGroup(id.sectionId, id.groupId);
        return;
    }
    if (type === "product") editProduct(id);
    if (type === "category") editCategory(id);
    if (type === "user") editUser(id);
    if (type === "hero") editHeroSlide(id);
    const panelMap = {
        product: "products",
        category: "categories",
        user: "users",
        hero: "hero",
    };
    const panel = panelMap[type] || type;
    state.activeModalAction = "edit";
    openAdminModal(panel, "edit");
}

function removeRecord(type, id) {
    if (type === "brand") {
        removeBrand(id);
        return;
    }
    if (type === "navigation-scope") {
        removeNavigationScope(id);
        return;
    }
    if (type === "navigation-group") {
        removeNavigationGroup(id.sectionId, id.groupId);
        return;
    }
    if (type === "product") removeProduct(id);
    if (type === "category") removeCategory(id);
    if (type === "user") removeUser(id);
    if (type === "hero") removeHeroSlide(id);
    renderAll();
}

function handlePanelTableClick(event) {
    const editButton = event.target.closest("[data-edit-type]");
    const deleteButton = event.target.closest("[data-delete-type]");
    const bulkButton = event.target.closest("[data-open-bulk]");

    if (editButton) {
        const type = editButton.dataset.editType;
        if (type === "navigation-scope") {
            openEditor(type, editButton.dataset.scopeId || editButton.dataset.id);
            return;
        }
        if (type === "navigation-group") {
            openEditor(type, {
                sectionId: editButton.dataset.sectionId,
                groupId: editButton.dataset.groupId || editButton.dataset.id,
            });
            return;
        }
        const id = type === "brand" ? String(editButton.dataset.id || "") : Number(editButton.dataset.id);
        openEditor(type, id);
        return;
    }

    if (deleteButton) {
        const type = deleteButton.dataset.deleteType;
        if (type === "navigation-scope") {
            removeRecord(type, deleteButton.dataset.scopeId || deleteButton.dataset.id);
            return;
        }
        if (type === "navigation-group") {
            removeRecord(type, {
                sectionId: deleteButton.dataset.sectionId,
                groupId: deleteButton.dataset.groupId || deleteButton.dataset.id,
            });
            return;
        }
        const id = type === "brand" ? String(deleteButton.dataset.id || "") : Number(deleteButton.dataset.id);
        removeRecord(type, id);
        return;
    }

    if (bulkButton) {
        openAdminModal("bulk", "view");
    }
}

function handleLauncherClick(event) {
    const button = event.target.closest("[data-open-panel]");
    if (!button) return;
    const panel = button.dataset.openPanel;
    openAdminModal(panel, "view");
}

function handleBackdropClick(event) {
    if (event.target === els.adminModalBackdrop) {
        closeAdminModal();
    }
}

function handleAdminKeydown(event) {
    if (event.key === "Escape" && !els.adminModalBackdrop.classList.contains("hidden")) {
        closeAdminModal();
    }
}

function persistAndRender() {
    saveState();
    renderAll();
}

function openAdminModal(panel, action = state.activeModalAction || "view") {
    state.activeAdminPanel = panel;
    state.activeModalAction = action;
    els.adminModalBackdrop.classList.remove("hidden");
    persistAndRender();
}

function closeAdminModal() {
    els.adminModalBackdrop.classList.add("hidden");
}

function saveState() {
    state.headerNavigation = sanitizeNavigation(state.headerNavigation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (window.PFContent && typeof window.PFContent.save === "function") {
        window.PFContent.save(state);
    }
}

function sanitizeNavigation(navigation) {
    const safe = navigation || { searchScopes: [], sections: [] };
    const searchScopes = Array.isArray(safe.searchScopes) ? safe.searchScopes : [];
    const sections = Array.isArray(safe.sections) ? safe.sections : [];

    return {
        ...safe,
        searchScopes: searchScopes.filter((scope) => !BLOCKED_NAV_IDS.has(String(scope.id || "").toLowerCase())),
        sections: sections.filter((section) => !BLOCKED_NAV_IDS.has(String(section.id || "").toLowerCase())),
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        return {
            ...structuredClone(defaultState),
            ...parsed,
            nextIds: { ...defaultState.nextIds, ...(parsed.nextIds || {}) },
            panelSearchQuery: parsed.panelSearchQuery || "",
            activeModalAction: parsed.activeModalAction || "view",
            sessionRole: "admin",
            heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length ? parsed.heroSlides : structuredClone(defaultState.heroSlides),
            products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : structuredClone(defaultState.products),
            brands: Array.isArray(parsed.brands) && parsed.brands.length ? normalizeBrandCollection(parsed.brands) : structuredClone(defaultState.brands),
            categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : structuredClone(defaultState.categories),
            users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : structuredClone(defaultState.users),
            headerNavigation: sanitizeNavigation(parsed.headerNavigation || defaultState.headerNavigation),
        };
    } catch {
        return structuredClone(defaultState);
    }
}

async function loadInitialState() {
    const base = structuredClone(defaultState);
    if (window.PFContent && typeof window.PFContent.load === "function") {
        try {
            const content = await window.PFContent.load();
            return mergeState(base, content);
        } catch {
            return loadState();
        }
    }
    return loadState();
}

function mergeState(base, incoming) {
    const merged = {
        ...base,
        ...incoming,
        nextIds: { ...base.nextIds, ...(incoming.nextIds || {}) }
    };
    merged.sessionRole = "admin";
    merged.activeAdminPanel = incoming.activeAdminPanel || base.activeAdminPanel;
    merged.activeModalAction = incoming.activeModalAction || base.activeModalAction;
    merged.panelSearchQuery = incoming.panelSearchQuery || base.panelSearchQuery;
    merged.heroSlides = Array.isArray(incoming.heroSlides) && incoming.heroSlides.length ? incoming.heroSlides : base.heroSlides;
    merged.products = Array.isArray(incoming.products) && incoming.products.length ? incoming.products : base.products;
    merged.brands = Array.isArray(incoming.brands) && incoming.brands.length ? normalizeBrandCollection(incoming.brands) : base.brands;
    merged.categories = Array.isArray(incoming.categories) && incoming.categories.length ? incoming.categories : base.categories;
    merged.users = Array.isArray(incoming.users) && incoming.users.length ? incoming.users : base.users;
    merged.headerNavigation = sanitizeNavigation(incoming.headerNavigation || base.headerNavigation);
    return merged;
}

function renderAll() {
    renderMetrics();
    renderPriceStrip();
    renderStorefront();
    renderBrands();
    renderProductsTable();
    renderCategories();
    renderUsers();
    renderHeroSlides();
    renderNavigationLists();
    renderMainPanel();
    renderAdminModal();
    renderAdminLock();
    syncViewButtons();
    syncRoleButtons();
    populateCategorySelect();
    populateBrandSelect();
    populateNavigationParentSelect();
    syncNavigationFormState();
}

function renderMainPanel() {
    const meta = getPanelMeta(state.activeAdminPanel);
    const records = getPanelRecords(state.activeAdminPanel);
    const filtered = filterPanelRecords(records, state.activeAdminPanel, state.panelSearchQuery || "");

    els.panelSearch.value = state.panelSearchQuery || "";
    els.panelCreate.textContent = meta.createLabel || "Nuevo registro";
    els.panelTitle.textContent = meta.title;
    els.topbarProducts.textContent = String(state.products.length);
    els.topbarCategories.textContent = String(state.categories.length);
    els.topbarUsers.textContent = String(state.users.length);
    els.topbarCount.textContent = String(filtered.length);
    els.panelKicker.textContent = meta.kicker;
    els.panelTableTitle.textContent = meta.tableTitle;

    els.panelKpis.innerHTML = meta.kpis.map((item) => `
        <div class="kpi-pill">
            <span>${item.label}</span>
            <strong>${item.value(filtered, records)}</strong>
        </div>
    `).join("");

    const tableParts = renderPanelTableHTML(state.activeAdminPanel, filtered);
    els.panelTableHead.innerHTML = tableParts.head;
    els.panelTableBody.innerHTML = tableParts.body;
    document.querySelectorAll(".sidebar-link[data-panel-nav]").forEach((button) => {
        button.classList.toggle("active", button.dataset.panelNav === state.activeAdminPanel);
    });
}

function renderPanelEditor() {
    if (!els.panelEditorSlot) {
        return;
    }
    els.panelEditorSlot.innerHTML = renderPanelEditorHTML(state.activeAdminPanel);
    els.brandPanelForm = document.getElementById("brandPanelForm");
    els.brandPanelId = document.getElementById("brandPanelId");
    els.brandPanelCode = document.getElementById("brandPanelCode");
    els.brandPanelName = document.getElementById("brandPanelName");
    els.resetBrandPanelForm = document.getElementById("resetBrandPanelForm");

    if (els.brandPanelForm) {
        els.brandPanelForm.addEventListener("submit", saveBrandPanel);
    }
    if (els.resetBrandPanelForm) {
        els.resetBrandPanelForm.addEventListener("click", () => {
            resetBrandPanelForm();
        });
    }
}

function renderPanelEditorHTML(panel) {
    if (panel !== "brands") {
        return "";
    }

    return `
        <form id="brandPanelForm" class="mini-form panel-inline-form">
            <input type="hidden" id="brandPanelId">
            <label>
                Código
                <input type="text" id="brandPanelCode" placeholder="ALMA" required>
            </label>
            <label>
                Marca
                <input type="text" id="brandPanelName" placeholder="Alma" required>
            </label>
            <div class="form-actions">
                <button class="btn btn-primary" type="submit">Guardar marca</button>
                <button class="btn btn-ghost" type="button" id="resetBrandPanelForm">Limpiar</button>
            </div>
        </form>
    `;
}

function getPanelMeta(panel) {
    const labels = {
        products: {
            title: "Productos",
            subtitle: "Alta, detalle, presentacion, caracteristicas y precios.",
            kicker: "ABM / Productos",
            tableTitle: "Listado de productos",
            viewLabel: "SQL / Productos",
            createLabel: "Nuevo producto",
            kpis: [
                { label: "Productos", value: (filtered) => filtered.length },
                { label: "Veganos", value: (filtered) => filtered.filter((item) => item.vegano).length },
                { label: "Kosher", value: (filtered) => filtered.filter((item) => item.kosher).length },
            ],
        },
        brands: {
            title: "Marcas",
            subtitle: "Listado y edicion de marcas importadas desde el Excel.",
            kicker: "Catalogo / Marcas",
            tableTitle: "Listado de marcas",
            viewLabel: "SQL / Marcas",
            createLabel: "Nueva marca",
            kpis: [
                { label: "Marcas", value: (filtered) => filtered.length },
                { label: "Con codigo", value: (filtered) => filtered.filter((item) => Boolean(item.code)).length },
                { label: "Sin codigo", value: (filtered) => filtered.filter((item) => !item.code).length },
            ],
        },
        categories: {
            title: "Categorias",
            subtitle: "Catalogo de navegacion para el home y el buscador.",
            kicker: "Catalogo / Categorias",
            tableTitle: "Listado de categorias",
            viewLabel: "SQL / Categorias",
            createLabel: "Nueva categoria",
            kpis: [
                { label: "Visibles", value: (filtered) => filtered.filter((item) => item.visible).length },
                { label: "Ocultas", value: (filtered) => filtered.filter((item) => !item.visible).length },
                { label: "Total", value: (filtered) => filtered.length },
            ],
        },
        users: {
            title: "Usuarios",
            subtitle: "Clientes con acceso a precios y administradores del sistema.",
            kicker: "Accesos / Usuarios",
            tableTitle: "Listado de usuarios",
            viewLabel: "SQL / Usuarios",
            createLabel: "Nuevo usuario",
            kpis: [
                { label: "Activos", value: (filtered) => filtered.filter((item) => item.active).length },
                { label: "Con precios", value: (filtered) => filtered.filter((item) => item.canSeePrices).length },
                { label: "Admins", value: (filtered) => filtered.filter((item) => item.role === "admin").length },
            ],
        },
        hero: {
            title: "Hero / Carrusel",
            subtitle: "Slides del home editables desde la demo estatica.",
            kicker: "Contenido / Hero",
            tableTitle: "Listado de slides",
            viewLabel: "SQL / Hero",
            createLabel: "Nuevo slide",
            kpis: [
                { label: "Activos", value: (filtered) => filtered.filter((item) => item.active).length },
                { label: "Orden max", value: (filtered) => (filtered.length ? Math.max(...filtered.map((item) => Number(item.order || 0))) : 0) },
                { label: "Total", value: (filtered) => filtered.length },
            ],
        },
        navigation: {
            title: "Navegación",
            subtitle: "Listas del header y mega menus alimentados desde el JSON estatico.",
            kicker: "Header / Navegación",
            tableTitle: "Contenido de navegación",
            viewLabel: "SQL / Header",
            createLabel: "Nuevo registro",
            kpis: [
                { label: "Scopes", value: () => state.headerNavigation?.searchScopes?.length || 0 },
                { label: "Secciones", value: () => state.headerNavigation?.sections?.length || 0 },
                { label: "Grupos", value: () => (state.headerNavigation?.sections || []).reduce((sum, section) => sum + (section.groups?.length || 0), 0) },
            ],
        },
        bulk: {
            title: "Cargas masivas",
            subtitle: "Herramientas para importar precios por Excel y exportar el catalogo.",
            kicker: "Excel / Importacion",
            tableTitle: "Herramientas de carga",
            viewLabel: "SQL / Bulk",
            createLabel: "Abrir carga",
            kpis: [
                { label: "Acciones", value: (filtered) => filtered.length || 3 },
                { label: "Plantilla", value: () => 1 },
                { label: "Catálogo", value: () => 1 },
            ],
        },
    };
    return labels[panel] || labels.products;
}

function getPanelRecords(panel) {
    switch (panel) {
        case "products":
            return state.products;
        case "brands":
            return getBrandRows();
        case "categories":
            return state.categories;
        case "users":
            return state.users;
        case "hero":
            return state.heroSlides;
        case "navigation":
            return buildNavigationRows();
        case "bulk":
            return [
                { id: 1, name: "Descargar plantilla", status: "ok", description: "Genera un Excel base con sku, publicPrice y memberPrice." },
                { id: 2, name: "Importar archivo", status: "ok", description: "Procesa .xlsx o .csv y actualiza precios en la demo." },
                { id: 3, name: "Exportar catalogo", status: "ok", description: "Baja el JSON completo del contenido actual." },
            ];
        default:
            return state.products;
    }
}

function filterPanelRecords(records, panel, query) {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) => {
        const haystack = panel === "bulk"
            ? `${item.name} ${item.description} ${item.status}`
            : Object.values(item).join(" ");
        return String(haystack).toLowerCase().includes(normalized);
    });
}

function buildBrandRows() {
    return getBrandRows();
}

function getBrandRows() {
    const source = Array.isArray(state.brands) && state.brands.length ? state.brands : deriveBrandsFromProducts();
    return source
        .map((item, index) => {
            const name = String(item?.name || item?.brand || "").trim();
            if (!name) {
                return null;
            }
            const code = String(item?.code || item?.id || normalizeBrandCode(name, index)).trim();
            return {
                id: item?.id || code,
                code,
                name,
                image: String(item?.image || "").trim(),
                featured: Boolean(item?.featured),
            };
        })
        .filter(Boolean);
}

function normalizeBrandCollection(brands) {
    return (Array.isArray(brands) ? brands : [])
        .map((brand) => {
            const code = String(brand?.code || brand?.id || "").trim();
            const name = String(brand?.name || "").trim();
            if (!name && !code) {
                return null;
            }
            return {
                ...brand,
                id: brand?.id || code || name,
                code: code || normalizeBrandCode(name || brand?.id || ""),
                name: name || code || String(brand?.id || ""),
                image: String(brand?.image || "").trim(),
                featured: Boolean(brand?.featured),
            };
        })
        .filter(Boolean);
}

function rebuildBrandCatalog() {
    state.brands = deriveBrandsFromProducts();
    persistAndRender();
}

function deriveBrandsFromProducts() {
    const usedCodes = new Set();
    const seenNames = new Set();
    const brands = [];

    state.products.forEach((product) => {
        const name = String(product.brand || "").trim();
        if (!name) {
            return;
        }

        const normalizedName = normalizeKey(name);
        if (!normalizedName || seenNames.has(normalizedName)) {
            return;
        }
        seenNames.add(normalizedName);

        const baseCode = normalizeBrandCode(name, brands.length);
        let code = baseCode;
        let suffix = 2;
        while (usedCodes.has(code)) {
            code = `${baseCode}-${suffix++}`;
        }
        usedCodes.add(code);
        brands.push({
            id: code,
            code,
            name,
            image: "",
            featured: false,
        });
    });

    return brands;
}

function normalizeBrandCode(value, index = 0) {
    const code = slugify(value).toUpperCase();
    if (code) {
        return code;
    }
    return `MARCA-${String(index + 1).padStart(3, "0")}`;
}

function normalizeKey(value) {
    return slugify(value);
}

function shortFileName(value) {
    const raw = String(value || "").trim();
    if (!raw) {
        return "";
    }
    return raw.split(/[\\/]/).pop() || raw;
}

function updateProductImageStatus(value) {
    if (!els.productImageCurrent) {
        return;
    }
    const fileName = shortFileName(value);
    els.productImageCurrent.textContent = fileName ? `Imagen actual: ${fileName}` : "No hay imagen cargada.";
}

function updateBrandImageStatus(value) {
    if (!els.brandImageCurrent) {
        return;
    }
    const fileName = shortFileName(value);
    els.brandImageCurrent.textContent = fileName ? `Imagen actual: ${fileName}` : "No hay imagen cargada.";
}

function buildImagePath(fileName) {
    return `Content/Images/Products/${fileName}`;
}

async function saveFileToProject(pathSegments, file) {
    const segments = Array.isArray(pathSegments) ? pathSegments.filter(Boolean) : [];
    if (!segments.length) {
        throw new Error("Ruta invalida para guardar el archivo.");
    }
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const dataBase64 = btoa(binary);
    const response = await fetch(`${LOCAL_SAVE_SERVER}/api/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: segments.join("/"),
            name: file.name || segments[segments.length - 1],
            mimeType: file.type || "application/octet-stream",
            dataBase64,
        }),
    });
    if (!response.ok) {
        throw new Error("No se pudo guardar el archivo en el proyecto.");
    }
    return segments.join("/");
}

function normalizeImageFileName(name) {
    const raw = String(name || "").trim();
    if (!raw) {
        return "producto.jpg";
    }
    const extMatch = raw.match(/(\.[a-z0-9]+)$/i);
    const extension = extMatch ? extMatch[1].toLowerCase() : ".jpg";
    const base = slugify(raw.replace(/\.[a-z0-9]+$/i, "")) || "producto";
    return `${base}${extension}`;
}

async function copyProductImageFile(file) {
    const safeName = normalizeImageFileName(file.name);
    await saveFileToProject(["Content", "Images", "Products", safeName], file);
    return buildImagePath(safeName);
}

async function copyBrandImageFile(file) {
    const safeName = normalizeImageFileName(file.name);
    await saveFileToProject(["Content", "Images", "Brands", safeName], file);
    return `Content/Images/Brands/${safeName}`;
}

function getNavigationState() {
    state.headerNavigation = state.headerNavigation || { searchScopes: [], sections: [] };
    state.headerNavigation.searchScopes = Array.isArray(state.headerNavigation.searchScopes) ? state.headerNavigation.searchScopes : [];
    state.headerNavigation.sections = Array.isArray(state.headerNavigation.sections) ? state.headerNavigation.sections : [];
    return state.headerNavigation;
}

function buildNavigationRows() {
    const navigation = getNavigationState();
    const rows = [];

    (navigation.searchScopes || []).forEach((scope) => {
        rows.push({
            rowType: "scope",
            scopeId: scope.id,
            item: scope.label || scope.id || "",
            detail: scope.href || "",
            status: scope.id || "ok",
        });
    });

    (navigation.sections || []).forEach((section) => {
        (section.groups || []).forEach((group) => {
            rows.push({
                rowType: "group",
                sectionId: section.id,
                groupId: group.id,
                item: `${section.label || ""} / ${group.label || ""}`.replace(/^\s*\/\s*|\s*\/\s*$/g, ""),
                detail: group.href || "",
                status: `${(group.items || []).length} items`,
            });
        });
    });

    return rows;
}

function renderNavigationPanelTable(records) {
    return {
        head: `
            <tr>
                <th>Tipo</th>
                <th>Item</th>
                <th>Detalle</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        `,
        body: records.map((row) => {
            if (row.rowType === "group") {
                return `
                    <tr>
                        <td><strong>Sección</strong></td>
                        <td>${escapeHtml(row.item || "")}</td>
                        <td>${escapeHtml(row.detail || "")}</td>
                        <td>${badgeHtml("amber", row.status || "items")}</td>
                        <td>
                            <div class="sql-actions">
                                <button class="sql-action primary" type="button" data-edit-type="navigation-group" data-section-id="${escapeHtml(row.sectionId || "")}" data-group-id="${escapeHtml(row.groupId || "")}">Editar</button>
                                <button class="sql-action danger" type="button" data-delete-type="navigation-group" data-section-id="${escapeHtml(row.sectionId || "")}" data-group-id="${escapeHtml(row.groupId || "")}">Borrar</button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            return `
                <tr>
                    <td><strong>Scope</strong></td>
                    <td>${escapeHtml(row.item || "")}</td>
                    <td>${escapeHtml(row.detail || "")}</td>
                    <td>${badgeHtml("green", row.status || "ok")}</td>
                    <td>
                        <div class="sql-actions">
                            <button class="sql-action primary" type="button" data-edit-type="navigation-scope" data-scope-id="${escapeHtml(row.scopeId || "")}">Editar</button>
                            <button class="sql-action danger" type="button" data-delete-type="navigation-scope" data-scope-id="${escapeHtml(row.scopeId || "")}">Borrar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join(""),
    };
}

function renderBrandsPanelTable(records) {
    return {
        head: `
            <tr>
                <th>Código</th>
                <th>Imagen</th>
                <th>Destacado</th>
                <th>Acciones</th>
            </tr>
        `,
        body: records.map((row) => `
            <tr>
                <td><strong>${escapeHtml(row.code || "")}</strong></td>
                <td>${row.image ? badgeHtml("amber", shortFileName(row.image)) : "-"}</td>
                <td>${row.featured ? badgeHtml("green", "Sí") : badgeHtml("red", "No")}</td>
                <td>
                    <div class="sql-actions">
                        <button class="sql-action primary" type="button" data-edit-type="brand" data-id="${escapeHtml(row.id || "")}">Editar</button>
                        <button class="sql-action danger" type="button" data-delete-type="brand" data-id="${escapeHtml(row.id || "")}">Borrar</button>
                    </div>
                </td>
            </tr>
        `).join(""),
    };
}

function populateNavigationParentSelect(selectedId = "") {
    if (!els.navParentSection) {
        return;
    }

    const navigation = getNavigationState();
    els.navParentSection.innerHTML = `
        <option value="">Selecciona una sección</option>
        ${(navigation.sections || []).map((section) => `<option value="${escapeHtml(section.id || "")}">${escapeHtml(section.label || section.id || "")}</option>`).join("")}
    `;

    if (selectedId) {
        els.navParentSection.value = selectedId;
    }
}

function syncNavigationFormState() {
    if (!els.navRecordType || !els.navParentSectionField || !els.navParentSection || !els.navRecordHref) {
        return;
    }

    const isGroup = els.navRecordType.value === "group";
    els.navParentSectionField.style.display = isGroup ? "" : "none";
    els.navParentSection.required = isGroup;
    els.navRecordHref.placeholder = "#4-alacena";
}

function resetNavigationForm(defaultType = "scope") {
    if (!els.navForm) {
        return;
    }

    els.navForm.reset();
    clearHiddenFormField("navRecordId");
    els.navRecordType.value = defaultType;
    populateNavigationParentSelect();
    syncNavigationFormState();
    els.navRecordLabel.value = "";
    els.navRecordHref.value = "";
}

function buildUniqueNavigationId(label, ignoreId = "", ignoreGroupId = "", ignoreSectionId = "") {
    const navigation = getNavigationState();
    const used = new Set();

    (navigation.searchScopes || []).forEach((scope) => {
        if (scope.id && scope.id !== ignoreId) {
            used.add(String(scope.id));
        }
    });

    (navigation.sections || []).forEach((section) => {
        (section.groups || []).forEach((group) => {
            if (group.id && !(section.id === ignoreSectionId && group.id === ignoreGroupId)) {
                used.add(String(group.id));
            }
        });
    });

    const base = slugify(label) || "item";
    let candidate = base;
    let counter = 2;
    while (used.has(candidate)) {
        candidate = `${base}-${counter++}`;
    }
    return candidate;
}

function findNavigationScope(scopeId) {
    const navigation = getNavigationState();
    return (navigation.searchScopes || []).find((scope) => String(scope.id) === String(scopeId));
}

function findNavigationGroup(sectionId, groupId) {
    const navigation = getNavigationState();
    for (const section of navigation.sections || []) {
        if (String(section.id) !== String(sectionId)) {
            continue;
        }
        const group = (section.groups || []).find((item) => String(item.id) === String(groupId));
        if (group) {
            return { section, group };
        }
    }
    return null;
}

function findNavigationGroupById(groupId) {
    const navigation = getNavigationState();
    for (const section of navigation.sections || []) {
        const group = (section.groups || []).find((item) => String(item.id) === String(groupId));
        if (group) {
            return { section, group };
        }
    }
    return null;
}

function saveNavigationRecord(event) {
    event.preventDefault();

    const navigation = getNavigationState();
    const type = els.navRecordType.value === "group" ? "group" : "scope";
    const recordId = String(els.navRecordId.value || "").trim();
    const label = String(els.navRecordLabel.value || "").trim();
    const href = String(els.navRecordHref.value || "").trim();

    if (!label || !href) {
        alert("Completa la etiqueta y el href.");
        return;
    }

    if (type === "scope") {
        const nextId = recordId || buildUniqueNavigationId(label, recordId);
        const payload = { id: nextId, label, href };
        const hasRecord = navigation.searchScopes.some((scope) => String(scope.id) === String(recordId));
        navigation.searchScopes = hasRecord
            ? navigation.searchScopes.map((scope) => (String(scope.id) === String(recordId) ? payload : scope))
            : [...navigation.searchScopes, payload];
        els.navRecordId.value = nextId;
    } else {
        const parentSectionId = String(els.navParentSection.value || "").trim();
        if (!parentSectionId) {
            alert("Selecciona una sección padre.");
            return;
        }

        const section = navigation.sections.find((item) => String(item.id) === parentSectionId);
        if (!section) {
            alert("La sección padre no existe.");
            return;
        }

        const existingGroup = recordId ? findNavigationGroupById(recordId) : null;
        const currentGroup = existingGroup ? existingGroup.group : null;
        const previousSectionId = existingGroup ? String(existingGroup.section.id || "") : "";
        const previousIndex = existingGroup ? (existingGroup.section.groups || []).findIndex((group) => String(group.id) === String(recordId)) : -1;
        const nextId = recordId || buildUniqueNavigationId(label, recordId, "", parentSectionId);
        const payload = {
            id: nextId,
            label,
            href,
            items: currentGroup && Array.isArray(currentGroup.items) ? currentGroup.items : [],
        };

        navigation.sections.forEach((candidateSection) => {
            candidateSection.groups = (candidateSection.groups || []).filter((group) => String(group.id) !== String(recordId));
        });

        section.groups = Array.isArray(section.groups) ? section.groups : [];
        if (previousSectionId === parentSectionId && previousIndex >= 0) {
            section.groups.splice(Math.min(previousIndex, section.groups.length), 0, payload);
        } else {
            section.groups.push(payload);
        }
        els.navRecordId.value = nextId;
    }

    state.headerNavigation = navigation;
    state.activeAdminPanel = "navigation";
    state.activeModalAction = "create";
    persistAndRender();
    resetNavigationForm(type);
}

function editNavigationScope(scopeId) {
    const scope = findNavigationScope(scopeId);
    if (!scope) {
        return;
    }

    resetNavigationForm("scope");
    state.activeAdminPanel = "navigation";
    state.activeModalAction = "edit";
    openAdminModal("navigation", "edit");
    els.navRecordType.value = "scope";
    els.navRecordId.value = String(scope.id || "");
    els.navRecordLabel.value = scope.label || "";
    els.navRecordHref.value = scope.href || "";
    syncNavigationFormState();
}

function editNavigationGroup(sectionId, groupId) {
    const found = findNavigationGroup(sectionId, groupId);
    if (!found) {
        return;
    }

    resetNavigationForm("group");
    state.activeAdminPanel = "navigation";
    state.activeModalAction = "edit";
    openAdminModal("navigation", "edit");
    els.navRecordType.value = "group";
    els.navRecordId.value = String(found.group.id || "");
    els.navRecordLabel.value = found.group.label || "";
    els.navRecordHref.value = found.group.href || "";
    populateNavigationParentSelect(String(found.section.id || ""));
    syncNavigationFormState();
}

function removeNavigationScope(scopeId) {
    const navigation = getNavigationState();
    navigation.searchScopes = (navigation.searchScopes || []).filter((scope) => String(scope.id) !== String(scopeId));
    state.headerNavigation = navigation;
    persistAndRender();
}

function removeNavigationGroup(sectionId, groupId) {
    const navigation = getNavigationState();
    navigation.sections = (navigation.sections || []).map((section) => ({
        ...section,
        groups: (section.groups || []).filter((group) => !(String(section.id) === String(sectionId) && String(group.id) === String(groupId))),
    }));
    state.headerNavigation = navigation;
    persistAndRender();
}

function renderPanelTableHTML(panel, records) {
    if (panel === "products") {
    return {
        head: `
            <tr>
                <th>SKU</th>
                <th>Detalle</th>
                <th>Presentación</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Acciones</th>
                </tr>
            `,
            body: records.map((product) => {
                    const category = state.categories.find((item) => item.id === product.categoryId);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(product.sku)}</strong></td>
                            <td>${escapeHtml(product.detail || product.name || "")}</td>
                            <td>${escapeHtml(product.presentation || "")}</td>
                            <td>${category ? escapeHtml(category.name) : "Sin categoria"}</td>
                            <td>${escapeHtml(product.brand || "")}</td>
                            <td>
                                <div class="sql-actions">
                                    <button class="sql-action primary" type="button" data-edit-type="product" data-id="${product.id}">Editar</button>
                                    <button class="sql-action danger" type="button" data-delete-type="product" data-id="${product.id}">Borrar</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join(""),
        };
    }

    if (panel === "categories") {
        return {
            head: `
                <tr>
                    <th>Nombre</th>
                    <th>Slug</th>
                    <th>Visible</th>
                    <th>Acciones</th>
                </tr>
            `,
            body: records.map((category) => `
                    <tr>
                        <td><strong>${escapeHtml(category.name)}</strong></td>
                        <td>${escapeHtml(category.slug)}</td>
                        <td>${category.visible ? badgeHtml("green", "Visible") : badgeHtml("red", "Oculta")}</td>
                        <td>
                            <div class="sql-actions">
                                <button class="sql-action primary" type="button" data-edit-type="category" data-id="${category.id}">Editar</button>
                                <button class="sql-action danger" type="button" data-delete-type="category" data-id="${category.id}">Borrar</button>
                            </div>
                        </td>
                    </tr>
                `).join(""),
        };
    }

    if (panel === "users") {
        return {
            head: `
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Acceso</th>
                    <th>Acciones</th>
                </tr>
            `,
            body: records.map((user) => `
                    <tr>
                        <td><strong>${escapeHtml(user.name)}</strong></td>
                        <td>${escapeHtml(user.email)}</td>
                        <td>${user.role === "admin" ? badgeHtml("amber", "Administrador") : badgeHtml("", "Cliente")}</td>
                        <td>${user.canSeePrices ? badgeHtml("green", "Lista de precios") : badgeHtml("red", "Sin acceso")}<span class="row-sub">${user.active ? "Activo" : "Inactivo"}</span></td>
                        <td>
                            <div class="sql-actions">
                                <button class="sql-action primary" type="button" data-edit-type="user" data-id="${user.id}">Editar</button>
                                <button class="sql-action danger" type="button" data-delete-type="user" data-id="${user.id}">Borrar</button>
                            </div>
                        </td>
                    </tr>
                `).join(""),
        };
    }

    if (panel === "hero") {
        return {
            head: `
                <tr>
                    <th>Orden</th>
                    <th>Titulo</th>
                    <th>Imagen</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            `,
            body: records.map((slide) => `
                    <tr>
                        <td><strong>${slide.order}</strong></td>
                        <td>${escapeHtml(slide.title)}<span class="row-sub">${escapeHtml(slide.badge || "")}</span></td>
                        <td>${escapeHtml(slide.image)}</td>
                        <td>${slide.imageMobile ? `${escapeHtml(slide.imageMobile)}` : "-"}</td>
                        <td>${slide.active ? badgeHtml("green", "Activo") : badgeHtml("red", "Oculto")}</td>
                        <td>
                            <div class="sql-actions">
                                <button class="sql-action primary" type="button" data-edit-type="hero" data-id="${slide.id}">Editar</button>
                                <button class="sql-action danger" type="button" data-delete-type="hero" data-id="${slide.id}">Borrar</button>
                            </div>
                        </td>
                    </tr>
                `).join(""),
        };
    }

    if (panel === "brands") {
        return renderBrandsPanelTable(records);
    }

    if (panel === "navigation") {
        return renderNavigationPanelTable(records);
        const navigation = records[0] || { searchScopes: [], sections: [] };
        return {
            head: `
                <tr>
                    <th>Tipo</th>
                    <th>Item</th>
                    <th>Detalle</th>
                    <th>Estado</th>
                </tr>
            `,
            body: [
                ...(navigation.searchScopes || []).map((scope) => `
                    <tr>
                        <td><strong>Scope</strong></td>
                        <td>${escapeHtml(scope.label || "")}</td>
                        <td>${escapeHtml(scope.href || "")}</td>
                        <td>${badgeHtml("green", scope.id || "ok")}</td>
                    </tr>
                `),
                ...(navigation.sections || []).flatMap((section) => (section.groups || []).map((group) => `
                    <tr>
                        <td><strong>Sección</strong></td>
                        <td>${escapeHtml(section.label || "")} / ${escapeHtml(group.label || "")}</td>
                        <td>${escapeHtml(group.href || "")}</td>
                        <td>${badgeHtml("amber", `${(group.items || []).length} items`)}</td>
                    </tr>
                `)),
            ].join(""),
        };
    }

    return {
        head: `
            <tr>
                <th>Accion</th>
                <th>Descripcion</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        `,
        body: records.map((item) => `
                <tr>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${escapeHtml(item.description)}</td>
                    <td>${badgeHtml("amber", item.status)}</td>
                    <td>
                        <div class="sql-actions">
                            <button class="sql-action primary" type="button" data-open-bulk="${item.id}">Abrir</button>
                            <button class="sql-action danger" type="button" data-open-bulk="${item.id}">Ver</button>
                        </div>
                        </td>
                    </tr>
            `).join(""),
    };
}

function badgeHtml(tone, label) {
    const map = {
        green: "green",
        amber: "amber",
        red: "red",
        "": "",
    };
    const cls = map[tone] || "";
    return `<span class="badge-soft ${cls}">${escapeHtml(label)}</span>`;
}

function statusBadge(status) {
    const map = {
        published: ["green", "Publicado"],
        draft: ["amber", "Borrador"],
        hidden: ["red", "Oculto"],
    }[status] || ["", String(status)];
    return badgeHtml(map[0], map[1]);
}

function yesNoLabel(value) {
    return value ? "Sí" : "No";
}

function renderMetrics() {
    els.topbarProducts.textContent = String(state.products.length);
    els.topbarCategories.textContent = String(state.categories.length);
    if (els.topbarBrands) {
        els.topbarBrands.textContent = String(getBrandRows().length);
    }
    els.topbarUsers.textContent = String(state.users.length);
}

function renderPriceStrip() {
    const featured = state.products.find((product) => product.featured) || state.products[0];
    if (!featured) return;

    els.featuredPublic.textContent = money(featured.publicPrice);
    els.featuredMember.textContent = money(featured.memberPrice);
    const diff = featured.publicPrice ? Math.round(((featured.publicPrice - featured.memberPrice) / featured.publicPrice) * 100) : 0;
    els.featuredDiff.textContent = `${diff}%`;
}

function renderStorefront() {
    const featuredProducts = state.products.filter((product) => product.status !== "hidden" && product.featured);

    if (!featuredProducts.length) {
        els.storefrontGrid.innerHTML = `
            <div class="empty-state">
                <strong>No hay productos destacados</strong>
                <p>Marcá productos como destacados desde el panel de productos para que aparezcan acá.</p>
            </div>
        `;
        return;
    }

    els.storefrontGrid.innerHTML = featuredProducts.map((product) => {
        const category = state.categories.find((item) => item.id === product.categoryId);
        const publicPrice = money(product.publicPrice);
        const memberPrice = money(product.memberPrice);
        const currentPrice = state.viewMode === "member" && state.sessionRole !== "guest" ? memberPrice : publicPrice;
        const priceLabel = state.viewMode === "member" && state.sessionRole !== "guest" ? "Precio logueado" : "Precio publico";
        const canSeeMember = state.sessionRole !== "guest";
        return `
            <article class="product-card">
                ${product.image ? `
                    <div class="product-image">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.detail || product.name || product.sku || "Producto")}">
                    </div>
                ` : ""}
                <div class="product-top">
                    <div>
                        <div class="product-sku">${product.sku}</div>
                        <h3 class="product-name">${escapeHtml(product.detail || product.name || "")}</h3>
                        <div class="product-brand">${escapeHtml(product.brand)} · ${category ? escapeHtml(category.name) : "Sin categoria"}</div>
                    </div>
                    <span class="tag ${product.status === "published" ? "ok" : "warn"}">${statusLabel(product.status)}</span>
                </div>
                <div class="price-row">
                    <div class="price-pill">
                        <span class="label">Publico</span>
                        <strong>${publicPrice}</strong>
                    </div>
                    <div class="price-pill">
                        <span class="label">${canSeeMember ? "Logueado" : "Bloqueado"}</span>
                        <strong>${canSeeMember ? memberPrice : "Acceso"}</strong>
                    </div>
                </div>
                <div class="product-footer">
                    <span>${priceLabel}: <strong>${currentPrice}</strong></span>
                    <span class="badge">Vegano ${yesNoLabel(product.vegano)} · Kosher ${yesNoLabel(product.kosher)}</span>
                </div>
            </article>
        `;
    }).join("");
}

function renderBrands() {
    if (!els.brandTable) {
        return;
    }

    const rows = getBrandRows();
    els.brandTable.querySelector("tbody").innerHTML = rows.map((row) => `
        <tr>
            <td><strong>${escapeHtml(row.code || "")}</strong></td>
                <td>${row.image ? badgeHtml("amber", shortFileName(row.image)) : "-"}</td>
            <td>${row.featured ? badgeHtml("green", "Sí") : badgeHtml("red", "No")}</td>
            <td>
                <div class="sql-actions">
                    <button class="sql-action primary" type="button" data-action="edit-brand" data-id="${escapeHtml(row.id || "")}">Editar</button>
                    <button class="sql-action danger" type="button" data-action="delete-brand" data-id="${escapeHtml(row.id || "")}">Borrar</button>
                </div>
            </td>
        </tr>
    `).join("");

    els.brandTable.querySelector("tbody").onclick = (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = button.dataset.id;
        if (button.dataset.action === "edit-brand") {
            editBrand(id);
        }
        if (button.dataset.action === "delete-brand") {
            removeBrand(id);
        }
    };
}

function renderProductsTable() {
    els.productTable.querySelector("tbody").innerHTML = state.products.map((product) => {
        const category = state.categories.find((item) => item.id === product.categoryId);
        return `
            <tr>
                <td><strong>${escapeHtml(product.sku)}</strong></td>
                <td>
                    <strong>${escapeHtml(product.detail || product.name || "")}</strong><br>
                    <span class="badge">${escapeHtml(product.brand || "")}</span>
                </td>
                <td>${escapeHtml(product.presentation || "")}</td>
                <td>${category ? escapeHtml(category.name) : "Sin categoria"}</td>
                <td>${escapeHtml(product.brand || "")}</td>
                <td>
                    <div class="row-actions">
                        <button class="icon-btn" type="button" data-action="edit-product" data-id="${product.id}">Editar</button>
                        <button class="icon-btn danger" type="button" data-action="delete-product" data-id="${product.id}">Borrar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    els.productTable.querySelector("tbody").onclick = (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === "edit-product") {
            editProduct(id);
        }
        if (button.dataset.action === "delete-product") {
            removeProduct(id);
        }
    };
}

function renderCategories() {
    els.categoryList.innerHTML = state.categories.map((category) => `
        <div class="list-item">
            <div>
                <strong>${escapeHtml(category.name)}</strong>
                <small>/${escapeHtml(category.slug)} · ${category.visible ? "Visible" : "Oculta"}</small>
            </div>
            <div class="row-actions">
                <button class="icon-btn" type="button" data-action="edit-category" data-id="${category.id}">Editar</button>
                <button class="icon-btn danger" type="button" data-action="delete-category" data-id="${category.id}">Borrar</button>
            </div>
        </div>
    `).join("");

    els.categoryList.onclick = (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === "edit-category") {
            editCategory(id);
        }
        if (button.dataset.action === "delete-category") {
            removeCategory(id);
        }
    };
}

function renderUsers() {
    els.userTable.querySelector("tbody").innerHTML = state.users.map((user) => `
        <tr>
            <td>
                <strong>${escapeHtml(user.name)}</strong><br>
                <span class="badge">${escapeHtml(user.email)}</span>
            </td>
            <td>${user.role === "admin" ? "Administrador" : "Cliente"}</td>
            <td>${user.canSeePrices ? "Lista de precios" : "Sin precios"}<br><span class="badge">${user.active ? "Activo" : "Inactivo"}</span></td>
            <td>
                <div class="row-actions">
                    <button class="icon-btn" type="button" data-action="edit-user" data-id="${user.id}">Editar</button>
                    <button class="icon-btn danger" type="button" data-action="delete-user" data-id="${user.id}">Borrar</button>
                </div>
            </td>
        </tr>
    `).join("");

    els.userTable.querySelector("tbody").onclick = (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === "edit-user") {
            editUser(id);
        }
        if (button.dataset.action === "delete-user") {
            removeUser(id);
        }
    };
}

function renderHeroSlides() {
    const sortedSlides = [...state.heroSlides].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    els.heroTable.querySelector("tbody").innerHTML = sortedSlides.map((slide) => `
        <tr>
            <td>${slide.order}</td>
            <td>
                <strong>${escapeHtml(slide.title)}</strong><br>
                <span class="badge">${escapeHtml(slide.badge || "")}</span>
            </td>
            <td>${escapeHtml(slide.image)}</td>
            <td>${slide.imageMobile ? `<span class="badge">${escapeHtml(slide.imageMobile)}</span>` : '<span class="badge">-</span>'}</td>
            <td>${slide.homeSpotlight ? '<span class="badge">Sí</span>' : '<span class="badge">-</span>'}</td>
            <td>${slide.active ? "Activo" : "Oculto"}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-btn" type="button" data-action="edit-hero" data-id="${slide.id}">Editar</button>
                    <button class="icon-btn danger" type="button" data-action="delete-hero" data-id="${slide.id}">Borrar</button>
                </div>
            </td>
        </tr>
    `).join("");

    els.heroTable.querySelector("tbody").onclick = (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === "edit-hero") {
            editHeroSlide(id);
        }
        if (button.dataset.action === "delete-hero") {
            removeHeroSlide(id);
        }
    };
}

function renderNavigationLists() {
    const navigation = state.headerNavigation || { searchScopes: [], sections: [] };

    if (els.navScopesList) {
        els.navScopesList.innerHTML = (navigation.searchScopes || []).map((scope) => `
            <div class="list-item">
                <div>
                    <strong>${escapeHtml(scope.label || "")}</strong>
                    <small>${escapeHtml(scope.href || "")}</small>
                </div>
                <span class="badge">${escapeHtml(scope.id || "")}</span>
            </div>
        `).join("");
    }

    if (els.navSectionsList) {
        els.navSectionsList.innerHTML = (navigation.sections || []).map((section) => `
            <div class="list-item nav-section-item">
                <div>
                    <strong>${escapeHtml(section.label || "")}</strong>
                    <small>${escapeHtml(section.href || "")} · ${(section.groups || []).length} grupos</small>
                </div>
                <span class="badge">${escapeHtml(section.id || "")}</span>
            </div>
        `).join("");
    }
}

function renderAdminLock() {
    const locked = state.sessionRole !== "admin";
    els.adminLock.classList.toggle("hidden", !locked);
    els.panelApp.classList.toggle("dimmed", locked);
    if (locked) {
        closeAdminModal();
    }
}

function renderAdminModal() {
    const meta = {
        products: {
            title: state.activeModalAction === "edit" ? "Editar producto" : "Nuevo producto",
            kicker: "ABM",
        },
        brands: {
            title: state.activeModalAction === "edit" ? "Editar marca" : "Nueva marca",
            kicker: "Catalogo",
        },
        categories: {
            title: state.activeModalAction === "edit" ? "Editar categoria" : "Nueva categoria",
            kicker: "Catalogo",
        },
        users: {
            title: state.activeModalAction === "edit" ? "Editar usuario" : "Nuevo usuario",
            kicker: "Accesos",
        },
        hero: {
            title: state.activeModalAction === "edit" ? "Editar slide" : "Nuevo slide",
            kicker: "Contenido",
        },
        navigation: {
            title: state.activeModalAction === "edit" ? "Editar registro" : "Nuevo registro",
            kicker: "Header",
        },
        bulk: { title: "Carga masiva de precios", kicker: "Excel" },
    }[state.activeAdminPanel] || { title: "Panel", kicker: "Admin" };

    els.adminModalTitle.textContent = meta.title;
    els.adminModalKicker.textContent = meta.kicker;

    document.querySelectorAll(".modal-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === state.activeAdminPanel);
    });
}

function syncViewButtons() {
    document.querySelectorAll(".toggle-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === state.viewMode);
    });
}

function syncRoleButtons() {
    return;
}

function populateCategorySelect() {
    const selected = Number(els.productCategory.value || state.categories[0]?.id || 0);
    els.productCategory.innerHTML = state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
    if (selected) els.productCategory.value = String(selected);
}

function populateBrandSelect() {
    if (!els.productBrand) {
        return;
    }
    const selected = String(els.productBrand.value || "");
    const source = Array.isArray(state.brands) && state.brands.length ? state.brands : deriveBrandsFromProducts();
    els.productBrand.innerHTML = [
        `<option value="">Selecciona una marca</option>`,
        ...source.map((brand) => {
            const value = brand.name || brand.code || "";
            const label = brand.code ? `${brand.code} - ${brand.name}` : (brand.name || value);
            return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
        })
    ].join("");
    if (selected) {
        els.productBrand.value = selected;
    }
}

function resetBrandForm() {
    if (!els.brandForm) {
        return;
    }
    els.brandForm.reset();
    clearHiddenFormField("brandId");
    clearHiddenFormField("brandImage");
    if (els.brandFeatured) {
        els.brandFeatured.checked = false;
    }
    if (els.brandImageFile) {
        els.brandImageFile.value = "";
    }
    if (els.brandImage) {
        els.brandImage.value = "";
    }
    updateBrandImageStatus("");
}

async function saveBrand(event) {
    event.preventDefault();
    const id = String(els.brandId.value || "").trim();
    const code = normalizeBrandCode(els.brandCode.value, state.brands.length).toUpperCase();
    const name = String(els.brandName.value || "").trim();
    const selectedFile = els.brandImageFile?.files?.[0] || null;
    let imagePath = String(els.brandImage.value || "").trim();
    if (selectedFile) {
        try {
            imagePath = await copyBrandImageFile(selectedFile);
            els.brandImage.value = imagePath;
            updateBrandImageStatus(imagePath);
        } catch (error) {
            alert(error.message || "No se pudo guardar la imagen de la marca.");
            return;
        }
    }
    const featured = !!els.brandFeatured?.checked;
    if (!name) {
        return;
    }

    const payload = { id: code, code, name, image: imagePath, featured };
    if (id) {
        state.brands = state.brands.map((brand) => (String(brand.id) === id ? { ...brand, ...payload } : brand));
    } else {
        const exists = state.brands.some((brand) => String(brand.code || "").toUpperCase() === code);
        const nextPayload = exists ? { ...payload, id: `${code}-${state.brands.length + 1}` } : payload;
        state.brands.unshift(nextPayload);
    }

    clearHiddenFormField("brandId");
    els.brandForm.reset();
    clearHiddenFormField("brandImage");
    if (els.brandFeatured) {
        els.brandFeatured.checked = false;
    }
    if (els.brandImageFile) {
        els.brandImageFile.value = "";
    }
    if (els.brandImage) {
        els.brandImage.value = "";
    }
    updateBrandImageStatus("");
    persistAndRender();
    closeAdminModal();
}

function resetBrandPanelForm() {
    if (els.brandPanelForm) {
        els.brandPanelForm.reset();
    }
    clearHiddenFormField("brandPanelId");
}

function saveBrandPanel(event) {
    event.preventDefault();
    const id = String(els.brandPanelId?.value || "").trim();
    const code = normalizeBrandCode(els.brandPanelCode?.value || "", state.brands.length).toUpperCase();
    const name = String(els.brandPanelName?.value || "").trim();
    if (!name) {
        return;
    }

    const payload = { id: code, code, name };
    if (id) {
        state.brands = state.brands.map((brand) => (String(brand.id) === id ? { ...brand, ...payload } : brand));
    } else {
        const exists = state.brands.some((brand) => String(brand.code || "").toUpperCase() === code);
        const nextPayload = exists ? { ...payload, id: `${code}-${state.brands.length + 1}` } : payload;
        state.brands.unshift(nextPayload);
    }

    resetBrandPanelForm();
    persistAndRender();
}

function editBrandPanel(id) {
    const brand = getBrandRows().find((item) => String(item.id) === String(id));
    if (!brand) {
        return;
    }
    if (els.brandPanelId) els.brandPanelId.value = String(brand.id);
    if (els.brandPanelCode) els.brandPanelCode.value = brand.code || "";
    if (els.brandPanelName) els.brandPanelName.value = brand.name || "";
    state.activeModalAction = "edit";
    renderPanelEditor();
    if (els.panelEditorSlot) {
        els.panelEditorSlot.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function editBrand(id) {
    const brand = getBrandRows().find((item) => String(item.id) === String(id));
    if (!brand) {
        return;
    }
    els.brandId.value = String(brand.id);
    els.brandCode.value = brand.code || "";
    els.brandName.value = brand.name || "";
    if (els.brandImage) {
        els.brandImage.value = brand.image || "";
    }
    if (els.brandImageFile) {
        els.brandImageFile.value = "";
    }
    updateBrandImageStatus(brand.image || "");
    if (els.brandFeatured) {
        els.brandFeatured.checked = !!brand.featured;
    }
    openAdminModal("brands", "edit");
}

function removeBrand(id) {
    state.brands = state.brands.filter((brand) => String(brand.id) !== String(id));
    persistAndRender();
}

async function saveProduct(event) {
    event.preventDefault();
    const id = Number(els.productId.value || 0);
    const selectedFile = els.productImageFile?.files?.[0] || null;
    let imagePath = String(els.productImage.value || "").trim();
    if (selectedFile) {
        try {
            imagePath = await copyProductImageFile(selectedFile);
            els.productImage.value = imagePath;
            updateProductImageStatus(imagePath);
        } catch (error) {
            alert(error.message || "No se pudo guardar la imagen en la carpeta del proyecto.");
            return;
        }
    }

    const payload = {
        sku: els.productSku.value.trim().toUpperCase(),
        name: els.productDetail.value.trim(),
        detail: els.productDetail.value.trim(),
        presentation: els.productPresentation.value.trim(),
        categoryId: Number(els.productCategory.value),
        brand: els.productBrand.value.trim(),
        image: imagePath,
        featured: els.productFeatured.checked,
        trending: !!els.productTrending?.checked,
        vegano: els.productVegano.value === "true",
        kosher: els.productKosher.value === "true",
        testeadoEnAnimales: els.productTesteadoEnAnimales.value === "true",
        publicPrice: Number(els.productPublicPrice.value),
        memberPrice: Number(els.productMemberPrice.value),
        status: "published",
    };

    if (id) {
        state.products = state.products.map((product) => (product.id === id ? { ...product, ...payload } : product));
    } else {
        state.products.unshift({ id: state.nextIds.product++, ...payload });
    }

    clearHiddenFormField("productId");
    els.productForm.reset();
    clearHiddenFormField("productImage");
    els.productVegano.value = "false";
    els.productKosher.value = "false";
    els.productTesteadoEnAnimales.value = "false";
    if (els.productTrending) {
        els.productTrending.checked = false;
    }
    if (els.productImageFile) {
        els.productImageFile.value = "";
    }
    updateProductImageStatus("");
    persistAndRender();
    closeAdminModal();
}

function saveCategory(event) {
    event.preventDefault();
    const id = Number(els.categoryId.value || 0);
    const payload = {
        name: els.categoryName.value.trim(),
        slug: slugify(els.categorySlug.value),
        visible: els.categoryVisible.checked,
    };

    if (id) {
        state.categories = state.categories.map((category) => (category.id === id ? { ...category, ...payload } : category));
    } else {
        state.categories.unshift({ id: state.nextIds.category++, ...payload });
    }

    clearHiddenFormField("categoryId");
    els.categoryForm.reset();
    els.categoryVisible.checked = true;
    persistAndRender();
}

function saveUser(event) {
    event.preventDefault();
    const id = Number(els.userId.value || 0);
    const payload = {
        name: els.userName.value.trim(),
        email: els.userEmail.value.trim(),
        role: els.userRole.value,
        canSeePrices: els.userCanSeePrices.checked,
        active: els.userActive.checked,
    };

    if (id) {
        state.users = state.users.map((user) => (user.id === id ? { ...user, ...payload } : user));
    } else {
        state.users.unshift({ id: state.nextIds.user++, ...payload });
    }

    clearHiddenFormField("userId");
    els.userForm.reset();
    els.userRole.value = "customer";
    els.userCanSeePrices.checked = true;
    els.userActive.checked = true;
    persistAndRender();
}

function saveHeroSlide(event) {
    event.preventDefault();
    const id = Number(els.heroId.value || 0);
    const rawLink = els.heroLink.value.trim();
    const normalizedLink = rawLink.replace(/^https?:\/\/www\.greenco\.com\.ar\/Galeria\//i, "galeria.html?source=/Galeria/")
        .replace(/^https?:\/\/greenco\.com\.ar\/Galeria\//i, "galeria.html?source=/Galeria/")
        .replace(/^\/Galeria\//i, "galeria.html?source=/Galeria/")
        .replace(/^https?:\/\/www\.greenco\.com\.ar\/Seguridad\/Register/i, "login.html?mode=register");
    const payload = {
        title: els.heroTitle.value.trim(),
        subtitle: els.heroSubtitle.value.trim(),
        image: els.heroImage.value.trim(),
        imageMobile: els.heroImageMobile.value.trim(),
        link: normalizedLink || "galeria.html",
        badge: els.heroBadge.value.trim(),
        order: Number(els.heroOrder.value),
        active: els.heroActive.checked,
        homeSpotlight: els.heroHomeSpotlight.checked,
    };

    if (payload.homeSpotlight) {
        state.heroSlides = state.heroSlides.map((slide) => ({ ...slide, homeSpotlight: false }));
    }

    if (id) {
        state.heroSlides = state.heroSlides.map((slide) => (slide.id === id ? { ...slide, ...payload } : slide));
    } else {
        state.heroSlides.unshift({ id: state.nextIds.heroSlide++, ...payload });
    }

    clearHiddenFormField("heroId");
    els.heroForm.reset();
    els.heroActive.checked = true;
    els.heroHomeSpotlight.checked = false;
    els.heroOrder.value = nextHeroOrder();
    persistAndRender();
}

function editProduct(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    els.productId.value = String(product.id);
    els.productSku.value = product.sku;
    els.productDetail.value = product.detail || product.name || "";
    els.productPresentation.value = product.presentation || "";
    els.productCategory.value = String(product.categoryId);
    populateBrandSelect();
    els.productBrand.value = product.brand;
    if (els.productImage) {
        els.productImage.value = product.image || "";
    }
    if (els.productImageFile) {
        els.productImageFile.value = "";
    }
    updateProductImageStatus(product.image || "");
    els.productFeatured.checked = !!product.featured;
    if (els.productTrending) {
        els.productTrending.checked = !!product.trending;
    }
    els.productVegano.value = product.vegano ? "true" : "false";
    els.productKosher.value = product.kosher ? "true" : "false";
    els.productTesteadoEnAnimales.value = product.testeadoEnAnimales ? "true" : "false";
    els.productPublicPrice.value = product.publicPrice;
    els.productMemberPrice.value = product.memberPrice;
}

function editCategory(id) {
    const category = state.categories.find((item) => item.id === id);
    if (!category) return;
    els.categoryId.value = String(category.id);
    els.categoryName.value = category.name;
    els.categorySlug.value = category.slug;
    els.categoryVisible.checked = category.visible;
}

function editUser(id) {
    const user = state.users.find((item) => item.id === id);
    if (!user) return;
    els.userId.value = String(user.id);
    els.userName.value = user.name;
    els.userEmail.value = user.email;
    els.userRole.value = user.role;
    els.userCanSeePrices.checked = user.canSeePrices;
    els.userActive.checked = user.active;
}

function editHeroSlide(id) {
    const slide = state.heroSlides.find((item) => item.id === id);
    if (!slide) return;
    els.heroId.value = String(slide.id);
    els.heroTitle.value = slide.title;
    els.heroSubtitle.value = slide.subtitle;
    els.heroImage.value = slide.image;
    els.heroImageMobile.value = slide.imageMobile || "";
    els.heroLink.value = slide.link;
    els.heroBadge.value = slide.badge;
    els.heroOrder.value = slide.order;
    els.heroActive.checked = slide.active !== false;
    els.heroHomeSpotlight.checked = !!slide.homeSpotlight;
}

function removeProduct(id) {
    state.products = state.products.filter((product) => product.id !== id);
    state.brands = deriveBrandsFromProducts();
    persistAndRender();
}

function removeCategory(id) {
    const used = state.products.some((product) => product.categoryId === id);
    if (used) {
        alert("No se puede borrar una categoria que sigue usada por productos.");
        return;
    }
    state.categories = state.categories.filter((category) => category.id !== id);
    persistAndRender();
}

function removeUser(id) {
    state.users = state.users.filter((user) => user.id !== id);
    persistAndRender();
}

function removeHeroSlide(id) {
    state.heroSlides = state.heroSlides.filter((slide) => slide.id !== id);
    persistAndRender();
}

function nextHeroOrder() {
    const highest = state.heroSlides.reduce((max, slide) => Math.max(max, Number(slide.order || 0)), 0);
    return String(highest + 1);
}

function syncForms() {
    els.productVegano.value = "false";
    els.productKosher.value = "false";
    els.productTesteadoEnAnimales.value = "false";
    els.categoryVisible.checked = true;
    els.userRole.value = "customer";
    els.userCanSeePrices.checked = true;
    els.userActive.checked = true;
    els.heroActive.checked = true;
    els.heroHomeSpotlight.checked = false;
    els.heroOrder.value = nextHeroOrder();
    els.heroImageMobile.value = "";
    populateCategorySelect();
}

function downloadTemplate() {
    const rows = [
        ["brand", "detail", "presentation", "category", "vegano", "kosher", "testeadoEnAnimales", "publicPrice", "memberPrice"],
        ["AL NATURAL", "AL NATURAL EXTRACTO JUGO GRAVIOLA 500cc", "500 cc", "Catalogo importado", "No", "Si", "No", 13000, 10600],
        ["BAMBOO", "BAMBOO POCHOCLOS ORGANICOS AZUCAR", "80 gr", "Catalogo importado", "Si", "Si", "No", 2200, 2100],
    ];
    downloadWorkbook(rows, "plantilla_productos_pintofruta.xlsx");
}

function downloadCatalog() {
    const rows = [
        ["sku", "detail", "presentation", "category", "brand", "vegano", "kosher", "testeadoEnAnimales", "publicPrice", "memberPrice"],
        ...state.products.map((product) => [
            product.sku,
            product.detail || "",
            product.presentation || "",
            state.categories.find((category) => category.id === product.categoryId)?.name || "",
            product.brand,
            product.vegano ? "Si" : "No",
            product.kosher ? "Si" : "No",
            product.testeadoEnAnimales ? "Si" : "No",
            product.publicPrice,
            product.memberPrice,
        ]),
    ];
    downloadWorkbook(rows, "catalogo_pintofruta.xlsx");
}

function downloadJson() {
    const payload = JSON.stringify(state, null, 2);
    downloadBlob(new Blob([payload], { type: "application/json;charset=utf-8" }), "site-content-pintofruta.json");
}

function downloadWorkbook(rows, filename) {
    if (window.XLSX) {
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Precios");
        XLSX.writeFile(workbook, filename);
        return;
    }

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, filename.replace(/\.xlsx$/, ".csv"));
}

async function importPriceFile() {
    const file = els.priceFile.files[0];
    if (!file) {
        setImportState("Selecciona un archivo primero.");
        return;
    }

    try {
        const rows = await readRows(file);
        applyImportedRows(rows);
        persistAndRender();
        setImportState(`Archivo procesado: ${file.name}`);
    } catch (error) {
        console.error(error);
        setImportState("No se pudo leer el archivo.");
    }
}

async function readRows(file) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".csv")) {
        const text = await file.text();
        return parseCsv(text);
    }

    if (!window.XLSX) {
        throw new Error("XLSX library not loaded");
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function applyImportedRows(rows) {
    const normalized = rows.map(normalizeRow).filter(Boolean);
    let updated = 0;

    normalized.forEach((row) => {
        const product = state.products.find((item) => item.sku.toUpperCase() === row.sku.toUpperCase());
        if (!product) return;
        if (row.publicPrice !== null) product.publicPrice = row.publicPrice;
        if (row.memberPrice !== null) product.memberPrice = row.memberPrice;
        updated += 1;
    });

    setImportState(`Se actualizaron ${updated} productos.`);
}

function normalizeRow(row) {
    const sku = String(row.sku || row.SKU || row.codigo || row.code || "").trim();
    if (!sku) return null;
    return {
        sku,
        publicPrice: toNumber(row.publicPrice ?? row.public_price ?? row.precio_publico ?? row.precioPublico),
        memberPrice: toNumber(row.memberPrice ?? row.member_price ?? row.precio_logueado ?? row.precioLogueado),
    };
}

function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const [headerLine, ...bodyLines] = lines;
    const headers = headerLine.split(",").map((header) => header.trim());
    return bodyLines.map((line) => {
        const values = line.split(",").map((value) => value.trim());
        return headers.reduce((acc, header, index) => {
            acc[header] = values[index] ?? "";
            return acc;
        }, {});
    });
}

function money(value) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function statusLabel(status) {
    return {
        published: "Publicado",
        draft: "Borrador",
        hidden: "Oculto",
    }[status] || status;
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function toNumber(value) {
    const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(number) ? number : null;
}

function csvCell(value) {
    const stringValue = String(value ?? "");
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function setImportState(message) {
    els.importState.textContent = message;
}

function clearHiddenFormField(id) {
    els[id].value = "";
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

