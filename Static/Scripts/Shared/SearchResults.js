(function () {
    const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#f4ebdd"/>
                    <stop offset="100%" stop-color="#fcfaf6"/>
                </linearGradient>
                <linearGradient id="sage" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#7ea58a"/>
                    <stop offset="100%" stop-color="#4b7b64"/>
                </linearGradient>
            </defs>
            <rect width="800" height="800" rx="44" fill="url(#bg)"/>
            <path d="M0 0C120 40 120 160 0 240V0Z" fill="#c7dccb" opacity=".9"/>
            <path d="M800 800C680 760 680 640 800 560V800Z" fill="#d7a56d" opacity=".34"/>
            <path d="M248 260h304a28 28 0 0 1 28 28v248a28 28 0 0 1-28 28H248a28 28 0 0 1-28-28V288a28 28 0 0 1 28-28z" fill="#fffdf8" stroke="#9cad98" stroke-width="14"/>
            <circle cx="332" cy="360" r="52" fill="#d7a56d" opacity=".45"/>
            <path d="M292 532l70-74 60 58 56-52 78 68" fill="none" stroke="url(#sage)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M304 560L520 344" fill="none" stroke="#d7a56d" stroke-width="16" stroke-linecap="round"/>
            <path d="M276 252l98-108M524 252l88-92" fill="none" stroke="#7ea58a" stroke-width="8" stroke-linecap="round" opacity=".45"/>
            <text x="400" y="686" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="8" fill="#5c7d66">NO IMAGE</text>
        </svg>
    `);
    const FILTER_STATE_KEY = "pintofruta-search-filters-v1";

    let currentContent = null;

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

    function isTruthyValue(value) {
        if (value == null || value === "") {
            return false;
        }

        const normalized = normalizeText(value);
        return normalized !== "0" && normalized !== "false" && normalized !== "no" && normalized !== "null";
    }

    function uniqueBySku(products) {
        const seen = new Set();
        return (Array.isArray(products) ? products : []).filter((product) => {
            const key = String(product && (product.sku || product.id || product.name || "")).trim().toUpperCase();
            if (!key || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    function tokenizeQuery(query) {
        return normalizeText(query)
            .split(/\s+/)
            .map((term) => term.trim())
            .filter(Boolean);
    }

    function matchesTerms(text, terms) {
        if (!terms.length) {
            return true;
        }

        const haystack = normalizeText(text);
        if (!haystack) {
            return false;
        }

        return terms.every((term) => haystack.includes(term));
    }

    function getCategoryName(content, product) {
        const category = (content.categories || []).find((item) => Number(item.id) === Number(product.categoryId));
        return category ? category.name : "";
    }

    function getPrice(product) {
        const isAuthenticated = window.PFAuth && typeof window.PFAuth.isAuthenticated === "function" && window.PFAuth.isAuthenticated();
        const displayPrice = isAuthenticated ? Number(product.memberPrice || product.publicPrice || 0) : Number(product.publicPrice || 0);
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(displayPrice);
    }

    function getDetailLink(product) {
        return `detallearticulo.html?sku=${encodeURIComponent(String(product.sku || "").toUpperCase())}`;
    }

    function getImage(product) {
        const image = String(product && product.image ? product.image : "").trim();
        return isMissingImage(image) ? FALLBACK_IMAGE : image;
    }

    function isMissingImage(image) {
        const normalized = normalizeText(image);
        return !image || normalized.includes("metaimage.jpg") || normalized.includes("green&co") || normalized.includes("greenco");
    }

    function readFilterState() {
        try {
            const raw = localStorage.getItem(FILTER_STATE_KEY);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return normalizeFilterState(parsed);
        } catch {
            return [];
        }
    }

    function normalizeFilterState(state) {
        return (Array.isArray(state) ? state : [])
            .map((token) => ({
                type: String(token?.type || "").trim(),
                values: Array.isArray(token?.values) ? token.values.map((value) => String(value).trim()).filter(Boolean) : [],
            }))
            .filter((token) => token.type && token.values.length);
    }

    function parseFilterStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const tokens = [];

        const push = (type, values) => {
            const cleaned = values.map((value) => String(value).trim()).filter(Boolean);
            if (cleaned.length) {
                tokens.push({ type, values: cleaned });
            }
        };

        push("brand", String(params.get("Marca") || "").split(","));
        push("category", String(params.get("Categoria") || "").split(","));
        if (params.get("Vegano")) {
            push("vegano", ["1"]);
        }
        if (params.get("Kosher")) {
            push("kosher", ["1"]);
        }

        return tokens;
    }

    function getFilterState() {
        const stored = readFilterState();
        if (stored.length) {
            return stored;
        }
        return normalizeFilterState(parseFilterStateFromUrl());
    }

    function buildBrandAliasSet(content, selectedValues) {
        const brands = Array.isArray(content?.brands) ? content.brands : [];
        const aliasSet = new Set();

        selectedValues.forEach((value) => {
            const normalized = normalizeText(value);
            const brand = brands.find((item) => {
                const keys = [item?.id, item?.code, item?.name].map(normalizeText).filter(Boolean);
                return keys.includes(normalized);
            });

            if (brand) {
                [brand.id, brand.code, brand.name].map(normalizeText).filter(Boolean).forEach((alias) => aliasSet.add(alias));
            } else if (normalized) {
                aliasSet.add(normalized);
            }
        });

        return aliasSet;
    }

    function applyOrderedFilter(content, products, token) {
        if (!token || !token.type || !token.values.length) {
            return products;
        }

        if (token.type === "brand") {
            const aliases = buildBrandAliasSet(content, token.values);
            return products.filter((product) => aliases.has(normalizeText(product.brand || "")));
        }

        if (token.type === "category") {
            const selected = new Set(token.values.map((value) => String(value)));
            return products.filter((product) => selected.has(String(product.categoryId)));
        }

        if (token.type === "vegano") {
            return products.filter((product) => isTruthyValue(product.vegano));
        }

        if (token.type === "kosher") {
            return products.filter((product) => isTruthyValue(product.kosher));
        }

        return products;
    }

    function applySidebarFilters(content, baseProducts, filterState) {
        return filterState.reduce((currentProducts, token) => {
            return applyOrderedFilter(content, currentProducts, token);
        }, baseProducts);
    }

    function collectBaseSearchResults(content, query, scope) {
        const products = Array.isArray(content.products) ? content.products.filter((product) => product && product.status !== "hidden") : [];
        const brands = Array.isArray(content.brands) ? content.brands : [];
        const categories = Array.isArray(content.categories) ? content.categories.filter((category) => category && category.visible !== false) : [];
        const terms = tokenizeQuery(query);

        if (scope === "categories") {
            if (!terms.length) {
                return uniqueBySku(products);
            }

            const matchedCategories = categories.filter((category) => matchesTerms(`${category.name || ""} ${category.slug || ""}`, terms));
            const matchedCategoryProducts = matchedCategories.reduce((accumulator, category) => accumulator.concat(products.filter((product) => Number(product.categoryId) === Number(category.id))), []);

            return uniqueBySku(matchedCategoryProducts);
        }

        if (scope === "products") {
            if (!terms.length) {
                return uniqueBySku(products);
            }

            return uniqueBySku(products.filter((product) =>
                matchesTerms(`${product.name || ""} ${product.detail || ""} ${product.description || ""} ${product.brand || ""} ${getCategoryName(content, product)}`, terms)
            ));
        }

        if (scope === "brands") {
            if (!terms.length) {
                return uniqueBySku(products);
            }

            const matchedBrands = brands.filter((brand) => matchesTerms(`${brand.name || ""} ${brand.code || ""}`, terms));
            const matchedBrandProducts = matchedBrands.reduce((accumulator, brand) => {
                const aliases = [brand.id, brand.code, brand.name].map(normalizeText).filter(Boolean);
                return accumulator.concat(products.filter((product) => aliases.includes(normalizeText(product.brand || ""))));
            }, []);

            return uniqueBySku(matchedBrandProducts);
        }

        if (!terms.length) {
            return uniqueBySku(products);
        }

        const directProductMatches = products.filter((product) =>
            matchesTerms(`${product.name || ""} ${product.detail || ""} ${product.description || ""} ${product.brand || ""} ${getCategoryName(content, product)}`, terms)
        );

        const matchedBrandProducts = brands
            .filter((brand) => matchesTerms(`${brand.name || ""} ${brand.code || ""}`, terms))
            .reduce((accumulator, brand) => {
                const aliases = [brand.id, brand.code, brand.name].map(normalizeText).filter(Boolean);
                return accumulator.concat(products.filter((product) => aliases.includes(normalizeText(product.brand || ""))));
            }, []);

        const matchedCategoryProducts = categories
            .filter((category) => matchesTerms(`${category.name || ""} ${category.slug || ""}`, terms))
            .reduce((accumulator, category) => accumulator.concat(products.filter((product) => Number(product.categoryId) === Number(category.id))), []);

        return uniqueBySku([
            ...directProductMatches,
            ...matchedBrandProducts,
            ...matchedCategoryProducts,
        ]);
    }

    function buildResultCard(content, product) {
        const categoryName = getCategoryName(content, product) || "Sin categoria";
        const image = getImage(product);
        const hasImage = !isMissingImage(image);
        const price = getPrice(product);
        const alt = product.detail || product.name || product.sku || "Producto";

        return `
            <div class="col-lg-3 col-md-4 col-6 col-grid-box">
                <article class="pf-search-card product addtocart_count search_result">
                    <section data-ga-id="${escapeHtml(product.sku || product.id || "")}" data-ga-name="${escapeHtml(product.detail || product.name || "")}" data-ga-brand="${escapeHtml(product.brand || "")}">
                        <a class="pf-search-link" href="${escapeHtml(getDetailLink(product))}" data-open-product-detail="1" data-product-sku="${escapeHtml(String(product.sku || "").toUpperCase())}">
                            ${
                                hasImage
                                    ? `<img class="pf-search-image" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">`
                                    : `<div class="pf-search-placeholder"><i class="fa fa-image" aria-hidden="true"></i><span>No image</span></div>`
                            }
                        </a>
                        <div class="pf-search-body">
                            <div class="pf-search-brand">${escapeHtml(product.brand || "")}</div>
                            <h3 class="pf-search-name">${escapeHtml(product.detail || product.name || "")}</h3>
                            <div class="pf-search-category">${escapeHtml(categoryName)}</div>
                            <div class="pf-search-meta">
                                <strong class="pf-search-price">${escapeHtml(price)}</strong>
                            </div>
                        </div>
                    </section>
                </article>
            </div>
        `;
    }

    function buildEmptyState(message) {
        return `
            <div class="col-12">
                <div class="search-empty-state card border-0 shadow-sm p-4 text-center">
                    <strong>${escapeHtml(message)}</strong>
                    <p class="mb-0 mt-2 text-muted">Probá con el nombre de un producto, marca o categoría.</p>
                </div>
            </div>
        `;
    }

    function updateSummary(summaryText) {
        const summaryTarget = document.querySelector(".collection-product-wrapper");
        if (!summaryTarget) {
            return;
        }

        let summary = summaryTarget.querySelector(".pf-search-summary");
        if (!summary) {
            summary = document.createElement("div");
            summary.className = "pf-search-summary";
            const grid = summaryTarget.querySelector(".product-wrapper-grid");
            if (grid && grid.parentElement === summaryTarget) {
                summaryTarget.insertBefore(summary, grid);
            } else {
                summaryTarget.appendChild(summary);
            }
        }

        summary.textContent = summaryText;
    }

    function updateAnalytics(results) {
        if (!window.GoogleAnalytics4 || typeof window.GoogleAnalytics4.viewItemList !== "function") {
            return;
        }

        const items = results.map((product) => {
            const section = document.createElement("section");
            section.setAttribute("data-ga-id", product.sku || product.id || "");
            section.setAttribute("data-ga-name", product.detail || product.name || "");
            section.setAttribute("data-ga-brand", product.brand || "");
            return window.GoogleAnalytics4.getItem(window.jQuery ? window.jQuery(section) : section);
        });

        window.GoogleAnalytics4.viewItemList(items, "Search Result", "search_result");
    }

    function getScope(params) {
        const raw = String(params.get("subMenuIdString") || "").trim().toLowerCase();
        if (raw === "brands" || raw === "marcas") {
            return "brands";
        }
        if (raw === "categories" || raw === "categorias") {
            return "categories";
        }
        if (raw === "products" || raw === "productos") {
            return "products";
        }
        return "all";
    }

    function markSearchInputs(query) {
        document.querySelectorAll('input[name="valorBusqueda"]').forEach((input) => {
            if (input && input.value !== query) {
                input.value = query;
            }
        });
    }

    function markScopeSelects(scopeValue) {
        document.querySelectorAll('select[name="subMenuIdString"], .categoriaBusqueda').forEach((select) => {
            if (select && select.value !== scopeValue) {
                select.value = scopeValue;
            }
        });
    }

    function render(content) {
        const root = document.getElementById("contenedorArticulos");
        if (!root) {
            return;
        }

        currentContent = content || currentContent || window.PF_BASE_CONTENT || {};

        const params = new URLSearchParams(window.location.search);
        const query = String(params.get("valorBusqueda") || "").trim();
        const scope = getScope(params);
        const baseProducts = collectBaseSearchResults(currentContent, query, scope);
        const filteredProducts = applySidebarFilters(currentContent, baseProducts, getFilterState());

        markSearchInputs(query);
        markScopeSelects(scope === "all" ? "" : scope);

        if (!filteredProducts.length) {
            root.innerHTML = buildEmptyState("No encontramos resultados para tu búsqueda.");
        } else {
            root.innerHTML = filteredProducts.map((product) => buildResultCard(currentContent, product)).join("");
        }

        const summaryText = query
            ? `Resultados para "${query}" en ${scope === "all" ? "toda la web" : scope === "brands" ? "marcas" : scope === "categories" ? "categorías" : "productos"}`
            : `Mostrando ${filteredProducts.length} producto${filteredProducts.length === 1 ? "" : "s"}`;
        updateSummary(summaryText);
        updateAnalytics(filteredProducts);

        if (window.Galeria && typeof window.Galeria.init === "function") {
            window.Galeria.init();
        }

        window.hasReachedEndOfInfiniteScroll = true;
        window.page = -1;
    }

    function renderCurrent() {
        if (currentContent) {
            render(currentContent);
            return;
        }

        if (window.PFContent && typeof window.PFContent.load === "function") {
            window.PFContent.load().then((content) => {
                currentContent = content || currentContent;
                render(currentContent);
            }).catch(() => {
                render(window.PF_BASE_CONTENT || {});
            });
            return;
        }

        render(window.PF_BASE_CONTENT || {});
    }

    async function init() {
        const root = document.getElementById("contenedorArticulos");
        if (!root) {
            return;
        }

        root.innerHTML = buildEmptyState("Buscando en el catalogo...");

        try {
            if (window.PFContent && typeof window.PFContent.load === "function") {
                currentContent = await window.PFContent.load();
            } else {
                currentContent = window.PF_BASE_CONTENT || {};
            }
        } catch (error) {
            console.warn("No se pudo cargar el contenido para la busqueda.", error);
            currentContent = window.PF_BASE_CONTENT || {};
        }

        render(currentContent);
    }

    window.PFSearchResults = {
        renderCurrent,
    };

    document.addEventListener("DOMContentLoaded", init);
    window.addEventListener("pf-search-filters-change", renderCurrent);
})();
