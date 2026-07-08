(function () {
    const money = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    });

    const galleryPresets = {
        "1-categorias": {
            title: "Categorías",
            kicker: "Colección / Categorías",
            description: "Un acceso general al catálogo por familias de producto.",
            accent: "Explorar",
        },
        "2-marcas": {
            title: "Marcas",
            kicker: "Colección / Marcas",
            description: "Un recorrido por marcas para entrar al catálogo desde la identidad comercial.",
            accent: "Marca",
        },
        "3-dietas": {
            title: "Dietas",
            kicker: "Colección / Dietas",
            description: "Una vista de catálogo pensada para explorar variantes de consumo y atributos.",
            accent: "Saludable",
        },
        "4-alacena": {
            title: "Alacena",
            kicker: "Colección / Categorías",
            description: "Una selección cálida de básicos, snacks y productos pensados para abastecer la despensa.",
            accent: "Despensa",
            filterCategoryIds: [1, 3],
        },
        "5-bebidas": {
            title: "Bebidas",
            kicker: "Colección / Bebidas",
            description: "Jugos, aguas y bebidas de todos los días con una presentación limpia y directa.",
            accent: "Refrescante",
            filterCategoryIds: [1],
        },
        "6-congelados": {
            title: "Congelados",
            kicker: "Colección / Congelados",
            description: "Productos prácticos para resolver comidas con una estética fresca y de alto contraste.",
            accent: "Freezer",
            filterCategoryIds: [2],
        },
        "7-refrigerados": {
            title: "Refrigerados",
            kicker: "Colección / Refrigerados",
            description: "Lácteos, fiambres y opciones listas para mostrar stock, variedad y confianza.",
            accent: "Fresco",
            filterCategoryIds: [1],
        },
        "8-cosmetica": {
            title: "Cosmética",
            kicker: "Colección / Cuidado",
            description: "Una vitrina más limpia y elegante para el universo de cuidado personal.",
            accent: "Cuidado",
            filterCategoryIds: [4],
        },
        "97-sin-azucar": {
            title: "Sin azúcar",
            kicker: "Colección / Dietas",
            description: "Una selección orientada a consumo sin azúcar agregada.",
            accent: "Ligero",
            filterCategoryIds: [1, 3],
        },
        "98-libre-de-gluten": {
            title: "Libre de gluten",
            kicker: "Colección / Dietas",
            description: "Una vista amplia para productos aptos sin gluten dentro de la maqueta.",
            accent: "Sin TACC",
            filterCategoryIds: [1, 2, 3, 4],
        },
        "99-vegana": {
            title: "Vegana",
            kicker: "Colección / Dietas",
            description: "Productos con foco vegetal para mostrar una experiencia más específica.",
            accent: "Plant based",
            filterCategoryIds: [1, 2, 3],
        },
        "100-vegetariana": {
            title: "Vegetariana",
            kicker: "Colección / Dietas",
            description: "Una selección vegetal pensada para navegar el catálogo por estilo de consumo.",
            accent: "Vegetal",
            filterCategoryIds: [1, 2, 3],
        },
        "101-organica": {
            title: "Orgánica",
            kicker: "Colección / Dietas",
            description: "Una vista de productos naturales y de impronta orgánica.",
            accent: "Natural",
            filterCategoryIds: [1, 4],
        },
        "102-sin-lactosa": {
            title: "Sin lactosa",
            kicker: "Colección / Dietas",
            description: "Una selección que prioriza productos pensados para consumo sin lactosa.",
            accent: "Ligeros",
            filterCategoryIds: [1, 2],
        },
        "103-kosher": {
            title: "Kosher",
            kicker: "Colección / Dietas",
            description: "Una entrada dedicada a productos con foco kosher dentro de la galería.",
            accent: "Kosher",
            filterCategoryIds: [1, 2, 4],
        },
        "104-agroecologico": {
            title: "Agroecológico",
            kicker: "Colección / Dietas",
            description: "Una ruta de exploración con foco en productos de origen más natural.",
            accent: "Origen",
            filterCategoryIds: [1],
        },
        "105-proteica": {
            title: "Proteica",
            kicker: "Colección / Dietas",
            description: "Una selección pensada para destacar productos con perfil más nutritivo.",
            accent: "Proteico",
            filterCategoryIds: [1, 2, 3],
        },
        "415-promociones": {
            title: "Promociones",
            kicker: "Colección / Promo",
            description: "Ofertas destacadas para comunicar movimiento comercial y campañas activas.",
            accent: "Oferta",
            filterFeatured: true,
        },
        "693-nuevos-ingresos": {
            title: "Nuevos ingresos",
            kicker: "Colección / Novedades",
            description: "Una entrada rápida a los productos más recientes de la maqueta.",
            accent: "Nuevo",
        },
        "925-importados": {
            title: "Importados",
            kicker: "Colección / Importados",
            description: "Marcas y productos de origen internacional presentados como landing propia.",
            accent: "Origen",
            filterCategoryIds: [3, 4],
        },
        "143-a-b": {
            title: "A-B",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre A y B.",
            accent: "A-B",
            filterBrandPrefixes: ["a", "b"],
        },
        "144-c": {
            title: "C",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca con C.",
            accent: "C",
            filterBrandPrefixes: ["c"],
        },
        "145-d-f": {
            title: "D-F",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre D y F.",
            accent: "D-F",
            filterBrandPrefixes: ["d", "e", "f"],
        },
        "146-g-j": {
            title: "G-J",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre G y J.",
            accent: "G-J",
            filterBrandPrefixes: ["g", "h", "i", "j"],
        },
        "147-k-l": {
            title: "K-L",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre K y L.",
            accent: "K-L",
            filterBrandPrefixes: ["k", "l"],
        },
        "148-m-n": {
            title: "M-N",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre M y N.",
            accent: "M-N",
            filterBrandPrefixes: ["m", "n"],
        },
        "149-o-q": {
            title: "O-Q",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre O y Q.",
            accent: "O-Q",
            filterBrandPrefixes: ["o", "p", "q"],
        },
        "150-r-t": {
            title: "R-T",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre R y T.",
            accent: "R-T",
            filterBrandPrefixes: ["r", "s", "t"],
        },
        "151-u-z": {
            title: "U-Z",
            kicker: "Colección / Marcas",
            description: "Marcas cuyo nombre arranca entre U y Z.",
            accent: "U-Z",
            filterBrandPrefixes: ["u", "v", "w", "x", "y", "z"],
        },
        "1015-sierra-de-los-padres": {
            title: "Sierra de los Padres",
            kicker: "Campaña / Hero",
            description: "Una portada de campaña con foco en imagen grande y navegación rápida.",
            accent: "Hero",
            filterFeatured: true,
        },
        "954-suma": {
            title: "Suma",
            kicker: "Campaña / Hero",
            description: "Un bloque de promo pensado para conectar banner, stock y catálogo.",
            accent: "Promo",
            filterFeatured: true,
        },
        "984-un-mate": {
            title: "Un Mate",
            kicker: "Campaña / Hero",
            description: "Un ejemplo de landing para lanzamientos, marcas o temporadas puntuales.",
            accent: "Nuevo",
            filterFeatured: true,
        },
        "644-qu": {
            title: "Qu Cocoiogo",
            kicker: "Campaña / Hero",
            description: "Banner de marca con lenguaje visual fuerte y una ruta de entrada clara.",
            accent: "Marca",
            filterFeatured: true,
        },
        "129-meraki": {
            title: "Meraki",
            kicker: "Campaña / Hero",
            description: "Un layout orientado a marca para comunicar novedad, trazabilidad y estilo.",
            accent: "Marca",
            filterFeatured: true,
        },
        "657-veg-abundancia": {
            title: "Veg Abundancia",
            kicker: "Campaña / Hero",
            description: "Cierre del carrusel con una propuesta vegetal y una grilla de productos.",
            accent: "Plant based",
            filterFeatured: true,
        },
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function sourcePath() {
        return new URLSearchParams(window.location.search).get("source") || "";
    }

    function slugFromSource(source) {
        const normalized = String(source || "").replace(/^\/+/, "");
        const match = normalized.match(/(?:DetalleArticulo|Galeria)\/([^/?#]+)/i);
        return match ? match[1].toLowerCase() : "";
    }

    function buildGalleryUrlFromSlug(slug) {
        if (!slug) {
            return "galeria.html";
        }
        return `galeria.html?source=/Galeria/${encodeURIComponent(slug)}`;
    }

    function productImage(product) {
        if (product && product.image) {
            return product.image;
        }
        if (String(product && product.sku || "").toUpperCase() === "MERA09") {
            return "Content/Images/articulos/PF_DETAIL_MERA09.png";
        }
        return `Content/Images/articulos/${String(product.sku || "").toUpperCase()}_g.jpg`;
    }

    function fallbackImage() {
        return "assets/images/metaimage.jpg";
    }

    function categoryName(content, categoryId) {
        const category = (content.categories || []).find((item) => Number(item.id) === Number(categoryId));
        return category ? category.name : "General";
    }

    function resolveProduct(content) {
        const params = new URLSearchParams(window.location.search);
        const skuParam = (params.get("sku") || "").trim().toUpperCase();
        const idParam = Number(params.get("id") || 0);
        const fromSource = slugFromSource(sourcePath());
        const sourceSku = fromSource
            ? ((fromSource.match(/^[0-9]+-([a-z0-9]+)/i) || fromSource.match(/^([a-z0-9]+)/i) || [null, ""])[1].toUpperCase())
            : "";
        const candidates = content.products || [];

        return (
            candidates.find((item) => item.sku.toUpperCase() === skuParam) ||
            candidates.find((item) => Number(item.id) === idParam) ||
            candidates.find((item) => item.sku.toUpperCase() === sourceSku) ||
            candidates.find((item) => item.featured) ||
            candidates[0] || {
                sku: "MERA09",
                name: "Producto destacado",
                brand: "Pintofruta",
                categoryId: 1,
                publicPrice: 2490,
                memberPrice: 2240,
                stock: 18,
                status: "published",
                featured: true,
            }
        );
    }

    function resolveGalleryContext() {
        const slug = slugFromSource(sourcePath());
        return galleryPresets[slug] || {
            title: "Galería",
            kicker: "Colección / Destacados",
            description: "Una vitrina estática para navegar campañas, categorías y marcas con la misma paleta del home.",
            accent: "Explorar",
            filterFeatured: true,
        };
    }

    async function loadContent() {
        if (window.PFContent && typeof window.PFContent.load === "function") {
            return window.PFContent.load();
        }
        return window.PF_BASE_CONTENT || {};
    }

    function buttonHtml(href, label, extraClass = "button-primary") {
        return `<a class="button ${extraClass}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    }

    function getGallerySortKey() {
        const select = document.getElementById("gallerySortingOption");
        return (select && select.value) || window.__gallerySortKey || "Relevancia";
    }

    function sortGalleryProducts(items, sortKey) {
        const list = [...items];
        switch (sortKey) {
            case "MasNuevo":
                return list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
            case "MasAntiguo":
                return list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
            case "MenorPrecio":
                return list.sort((a, b) => Number(a.publicPrice || 0) - Number(b.publicPrice || 0));
            case "MayorPrecio":
                return list.sort((a, b) => Number(b.publicPrice || 0) - Number(a.publicPrice || 0));
            case "Descripcion":
                return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }));
            case "Relevancia":
            default:
                return list.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.id || 0) - Number(a.id || 0));
        }
    }

    function matchesBrandPrefix(product, prefixes) {
        if (!Array.isArray(prefixes) || !prefixes.length) {
            return true;
        }
        const brand = String(product.brand || "").trim().toLowerCase();
        return prefixes.some((prefix) => brand.startsWith(String(prefix || "").toLowerCase()));
    }

    function renderGallery(content) {
        const ctx = resolveGalleryContext();
        const products = (content.products || []).filter((item) => item.status !== "hidden");
        const categoryFilter = Array.isArray(ctx.filterCategoryIds) ? ctx.filterCategoryIds.map((id) => Number(id)) : [];
        const filteredProducts = products.filter((item) => {
            const matchesCategory = !categoryFilter.length || categoryFilter.includes(Number(item.categoryId));
            const matchesBrand = matchesBrandPrefix(item, ctx.filterBrandPrefixes);
            const matchesFeatured = !ctx.filterFeatured || item.featured;
            return matchesCategory && matchesBrand && matchesFeatured;
        });
        const sortKey = getGallerySortKey();
        const featured = sortGalleryProducts(filteredProducts, sortKey);

        const heroEl = document.getElementById("galleryHero");
        const productsEl = document.getElementById("galleryProducts");
        const titleEl = document.getElementById("galleryTitle");
        const subtitleEl = document.getElementById("gallerySubtitle");
        const statsEl = document.getElementById("galleryStats");
        const subtitleLineEl = document.getElementById("gallerySubtitleLine");
        const countEl = document.getElementById("galleryCount");
        const sortSelect = document.getElementById("gallerySortingOption");

        if (titleEl) titleEl.textContent = ctx.title;
        if (subtitleEl) subtitleEl.textContent = ctx.description;
        if (heroEl) heroEl.querySelector("[data-kicker]").textContent = ctx.kicker;
        if (subtitleLineEl) {
            subtitleLineEl.textContent = `${ctx.description} Ordená por relevancia, precio o nombre.`;
        }
        if (sortSelect && sortSelect.value !== sortKey) {
            sortSelect.value = sortKey;
        }
        if (countEl) {
            countEl.textContent = `${featured.length} producto${featured.length === 1 ? "" : "s"}`;
        }

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat">
                    <span>Productos</span>
                    <strong>${products.length}</strong>
                </div>
                <div class="stat">
                    <span>Categorías</span>
                    <strong>${(content.categories || []).length}</strong>
                </div>
                <div class="stat">
                    <span>Ruta</span>
                    <strong>${escapeHtml(ctx.accent)}</strong>
                </div>
            `;
        }

        if (productsEl) {
            if (!featured.length) {
                productsEl.innerHTML = `
                    <div class="hero-art-card" style="grid-column: 1 / -1;">
                        <strong>No hay productos para esta categoría</strong>
                        <p>En la demo actual todavía no hay artículos cargados para esta sección.</p>
                    </div>
                `;
                return;
            }

            productsEl.innerHTML = featured.map((product) => {
                const image = productImage(product);
                const displayPrice = window.PFAuth && typeof window.PFAuth.getDisplayPrice === "function"
                    ? window.PFAuth.getDisplayPrice(product)
                    : Number(product.publicPrice || 0);
                const priceLabel = "Precio";
                return `
                    <article class="product-card">
                        <div class="product-media">
                            <div class="badge-row">
                                <span class="badge">${escapeHtml(product.brand || "Marca")}</span>
                                <span class="badge soft">${escapeHtml(ctx.title)}</span>
                            </div>
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name || product.sku)}" onerror="this.onerror=null;this.src='${fallbackImage()}'">
                        </div>
                        <div class="product-body">
                            <h3 class="product-title">${escapeHtml(product.name || "")}</h3>
                            <div class="product-price">
                                <div>
                                    <span>${escapeHtml(priceLabel)}</span>
                                    <strong>${money.format(Number(displayPrice || 0))}</strong>
                                </div>
                            </div>
                            <div class="product-actions">
                                <a class="button button-primary button-small" href="detallearticulo.html?sku=${encodeURIComponent(product.sku || "")}" data-product-sku="${escapeHtml(product.sku || "")}">Ver detalle</a>
                                <button class="button button-secondary button-small" type="button"
                                    data-demo-cart-add="1"
                                    data-cart-id="${escapeHtml(product.id || product.sku || "")}"
                                    data-cart-sku="${escapeHtml(product.sku || "")}"
                                    data-cart-name="${escapeHtml(product.name || "")}"
                                    data-cart-brand="${escapeHtml(product.brand || "")}"
                                    data-cart-href="detallearticulo.html?sku=${encodeURIComponent(product.sku || "")}"
                                    data-cart-qty="1" aria-label="Agregar al pedido" title="Agregar al pedido"><i class="fa fa-plus" aria-hidden="true"></i></button>
                                <a class="button button-secondary button-small" href="busqueda.html">Seguir viendo</a>
                            </div>
                        </div>
                    </article>
                `;
            }).join("");
        }
    }

    function renderDetail(content) {
        const product = resolveProduct(content);
        const category = categoryName(content, product.categoryId);
        const image = productImage(product);
        const displayPrice = window.PFAuth && typeof window.PFAuth.getDisplayPrice === "function"
            ? window.PFAuth.getDisplayPrice(product)
            : Number(product.publicPrice || 0);
        const priceLabel = "Precio";
        const detailEl = document.getElementById("detailRoot");
        const titleEl = document.getElementById("detailTitle");
        const subtitleEl = document.getElementById("detailSubtitle");
        const metaEl = document.getElementById("detailMeta");
        const thumbsEl = document.getElementById("detailThumbs");

        if (titleEl) titleEl.textContent = product.name || "Detalle de producto";
        if (subtitleEl) subtitleEl.textContent = `Ficha estática inspirada en la paleta del home.`;
        if (metaEl) {
            metaEl.innerHTML = `
                <span>${escapeHtml(product.brand || "")}</span>
                <span>${escapeHtml(category)}</span>
                <span>${product.featured ? "Destacado" : "Regular"}</span>
            `;
        }

        if (detailEl) {
            const kicker = detailEl.querySelector("[data-kicker]");
            const heroTitle = detailEl.querySelector("[data-detail-hero-title]");
            const panelTitle = detailEl.querySelector("[data-detail-title]");
            const description = detailEl.querySelector("[data-detail-description]");
            const detailCopy = detailEl.querySelector("[data-detail-copy]");
            if (kicker) kicker.textContent = "Ficha / Producto";
            if (heroTitle) heroTitle.textContent = product.name || "Producto destacado";
            if (panelTitle) panelTitle.textContent = product.name || "Producto destacado";
            if (description) description.textContent = product.description || `Ficha técnica y visual del producto.`;
            if (detailCopy) detailCopy.textContent = product.description || `Ficha pensada para mostrar la imagen, el precio y la compra rápida del producto.`;
            const priceLabelEl = detailEl.querySelector("[data-price-label], [data-member-price]");
            const priceValueEl = detailEl.querySelector("[data-price-value], [data-public-price]");
            const categoryEl = detailEl.querySelector("[data-category]");
            const brandEl = detailEl.querySelector("[data-brand]");
            const mainImageEl = detailEl.querySelector("[data-main-image]");
            const qtyInput = detailEl.querySelector("[data-detail-qty]");
            const addButton = detailEl.querySelector("[data-detail-add-to-cart]");
            if (priceLabelEl) priceLabelEl.textContent = "Precio";
            if (priceValueEl) priceValueEl.textContent = money.format(Number(displayPrice || 0));
            if (categoryEl) categoryEl.textContent = category;
            if (brandEl) brandEl.textContent = product.brand || "";
            if (mainImageEl) {
                mainImageEl.src = image;
                mainImageEl.alt = product.name || product.sku || "Producto";
            }
            if (qtyInput) qtyInput.value = "1";
            if (addButton) {
                addButton.setAttribute("data-cart-id", product.id || product.sku || "");
                addButton.setAttribute("data-cart-sku", product.sku || "");
                addButton.setAttribute("data-cart-name", product.name || "");
                addButton.setAttribute("data-cart-brand", product.brand || "");
                addButton.setAttribute("data-cart-href", `detallearticulo.html?sku=${encodeURIComponent(product.sku || "")}`);
            }
        }

        if (thumbsEl) {
            const thumbImages = [image, "Content/Images/Banners/Banner SM 1.jpg", "Content/Images/Banners/Banner Suma 2.jpg", "Content/Images/Banners/Meraki Banner.jpg"];
            thumbsEl.innerHTML = thumbImages.map((thumb, index) => `
                <div class="thumb">
                    <img src="${escapeHtml(thumb)}" alt="Miniatura ${index + 1}" onerror="this.onerror=null;this.src='${fallbackImage()}'">
                </div>
            `).join("");
        }

        document.getElementById("detailTabOverview").textContent =
            product.description || `${product.name || "Producto"} pertenece a la categoría ${category} y está listo para mostrar imagen, precio y compra rápida en una ficha comercial completa.`;
        document.getElementById("detailTabSpecs").innerHTML = `
            <div class="faq-list">
                <div class="faq-item"><strong>${escapeHtml(priceLabel)}</strong>${money.format(Number(displayPrice || 0))}</div>
            </div>
        `;
    }

    function bindTabs() {
        const tabs = document.querySelectorAll("[data-tab]");
        const panels = document.querySelectorAll("[data-tab-panel]");
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                const target = tab.dataset.tab;
                tabs.forEach((item) => item.classList.toggle("active", item === tab));
                panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.tabPanel === target));
            });
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const content = await loadContent();
        if (document.body.dataset.page === "gallery") {
            renderGallery(content);
        }
        if (document.body.dataset.page === "detail") {
            renderDetail(content);
            bindTabs();
        }

        if (window.PFAuth && typeof window.PFAuth.onChange === "function") {
            window.PFAuth.onChange(() => {
                if (document.body.dataset.page === "gallery") {
                    renderGallery(content);
                }
                if (document.body.dataset.page === "detail") {
                    renderDetail(content);
                }
            });
        }

        document.addEventListener("change", (event) => {
            if (event.target && event.target.id === "gallerySortingOption") {
                window.__gallerySortKey = event.target.value;
                if (document.body.dataset.page === "gallery") {
                    renderGallery(content);
                }
            }
        });
    });
})();
