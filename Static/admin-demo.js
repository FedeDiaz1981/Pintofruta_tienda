const STORAGE_KEY = "pintofruta-static-site-content-v1";

const defaultState = {
    sessionRole: "admin",
    viewMode: "public",
    activeAdminPanel: "products",
    panelSearchQuery: "",
    headerNavigation: window.PF_BASE_CONTENT?.headerNavigation || { searchScopes: [], sections: [] },
    heroSlides: [
        {
            id: 1,
            order: 1,
            title: "Sierra de los Padres",
            subtitle: "Destacados de temporada con visual principal del home.",
            badge: "Campana activa",
            image: "Content/Images/Banners/Banner SM 1.jpg",
            link: "/Galeria/1015-sierra-de-los-padres",
            active: true
        },
        {
            id: 2,
            order: 2,
            title: "Suma",
            subtitle: "Oferta destacada con acceso directo a la galeria.",
            badge: "Promo",
            image: "Content/Images/Banners/Banner Suma 2.jpg",
            link: "/Galeria/954-suma",
            active: true
        },
        {
            id: 3,
            order: 3,
            title: "Un Mate",
            subtitle: "Contenido editable para comunicar lanzamientos o marcas.",
            badge: "Lanzamiento",
            image: "Content/Images/Banners/Un Mate Banner 3.jpg",
            link: "/Galeria/984-un-mate",
            active: true
        },
        {
            id: 4,
            order: 4,
            title: "Qu Cocoiogo",
            subtitle: "Banner de marca con link a categoria especifica.",
            badge: "Marca",
            image: "Content/Images/Banners/Banner QU Cocoiogo 4.jpg",
            link: "/Galeria/644-qu",
            active: true
        },
        {
            id: 5,
            order: 5,
            title: "Meraki",
            subtitle: "Slide pensado para mostrar una nueva campana visual.",
            badge: "Nuevo",
            image: "Content/Images/Banners/Meraki Banner.jpg",
            link: "/Galeria/129-meraki",
            active: true
        },
        {
            id: 6,
            order: 6,
            title: "Veg Abundancia",
            subtitle: "Cierre del carrusel con foco en la lista de productos.",
            badge: "Promo",
            image: "Content/Images/Banners/Banner VA 6.jpg",
            link: "/Galeria/657-veg-abundancia",
            active: true
        }
    ],
    products: [
        { id: 1, sku: "MERA09", name: "Cepillo Dental de Bambu Media", brand: "Meraki", categoryId: 4, publicPrice: 2490, memberPrice: 2240, stock: 18, status: "published", featured: true },
        { id: 2, sku: "TALO01", name: "Yogurt Estilo Griego Natural 180g", brand: "Talos", categoryId: 1, publicPrice: 1890, memberPrice: 1690, stock: 42, status: "published", featured: true },
        { id: 3, sku: "BURG04", name: "Medallones de Cebollas Caramelizadas", brand: "Burganas", categoryId: 2, publicPrice: 3920, memberPrice: 3520, stock: 26, status: "published", featured: false },
        { id: 4, sku: "ZAFR25", name: "Barra de Cereal Pasta de Mani y Miel", brand: "Zafran", categoryId: 3, publicPrice: 1780, memberPrice: 1590, stock: 58, status: "draft", featured: false },
        { id: 5, sku: "AIKE06", name: "Tortillas de Quinoa y Kale", brand: "Aiken", categoryId: 1, publicPrice: 4150, memberPrice: 3710, stock: 31, status: "published", featured: false },
    ],
    categories: [
        { id: 1, name: "Almacen saludable", slug: "almacen-saludable", visible: true },
        { id: 2, name: "Congelados", slug: "congelados", visible: true },
        { id: 3, name: "Barras y snacks", slug: "snacks", visible: true },
        { id: 4, name: "Hogar y cuidado", slug: "hogar-cuidado", visible: true },
    ],
    users: [
        { id: 1, name: "Laura Gomez", email: "laura@demo.com", role: "admin", canSeePrices: true, active: true },
        { id: 2, name: "Sofia Perez", email: "sofia@demo.com", role: "customer", canSeePrices: true, active: true },
        { id: 3, name: "Martin Ruiz", email: "martin@demo.com", role: "customer", canSeePrices: false, active: true },
        { id: 4, name: "Muestra Inactiva", email: "inactive@demo.com", role: "customer", canSeePrices: true, active: false },
    ],
    nextIds: { product: 6, category: 5, user: 5, heroSlide: 7 },
};

let state = loadState();

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
    bindElements();
    state = await loadInitialState();
    bindEvents();
    syncForms();
    renderAll();
});

