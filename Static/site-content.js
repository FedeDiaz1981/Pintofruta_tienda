(function () {
    const STORAGE_KEY = "pintofruta-static-site-content-v2";
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
                imageMobile: "Content/Images/Banners/pf-hero-01-mobile.jpg",
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
            cachedContent = deepMerge(deepMerge(baseContent, remote), local);
            cachedContent.heroSlides = mergeRecordsById(
                baseContent.heroSlides,
                mergeRecordsById(remote.heroSlides, local.heroSlides)
            );
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

    function normalizeNavigation(content) {
        const navigation = content && content.headerNavigation ? content.headerNavigation : {};
        const blockedIds = new Set(["diets", "promotions", "imported"]);
        const searchScopes = (Array.isArray(navigation.searchScopes) ? navigation.searchScopes : [])
            .filter((scope) => !blockedIds.has(String(scope.id || "").toLowerCase()));
        const sections = (Array.isArray(navigation.sections) ? navigation.sections : [])
            .filter((section) => !blockedIds.has(String(section.id || "").toLowerCase()));
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

    async function initHeroCarousel() {
        const content = await load();
        renderHeroCarousel(content);
        renderHomeSpotlightBanner(content);
        renderHeaderSearchScopes(content);
        renderHeaderNavigation(content);

        let lastMobileState = isMobileHeroViewport();
        window.addEventListener("resize", () => {
            const mobileState = isMobileHeroViewport();
            if (mobileState === lastMobileState) {
                return;
            }
            lastMobileState = mobileState;
            renderHeroCarousel(content);
            renderHomeSpotlightBanner(content);
            renderHeaderNavigation(content);
        });
    }

    window.PFContent = {
        load,
        save,
        get,
        renderHeroCarousel,
        renderHomeSpotlightBanner
    };

    document.addEventListener("DOMContentLoaded", initHeroCarousel);
    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        load(true).then((content) => {
            renderHeroCarousel(content);
            renderHomeSpotlightBanner(content);
            renderHeaderSearchScopes(content);
            renderHeaderNavigation(content);
        });
    });
})();
