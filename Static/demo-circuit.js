(function () {
    var CART_KEY = "pintofruta-demo-cart-v1";
    var JS_PDF_URL = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

    function isLocalPreview() {
        return window.location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    }

    function safeParse(raw, fallback) {
        try {
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function loadCart() {
        var cart = safeParse(sessionStorage.getItem(CART_KEY), null);
        if (!cart || !Array.isArray(cart.items)) {
            cart = { items: [] };
        }
        return cart;
    }

    function saveCart(cart) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderAll();
    }

    function cartItems() {
        return loadCart().items;
    }

    function cartCount() {
        return cartItems().reduce(function (sum, item) {
            return sum + Number(item.qty || 0);
        }, 0);
    }

    function normalizeRoute(value) {
        var href = String(value || "").trim();
        if (!href) {
            return href;
        }

        var match;

            if (/greenco\.com\.ar\/Galeria\//i.test(href) || /^\/Galeria\//i.test(href)) {
                match = href.match(/(?:greenco\.com\.ar)?\/?Galeria\/([^?#]+)/i);
                return match ? "galeria.html?source=/Galeria/" + encodeURIComponent(match[1]) : "galeria.html";
            }

        if (/greenco\.com\.ar\/DetalleArticulo\//i.test(href) || /^\/DetalleArticulo\//i.test(href)) {
            match = href.match(/(?:greenco\.com\.ar)?\/?DetalleArticulo\/(?:\d+-)?([a-z0-9]+)(?:-|\/|$)/i);
            return match ? "detallearticulo.html?sku=" + encodeURIComponent(match[1].toUpperCase()) : "detallearticulo.html";
        }

            if (/greenco\.com\.ar\/Seguridad\/Register/i.test(href) || /^\/Seguridad\/Register/i.test(href)) {
                return "login.html?mode=register";
            }

        if (/checkout/i.test(href)) {
            return "carrito.html";
        }

        return href;
    }

    function rewriteDomRoutes(root) {
        var scope = root || document;

        scope.querySelectorAll("a[href]").forEach(function (link) {
            var current = link.getAttribute("href");
            var next = normalizeRoute(current);
            if (next && next !== current) {
                link.setAttribute("href", next);
            }
        });

        scope.querySelectorAll("[data-link-url]").forEach(function (node) {
            var current = node.getAttribute("data-link-url");
            var next = normalizeRoute(current);
            if (next && next !== current) {
                node.setAttribute("data-link-url", next);
            }
        });

        scope.querySelectorAll("[onclick]").forEach(function (node) {
            var onclick = node.getAttribute("onclick") || "";
            if (!/greenco\.com\.ar\/Galeria\/|greenco\.com\.ar\/Seguridad\/Register|\/Galeria\//i.test(onclick)) {
                return;
            }
            var routeMatch = onclick.match(/(?:greenco\.com\.ar)?\/?Galeria\/([^'"]+)/i);
            if (routeMatch) {
                var cleanRoute = routeMatch[1].split("?")[0];
                node.setAttribute("onclick", "window.location.href='" + normalizeRoute("/Galeria/" + cleanRoute) + "'; return false;");
                return;
            }
            if (/Seguridad\/Register/i.test(onclick)) {
                node.setAttribute("onclick", "window.location.href='login.html?mode=register'; return false;");
            }
        });
    }

    function getUserLabel() {
        if (window.PFAuth && typeof window.PFAuth.getUser === "function" && window.PFAuth.isAuthenticated && window.PFAuth.isAuthenticated()) {
            var user = window.PFAuth.getUser();
            if (user && user.email) {
                return user.email;
            }
        }
        return "Invitado";
    }

    function getContent() {
        if (window.PFContent && typeof window.PFContent.load === "function") {
            return window.PFContent.load();
        }
        return Promise.resolve(window.PF_BASE_CONTENT || {});
    }

    function extractSkuFromHref(href) {
        var value = String(href || "").trim();
        if (!value) {
            return "";
        }

        var queryMatch = value.match(/[?&]sku=([A-Za-z0-9_-]+)/i);
        if (queryMatch) {
            return queryMatch[1].toUpperCase();
        }

        var pathMatch = value.match(/\/DetalleArticulo\/(?:\d+-)?([A-Za-z0-9]+)/i);
        if (pathMatch) {
            return pathMatch[1].toUpperCase();
        }

        return "";
    }

    function ensureProductModal() {
        if (document.getElementById("pfProductModal")) {
            return;
        }

        var style = document.createElement("style");
        style.textContent = `
            .pf-product-modal {
                position: fixed;
                inset: 0;
                z-index: 10050;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                overscroll-behavior: contain;
                touch-action: none;
            }
            .pf-product-modal.is-open { display: flex; }
            body.modal-open {
                overflow: hidden;
                touch-action: none;
            }
            .pf-product-modal__backdrop {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, .62);
                backdrop-filter: blur(8px);
            }
            .pf-product-modal__dialog {
                position: relative;
                width: min(1120px, 100%);
                max-height: calc(100vh - 36px);
                overflow: auto;
                border-radius: 28px;
                background: linear-gradient(180deg, #fffdf7 0%, #fff8ec 100%);
                box-shadow: 0 30px 70px rgba(15, 23, 42, .26);
                border: 1px solid rgba(255, 190, 90, .22);
            }
            .pf-product-modal__close {
                position: absolute;
                top: 16px;
                right: 16px;
                z-index: 1;
                width: 42px;
                height: 42px;
                border-radius: 999px;
                border: 0;
                background: #1f2a44;
                color: #fff;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
            }
            .pf-product-modal__inner { padding: 26px; }
            .pf-product-modal__grid {
                display: grid;
                grid-template-columns: 1.1fr .9fr;
                gap: 18px;
                align-items: stretch;
            }
            .pf-product-modal__hero, .pf-product-modal__info {
                border-radius: 22px;
                overflow: hidden;
                background: #fff;
                box-shadow: inset 0 0 0 1px rgba(31,42,68,.08);
            }
            .pf-product-modal__hero {
                padding: 18px;
                background: linear-gradient(180deg, #fffdf7 0%, #fff6e3 100%);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pf-product-modal__image-wrap {
                width: 100%;
                min-height: 520px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 18px;
                background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.7), rgba(255,255,255,.2));
                box-shadow: inset 0 0 0 1px rgba(31,42,68,.06);
            }
            .pf-product-modal__image {
                width: 100%;
                max-width: 720px;
                max-height: 100%;
                border-radius: 8px;
                display: block;
                object-fit: contain;
            }
            .pf-product-modal__info { padding: 22px; }
            .pf-product-modal__eyebrow {
                display: inline-block;
                padding: 7px 12px;
                border-radius: 999px;
                font-size: 12px;
                letter-spacing: .14em;
                text-transform: uppercase;
                color: #b86e00;
                background: rgba(255, 184, 77, .18);
                margin-bottom: 10px;
            }
            .pf-product-modal__title {
                margin: 0;
                font-size: clamp(32px, 4vw, 56px);
                line-height: .95;
                letter-spacing: -.05em;
                color: #1f2a44;
            }
            .pf-product-modal__meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
                color: #51607d;
                font-size: 13px;
            }
            .pf-product-modal__prices {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin-top: 18px;
            }
            .pf-product-modal__price-card {
                padding: 14px 16px;
                border-radius: 18px;
                background: linear-gradient(180deg, #fff9ef 0%, #fff1d6 100%);
            }
            .pf-product-modal__price-card span {
                display: block;
                font-size: 12px;
                color: #51607d;
                margin-bottom: 6px;
            }
            .pf-product-modal__price-card strong {
                font-size: 28px;
                color: #1f2a44;
            }
            .pf-product-modal__buy {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: end;
                margin-top: 16px;
            }
            .pf-product-modal__qty {
                display: grid;
                gap: 6px;
            }
            .pf-product-modal__qty label {
                font-size: 13px;
                color: #51607d;
                font-weight: 600;
            }
            .pf-product-modal__qty input {
                width: 110px;
                height: 46px;
                border-radius: 14px;
                border: 1px solid rgba(31,42,68,.12);
                background: #fff;
                padding: 0 14px;
                font: inherit;
                font-weight: 700;
                color: #1f2a44;
            }
            .pf-product-modal__facts {
                display: grid;
                gap: 10px;
                margin-top: 16px;
            }
            .pf-product-modal__fact {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                padding: 13px 14px;
                border-radius: 16px;
                border: 1px solid rgba(31,42,68,.08);
                background: rgba(255,255,255,.9);
            }
            .pf-product-modal__fact span { color: #51607d; }
            .pf-product-modal__copy {
                margin-top: 16px;
                color: #51607d;
                line-height: 1.6;
            }
            .pf-product-modal__actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 18px;
            }
            .pf-product-modal__actions a,
            .pf-product-modal__actions button {
                appearance: none;
                border: 0;
                border-radius: 999px;
                padding: 12px 16px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
                text-decoration: none;
            }
            .pf-product-modal__actions .primary {
                background: linear-gradient(135deg, #ffb84d, #f6a623);
                color: #1f2a44;
            }
            .pf-product-modal__actions .secondary {
                background: #eef1f6;
                color: #1f2a44;
            }
            @media (max-width: 900px) {
                .pf-product-modal__grid { grid-template-columns: 1fr; }
                .pf-product-modal__image-wrap { min-height: 280px; }
                .pf-product-modal__prices { grid-template-columns: 1fr; }
                .pf-product-modal__inner { padding: 18px; }
            }
            @media (max-width: 767px) {
                .pf-product-modal {
                    align-items: stretch;
                    justify-content: stretch;
                    padding: 0;
                    height: 100dvh;
                }
                .pf-product-modal__dialog {
                    width: 100%;
                    max-height: 100dvh;
                    height: 100dvh;
                    border-radius: 0;
                }
                .pf-product-modal__inner {
                    padding: 16px;
                    height: 100%;
                    box-sizing: border-box;
                }
                .pf-product-modal__close {
                    top: calc(12px + env(safe-area-inset-top));
                    right: 12px;
                }
            }
        `;
        document.head.appendChild(style);

        var modal = document.createElement("div");
        modal.id = "pfProductModal";
        modal.className = "pf-product-modal";
        modal.innerHTML = `
            <div class="pf-product-modal__backdrop" data-pf-product-close></div>
            <div class="pf-product-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="pfProductModalTitle">
                <button class="pf-product-modal__close" type="button" data-pf-product-close aria-label="Cerrar">&times;</button>
                <div class="pf-product-modal__inner">
                    <div class="pf-product-modal__grid">
                        <section class="pf-product-modal__hero">
                            <div class="pf-product-modal__image-wrap">
                                <img class="pf-product-modal__image" data-pf-product-image src="assets/images/no-image.svg" alt="Producto">
                            </div>
                        </section>
                        <aside class="pf-product-modal__info">
                            <span class="pf-product-modal__eyebrow" data-pf-product-kicker>Detalle de producto</span>
                            <h2 class="pf-product-modal__title" id="pfProductModalTitle" data-pf-product-title>Producto</h2>
                            <div class="pf-product-modal__meta" data-pf-product-meta></div>
                            <div class="pf-product-modal__prices">
                                <div class="pf-product-modal__price-card">
                                    <span data-pf-product-price-label>Precio</span>
                                    <strong data-pf-product-public-price>$0</strong>
                                </div>
                            </div>
                            <div class="pf-product-modal__buy">
                                <div class="pf-product-modal__qty">
                                    <label for="pfProductModalQty">Cantidad</label>
                                    <input id="pfProductModalQty" type="number" min="1" step="1" value="1" data-pf-product-qty>
                                </div>
                                <button class="primary" type="button" data-demo-cart-add="1" data-cart-id="" data-cart-sku="" data-cart-name="" data-cart-brand="" data-cart-href="" data-cart-qty="1" data-pf-product-add-to-cart>Agregar al carrito</button>
                            </div>
                            <div class="pf-product-modal__facts" data-pf-product-facts></div>
                            <p class="pf-product-modal__copy" data-pf-product-copy></p>
                            <div class="pf-product-modal__actions">
                                <a class="primary" href="carrito.html">Ver pedido</a>
                                <a class="secondary" href="busqueda.html">Ir a búsqueda</a>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener("click", function (event) {
            if (event.target && event.target.hasAttribute("data-pf-product-close")) {
                closeProductModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeProductModal();
            }
        });
    }

    function closeProductModal() {
        var modal = document.getElementById("pfProductModal");
        if (!modal) {
            return;
        }
        modal.classList.remove("is-open");
        var scrollY = Number(document.body.dataset.modalScrollY || "0");
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.classList.remove("modal-open");
        delete document.body.dataset.modalScrollY;
        window.scrollTo(0, scrollY);
    }

    async function openProductModalFromTrigger(trigger) {
        ensureProductModal();

        var sku = (trigger && trigger.getAttribute("data-product-sku")) || extractSkuFromHref(trigger && trigger.getAttribute("href"));
        var content = await getContent();
        var candidates = content.products || [];
        var product = candidates.find(function (item) {
            return String(item.sku || "").toUpperCase() === String(sku || "").toUpperCase();
        }) || candidates.find(function (item) { return item.featured; }) || candidates[0];

        if (!product) {
            return;
        }

        var category = "";
        var categorySource = (window.PFContent && typeof window.PFContent.get === "function" && window.PFContent.get()) || window.PF_BASE_CONTENT || {};
        var categoryObj = (categorySource.categories || []).find(function (item) {
            return Number(item.id) === Number(product.categoryId);
        });
        category = categoryObj ? categoryObj.name : "";

        var modal = document.getElementById("pfProductModal");
        if (!modal) {
            return;
        }

        var scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.dataset.modalScrollY = String(scrollY);
        document.body.style.position = "fixed";
        document.body.style.top = "-" + scrollY + "px";
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.classList.add("modal-open");

        var image = String(product.sku || "").toUpperCase() === "MERA09"
            ? "Content/Images/articulos/PF_DETAIL_MERA09.png"
            : "Content/Images/articulos/" + String(product.sku || "").toUpperCase() + "_g.jpg";
        var publicPrice = Number(product.publicPrice || 0);
        var memberPrice = Number(product.memberPrice || publicPrice);
        var isMember = window.PFAuth && typeof window.PFAuth.isAuthenticated === "function" ? window.PFAuth.isAuthenticated() : false;
        var moneyLocal = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
        var displayPrice = isMember ? memberPrice : publicPrice;
        var displayLabel = "Precio";

        modal.querySelector("[data-pf-product-image]").src = image;
        modal.querySelector("[data-pf-product-image]").alt = product.name || product.sku || "Producto";
        modal.querySelector("[data-pf-product-title]").textContent = product.name || "Producto";
        modal.querySelector("[data-pf-product-meta]").innerHTML = [
            product.brand ? escapeHtml(product.brand) : "",
            category ? escapeHtml(category) : "",
            product.featured ? "Destacado" : "Regular"
        ].filter(Boolean).map(function (item) {
            return "<span>" + item + "</span>";
        }).join("");
        modal.querySelector("[data-pf-product-price-label]").textContent = displayLabel;
        modal.querySelector("[data-pf-product-public-price]").textContent = moneyLocal.format(displayPrice);
        modal.querySelector("[data-pf-product-copy]").textContent = "Ficha técnica y visual del producto.";
        var addButton = modal.querySelector("[data-pf-product-add-to-cart]");
        var qtyInput = modal.querySelector("[data-pf-product-qty]");
        if (qtyInput) {
            qtyInput.value = "1";
        }
        if (addButton) {
            addButton.setAttribute("data-cart-id", product.id || product.sku || "");
            addButton.setAttribute("data-cart-sku", product.sku || "");
            addButton.setAttribute("data-cart-name", product.name || "");
            addButton.setAttribute("data-cart-brand", product.brand || "");
            addButton.setAttribute("data-cart-href", "detallearticulo.html?sku=" + encodeURIComponent(product.sku || ""));
            addButton.setAttribute("data-cart-public-price", String(publicPrice));
            addButton.setAttribute("data-cart-member-price", String(memberPrice));
            addButton.setAttribute("data-cart-price", String(displayPrice));
        }
        modal.querySelector("[data-pf-product-facts]").innerHTML = `
            <div class="pf-product-modal__fact"><span>Marca</span><strong>${escapeHtml(product.brand || "-")}</strong></div>
            <div class="pf-product-modal__fact"><span>Categoría</span><strong>${escapeHtml(category || "-")}</strong></div>
        `;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function normalizeName(value) {
        return String(value || "").trim();
    }

    function extractPrice(node) {
        if (!node) {
            return null;
        }

        var priceMatch = String(node.textContent || "").match(/\$\s?([\d.,]+)/);
        if (!priceMatch) {
            return null;
        }

        var cleaned = priceMatch[1].replace(/\./g, "").replace(",", ".");
        var parsed = Number(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    function getNumericAttribute(node, names) {
        if (!node) {
            return null;
        }

        var list = Array.isArray(names) ? names : [names];
        for (var i = 0; i < list.length; i++) {
            var value = node.getAttribute(list[i]);
            if (value == null || value === "") {
                continue;
            }
            var parsed = Number(String(value).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
        return null;
    }

    function resolveCartPrice(trigger, root) {
        var isMember = window.PFAuth && typeof window.PFAuth.isAuthenticated === "function" ? window.PFAuth.isAuthenticated() : false;
        var source = trigger || root;
        var publicPrice = getNumericAttribute(source, ["data-cart-public-price", "data-public-price", "data-cart-price-public", "data-price-public", "data-price", "data-cart-price"]);
        var memberPrice = getNumericAttribute(source, ["data-cart-member-price", "data-member-price", "data-cart-price-member", "data-price-member"]);

        if (publicPrice == null && root) {
            publicPrice = getNumericAttribute(root, ["data-cart-public-price", "data-public-price", "data-price", "data-pf-product-price"]) || extractPrice(root);
        }
        if (memberPrice == null && root) {
            memberPrice = getNumericAttribute(root, ["data-cart-member-price", "data-member-price"]);
        }

        if (isMember) {
            if (memberPrice != null) {
                return memberPrice;
            }
            if (publicPrice != null) {
                return publicPrice;
            }
        }

        if (publicPrice != null) {
            return publicPrice;
        }
        if (memberPrice != null) {
            return memberPrice;
        }
        return extractPrice(root);
    }

    function getContentProducts() {
        var content = (window.PFContent && typeof window.PFContent.get === "function" && window.PFContent.get()) || window.PF_BASE_CONTENT || null;
        if (!content || !Array.isArray(content.products)) {
            return [];
        }
        return content.products;
    }

    function findCatalogProductBySku(sku) {
        var normalizedSku = String(sku || "").toUpperCase();
        if (!normalizedSku) {
            return null;
        }

        var products = getContentProducts();
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            if (String(product.sku || "").toUpperCase() === normalizedSku) {
                return product;
            }
        }
        return null;
    }

    function getStoredCartPrice(item) {
        if (item && item.price != null && !isNaN(Number(item.price))) {
            return Number(item.price);
        }

        var product = findCatalogProductBySku(item && item.sku);
        if (!product) {
            return null;
        }

        var isMember = window.PFAuth && typeof window.PFAuth.isAuthenticated === "function" ? window.PFAuth.isAuthenticated() : false;
        var publicPrice = Number(product.publicPrice || 0);
        var memberPrice = Number(product.memberPrice || publicPrice);
        return isMember ? memberPrice : publicPrice;
    }

    function getDisplayCartTotalPrice(item) {
        var unitPrice = getStoredCartPrice(item);
        if (unitPrice == null) {
            return null;
        }
        return Number(unitPrice || 0) * Number(item.qty || 0);
    }

    function getCardMeta(trigger) {
        var root = trigger.closest("[data-cart-root]") || trigger.closest("section") || trigger.closest(".product") || trigger.closest(".detail-panel") || trigger.closest(".hero-panel");
        var section = trigger.closest("section[data-ga-id]") || root;
        var name = "";
        var sku = "";
        var brand = "";
        var href = "";
        var image = "";
        var articleId = "";
        var qty = 1;

        if (section && section.dataset) {
            name = normalizeName(section.dataset.gaName);
            sku = normalizeName(section.dataset.gaId).toUpperCase();
            brand = normalizeName(section.dataset.gaBrand);
        }

        var titleNode = root ? root.querySelector(".price-title, [data-detail-title], h1, h2, h3") : null;
        if (!name && titleNode) {
            name = normalizeName(titleNode.textContent);
        }

        var linkNode = root ? root.querySelector("a.lnkDescripcion, a.lnkFoto, a[href*='detallearticulo.html'], a[href*='/DetalleArticulo/']") : null;
        if (linkNode) {
            href = normalizeRoute(linkNode.getAttribute("href"));
        }

        var imgNode = root ? root.querySelector("img") : null;
        if (imgNode) {
            image = imgNode.getAttribute("src") || "";
        }

        if (root && root.getAttribute("articuloid")) {
            articleId = root.getAttribute("articuloid");
        }
        if (!articleId && trigger && trigger.getAttribute("data-cart-id")) {
            articleId = trigger.getAttribute("data-cart-id");
        }
        if (!sku && articleId) {
            sku = String(articleId);
        }

        var qtyInput = root ? root.querySelector("input.qty-input, input[type='number']") : null;
        if (qtyInput) {
            var parsedQty = parseInt(qtyInput.value || "1", 10);
            qty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;
        }
        if (trigger && trigger.getAttribute("data-cart-qty")) {
            var triggerQty = parseInt(trigger.getAttribute("data-cart-qty"), 10);
            if (!isNaN(triggerQty) && triggerQty > 0) {
                qty = triggerQty;
            }
        }

        var cartPrice = resolveCartPrice(trigger, root);

        return {
            id: articleId || sku || href || name,
            sku: sku || articleId || "",
            name: name || "Producto demo",
            brand: brand || "",
            href: href || "detallearticulo.html",
            image: image || "",
            qty: qty,
            price: cartPrice,
        };
    }

    function upsertCartItem(item) {
        var cart = loadCart();
        var key = String(item.id || item.sku || item.name).toLowerCase();
        var existing = cart.items.find(function (entry) {
            var entryKey = String(entry.id || entry.sku || entry.name).toLowerCase();
            return entryKey === key;
        });

        if (existing) {
            existing.qty = Number(existing.qty || 0) + Number(item.qty || 1);
            existing.price = item.price != null ? item.price : existing.price;
            existing.name = item.name || existing.name;
            existing.brand = item.brand || existing.brand;
            existing.href = item.href || existing.href;
            existing.image = item.image || existing.image;
            existing.sku = item.sku || existing.sku;
        } else {
            cart.items.push({
                id: item.id,
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                href: item.href,
                image: item.image,
                qty: Number(item.qty || 1),
                price: item.price,
            });
        }

        saveCart(cart);
        openCartSideIfAvailable();
    }

    function removeCartItem(id) {
        var cart = loadCart();
        var key = String(id).toLowerCase();
        cart.items = cart.items.filter(function (entry) {
            var entryKey = String(entry.id || entry.sku || entry.name).toLowerCase();
            return entryKey !== key;
        });
        saveCart(cart);
    }

    function clearCart() {
        saveCart({ items: [] });
    }

    function cartSubtotal() {
        return cartItems().reduce(function (sum, item) {
            var price = getStoredCartPrice(item);
            if (price == null) {
                return sum;
            }
            return sum + (Number(price || 0) * Number(item.qty || 0));
        }, 0);
    }

    function formatMoney(value) {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    }

    function ensureMiniCartStyles() {
        if (document.getElementById("demoMiniCartStyles")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "demoMiniCartStyles";
        style.textContent = `
            #cart_side.add_to_cart.right {
                width: min(calc(100vw - 8px), 470px) !important;
                right: -470px !important;
                left: auto !important;
                height: calc(100dvh - 8px) !important;
                max-height: calc(100dvh - 8px) !important;
                top: 4px !important;
                background: rgba(29, 42, 38, 0.34);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                border-left: 1px solid rgba(75, 123, 100, 0.18);
                padding: 14px 10px 14px 18px !important;
                box-sizing: border-box;
            }

            #cart_side.add_to_cart.right.open-side {
                width: min(calc(100vw - 8px), 470px) !important;
                right: 0 !important;
                left: auto !important;
            }

            #cart_side.add_to_cart.right .cart-inner {
                height: calc(100dvh - 28px);
                max-height: calc(100dvh - 28px);
                width: 100% !important;
                max-width: none !important;
                border-radius: 20px;
                overflow: hidden;
                background:
                    radial-gradient(circle at top right, rgba(215, 165, 109, 0.18), transparent 22%),
                    linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(245, 236, 222, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.72);
                box-shadow: 0 28px 70px rgba(23, 34, 28, 0.28);
                display: flex;
                flex-direction: column;
                margin-right: 0;
            }

            #cart_side .cart_top {
                padding: 20px 26px 14px 22px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 14px;
                border-bottom: 1px solid rgba(75, 123, 100, 0.12);
            }

            #cart_side .cart_top h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 900;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--pf-text, #2e3130);
            }

            #cart_side .cart-kicker {
                display: inline-flex;
                margin-bottom: 6px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(75, 123, 100, 0.12);
                color: var(--pf-primary-darker, #244134);
                font-size: 0.72rem;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }

            #cart_side .close-cart a {
                width: 34px;
                height: 34px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: rgba(75, 123, 100, 0.1);
                color: var(--pf-primary-darker, #244134);
                transition: transform 180ms ease, background 180ms ease;
            }

            #cart_side .close-cart a:hover {
                transform: translateY(-1px);
                background: rgba(75, 123, 100, 0.18);
            }

            #cart_side .cart_media {
                padding: 16px 18px 28px;
                width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 16px;
                flex: 1 1 auto;
                min-height: 0;
                height: auto !important;
                max-height: none !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                scrollbar-gutter: stable both-edges;
                padding-right: 22px;
            }

            #cart_side .cart-summary-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }

            #cart_side .summary-chip {
                padding: 14px 16px;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.78);
                border: 1px solid rgba(75, 123, 100, 0.12);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
            }

            #cart_side .summary-chip span,
            #cart_side .cart-note,
            #cart_side .cart-meta {
                display: block;
                font-size: 0.76rem;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: rgba(46, 49, 48, 0.58);
                font-weight: 800;
            }

            #cart_side .summary-chip strong {
                display: block;
                margin-top: 8px;
                font-size: 1.1rem;
                font-weight: 900;
                color: var(--pf-text, #2e3130);
            }

            #cart_side .cart_product {
                display: grid;
                gap: 12px;
                padding: 0;
                margin: 0;
                width: 100%;
            }

            #cart_side .cart_product li {
                list-style: none;
                padding: 14px;
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(75, 123, 100, 0.12);
                box-shadow: 0 12px 28px rgba(53, 72, 61, 0.08);
                width: 100%;
                box-sizing: border-box;
            }

            #cart_side .cart_product .media {
                display: flex;
                align-items: flex-start;
                gap: 14px;
            }

            #cart_side .cart-thumb {
                width: 72px;
                height: 72px;
                border-radius: 18px;
                overflow: hidden;
                background:
                    radial-gradient(circle at top left, rgba(126, 165, 138, 0.22), transparent 55%),
                    linear-gradient(180deg, rgba(248, 244, 236, 0.98), rgba(237, 226, 207, 0.98));
                border: 1px solid rgba(75, 123, 100, 0.10);
                flex: none;
                display: grid;
                place-items: center;
            }

            #cart_side .cart-thumb img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            #cart_side .cart_product .media-body {
                flex: 1 1 auto;
                min-width: 0;
            }

            #cart_side .cart_product h4 {
                margin: 0;
                font-size: 1rem;
                line-height: 1.25;
                font-weight: 900;
                color: var(--pf-text, #2e3130);
            }

            #cart_side .cart_product h6 {
                margin: 8px 0 0;
                color: var(--pf-primary, #4b7b64);
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 0.03em;
            }

            #cart_side .cart-price-row {
                margin-top: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 16px;
                background: rgba(75, 123, 100, 0.08);
                color: var(--pf-text, #2e3130);
            }

            #cart_side .cart-price-row span {
                font-size: 0.82rem;
                font-weight: 800;
                color: rgba(46, 49, 48, 0.66);
            }

            #cart_side .cart-price-row strong {
                font-size: 0.95rem;
                font-weight: 900;
            }

            #cart_side .mini-remove {
                display: inline-flex;
                margin-top: 12px;
                padding: 9px 14px;
                border-radius: 999px;
                background: rgba(75, 123, 100, 0.12);
                color: var(--pf-primary-darker, #244134);
                font-size: 0.84rem;
                font-weight: 800;
                transition: transform 180ms ease, background 180ms ease;
            }

            #cart_side .mini-remove:hover {
                transform: translateY(-1px);
                background: rgba(75, 123, 100, 0.18);
            }

            #cart_side .cart_total {
                margin: 0;
                padding: 0 0 8px;
                display: grid;
                gap: 12px;
                width: 100%;
            }

            #cart_side .cart_total > li {
                list-style: none;
                padding: 16px;
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.82);
                border: 1px solid rgba(75, 123, 100, 0.12);
                width: 100%;
                box-sizing: border-box;
            }

            #cart_side .total h5 {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin: 0;
                font-size: 0.92rem;
                color: rgba(46, 49, 48, 0.72);
                font-weight: 700;
            }

            #cart_side .total h5 span {
                font-size: 1rem;
                font-weight: 900;
                color: var(--pf-text, #2e3130);
            }

            #cart_side .product-total {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(75, 123, 100, 0.10);
            }

            #cart_side .product-total h4 {
                margin: 0;
                color: var(--pf-primary-darker, #244134);
                font-size: 0.88rem;
                line-height: 1.5;
            }

            #cart_side .buttons {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            #cart_side .buttons .btn,
            #cart_side .buttons .button {
                flex: 1 1 0;
                min-height: 46px;
                border-radius: 999px;
                font-weight: 800;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            #cart_side .buttons .btn.btn-rounded.btn-xs {
                background: linear-gradient(135deg, var(--pf-secondary), #efb955);
                color: #2a1a0e;
                border: none;
                box-shadow: 0 12px 22px rgba(215, 165, 109, 0.25);
            }

            #cart_side .buttons .btn.btn-rounded.btn-xs:hover {
                transform: translateY(-1px);
            }

            #cart_side .buttons .btn[data-demo-cart-clear] {
                background: rgba(75, 123, 100, 0.12);
                color: var(--pf-primary-darker, #244134);
                box-shadow: none;
            }

            #cart_side .buttons .btn[data-demo-cart-clear]:hover {
                background: rgba(75, 123, 100, 0.18);
            }

            #cart_side .cart-empty {
                padding: 18px 0 6px;
                display: grid;
                place-items: center;
                text-align: center;
                gap: 14px;
            }

            #cart_side .cart-empty__icon {
                width: 72px;
                height: 72px;
                border-radius: 24px;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, rgba(126, 165, 138, 0.18), rgba(215, 165, 109, 0.18));
                color: var(--pf-primary-darker, #244134);
                font-size: 1.7rem;
            }

            #cart_side .cart-empty p {
                margin: 0;
                color: var(--pf-muted, #6f6c64);
                line-height: 1.6;
                font-weight: 600;
            }

            @media (max-width: 575px) {
                #cart_side.add_to_cart.right {
                    width: min(calc(100vw - 16px), 430px) !important;
                    right: -430px !important;
                    left: auto !important;
                    height: calc(100dvh - 16px) !important;
                    max-height: calc(100dvh - 16px) !important;
                    top: 8px !important;
                    padding: 8px !important;
                }

                #cart_side.add_to_cart.right.open-side {
                    width: min(calc(100vw - 16px), 430px) !important;
                    right: 16px !important;
                    left: auto !important;
                }

                #cart_side.add_to_cart.right .cart-inner {
                    height: calc(100dvh - 16px);
                    max-height: calc(100dvh - 16px);
                    margin-right: 0;
                    width: 100% !important;
                    border-radius: 18px;
                }

                #cart_side .cart_media {
                    padding-bottom: 36px;
                    padding-right: 18px;
                }

                #cart_side .cart-summary-grid {
                    grid-template-columns: 1fr;
                }

                #cart_side .buttons {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function renderMiniCart() {
        ensureMiniCartStyles();
        var side = document.getElementById("cart_side");
        if (!side) {
            return;
        }

        var items = cartItems();
        var total = cartSubtotal();
        var count = cartCount();

        var body = "";
        if (!items.length) {
            body = `
                <div class="cart-inner">
                    <div class="cart_top">
                        <div>
                            <span class="cart-kicker">Pedido demo</span>
                            <h3>Mi pedido</h3>
                        </div>
                        <div class="close-cart">
                            <a href="javascript:void(0)" onclick="MiniCart.cerrar(); return false;" data-demo-cart-close aria-label="Cerrar carrito"><i class="fa fa-times" aria-hidden="true"></i></a>
                        </div>
                    </div>
                    <div class="cart_media">
                        <div class="cart-empty">
                            <div class="cart-empty__icon"><i class="fa fa-basket-shopping" aria-hidden="true"></i></div>
                            <p>No agregaste artículos todavía.</p>
                        </div>
                        <div class="cart-summary-grid">
                            <div class="summary-chip">
                                <span>Artículos</span>
                                <strong>0</strong>
                            </div>
                            <div class="summary-chip">
                                <span>Total</span>
                                <strong>Sin calcular</strong>
                            </div>
                        </div>
                        <ul class="cart_total">
                            <li>
                                <div class="total"><h5>Total estimado: <span>$ 0</span></h5></div>
                                <div class="product-total">
                                    <h4>Pedí productos y descargá el resumen en PDF.</h4>
                                </div>
                            </li>
                            <li>
                                <div class="buttons">
                                    <a href="carrito.html" class="btn btn-rounded btn-xs">Ver pedido</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
            side.innerHTML = body;
            return;
        }

        var list = items.map(function (item) {
            var displayPrice = getDisplayCartTotalPrice(item);
            var price = displayPrice == null ? "Sin precio" : formatMoney(displayPrice);
            return `
                <li>
                    <div class="media">
                        <div class="media-body">
                            <h4>${escapeHtml(item.name || "")}</h4>
                            <h6>${escapeHtml(item.brand || "")}${item.sku ? " - " + escapeHtml(item.sku) : ""}</h6>
                            <div class="cart-price-row">
                                <span>Cant. ${escapeHtml(item.qty || 0)}</span>
                                <strong>${escapeHtml(price)}</strong>
                            </div>
                            <a href="javascript:void(0)" class="mini-remove" data-demo-cart-remove="${escapeHtml(item.id || item.sku || item.name)}">Quitar</a>
                        </div>
                    </div>
                </li>
            `;
        }).join("");

        body = `
            <div class="cart-inner">
                <div class="cart_top">
                    <div>
                        <span class="cart-kicker">Pedido demo</span>
                        <h3>Mi pedido</h3>
                    </div>
                    <div class="close-cart">
                        <a href="javascript:void(0)" onclick="MiniCart.cerrar(); return false;" data-demo-cart-close aria-label="Cerrar carrito"><i class="fa fa-times" aria-hidden="true"></i></a>
                    </div>
                </div>
                <div class="cart_media">
                    <div class="cart-summary-grid">
                        <div class="summary-chip">
                            <span>Artículos</span>
                            <strong>${escapeHtml(count)}</strong>
                        </div>
                        <div class="summary-chip">
                            <span>Total</span>
                            <strong>${escapeHtml(items.some(function (item) { return getStoredCartPrice(item) != null; }) ? formatMoney(total) : "Sin calcular")}</strong>
                        </div>
                    </div>
                    <ul class="cart_product">${list}</ul>
                    <ul class="cart_total">
                        <li>
                            <div class="total"><h5>Total estimado: <span>${escapeHtml(items.some(function (item) { return getStoredCartPrice(item) != null; }) ? formatMoney(total) : "Sin calcular")}</span></h5></div>
                            <div class="product-total">
                                <h4>Pedido demo para descargar en PDF.</h4>
                            </div>
                        </li>
                        <li>
                            <div class="buttons">
                                <a href="javascript:void(0)" class="btn btn-rounded btn-xs" data-demo-cart-clear>Vaciar pedido</a>
                                <a href="carrito.html" class="btn btn-rounded btn-xs">Ver pedido</a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        side.innerHTML = body;
    }

    function renderOrderPage() {
        var title = document.getElementById("cartTitle");
        var subtitle = document.getElementById("cartSubtitle");
        var meta = document.getElementById("cartMeta");
        var user = document.getElementById("cartUser");
        var summary = document.getElementById("cartSummary");
        var items = document.getElementById("cartItems");
        var actions = document.getElementById("cartActions");
        var count = cartCount();
        var list = cartItems();
        var subtotal = cartSubtotal();
        var hasPrices = list.some(function (item) { return getStoredCartPrice(item) != null; });
        var userLabel = getUserLabel();

        if (title) {
            title.textContent = "Pedido demo listo para descargar";
        }
        if (subtitle) {
            subtitle.textContent = "Este carrito arma un pedido local, sin checkout ni pasarela de pago, y lo baja en PDF.";
        }
        if (meta) {
            meta.innerHTML = `
                <span>Articulos ${escapeHtml(count)}</span>
                <span>${escapeHtml(hasPrices ? formatMoney(subtotal) : "Sin precio")}</span>
                <span>${escapeHtml(userLabel)}</span>
            `;
        }
        if (user) {
            user.textContent = userLabel;
        }
        if (summary) {
            summary.innerHTML = `
                <span class="eyebrow">Resumen</span>
                <h2>Pedido local</h2>
                <div class="faq-list">
                    <div class="faq-item"><strong>Articulos</strong>${escapeHtml(count)}</div>
                    <div class="faq-item"><strong>Lineas</strong>${escapeHtml(list.length)}</div>
                    <div class="faq-item"><strong>Total estimado</strong>${escapeHtml(hasPrices ? formatMoney(subtotal) : "Sin calcular")}</div>
                    <div class="faq-item"><strong>Usuario</strong>${escapeHtml(userLabel)}</div>
                </div>
            `;
        }
        if (items) {
            if (!list.length) {
                items.innerHTML = `
                    <div class="hero-art-card">
                        <strong>El pedido esta vacio</strong>
                        <p>Volve a Home o Busqueda para agregar productos y generar el PDF de demostracion.</p>
                    </div>
                `;
            } else {
                items.innerHTML = `
                    <div class="section-head" style="margin-bottom:16px;">
                        <div>
                            <span class="eyebrow">Detalle</span>
                            <h2>Articulos seleccionados</h2>
                        </div>
                        <p>Podras quitar items, vaciar el pedido o descargar el PDF.</p>
                    </div>
                    <div class="related-grid">
                        ${list.map(function (item) {
                            var itemSku = String(item.sku || extractSkuFromHref(item.href) || item.id || "").toUpperCase();
                            return `
                                <article class="related-card">
                                    <img src="${escapeHtml(item.image || "assets/images/no-image.svg")}" alt="${escapeHtml(item.name || "")}" onerror="this.onerror=null;this.src='assets/images/no-image.svg'">
                                    <div class="body">
                                        <strong>${escapeHtml(item.name || "")}</strong>
                                        <span>${escapeHtml(item.brand || "")}${item.sku ? " · " + escapeHtml(item.sku) : ""}</span>
                                        <span>Cantidad: ${escapeHtml(item.qty || 0)}</span>
                                        <span>${escapeHtml(getDisplayCartTotalPrice(item) == null ? "Sin precio" : formatMoney(getDisplayCartTotalPrice(item)))}</span>
                                        <div class="hero-actions" style="margin-top:12px;">
                                            <a class="button button-secondary button-small" href="detallearticulo.html?sku=${encodeURIComponent(itemSku)}" data-product-sku="${escapeHtml(itemSku)}">Ver detalle</a>
                                            <button class="button button-primary button-small" type="button" data-demo-cart-remove="${escapeHtml(item.id || item.sku || item.name)}">Quitar</button>
                                        </div>
                                    </div>
                                </article>
                            `;
                        }).join("")}
                    </div>
                `;
            }
        }
        if (actions) {
            actions.innerHTML = `
                <button class="button button-primary" type="button" data-demo-cart-download>Descargar PDF</button>
                <button class="button button-secondary" type="button" data-demo-cart-clear>Vaciar pedido</button>
                <a class="button button-secondary" href="index.html">Seguir comprando</a>
            `;
        }
    }

    function ensureFloatingCartButton() {
        if (document.getElementById("demoFloatingCartButton")) {
            return;
        }
        if (document.body && document.body.dataset && document.body.dataset.page === "cart") {
            return;
        }

        var button = document.createElement("a");
        button.id = "demoFloatingCartButton";
        button.href = "carrito.html";
        button.textContent = "Pedido (0)";
        button.setAttribute("aria-label", "Ir al pedido");
        button.style.position = "fixed";
        button.style.right = "18px";
        button.style.bottom = "18px";
        button.style.zIndex = "9999";
        button.style.padding = "14px 18px";
        button.style.borderRadius = "999px";
        button.style.background = "linear-gradient(135deg, #1f2a44, #ffb84d)";
        button.style.color = "#fff";
        button.style.fontWeight = "700";
        button.style.boxShadow = "0 14px 30px rgba(31,42,68,.28)";
        button.style.textDecoration = "none";
        button.style.border = "1px solid rgba(255,255,255,.25)";
        button.style.letterSpacing = ".02em";
        button.style.fontSize = "14px";
        button.style.lineHeight = "1";
        button.style.transition = "transform .18s ease, box-shadow .18s ease";
        button.onmouseenter = function () {
            button.style.transform = "translateY(-2px)";
            button.style.boxShadow = "0 18px 34px rgba(31,42,68,.32)";
        };
        button.onmouseleave = function () {
            button.style.transform = "translateY(0)";
            button.style.boxShadow = "0 14px 30px rgba(31,42,68,.28)";
        };

        document.body.appendChild(button);
    }

    function renderDemoButtons() {
        document.querySelectorAll(".addtocart_btn[articuloid]").forEach(function (node) {
            if (node.querySelector("[data-demo-cart-add]")) {
                return;
            }

            var card = node.closest("section[data-ga-id]") || node.closest(".product") || node.closest(".product-box") || node.parentElement;
            var name = card ? normalizeName((card.querySelector(".price-title") || card.querySelector("[data-detail-title]") || card.querySelector("h1, h2, h3") || {}).textContent) : "";
            var sku = card && card.dataset ? normalizeName(card.dataset.gaId) : "";
            var brand = card && card.dataset ? normalizeName(card.dataset.gaBrand) : "";
            var hrefNode = card ? card.querySelector("a.lnkDescripcion, a.lnkFoto") : null;
            var href = hrefNode ? normalizeRoute(hrefNode.getAttribute("href")) : "detallearticulo.html";
            var imageNode = card ? card.querySelector("img") : null;
            var image = imageNode ? imageNode.getAttribute("src") || "" : "";
            var itemId = node.getAttribute("articuloid");

            node.innerHTML = `
                <div class="pf-cart-actions">
                    <button class="button button-primary button-small" type="button"
                        data-demo-cart-add="1"
                        data-cart-id="${escapeHtml(itemId)}"
                        data-cart-sku="${escapeHtml(sku)}"
                        data-cart-name="${escapeHtml(name)}"
                        data-cart-brand="${escapeHtml(brand)}"
                        data-cart-href="${escapeHtml(href)}"
                        data-cart-image="${escapeHtml(image)}"
                        data-cart-qty="1" aria-label="Agregar al pedido" title="Agregar al pedido"><i class="fa fa-plus" aria-hidden="true"></i></button>
                </div>
            `;
        });
    }

    function openCartSideIfAvailable() {
        if (window.MiniCart && typeof window.MiniCart.abrir === "function" && document.getElementById("cart_side")) {
            window.MiniCart.abrir();
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function ensureJsPdf() {
        if (window.jspdf && window.jspdf.jsPDF) {
            return Promise.resolve(window.jspdf.jsPDF);
        }

        return new Promise(function (resolve, reject) {
            var existing = document.querySelector("script[data-pdf-lib]");
            if (existing) {
                existing.addEventListener("load", function () {
                    resolve(window.jspdf.jsPDF);
                }, { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }

            var script = document.createElement("script");
            script.src = JS_PDF_URL;
            script.async = true;
            script.setAttribute("data-pdf-lib", "1");
            script.onload = function () {
                resolve(window.jspdf.jsPDF);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function downloadPdf() {
        var items = cartItems();
        if (!items.length) {
            alert("El pedido esta vacio.");
            return;
        }

        var jsPDF = await ensureJsPdf();
        var doc = new jsPDF({ unit: "pt", format: "a4" });
        var width = doc.internal.pageSize.getWidth();
        var height = doc.internal.pageSize.getHeight();
        var margin = 40;
        var y = 54;
        var rowHeight = 18;
        var userLabel = getUserLabel();
        var total = cartSubtotal();
        var hasPrices = items.some(function (item) { return getStoredCartPrice(item) != null; });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Pintofruta", margin, y);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        y += 22;
        doc.text("Pedido demo", margin, y);
        y += 16;
        doc.text("Usuario: " + userLabel, margin, y);
        y += 16;
        doc.text("Fecha: " + new Date().toLocaleString("es-AR"), margin, y);
        y += 24;

        doc.setFont("helvetica", "bold");
        doc.text("Articulo", margin, y);
        doc.text("SKU", 300, y);
        doc.text("Cant.", 420, y);
        if (hasPrices) {
            doc.text("Importe", 480, y);
        }
        y += 8;
        doc.setDrawColor(210);
        doc.line(margin, y, width - margin, y);
        y += 18;
        doc.setFont("helvetica", "normal");

        items.forEach(function (item) {
            if (y > height - 90) {
                doc.addPage();
                y = 54;
            }

            var text = item.name || "Producto demo";
            var lines = doc.splitTextToSize(text, 250);
            doc.text(lines, margin, y);
            doc.text(String(item.sku || "-"), 300, y);
            doc.text(String(item.qty || 0), 420, y);
            if (hasPrices) {
                var printablePrice = getDisplayCartTotalPrice(item);
                doc.text(printablePrice == null ? "Sin precio" : formatMoney(printablePrice), 480, y);
            }
            y += Math.max(lines.length * rowHeight, rowHeight);
            y += 8;
        });

        y += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Total estimado: " + (items.some(function (item) { return getStoredCartPrice(item) != null; }) ? formatMoney(total) : "Sin calcular"), margin, y);
        y += 18;
        doc.setFont("helvetica", "normal");
        doc.text("Este archivo es un ejemplo de pedido para compartir con el cliente.", margin, y);

        doc.save("pedido-pintofruta.pdf");
    }

    function bindActions() {
        document.addEventListener("click", function (event) {
            var addButton = event.target.closest("[data-demo-cart-add]");
            var removeButton = event.target.closest("[data-demo-cart-remove]");
            var downloadButton = event.target.closest("[data-demo-cart-download]");
            var clearButton = event.target.closest("[data-demo-cart-clear]");
            var productLink = event.target.closest("a[href*='detallearticulo.html'], a[href*='/DetalleArticulo/'], a[data-open-product-detail]");
            var localRouteNode = event.target.closest("[onclick]");

            if (addButton) {
                event.preventDefault();
                var qtyNode = addButton.closest(".pf-product-modal__info, .product-modal-info, .detail-info, [data-cart-root], .product-card, .related-card");
                var qtyInput = qtyNode ? qtyNode.querySelector("[data-pf-product-qty], input.qty-input, input[type='number']") : null;
                var qty = qtyInput ? parseInt(qtyInput.value || "1", 10) : parseInt(addButton.getAttribute("data-cart-qty") || "1", 10);
                upsertCartItem({
                    id: addButton.getAttribute("data-cart-id"),
                    sku: addButton.getAttribute("data-cart-sku"),
                    name: addButton.getAttribute("data-cart-name"),
                    brand: addButton.getAttribute("data-cart-brand"),
                    href: normalizeRoute(addButton.getAttribute("data-cart-href")),
                    image: addButton.getAttribute("data-cart-image"),
                    qty: isNaN(qty) || qty <= 0 ? 1 : qty,
                    price: null,
                });
                return;
            }

            if (removeButton) {
                event.preventDefault();
                removeCartItem(removeButton.getAttribute("data-demo-cart-remove"));
                return;
            }

            if (downloadButton) {
                event.preventDefault();
                downloadPdf();
                return;
            }

            if (clearButton) {
                event.preventDefault();
                clearCart();
                return;
            }

            if (productLink) {
                event.preventDefault();
                if (window.PFProductModal && typeof window.PFProductModal.openFromLink === "function") {
                    window.PFProductModal.openFromLink(productLink);
                    return;
                }
                var targetHref = normalizeRoute(productLink.getAttribute("href") || "");
                if (targetHref) {
                    window.location.href = targetHref;
                }
                return;
            }

            if (localRouteNode) {
                var onclick = localRouteNode.getAttribute("onclick") || "";
                if (/greenco\.com\.ar\/Galeria\/|greenco\.com\.ar\/Seguridad\/Register|\/Galeria\//i.test(onclick)) {
                    var routeMatch = onclick.match(/(?:greenco\.com\.ar)?\/?Galeria\/([^'"]+)/i);
                    if (routeMatch) {
                        event.preventDefault();
                        window.location.href = normalizeRoute("/Galeria/" + routeMatch[1].split("?")[0]);
                    }
                }
            }
        }, true);
    }

    function patchNativeCart() {
        if (!window.MiniCart) {
            return;
        }

        window.MiniCart.getAndUpdate = function () {
            renderMiniCart();
        };

        window.MiniCart.actualizar = function () {
            renderMiniCart();
        };

        window.MiniCart.actualizarCantidadArticulos = function () {
            var count = cartCount();
            document.querySelectorAll("#carritoCantidad").forEach(function (node) {
                node.textContent = String(count);
            });
        };

        window.MiniCart.vaciar = function () {
            clearCart();
        };
    }

    function renderAll() {
        rewriteDomRoutes(document);
        renderDemoButtons();
        patchNativeCart();
        renderMiniCart();
        updateCartCounters();
        renderOrderPage();
        rewriteDomRoutes(document);
    }

    function updateCartCounters() {
        var count = cartCount();
        document.querySelectorAll("#carritoCantidad").forEach(function (node) {
            node.textContent = String(count);
        });
        var floating = document.getElementById("demoFloatingCartButton");
        if (floating) {
            floating.textContent = "Pedido (" + String(count) + ")";
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        bindActions();
        renderAll();
        ensureFloatingCartButton();
    });

    window.PFDemoCircuit = {
        normalizeRoute: normalizeRoute,
        renderAll: renderAll,
        cartCount: cartCount,
        cartItems: cartItems
    };
})();
