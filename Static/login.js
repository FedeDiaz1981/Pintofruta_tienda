(function () {
    function getReturnUrl() {
        var value = new URLSearchParams(window.location.search).get("return");
        if (!value) {
            return "index.html";
        }
        try {
            return decodeURIComponent(value);
        } catch {
            return "index.html";
        }
    }

    function renderStatus() {
        var status = document.getElementById("authStatus");
        if (!status) {
            return;
        }

        if (window.PFAuth && typeof window.PFAuth.isAuthenticated === "function" && window.PFAuth.isAuthenticated()) {
            var user = window.PFAuth.getUser ? window.PFAuth.getUser() : null;
            status.innerHTML = `
                <strong>Sesión activa</strong>
                <span>${user && user.email ? user.email : "demo@gmail.com"}</span>
                <div class="row">
                    <a class="button button-primary button-small" href="${getReturnUrl()}">Volver</a>
                    <button class="button button-secondary button-small" type="button" id="logoutButton">Cerrar sesión</button>
                </div>
            `;
            bindLogoutButton();
            return;
        }

        status.innerHTML = `
            <strong>Sesión actual</strong>
            <span>No hay una sesión iniciada.</span>
        `;
        bindLogoutButton();
    }

    function bindLogoutButton() {
        var button = document.getElementById("logoutButton");
        if (!button) {
            return;
        }
        button.addEventListener("click", function () {
            if (window.PFAuth && typeof window.PFAuth.logout === "function") {
                window.PFAuth.logout();
            }
            renderStatus();
        }, { once: true });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var form = document.getElementById("loginForm");
        var email = document.getElementById("loginEmail");
        var password = document.getElementById("loginPassword");

        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                if (!window.PFAuth || typeof window.PFAuth.login !== "function") {
                    return;
                }

                var result = window.PFAuth.login(email.value, password.value);
                if (!result.ok) {
                    alert(result.message || "Credenciales inválidas");
                    return;
                }

                window.location.href = getReturnUrl();
            });
        }

        renderStatus();

        if (window.PFAuth && typeof window.PFAuth.onChange === "function") {
            window.PFAuth.onChange(renderStatus);
        }
    });
})();
