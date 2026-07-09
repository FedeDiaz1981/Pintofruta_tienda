(function () {
    const STORAGE_KEY = "pintofruta-search-filters-v1";

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalizeText(value) {
        return String(value == null ? "" : value)
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function uniqueBy(items, keyGetter) {
        const seen = new Set();
        const result = [];

        items.forEach((item) => {
            const key = keyGetter(item);
            if (!key || seen.has(key)) {
                return;
            }
            seen.add(key);
            result.push(item);
        });

        return result;
    }

    function getBrandItems(content) {
        return uniqueBy((Array.isArray(content?.brands) ? content.brands : [])
            .map((brand) => ({
                id: brand?.id || brand?.code || brand?.name,
                name: brand?.name || brand?.code || brand?.id,
            }))
            .filter((brand) => brand.id && brand.name)
            .sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name), "es")), (item) => String(item.id));
    }

    function getCategoryItems(content) {
        return uniqueBy((Array.isArray(content?.categories) ? content.categories : [])
            .filter((category) => category && category.visible !== false)
            .map((category) => ({
                id: category.id,
                name: category.name || category.slug || category.id,
            }))
            .filter((category) => category.id != null && category.name)
            .sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name), "es")), (item) => String(item.id));
    }

    function normalizeState(rawState) {
        const state = Array.isArray(rawState) ? rawState : [];
        return state
            .map((token) => ({
                type: String(token?.type || "").trim(),
                values: Array.isArray(token?.values) ? token.values.map((value) => String(value).trim()).filter(Boolean) : [],
            }))
            .filter((token) => token.type && token.values.length);
    }

    function parseStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const tokens = [];

        const pushToken = (type, values) => {
            const cleaned = values.map((value) => String(value).trim()).filter(Boolean);
            if (cleaned.length) {
                tokens.push({ type, values: cleaned });
            }
        };

        pushToken("brand", String(params.get("Marca") || "").split(","));
        pushToken("category", String(params.get("Categoria") || "").split(","));
        if (params.get("Vegano")) {
            pushToken("vegano", ["1"]);
        }
        if (params.get("Kosher")) {
            pushToken("kosher", ["1"]);
        }

        return tokens;
    }

    function readState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return normalizeState(JSON.parse(raw));
            }
        } catch {
            // Ignoro corruptos y caigo al URL o a vacío.
        }

        return normalizeState(parseStateFromUrl());
    }

    function writeState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
        } catch {
            // Silencioso: el filtro sigue funcionando con el estado actual.
        }
    }

    function getSelectedValuesByType(state, type) {
        const token = state.find((item) => item.type === type);
        return new Set(token ? token.values : []);
    }

    function syncGroupValue(state, type, value, checked) {
        const normalizedValue = String(value).trim();
        if (!normalizedValue) {
            return normalizeState(state);
        }

        const nextState = normalizeState(state);
        let token = nextState.find((item) => item.type === type);

        if (checked) {
            if (!token) {
                token = { type, values: [] };
                nextState.push(token);
            }
            if (!token.values.includes(normalizedValue)) {
                token.values.push(normalizedValue);
            }
            return normalizeState(nextState);
        }

        if (!token) {
            return nextState;
        }

        token.values = token.values.filter((item) => item !== normalizedValue);
        if (!token.values.length) {
            const index = nextState.indexOf(token);
            if (index >= 0) {
                nextState.splice(index, 1);
            }
        }

        return normalizeState(nextState);
    }

    function buildOptionHtml(items, prefix, filterType, selectedValues) {
        if (!items.length) {
            return '<div class="text-muted small px-1 py-2">No hay opciones disponibles.</div>';
        }

        return items.map((item) => {
            const itemId = String(item.id);
            const itemName = item.name || item.code || itemId;
            const checked = selectedValues.has(itemId) ? " checked" : "";

            return `
                <div class="custom-control custom-checkbox collection-filter-checkbox option">
                    <input type="checkbox"
                           class="custom-control-input"
                           data-filter-group="${escapeHtml(filterType)}"
                           data-filter-value="${escapeHtml(itemId)}"
                           opcionId="${escapeHtml(itemId)}"
                           id="${escapeHtml(prefix)}-${escapeHtml(itemId)}"${checked}>
                    <label class="custom-control-label" for="${escapeHtml(prefix)}-${escapeHtml(itemId)}">${escapeHtml(itemName)}</label>
                </div>
            `;
        }).join("");
    }

    function buildBinaryHtml(prefix, label, filterType, checked) {
        return `
            <div class="custom-control custom-checkbox collection-filter-checkbox option">
                <input type="checkbox"
                       class="custom-control-input"
                       data-filter-group="${escapeHtml(filterType)}"
                       data-filter-value="1"
                       opcionId="1"
                       id="${escapeHtml(prefix)}-si"${checked ? " checked" : ""}>
                <label class="custom-control-label" for="${escapeHtml(prefix)}-si">${escapeHtml(label)}</label>
            </div>
        `;
    }

    function renderSidebar(root, content, state) {
        const brandsRoot = root.querySelector("#searchBrandsFilter");
        const categoriesRoot = root.querySelector("#searchCategoriesFilter");
        const veganoRoot = root.querySelector("#searchVeganoFilter");
        const kosherRoot = root.querySelector("#searchKosherFilter");

        const selectedBrands = getSelectedValuesByType(state, "brand");
        const selectedCategories = getSelectedValuesByType(state, "category");
        const veganoChecked = getSelectedValuesByType(state, "vegano").has("1");
        const kosherChecked = getSelectedValuesByType(state, "kosher").has("1");

        if (brandsRoot) {
            brandsRoot.innerHTML = buildOptionHtml(getBrandItems(content), "Marca", "brand", selectedBrands);
        }

        if (categoriesRoot) {
            categoriesRoot.innerHTML = buildOptionHtml(getCategoryItems(content), "Categoria", "category", selectedCategories);
        }

        if (veganoRoot) {
            veganoRoot.innerHTML = buildBinaryHtml("Vegano", "Sí", "vegano", veganoChecked);
        }

        if (kosherRoot) {
            kosherRoot.innerHTML = buildBinaryHtml("Kosher", "Sí", "kosher", kosherChecked);
        }
    }

    function emitChange() {
        window.dispatchEvent(new CustomEvent("pf-search-filters-change"));
    }

    function bindInteractions(root) {
        root.addEventListener("change", (event) => {
            const input = event.target.closest("input[data-filter-group][data-filter-value]");
            if (!input) {
                return;
            }

            const group = input.getAttribute("data-filter-group");
            const value = input.getAttribute("data-filter-value");
            const nextState = syncGroupValue(readState(), group, value, input.checked);
            writeState(nextState);
            emitChange();
        });
    }

    async function init() {
        const root = document.getElementById("searchSidebarFilters");
        if (!root) {
            return;
        }

        let content = window.PF_BASE_CONTENT || {};
        try {
            if (window.PFContent && typeof window.PFContent.load === "function") {
                content = await window.PFContent.load();
            }
        } catch (error) {
            console.warn("No se pudo cargar el contenido dinámico para los filtros.", error);
        }

        root.innerHTML = `
            <div class="collection-mobile-back d-block d-xl-none">
                <span class="filter-back"><i class="fa fa-angle-left" aria-hidden="true"></i> Cerrar Filtros</span>
            </div>

            <div class="collection-collapse-block widget-scroll open">
                <h3 class="collapse-block-title mt-0">Marca</h3>
                <div class="collection-collapse-block-content widget-scroll-inner">
                    <div id="searchBrandsFilter" class="collection-Marca-filter collection-brand-filter filtroAtributos" filtroUrl="Marca"></div>
                </div>
            </div>

            <div class="collection-collapse-block widget-scroll open">
                <h3 class="collapse-block-title mt-0">Categoría</h3>
                <div class="collection-collapse-block-content widget-scroll-inner">
                    <div id="searchCategoriesFilter" class="collection-Categoria-filter collection-brand-filter filtroAtributos" filtroUrl="Categoria"></div>
                </div>
            </div>

            <div class="collection-collapse-block widget-scroll open">
                <h3 class="collapse-block-title mt-0">Vegano</h3>
                <div class="collection-collapse-block-content widget-scroll-inner">
                    <div id="searchVeganoFilter" class="collection-Vegano-filter collection-brand-filter filtroAtributos" filtroUrl="Vegano"></div>
                </div>
            </div>

            <div class="collection-collapse-block widget-scroll open">
                <h3 class="collapse-block-title mt-0">Kosher</h3>
                <div class="collection-collapse-block-content widget-scroll-inner">
                    <div id="searchKosherFilter" class="collection-Kosher-filter collection-brand-filter filtroAtributos" filtroUrl="Kosher"></div>
                </div>
            </div>
        `;

        renderSidebar(root, content, readState());
        bindInteractions(root);
        root.style.display = "";
    }

    window.PFSearchFilters = {
        readState,
        writeState,
        syncGroupValue,
    };

    document.addEventListener("DOMContentLoaded", init);
})();