function bindElements() {
    const ids = [
        "panelApp", "panelSidebar", "panelTitle", "topbarProducts", "topbarCategories", "topbarUsers", "topbarCount", "panelKicker",
        "panelTableTitle", "panelKpis", "panelSearch", "panelCreate", "panelTable", "panelTableHead", "panelTableBody",
        "featuredPublic", "featuredMember", "featuredDiff", "storefrontGrid", "adminLock",
        "adminLauncher", "adminModalBackdrop", "adminModalTitle", "adminModalKicker", "closeAdminModal", "adminModalTabs",
        "downloadJsonCard",
        "productForm", "productId", "productSku", "productName", "productCategory", "productBrand", "productPublicPrice",
        "productMemberPrice", "productStock", "productStatus", "productFeatured", "productTable", "resetProductForm",
        "categoryForm", "categoryId", "categoryName", "categorySlug", "categoryVisible", "categoryList", "resetCategoryForm",
        "userForm", "userId", "userName", "userEmail", "userRole", "userCanSeePrices", "userActive", "userTable", "resetUserForm",
        "heroForm", "heroId", "heroTitle", "heroSubtitle", "heroImage", "heroLink", "heroBadge", "heroOrder", "heroActive",
        "heroTable", "resetHeroForm", "navScopesList", "navSectionsList", "downloadTemplate", "downloadCatalog", "priceFile", "importPrices", "importState", "downloadJson"
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
    els.categoryForm.addEventListener("submit", saveCategory);
    els.userForm.addEventListener("submit", saveUser);
    els.heroForm.addEventListener("submit", saveHeroSlide);

    els.resetProductForm.addEventListener("click", () => {
        els.productForm.reset();
        clearHiddenFormField("productId");
        els.productStatus.value = "published";
    });
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

    els.downloadTemplate.addEventListener("click", downloadTemplate);
    els.downloadCatalog.addEventListener("click", downloadCatalog);
    els.importPrices.addEventListener("click", importPriceFile);
    els.downloadJson.addEventListener("click", downloadJson);
    els.downloadJsonCard.addEventListener("click", downloadJson);

    els.adminLauncher.addEventListener("click", handleLauncherClick);
    els.adminModalTabs.addEventListener("click", handleLauncherClick);
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
        openAdminModal("bulk");
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
    if (state.activeAdminPanel === "bulk") {
        openAdminModal("bulk");
        return;
    }
    openAdminModal(state.activeAdminPanel);
}

function openEditor(type, id) {
    if (type === "product") editProduct(id);
    if (type === "category") editCategory(id);
    if (type === "user") editUser(id);
    if (type === "hero") editHeroSlide(id);
    openAdminModal(type);
}

function removeRecord(type, id) {
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
        const id = Number(editButton.dataset.id);
        openEditor(type, id);
        return;
    }

    if (deleteButton) {
        const type = deleteButton.dataset.deleteType;
        const id = Number(deleteButton.dataset.id);
        removeRecord(type, id);
        return;
    }

    if (bulkButton) {
        openAdminModal("bulk");
    }
}

