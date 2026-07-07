(function () {
    const STORAGE_KEY = "pintofruta-static-site-content-v2";
    const DATA_URL = "data/site-content.json";
    const PROJECT_DB_NAME = "pintofruta-static-project";
    const PROJECT_DB_VERSION = 1;
    const PROJECT_STORE_NAME = "handles";
    const PROJECT_HANDLE_KEY = "root";
    const fallbackContent = {
        heroSlides: [
            {
                id: 1,
                order: 1,
                title: "Pintofruta",
                subtitle: "Contenido compartido desde un JSON estatica.",
                badge: "",
                image: "Content/Images/Banners/Banner SM 1.jpg",
                imageMobile: "Content/Images/Banners/pf-hero-01-mobile.jpg",
                link: "/Galeria/1015-sierra-de-los-padres",
                active: true
            }
        ]
    };
    const baseContent = window.PF_BASE_CONTENT || fallbackContent;

    let cachedPromise = null;
    let cachedContent = null;
    let cachedProjectRootHandle = null;

    const SERVER_BASE_URL = "http://127.0.0.1:8787";

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let index = 0; index < bytes.length; index += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
        }
        return btoa(binary);
    }

    async function serverFetch(path, options = {}) {
        const response = await fetch(`${SERVER_BASE_URL}${path}`, {
            mode: "cors",
            cache: "no-store",
            ...options,
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response;
    }

    function openProjectDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB no disponible"));
                return;
            }

            const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
                    db.createObjectStore(PROJECT_STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB"));
        });
    }

    async function getStoredProjectRootHandle() {
        if (cachedProjectRootHandle) {
            return cachedProjectRootHandle;
        }
        try {
            const db = await openProjectDb();
            const handle = await new Promise((resolve, reject) => {
                const transaction = db.transaction(PROJECT_STORE_NAME, "readonly");
                const store = transaction.objectStore(PROJECT_STORE_NAME);
                const request = store.get(PROJECT_HANDLE_KEY);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error || new Error("No se pudo leer el handle"));
            });
            db.close();
            if (!handle) {
                return null;
            }
            const permission = await handle.queryPermission({ mode: "readwrite" });
            if (permission === "granted") {
                cachedProjectRootHandle = handle;
                return handle;
            }
            const requested = await handle.requestPermission({ mode: "readwrite" });
            if (requested === "granted") {
                cachedProjectRootHandle = handle;
                return handle;
            }
        } catch {
            return null;
        }
        return null;
    }

    async function storeProjectRootHandle(handle) {
        if (!handle || !window.indexedDB) {
            return;
        }
        try {
            const db = await openProjectDb();
            await new Promise((resolve, reject) => {
                const transaction = db.transaction(PROJECT_STORE_NAME, "readwrite");
                const store = transaction.objectStore(PROJECT_STORE_NAME);
                const request = store.put(handle, PROJECT_HANDLE_KEY);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error || new Error("No se pudo guardar el handle"));
            });
            db.close();
            cachedProjectRootHandle = handle;
        } catch {
            /* ignore */
        }
    }

    async function ensureProjectRootHandle(promptForSelection = false) {
        return null;
    }

    async function getProjectFileHandle(pathSegments, create = false) {
        const rootHandle = await ensureProjectRootHandle(false);
        if (!rootHandle) {
            return null;
        }
        const segments = Array.isArray(pathSegments) ? pathSegments.filter(Boolean) : [];
        let currentHandle = rootHandle;
        for (let index = 0; index < segments.length - 1; index += 1) {
            currentHandle = await currentHandle.getDirectoryHandle(segments[index], { create });
        }
        const fileName = segments[segments.length - 1];
        if (!fileName) {
            return null;
        }
        return currentHandle.getFileHandle(fileName, { create });
    }

    async function writeProjectFile(pathSegments, file) {
        const segments = Array.isArray(pathSegments) ? pathSegments.filter(Boolean) : [];
        if (!segments.length) {
            throw new Error("Ruta invalida para guardar el archivo.");
        }
        const buffer = await file.arrayBuffer();
        const dataBase64 = arrayBufferToBase64(buffer);
        await serverFetch("/api/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: segments.join("/"),
                name: file.name || segments[segments.length - 1],
                mimeType: file.type || "application/octet-stream",
                dataBase64,
            }),
        });
        return segments.join("/");
    }

    async function readProjectContent() {
        try {
            const response = await serverFetch("/api/content");
            return await response.json();
        } catch {
            return null;
        }
    }

    function deepMerge(base, overlay) {
        if (Array.isArray(base) || Array.isArray(overlay)) {
            if (Array.isArray(overlay) && overlay.length) {
                return overlay;
            }
            return Array.isArray(base) ? base : [];
        }

        const result = { ...(base || {}) };
        Object.keys(overlay || {}).forEach((key) => {
            const baseValue = base ? base[key] : undefined;
            const overlayValue = overlay[key];
            if (overlayValue && typeof overlayValue === "object" && !Array.isArray(overlayValue) && baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)) {
                result[key] = deepMerge(baseValue, overlayValue);
            } else {
                result[key] = overlayValue;
            }
        });
        return result;
    }

    function mergeRecordsById(baseRecords, overlayRecords) {
        const baseList = Array.isArray(baseRecords) ? baseRecords : [];
        const overlayList = Array.isArray(overlayRecords) ? overlayRecords : [];
        if (!baseList.length && !overlayList.length) {
            return [];
        }

        const overlayById = new Map(
            overlayList
                .filter((item) => item && item.id !== undefined && item.id !== null)
                .map((item) => [item.id, item])
        );
        const merged = baseList.map((item) => {
            if (!item || item.id === undefined || item.id === null) {
                return item;
            }
            return overlayById.has(item.id) ? { ...item, ...overlayById.get(item.id) } : item;
        });

        overlayList.forEach((item) => {
            if (!item || item.id === undefined || item.id === null) {
                return;
            }
            if (!baseList.some((baseItem) => baseItem && baseItem.id === item.id)) {
                merged.push(item);
            }
        });

        return merged;
    }

    async function fetchJson() {
        if (window.location.protocol === "file:") {
            return null;
        }
        try {
            const response = await fetch(DATA_URL, { cache: "no-store" });
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch {
            return null;
        }
    }

    function readStoredContent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    async function load(forceReload = false) {
        if (forceReload) {
            cachedPromise = null;
        }

        if (cachedPromise) {
            return cachedPromise;
        }

        cachedPromise = (async () => {
            const remote = (await fetchJson()) || {};
            const local = readStoredContent() || {};
            const project = await readProjectContent();
            cachedContent = deepMerge(deepMerge(baseContent, remote), local);
            if (project) {
                cachedContent = deepMerge(cachedContent, project);
            }
            cachedContent.products = [project?.products, local.products, remote.products, baseContent.products]
                .find((list) => Array.isArray(list) && list.length)
                || [];
            cachedContent.brands = [project?.brands, local.brands, remote.brands, baseContent.brands]
                .find((list) => Array.isArray(list) && list.length)
                || [];
            cachedContent.categories = [project?.categories, local.categories, remote.categories, baseContent.categories]
                .find((list) => Array.isArray(list) && list.length)
                || [];
            cachedContent.headerNavigation = createHeaderNavigation(cachedContent);
            cachedContent.heroSlides = mergeRecordsById(
                baseContent.heroSlides,
                mergeRecordsById(remote.heroSlides, mergeRecordsById(local.heroSlides, project?.heroSlides))
            );
            return cachedContent;
        })();

        return cachedPromise;
    }

    function save(content) {
        cachedContent = content;
        const persistedContent = { ...(content || {}) };
        if (persistedContent.headerNavigation) {
            persistedContent.headerNavigation = {
                searchScopes: Array.isArray(persistedContent.headerNavigation.searchScopes) ? persistedContent.headerNavigation.searchScopes : [],
                sections: Array.isArray(persistedContent.headerNavigation.sections) ? persistedContent.headerNavigation.sections : [],
            };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedContent));
        writeProjectContent(persistedContent).catch(() => {});
    }

    async function writeProjectContent(content) {
        await serverFetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
    }

    function get() {
        return cachedContent;
    }

    function normalizeLink(link) {
        if (!link) {
            return "#";
        }
        if (/^(https?:)?\/\//i.test(link)) {
            return link;
        }
        if (window.location.protocol === "file:") {
            return link.replace(/^\//, "");
        }
        return link;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function isMobileHeroViewport() {
        return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function heroImageForViewport(slide) {
        if (!slide) {
            return "assets/images/metaimage.jpg";
        }
        if (isMobileHeroViewport() && slide.imageMobile) {
            return slide.imageMobile;
        }
        return slide.image || "assets/images/metaimage.jpg";
    }

    function cleanBrandName(value) {
        const text = String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .replace(/\bSIN STOCK\b/ig, "")
            .trim();
        const tokens = text.split(" ").filter(Boolean);
        if (!tokens.length) {
            return "";
        }
        const kept = [];
        for (const token of tokens) {
            if (/^[a-z]/.test(token)) {
                break;
            }
            kept.push(token);
        }
        return (kept.length ? kept : tokens.slice(0, 1)).join(" ").trim();
    }

    function cleanDisplayName(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .replace(/\bSIN STOCK\b/ig, "")
            .trim();
    }

    function letterBucket(value) {
        const first = cleanBrandName(value).charAt(0).toUpperCase();
        const groups = [
            ["A", "B"],
            ["C", "D"],
            ["E", "F"],
            ["G", "H"],
            ["I", "J"],
            ["K", "L"],
            ["M", "N"],
            ["O", "P"],
            ["Q", "R"],
            ["S", "T"],
            ["U", "V"],
            ["W", "X"],
            ["Y", "Z"]
        ];
        const found = groups.find((group) => group.includes(first));
        return found ? `${found[0]}-${found[1]}` : "Y-Z";
    }

    function buildBucketedGroups(values) {
        const groupOrder = [
            "A-B", "C-D", "E-F", "G-H", "I-J", "K-L", "M-N", "O-P", "Q-R", "S-T", "U-V", "W-X", "Y-Z"
        ];
        return groupOrder.map((bucket) => ({
            id: bucket.toLowerCase(),
            label: bucket,
            href: "#",
            items: values
                .filter((value) => letterBucket(value) === bucket)
                .map((value) => {
                    const slug = String(value || "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-zA-Z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .toLowerCase();
                    return {
                        id: slug,
                        label: value,
                        href: `#${slug}`,
                    };
                }),
        }));
    }

    function buildNavigationSection(sectionId, label, values, icon, cleaner = cleanBrandName) {
        const cleanedValues = [];
        const seen = new Set();
        values.forEach((value) => {
            const cleaned = cleaner(value);
            if (!cleaned || seen.has(cleaned)) {
                return;
            }
            seen.add(cleaned);
            cleanedValues.push(cleaned);
        });
        cleanedValues.sort((a, b) => cleanBrandName(a).localeCompare(cleanBrandName(b), "es", { sensitivity: "base" }));

        return {
            id: sectionId,
            label,
            icon,
            href: `#${sectionId === "products" ? "1-productos" : "2-marcas"}`,
            groups: buildBucketedGroups(cleanedValues),
        };
    }

    function createHeaderNavigation(content) {
        const products = Array.isArray(content && content.products) ? content.products : [];
        const productNames = [];
        const brands = [];
        const seenProducts = new Set();
        const seenBrands = new Set();

        products.forEach((product) => {
            const productLabel = cleanBrandName(product && (product.detail || product.name || ""));
            if (productLabel && !seenProducts.has(productLabel)) {
                seenProducts.add(productLabel);
                productNames.push(productLabel);
            }

            const brand = cleanBrandName(product && product.brand);
            if (!brand || seenBrands.has(brand)) {
                return;
            }
            seenBrands.add(brand);
            brands.push(brand);
        });

        const sections = [
            buildNavigationSection("products", "PRODUCTOS", productNames, "Content/Iconos/CATEGORIAS.png", cleanDisplayName),
            buildNavigationSection("brands", "MARCAS", brands, "Content/Iconos/MARCAS.png")
        ].filter((section) => section.groups.length);

        return {
            searchScopes: sections.map((section) => ({
                id: section.id,
                label: section.label,
                href: section.href
            })),
            sections,
            sectionsById: new Map(sections.map((section) => [String(section.id), section]))
        };
    }

    function renderHeroCarousel(content) {
        const root = document.getElementById("carouselExampleCaptions");
        if (!root || !content || !Array.isArray(content.heroSlides)) {
            return;
        }

        const slides = content.heroSlides
            .filter((slide) => slide && slide.active !== false)
            .slice()
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

        if (!slides.length) {
            return;
        }

        const indicators = root.querySelector(".carousel-indicators");
        const inner = root.querySelector(".carousel-inner");
        if (!indicators || !inner) {
            return;
        }

        indicators.innerHTML = slides.map((slide, index) => (
            `<li data-target="#carouselExampleCaptions" data-slide-to="${index}" class="${index === 0 ? "active" : ""}"></li>`
        )).join("");

        inner.innerHTML = slides.map((slide, index) => {
            const link = normalizeLink(slide.link);
            const image = heroImageForViewport(slide);
            return `
                <div class="carousel-item ${index === 0 ? "active" : ""} hero-slide-${slide.id}">
                    <a href="${escapeHtml(link)}">
                        <img src="${escapeHtml(image)}" class="d-block w-100" alt="${escapeHtml(slide.title || "Hero slide")}">
                    </a>
                </div>
            `;
        }).join("");

        if (window.jQuery && window.jQuery.fn && window.jQuery.fn.carousel) {
            window.jQuery(root).carousel("pause");
        }
    }

    function renderHomeSpotlightBanner(content) {
        const root = document.querySelector(".deal-banner2");
        if (!root || !content || !Array.isArray(content.heroSlides)) {
            return;
        }

        const slides = content.heroSlides
            .filter((slide) => slide && slide.active !== false)
            .slice()
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

        if (!slides.length) {
            return;
        }

        const selected = slides.find((slide) => slide.homeSpotlight || slide.highlightHome || slide.featuredHome) || slides[0];
        if (!selected) {
            return;
        }

        const link = normalizeLink(selected.link || "galeria.html");
        const image = heroImageForViewport(selected);

        root.innerHTML = `
            <a class="deal-banner-link" href="${escapeHtml(link)}" data-hero-spotlight="${escapeHtml(String(selected.id || ""))}">
                <img src="${escapeHtml(image)}" class="img-fluid w-100" alt="${escapeHtml(selected.title || "Banner destacado")}">
            </a>
        `;
    }

    function renderFeaturedProducts(content) {
        const root = document.querySelector(".product-slide-6");
        if (!root || !content || !Array.isArray(content.products)) {
            return;
        }

        const products = content.products
            .filter((product) => product && product.featured && product.status !== "hidden")
            .slice();
        const host = root.parentElement;
        if (!host) {
            return;
        }

        let liveGrid = document.getElementById("featuredProductsLive");
        if (!liveGrid) {
            liveGrid = document.createElement("div");
            liveGrid.id = "featuredProductsLive";
            liveGrid.style.display = "grid";
            liveGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(140px, 1fr))";
            liveGrid.style.gap = "12px";
            liveGrid.style.margin = "10px 0 4px";
            liveGrid.style.alignItems = "stretch";
            host.insertBefore(liveGrid, root);
        }

        if (!products.length) {
            liveGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <strong>No hay productos destacados</strong>
                    <p>Marcá productos como destacados desde el panel de productos para que aparezcan acá.</p>
                </div>
            `;
            root.style.display = "none";
            return;
        }

        liveGrid.style.display = "grid";
        liveGrid.innerHTML = products.map((product) => {
            const category = (content.categories || []).find((item) => Number(item.id) === Number(product.categoryId));
            const detailLink = normalizeLink(`detallearticulo.html?sku=${encodeURIComponent(String(product.sku || "").toUpperCase())}`);
            const image = product.image || "assets/images/metaimage.jpg";
            const publicPrice = Number(product.publicPrice || 0);
            const memberPrice = Number(product.memberPrice || publicPrice);
            const priceText = new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
            }).format(publicPrice);
            const memberText = new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
            }).format(memberPrice);

            return `
                <article class="product-card" style="border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 8px 18px rgba(31,42,68,.08); border: 1px solid rgba(31,42,68,.08); max-width: 190px;">
                    <section data-ga-id="${escapeHtml(product.sku || product.id || "")}" data-ga-name="${escapeHtml(product.detail || product.name || "")}" data-ga-brand="${escapeHtml(product.brand || "")}">
                        <a href="${escapeHtml(detailLink)}" data-open-product-detail="1" data-product-sku="${escapeHtml(String(product.sku || "").toUpperCase())}" style="display:block; background:#fff;">
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(product.detail || product.name || product.sku || "Producto destacado")}" style="width:100%; height:130px; object-fit: contain; display:block; background:#fff; padding:8px;">
                        </a>
                        <div style="padding: 10px 11px 12px;">
                            <div style="font-size: 10px; letter-spacing: .10em; text-transform: uppercase; color: #7a6a56; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(product.brand || "")}</div>
                            <h3 style="margin: 0 0 4px; font-size: 13px; line-height: 1.2; color: #1f2a44; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(product.detail || product.name || "")}</h3>
                            <div style="font-size: 11px; color: #6d7380; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(category ? category.name : "Sin categoria")}</div>
                            <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px;">
                                <strong style="font-size: 13px; color: #1f2a44;">${escapeHtml(priceText)}</strong>
                                <span style="font-size: 10px; color: #7c8596;">${escapeHtml(memberText)}</span>
                            </div>
                        </div>
                    </section>
                </article>
            `;
        }).join("");

        root.style.display = "none";
    }

    function renderFeaturedBrands(content) {
        const root = document.getElementById("featuredBrandsGrid");
        const empty = document.getElementById("featuredBrandsEmpty");
        if (!root || !empty || !content || !Array.isArray(content.brands)) {
            return;
        }

        const brands = content.brands
            .filter((brand) => brand && brand.featured && String(brand.image || "").trim())
            .slice();

        if (!brands.length) {
            root.innerHTML = "";
            empty.style.display = "block";
            empty.textContent = "No hay marcas destacadas cargadas.";
            return;
        }

        empty.style.display = "none";
        root.innerHTML = brands.map((brand) => `
            <article class="brand-logo-card">
                <div class="brand-logo-card__media">
                    <img src="${escapeHtml(brand.image)}" alt="${escapeHtml(brand.name || brand.code || "Marca destacada")}">
                </div>
            </article>
        `).join("");
    }

    function normalizeNavigation(content) {
        const generatedNavigation = createHeaderNavigation(content);
        if (generatedNavigation.sections.length) {
            return generatedNavigation;
        }

        const navigation = content && content.headerNavigation ? content.headerNavigation : {};
        const searchScopes = Array.isArray(navigation.searchScopes) ? navigation.searchScopes : [];
        const sections = Array.isArray(navigation.sections) ? navigation.sections : [];
        const sectionsById = new Map(sections.filter((section) => section && section.id !== undefined && section.id !== null).map((section) => [String(section.id), section]));

        return { searchScopes, sections, sectionsById };
    }

    function makeMenuKey(value) {
        return String(value || "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toUpperCase();
    }

    function renderHeaderSearchScopes(content) {
        const select = document.getElementById("subMenuIdString");
        const scopes = normalizeNavigation(content).searchScopes;

        if (!select || !scopes || !scopes.length) {
            return;
        }

        const currentValue = select.value;
        select.innerHTML = [
            '<option value="">Toda la web</option>',
            ...scopes.map((scope) => `<option value="${escapeHtml(scope.id || "")}">${escapeHtml(scope.label || "")}</option>`)
        ].join("");

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function buildDesktopSectionMenu(section) {
        const groups = Array.isArray(section.groups) ? section.groups : [];

        return `
            <li class="mega mega-desktop">
                <a class="has-submenu" href="${escapeHtml(section.href || "#")}">
                    ${section.icon ? `<img src="${escapeHtml(section.icon)}" alt="${escapeHtml(section.label || "")}">` : ""}
                    ${escapeHtml(section.label || "")}
                </a>
                <ul class="mega-menu full-mega-menu ratio_landscape sm-nowrap megamenu-container" style="z-index:10;">
                    <li>
                        <div class="container">
                            <div class="row">
                                <div class="col-xl-2 p-3 p-xl-5 titulos-cats">
                                    <span style="border-bottom: solid 1px black; padding-bottom: 10px; margin-bottom: 20px; display: block; width: 110px;">
                                        ${escapeHtml(section.label || "")}
                                    </span>
                                    ${groups.map((group) => `
                                        <a class="menu-title" href="${escapeHtml(group.href || "#")}" data-title="${escapeHtml(`${makeMenuKey(section.id)}-${makeMenuKey(group.id)}`)}">
                                            ${escapeHtml(group.label || "")}
                                        </a>
                                    `).join("")}
                                </div>
                                <div class="col-xl-10 p-3 p-xl-5" style="background: #F3F3F3;">
                                    <span style="border-bottom: solid 1px black; padding-bottom: 10px; margin-bottom: 20px; display: block; width: 110px;">
                                        EXPLORAR
                                    </span>
                                    <div class="menu-explorar">
                                        ${groups.map((group, index) => `
                                            <div class="menu-content" id="content-${escapeHtml(`${makeMenuKey(section.id)}-${makeMenuKey(group.id)}`)}" style="${index === 0 ? "" : "display:none;"}">
                                                ${(Array.isArray(group.items) && group.items.length ? group.items : [{ label: group.label || "", href: group.href || "#" }]).map((item) => `
                                                    <a href="${escapeHtml(item.href || "#")}">${escapeHtml(item.label || "")}</a>
                                                `).join("")}
                                            </div>
                                        `).join("")}
                                        <div class="mensaje-inicial">
                                            <i class="fa-solid fa-arrow-left mr-3"></i> Selecciona una sección de la izquierda para ver sus items
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </li>
        `;
    }

    function buildMobileSectionMenu(section) {
        const groups = Array.isArray(section.groups) ? section.groups : [];

        return `
            <li class="mega mega-mobile">
                <a class="has-submenu" href="${escapeHtml(section.href || "#")}">
                    ${section.icon ? `<img src="${escapeHtml(section.icon)}" alt="${escapeHtml(section.label || "")}">` : ""}
                    ${escapeHtml(section.label || "")}
                </a>
                <ul class="mega-menu full-mega-menu ratio_landscape sm-nowrap megamenu-container" style="z-index:10;">
                    <li>
                        <div class="container">
                            <div class="row">
                                ${groups.map((group) => `
                                    <div class="col-12 col-megamenu mega-box">
                                        <div class="link-section">
                                            <div class="menu-title">
                                                <h5><a class="menu-title" href="${escapeHtml(group.href || "#")}">${escapeHtml(group.label || "")}</a></h5>
                                            </div>
                                            <div class="menu-content">
                                                <ul>
                                                    ${(Array.isArray(group.items) && group.items.length ? group.items : [{ label: group.label || "", href: group.href || "#" }]).map((item) => `
                                                        <li><a href="${escapeHtml(item.href || "#")}">${escapeHtml(item.label || "")}</a></li>
                                                    `).join("")}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    </li>
                </ul>
            </li>
        `;
    }

    function openGalleryFromHash(href) {
        const hash = String(href || "").trim();
        if (!hash || !hash.startsWith("#")) {
            return false;
        }

        const slug = hash.slice(1);
        if (!slug) {
            return false;
        }

        window.location.href = `galeria.html?source=/Galeria/${encodeURIComponent(slug)}`;
        return true;
    }

    function bindHeaderNavigationInteractions(root) {
        if (!root) {
            return;
        }

        root.querySelectorAll(".menu-explorar").forEach((menu) => {
            let currentContent = null;
            let currentLink = null;
            const isTouchMenu = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
            const links = menu.closest('.row').querySelectorAll('.menu-title[data-title]');
            const mensajeInicial = menu.querySelector('.mensaje-inicial');

            const activateLink = function (link, event) {
                const menuTitle = link.getAttribute('data-title');
                const newContent = menu.querySelector('#content-' + menuTitle);

                if (currentLink === link && currentContent === newContent) {
                    if (currentContent) {
                        currentContent.style.display = 'none';
                        currentContent.classList.remove('active');
                    }
                    currentContent = null;
                    currentLink = null;

                    link.classList.remove('active');

                    if (mensajeInicial) {
                        mensajeInicial.style.display = 'block';
                    }

                    if (event) {
                        event.preventDefault();
                    }

                    return false;
                }

                if (currentContent && currentContent !== newContent) {
                    currentContent.style.display = 'none';
                    currentContent.classList.remove('active');
                }

                if (currentLink && currentLink !== link) {
                    currentLink.classList.remove('active');
                }

                if (newContent) {
                    newContent.style.display = 'block';
                    newContent.classList.add('active');
                    currentContent = newContent;
                }

                link.classList.add('active');
                currentLink = link;

                if (mensajeInicial) {
                    mensajeInicial.style.display = 'none';
                }

                if (event) {
                    event.preventDefault();
                }

                return true;
            };

            links.forEach((link) => {
                if (!isTouchMenu) {
                    link.addEventListener('mouseover', function (e) {
                        activateLink(link, e);
                    });
                }

                link.addEventListener('click', function (e) {
                    const opened = activateLink(link, e);
                    if (opened) {
                        openGalleryFromHash(link.getAttribute('href'));
                    }
                });
            });
        });

        root.addEventListener('click', function (event) {
            const link = event.target.closest('a[href^="#"]:not(.has-submenu)');
            if (!link || !root.contains(link)) {
                return;
            }

            if (openGalleryFromHash(link.getAttribute('href'))) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

    function renderHeaderNavigation(content) {
        const root = document.getElementById("main-menu");
        const navigation = normalizeNavigation(content);

        if (!root || (!navigation.searchScopes.length && !navigation.sections.length)) {
            return;
        }

        const sectionsById = navigation.sectionsById;
        const orderedSections = navigation.searchScopes
            .map((scope) => sectionsById.get(String(scope.id)))
            .filter(Boolean);
        const fallbackSections = navigation.sections.filter((section) => !orderedSections.includes(section));
        const sections = [...orderedSections, ...fallbackSections];

        root.innerHTML = [
            '<li>',
            '  <div class="mobile-back text-right">Volver<i class="fa fa-angle-right pl-2" aria-hidden="true"></i></div>',
            '</li>',
            '<li class="mobile-admin">',
            '  <a href="admin-demo.html" class="mobile-admin-link">',
            '    <i class="fas fa-user-shield"></i>',
            '    Ir a admin',
            '  </a>',
            '</li>',
            ...sections.map((section) => buildDesktopSectionMenu(section)),
            ...sections.map((section) => buildMobileSectionMenu(section)),
        ].join("");

        bindHeaderNavigationInteractions(root);
    }

    function hideExtraPublicProducts(limit = 15) {
        const selectors = [
            ".articulos_destacados",
            ".articulos_destacados_categorias",
            ".search_result"
        ];
        const nodes = Array.from(document.querySelectorAll(selectors.join(",")));
        if (!nodes.length) {
            return;
        }

        nodes.forEach((node, index) => {
            if (index < limit) {
                return;
            }

            const target = node.classList.contains("search_result")
                ? (node.closest(".col-grid-box") || node)
                : node;

            target.style.display = "none";
            target.setAttribute("aria-hidden", "true");
        });
    }

    async function initHeroCarousel() {
        const content = await load();
        renderHeroCarousel(content);
        renderHomeSpotlightBanner(content);
        renderFeaturedProducts(content);
        renderFeaturedBrands(content);
        renderHeaderSearchScopes(content);
        renderHeaderNavigation(content);
        hideExtraPublicProducts(15);

        let lastMobileState = isMobileHeroViewport();
        window.addEventListener("resize", () => {
            const mobileState = isMobileHeroViewport();
            if (mobileState === lastMobileState) {
                return;
            }
            lastMobileState = mobileState;
            renderHeroCarousel(content);
            renderHomeSpotlightBanner(content);
            renderFeaturedProducts(content);
            renderFeaturedBrands(content);
            renderHeaderNavigation(content);
            hideExtraPublicProducts(15);
        });
    }

    window.PFContent = {
        load,
        save,
        get,
        renderHeroCarousel,
        renderHomeSpotlightBanner,
        ensureProjectRootHandle,
        writeProjectFile,
    };

    document.addEventListener("DOMContentLoaded", initHeroCarousel);
    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        load(true).then((content) => {
            renderHeroCarousel(content);
            renderHomeSpotlightBanner(content);
            renderFeaturedProducts(content);
            renderFeaturedBrands(content);
            renderHeaderSearchScopes(content);
            renderHeaderNavigation(content);
            hideExtraPublicProducts(15);
        });
    });
})();
