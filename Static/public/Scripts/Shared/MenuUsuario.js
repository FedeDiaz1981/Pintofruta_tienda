var MenuUsuario = {

    keyHandler: function (event) {
        MenuUsuario.ocultarError();

        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13')
            MenuUsuario.validarUsuarioHandler();    
    },

    //#region ValidarUsuario
    validarUsuarioHandler: function () {

        var params = MenuUsuario.getParams();
        if (params == null)
            return;

        if (params.hayError) {
            MenuUsuario.mostrarError(params.error);
            return;
        }

        MenuUsuario.validarUsuario(params.usuario, params.password);
    },

    validarUsuario: function (usuario, pass) {
        var params = {
            usuario: usuario,
            password: pass
        };

        $.ajax({
            type: "POST",
            url: myApp.Urls.ValidarUsuario,
            data: params,
            dataType: "json",
            success: this.validarUsuarioCallback,
            context: this
        });
    },

    validarUsuarioCallback: function (data) {
        if (data.Error || data.Invalido) {
            this.borrarPassword();
            this.mostrarError("El usuario o la contraseña son incorrectos");
            return;
        }

        this.submit();
    },
    //#endregion

 
    //#region AUX
    getParams: function () {
        var usuario = $('#nombreMenuLogin').val();
        var password = $('#passwordMenuLogin').val();

        var params = {
            usuario: usuario,
            password: password
        };

        this.validarParams(params);

        return params;
    },

    validarParams: function (params) {
        var error = "";
        if (params.usuario == "")
            error = "Complete el usuario";

        if (params.password == "") {
            if (error != "")
                error += "<br/>";
            error += "Complete la contraseña";
        }

        if (error != "") {
            params.hayError = true;
            params.error = error;
        }
    },

    mostrarError: function (error) {
        var vs = $('#validatorLogInMenu');
        vs.html(error);
        vs.show();  
    },

    ocultarError: function () {
        $('#validatorLogInMenu').hide();
    },

    submit: function () {
        $("#frmLoginMenu").submit();
    },

    borrarPassword: function () {
        $('#passwordMenuLogin').val("");
    }
    //#endregion
};