function handleLauncherClick(event) {
    const button = event.target.closest("[data-open-panel]");
    if (!button) return;
    const panel = button.dataset.openPanel;
    openAdminModal(panel);
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

function openAdminModal(panel) {
    state.activeAdminPanel = panel;
    els.adminModalBackdrop.classList.remove("hidden");
    persistAndRender();
}

function closeAdminModal() {
    els.adminModalBackdrop.classList.add("hidden");
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.PFContent && typeof window.PFContent.save === "function") {
        window.PFContent.save(state);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        return {
            ...structuredClone(defaultState),
            ...parsed,
            nextIds: { ...defaultState.nextIds, ...(parsed.nextIds || {}) },
            panelSearchQuery: parsed.panelSearchQuery || "",
            sessionRole: "admin",
            heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length ? parsed.heroSlides : structuredClone(defaultState.heroSlides),
            products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : structuredClone(defaultState.products),
            categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : structuredClone(defaultState.categories),
            users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : structuredClone(defaultState.users),
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
    merged.panelSearchQuery = incoming.panelSearchQuery || base.panelSearchQuery;
    merged.heroSlides = Array.isArray(incoming.heroSlides) && incoming.heroSlides.length ? incoming.heroSlides : base.heroSlides;
    merged.products = Array.isArray(incoming.products) && incoming.products.length ? incoming.products : base.products;
    merged.categories = Array.isArray(incoming.categories) && incoming.categories.length ? incoming.categories : base.categories;
    merged.users = Array.isArray(incoming.users) && incoming.users.length ? incoming.users : base.users;
    return merged;
}

function renderAll() {
    renderMetrics();
    renderPriceStrip();
    renderStorefront();
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
}

function renderMainPanel() {
    const meta = getPanelMeta(state.activeAdminPanel);
    const records = getPanelRecords(state.activeAdminPanel);
    const filtered = filterPanelRecords(records, state.activeAdminPanel, state.panelSearchQuery || "");

    els.panelSearch.value = state.panelSearchQuery || "";
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

function getPanelMeta(panel) {
    const labels = {
        products: {
            title: "Productos",
            subtitle: "Alta, edicion, stock y precios en dos listas para la cliente.",
            kicker: "ABM / Productos",
            tableTitle: "Listado de productos",
            viewLabel: "SQL / Productos",
            kpis: [
                { label: "Publicados", value: (filtered) => filtered.filter((item) => item.status === "published").length },
                { label: "Destacados", value: (filtered) => filtered.filter((item) => item.featured).length },
                { label: "Stock total", value: (filtered) => filtered.reduce((sum, item) => sum + Number(item.stock || 0), 0) },
            ],
        },
        categories: {
            title: "Categorias",
            subtitle: "Catalogo de navegacion para el home y el buscador.",
            kicker: "Catalogo / Categorias",
            tableTitle: "Listado de categorias",
            viewLabel: "SQL / Categorias",
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
        case "categories":
            return state.categories;
        case "users":
            return state.users;
        case "hero":
            return state.heroSlides;
        case "navigation":
            return [state.headerNavigation || { searchScopes: [], sections: [] }];
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

function renderPanelTableHTML(panel, records) {
    if (panel === "products") {
        return {
            head: `
                <tr>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Categoria</th>
                    <th>Marca</th>
                    <th>Precios</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            `,
            body: records.map((product) => {
                    const category = state.categories.find((item) => item.id === product.categoryId);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(product.sku)}</strong></td>
                            <td>${escapeHtml(product.name)}</td>
                            <td>${category ? escapeHtml(category.name) : "Sin categoria"}</td>
                            <td>${escapeHtml(product.brand)}</td>
                            <td>
                                <strong>${money(product.publicPrice)}</strong>
                                <span class="row-sub">${money(product.memberPrice)}</span>
                            </td>
                            <td>${product.stock}</td>
                            <td>${statusBadge(product.status)}${product.featured ? `<span class="row-sub">Destacado</span>` : ""}</td>
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

    if (panel === "navigation") {
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

function renderMetrics() {
    els.topbarProducts.textContent = String(state.products.length);
    els.topbarCategories.textContent = String(state.categories.length);
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
    const visibleProducts = state.products.filter((product) => product.status !== "hidden");
    els.storefrontGrid.innerHTML = visibleProducts.map((product) => {
        const category = state.categories.find((item) => item.id === product.categoryId);
        const publicPrice = money(product.publicPrice);
        const memberPrice = money(product.memberPrice);
        const currentPrice = state.viewMode === "member" && state.sessionRole !== "guest" ? memberPrice : publicPrice;
        const priceLabel = state.viewMode === "member" && state.sessionRole !== "guest" ? "Precio logueado" : "Precio publico";
        const canSeeMember = state.sessionRole !== "guest";
        return `
            <article class="product-card">
                <div class="product-top">
                    <div>
                        <div class="product-sku">${product.sku}</div>
                        <h3 class="product-name">${escapeHtml(product.name)}</h3>
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
                    <span class="badge">Stock ${product.stock}</span>
                </div>
            </article>
        `;
    }).join("");
}

function renderProductsTable() {
    els.productTable.querySelector("tbody").innerHTML = state.products.map((product) => {
        const category = state.categories.find((item) => item.id === product.categoryId);
        return `
            <tr>
                <td><strong>${escapeHtml(product.sku)}</strong></td>
                <td>
                    <strong>${escapeHtml(product.name)}</strong><br>
                    <span class="badge">${escapeHtml(product.brand)}</span>
                </td>
                <td>${category ? escapeHtml(category.name) : "Sin categoria"}</td>
                <td>
                    ${money(product.publicPrice)}<br>
                    <span class="badge">${money(product.memberPrice)}</span>
                </td>
                <td>${statusLabel(product.status)}${product.featured ? "<br><span class='badge'>Destacado</span>" : ""}</td>
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
        products: { title: "Productos", kicker: "ABM" },
        categories: { title: "Categorias", kicker: "Catalogo" },
        users: { title: "Usuarios", kicker: "Accesos" },
        hero: { title: "Hero / Carrusel principal", kicker: "Contenido" },
        bulk: { title: "Carga masiva de precios", kicker: "Excel" },
    }[state.activeAdminPanel] || { title: "Panel", kicker: "Admin" };

    els.adminModalTitle.textContent = meta.title;
    els.adminModalKicker.textContent = meta.kicker;

    document.querySelectorAll(".modal-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === state.activeAdminPanel);
    });
    document.querySelectorAll(".modal-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.openPanel === state.activeAdminPanel);
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

function saveProduct(event) {
    event.preventDefault();
    const id = Number(els.productId.value || 0);
    const payload = {
        sku: els.productSku.value.trim().toUpperCase(),
        name: els.productName.value.trim(),
        categoryId: Number(els.productCategory.value),
        brand: els.productBrand.value.trim(),
        publicPrice: Number(els.productPublicPrice.value),
        memberPrice: Number(els.productMemberPrice.value),
        stock: Number(els.productStock.value),
        status: els.productStatus.value,
        featured: els.productFeatured.checked,
    };

    if (id) {
        state.products = state.products.map((product) => (product.id === id ? { ...product, ...payload } : product));
    } else {
        state.products.unshift({ id: state.nextIds.product++, ...payload });
    }

    clearHiddenFormField("productId");
    els.productForm.reset();
    els.productStatus.value = "published";
    persistAndRender();
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
    const payload = {
        title: els.heroTitle.value.trim(),
        subtitle: els.heroSubtitle.value.trim(),
        image: els.heroImage.value.trim(),
        link: els.heroLink.value.trim(),
        badge: els.heroBadge.value.trim(),
        order: Number(els.heroOrder.value),
        active: els.heroActive.checked,
    };

    if (id) {
        state.heroSlides = state.heroSlides.map((slide) => (slide.id === id ? { ...slide, ...payload } : slide));
    } else {
        state.heroSlides.unshift({ id: state.nextIds.heroSlide++, ...payload });
    }

    clearHiddenFormField("heroId");
    els.heroForm.reset();
    els.heroActive.checked = true;
    els.heroOrder.value = nextHeroOrder();
    persistAndRender();
}

function editProduct(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    els.productId.value = String(product.id);
    els.productSku.value = product.sku;
    els.productName.value = product.name;
    els.productCategory.value = String(product.categoryId);
    els.productBrand.value = product.brand;
    els.productPublicPrice.value = product.publicPrice;
    els.productMemberPrice.value = product.memberPrice;
    els.productStock.value = product.stock;
    els.productStatus.value = product.status;
    els.productFeatured.checked = product.featured;
    window.location.hash = "#admin";
}

function editCategory(id) {
    const category = state.categories.find((item) => item.id === id);
    if (!category) return;
    els.categoryId.value = String(category.id);
    els.categoryName.value = category.name;
    els.categorySlug.value = category.slug;
    els.categoryVisible.checked = category.visible;
    window.location.hash = "#admin";
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
    window.location.hash = "#admin";
}

function editHeroSlide(id) {
    const slide = state.heroSlides.find((item) => item.id === id);
    if (!slide) return;
    els.heroId.value = String(slide.id);
    els.heroTitle.value = slide.title;
    els.heroSubtitle.value = slide.subtitle;
    els.heroImage.value = slide.image;
    els.heroLink.value = slide.link;
    els.heroBadge.value = slide.badge;
    els.heroOrder.value = slide.order;
    els.heroActive.checked = slide.active !== false;
    window.location.hash = "#admin";
}

function removeProduct(id) {
    state.products = state.products.filter((product) => product.id !== id);
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
    els.productStatus.value = "published";
    els.categoryVisible.checked = true;
    els.userRole.value = "customer";
    els.userCanSeePrices.checked = true;
    els.userActive.checked = true;
    els.heroActive.checked = true;
    els.heroOrder.value = nextHeroOrder();
    populateCategorySelect();
}

function downloadTemplate() {
    const rows = [
        ["sku", "publicPrice", "memberPrice"],
        ["MERA09", 2490, 2240],
        ["TALO01", 1890, 1690],
        ["BURG04", 3920, 3520],
    ];
    downloadWorkbook(rows, "plantilla_precios_pintofruta.xlsx");
}

function downloadCatalog() {
    const rows = [
        ["sku", "name", "category", "brand", "publicPrice", "memberPrice", "stock", "status"],
        ...state.products.map((product) => [
            product.sku,
            product.name,
            state.categories.find((category) => category.id === product.categoryId)?.name || "",
            product.brand,
            product.publicPrice,
            product.memberPrice,
            product.stock,
            product.status,
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
