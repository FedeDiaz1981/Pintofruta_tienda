(function () {
    const STORAGE_KEY = "pintofruta-auth-v1";
    const DEMO_EMAIL = "demo@gmail.com";
    const DEMO_PASSWORD = "demo";
    const listeners = new Set();
    let widgetReady = false;

    function safeParse(raw) {
        try {
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    let session = safeParse(localStorage.getItem(STORAGE_KEY));

    function persist() {
        if (session) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        listeners.forEach((fn) => {
            try {
                fn(session);
            } catch {
                // noop
            }
        });
    }

    function ensureSessionWidget() {
        if (widgetReady || typeof document === "undefined") {
            return;
        }
        widgetReady = true;

        const style = document.createElement("style");
        style.textContent = `
            .pf-session-badge {
                position: fixed;
                top: 14px;
                right: 14px;
                z-index: 10060;
                display: none;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 999px;
                background: rgba(21, 32, 47, 0.92);
                color: #fff;
                box-shadow: 0 16px 30px rgba(21, 32, 47, 0.22);
                border: 1px solid rgba(255,255,255,0.16);
                backdrop-filter: blur(10px);
                font-size: 13px;
                line-height: 1;
            }
            .pf-session-badge.is-visible { display: inline-flex; }
            .pf-session-badge__name {
                font-weight: 700;
                white-space: nowrap;
                max-width: 180px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .pf-session-badge__logout {
                appearance: none;
                border: 0;
                border-radius: 999px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #ffd36f, #f0a64b);
                color: #23170c;
                font: inherit;
                font-weight: 800;
                cursor: pointer;
                white-space: nowrap;
            }
            @media (max-width: 720px) {
                .pf-session-badge {
                    left: 14px;
                    right: 14px;
                    justify-content: space-between;
                    width: auto;
                }
                .pf-session-badge__name {
                    max-width: 50vw;
                }
            }
        `;
        document.head.appendChild(style);

        const badge = document.createElement("div");
        badge.id = "pfSessionBadge";
        badge.className = "pf-session-badge";
        badge.innerHTML = `
            <span class="pf-session-badge__name" data-pf-session-name></span>
            <button class="pf-session-badge__logout" type="button" data-pf-session-logout>Cerrar sesión</button>
        `;
        document.body.appendChild(badge);

        badge.addEventListener("click", function (event) {
            if (event.target && event.target.hasAttribute("data-pf-session-logout")) {
                event.preventDefault();
                if (window.PFAuth && typeof window.PFAuth.logout === "function") {
                    window.PFAuth.logout();
                }
            }
        });
    }

    function renderSessionWidget() {
        if (typeof document === "undefined") {
            return;
        }

        ensureSessionWidget();

        const badge = document.getElementById("pfSessionBadge");
        if (!badge) {
            return;
        }

        if (session && normalizeEmail(session.email) === DEMO_EMAIL) {
            const label = session.name || session.email || "Usuario demo";
            const nameNode = badge.querySelector("[data-pf-session-name]");
            if (nameNode) {
                nameNode.textContent = label;
            }
            badge.classList.add("is-visible");
        } else {
            badge.classList.remove("is-visible");
        }
    }

    function normalizeEmail(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isAuthenticated() {
        return Boolean(session && normalizeEmail(session.email) === DEMO_EMAIL);
    }

    function getUser() {
        return session;
    }

    function login(email, password) {
        const normalizedEmail = normalizeEmail(email);
        const normalizedPassword = String(password || "");
        if (normalizedEmail !== DEMO_EMAIL || normalizedPassword !== DEMO_PASSWORD) {
            return {
                ok: false,
                message: "Usa demo@gmail.com y la clave demo",
            };
        }

        session = {
            email: DEMO_EMAIL,
            name: "Usuario demo",
            role: "customer",
            loggedAt: new Date().toISOString(),
        };
        persist();
        return { ok: true, session };
    }

    function logout() {
        session = null;
        persist();
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    }

    function getDisplayPrice(product) {
        const publicPrice = Number(product && product.publicPrice ? product.publicPrice : 0);
        const memberPrice = Number(product && product.memberPrice ? product.memberPrice : publicPrice);
        return isAuthenticated() ? memberPrice : publicPrice;
    }

    function getDisplayPriceLabel() {
        return isAuthenticated() ? "Precio con descuento" : "Precio normal";
    }

    function onChange(fn) {
        if (typeof fn === "function") {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
        return () => {};
    }

    window.PFAuth = {
        login,
        logout,
        isAuthenticated,
        getUser,
        getDisplayPrice,
        getDisplayPriceLabel,
        formatPrice,
        onChange,
        demoEmail: DEMO_EMAIL,
    };

    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        session = safeParse(event.newValue);
        persist();
    });

    window.addEventListener("DOMContentLoaded", renderSessionWidget);
    window.addEventListener("load", renderSessionWidget);
    window.addEventListener("storage", renderSessionWidget);
    onChange(renderSessionWidget);
})();
