(function () {
    const STORAGE_KEY = "pintofruta-static-site-content-v1";
    const DATA_URL = "data/site-content.json";
    const fallbackContent = {
        heroSlides: [
            {
                id: 1,
                order: 1,
                title: "Pintofruta",
                subtitle: "Contenido compartido desde un JSON estatica.",
                badge: "",
                image: "Content/Images/Banners/Banner SM 1.jpg",
                link: "/Galeria/1015-sierra-de-los-padres",
                active: true
            }
        ]
    };
    const baseContent = window.PF_BASE_CONTENT || fallbackContent;

    let cachedPromise = null;
    let cachedContent = null;

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
            cachedContent = deepMerge(deepMerge(baseContent, remote), local);
            return cachedContent;
        })();

        return cachedPromise;
    }

    function save(content) {
        cachedContent = content;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
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
            const image = slide.image || "assets/images/metaimage.jpg";
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

    function renderHeaderSearchScopes(content) {
        const select = document.getElementById("subMenuIdString");
        const scopes = content && content.headerNavigation && Array.isArray(content.headerNavigation.searchScopes)
            ? content.headerNavigation.searchScopes
            : null;

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

    async function initHeroCarousel() {
        const content = await load();
        renderHeroCarousel(content);
        renderHeaderSearchScopes(content);
    }

    window.PFContent = {
        load,
        save,
        get,
        renderHeroCarousel
    };

    document.addEventListener("DOMContentLoaded", initHeroCarousel);
    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        load(true).then(renderHeroCarousel);
    });
})();
