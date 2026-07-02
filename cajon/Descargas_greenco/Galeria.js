var Galeria = {

    init: function () {
        $("div#loading").hide();

        Galeria.initEvents();
        Galeria.conectarConMiniCart();
    },

    initEvents: function () {
        $('#contenedorArticulos')
            .off('click', '.add-button:not(.add-button-cajas)')
            .on('click', '.add-button:not(.add-button-cajas)', Galeria.agregarHandler);

        $('#contenedorArticulos')
            .off('click', '.add-button-sin-cantidad .add-button-cajas')
            .on('click', '.add-button-sin-cantidad .add-button-cajas', Galeria.agregarCajaHandler);

        $('#contenedorArticulos')
            .off('click', '.quantity-right-plus')
            .on('click', '.quantity-right-plus', Galeria.sumarHandler);

        $('#contenedorArticulos')
            .off('click', '.quantity-left-minus')
            .on('click', '.quantity-left-minus', Galeria.restarHandler);

        $('#contenedorArticulos')
            .off('keyup', '.qty-input')
            .on('keyup', '.qty-input', Galeria.cantidadKeyUpHandler);

        $('#contenedorArticulos')
            .off('click', '.cajas-arriba')
            .on('click', '.cajas-arriba', Galeria.sumarCajaHandler);

        $('#contenedorArticulos')
            .off('click', '.cajas-abajo')
            .on('click', '.cajas-abajo', Galeria.restarCajaHandler);
    },

    getDivDatos: function (el) {
        var div = $(el).closest('.add-button-datos');
        if (div.exists())
            return div;

        // esto es por si en el front sobreescribieron el PartialArticuloMiniatura... igual hay que ir arreglando los fronts para que no lo sobreescriban
        div = $(el).closest('.addtocart_btn');
        return div
    },

    agregarHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');
        var step = Galeria.getStep(div);

        input.val(step);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    sumarHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');

        var cantidad = parseInt(input.val());
        if (isNaN(cantidad) || cantidad < 0)
            cantidad = 0;

        var step = Galeria.getStep(div);

        cantidad += step;

        input.val(cantidad);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    restarHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');

        var cantidad = parseInt(input.val());
        if (isNaN(cantidad))
            cantidad = 0;
        else {
            var step = Galeria.getStep(div);

            cantidad -= step;

            if (cantidad < 0)
                cantidad = 0;
        }

        input.val(cantidad);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    cantidadKeyUpHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    agregarCajaHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');
        var cantxcaja = Galeria.getCantXCaja(div);

        input.val(cantxcaja);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    sumarCajaHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');

        var cantidad = parseInt(input.val());
        if (isNaN(cantidad) || cantidad < 0)
            cantidad = 0;

        var cantxcaja = Galeria.getCantXCaja(div);

        cantidad = (Math.trunc(cantidad / cantxcaja) + 1) * cantxcaja;

        input.val(cantidad);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },

    restarCajaHandler: function () {
        var div = Galeria.getDivDatos(this);
        if (!div.exists())
            return;

        var input = div.find('.qty-input');

        var cantidad = parseInt(input.val());
        if (isNaN(cantidad))
            cantidad = 0;
        else {
            var cantxcaja = Galeria.getCantXCaja(div);

            cantidad = Math.trunc((cantidad - 1) / cantxcaja) * cantxcaja;

            if (cantidad < 0)
                cantidad = 0;
        }

        input.val(cantidad);

        Galeria.actualizarCarritoDesdeMiniatura(div);
    },


    timers: {},

    actualizarCarritoDesdeMiniatura: function (div) {

        var articuloId = div.attr('articuloid'),
            input = div.find('.qty-input'),
            cantidad = input.val(),
            cantidadPrevia = input.attr('oldvalue');

        // Si es vacío no actualizo enseguida, dejo que se actualice en el callback, para darles tiempo a escribir.
        // De lo contrario, si borraba todo con backspace, inmediatamente aparecía el "Agregar" y no podía escribir el número que quería.
        if (cantidad != "")
            Galeria.actualizarBoton(div);

        // actualizo el botón pero luego seteo un timeout para mandar la info al server una vez que se termine de modificar el valor

        clearTimeout(Galeria.timers[articuloId]);

        Galeria.timers[articuloId] = setTimeout(function () {
            delete Galeria.timers[articuloId];
            Galeria.actualizarCarritoDesdeMiniaturaTimeout(articuloId, cantidad, cantidadPrevia);
        }, 1000);
    },

    actualizarCarritoDesdeMiniaturaTimeout: function (articuloId, cantidad, cantidadPrevia) {
        if (cantidad > 0) {

            var valoresPrevios = {
                ArticuloId: articuloId,
                Cantidad: cantidadPrevia
            };

            Galeria.agregar(articuloId, cantidad, "", valoresPrevios);

        } else {

            Galeria.eliminar(articuloId, cantidadPrevia);
        }
    },

    agregarAlCarritoDesdeGrilla: function () {
        var arr = [];

        $(".txtCantidad").each(function () {
            var cantidad = this.value == "" ? 0 : this.value;
            var articuloId = this.getAttribute("articuloId");
            var observacion = $("#txtObservacionDetallePedido").val() != undefined
                ? $("#txtObservacionDetallePedido").val()
                : $("#txtObservacionDetallePedido_" + articuloId).val();

            var p = {
                ArticuloId: articuloId,
                Cantidad: cantidad,
                Observaciones: observacion
            };
            arr.push(p);
        });

        Galeria.agregarMultiple(arr);
    },

    //#region Agregar
    agregar: function (articuloId, cantidad, obs, valoresPrevios, callback) {
        var params = {
            ArticuloId: articuloId,
            Cantidad: cantidad,
            Observaciones: obs
        };

        if (valoresPrevios) {
            var huboCambio = valoresPrevios.Cantidad != cantidad;
            if (!huboCambio)
                return;
        }

        // TODO: RUBY - considerar pasar como parametro que datos/partial traer del callback, por si se llama de distintos lugares
        $.ajax({
            type: "POST",
            url: myApp.Urls.AgregarArticulo,
            dataType: 'json',
            data: params,
            success: function (data) { this.agregarCallback(data, valoresPrevios, callback); },
            context: this
        });
    },

    agregarCallback: function (data, valoresPrevios, callback) {
        if (data.Error) {
            this.actualizarDetalle(valoresPrevios);
            MostrarNotificacionError(data);
            return;
        }

        this.actualizarDetalle(data.Detalle);
        //this.actualizarDetalleEnQuickView(data.Detalle);
        this.actualizarDetalleEnDetalleArticulo(data.Detalle);

        MiniCart.actualizar(data.MiniCart);
        MiniCart.actualizarCantidadArticulos(data.CantidadArticulos);

        if (callback)
            callback(data);

        var unidad = data.Detalle.Cantidad == 1 ? "unidad" : "unidades";
        var msj = "Hay " + data.Detalle.Cantidad + " " + unidad + " de este artículo en el carrito";
        MostrarNotificacionFront(myApp.Notificaciones.Felicitaciones, msj);

        if (data.AbrirMinicart)
            MiniCart.abrir();

        if (valoresPrevios) {
            data.GoogleAnalytics.Qty -= valoresPrevios.Cantidad;
            if (data.GoogleAnalytics.Qty < 1) {
                data.GoogleAnalytics.Qty = -1 * data.GoogleAnalytics.Qty;
                //GoogleAnalytics.eliminarArticulo(data.GoogleAnalytics);
                GoogleAnalytics4.removeFromCart(data.GoogleAnalytics);
            }
            else {
                //GoogleAnalytics.agregarArticulo(data.GoogleAnalytics);
                GoogleAnalytics4.addToCart(data.GoogleAnalytics);
            }
        }
        else {
            //GoogleAnalytics.agregarArticulo(data.GoogleAnalytics);
            GoogleAnalytics4.addToCart(data.GoogleAnalytics);
        }
    },
    //#endregion

    //#region Agregar Múltiple
    agregarMultiple: function (arr) {
        var params = {
            Detalles: arr
        };

        // TODO: RUBY - considerar pasar valoresPrevios para volver atrás si algo falla
        // TODO: RUBY - considerar pasar como parametro que datos/partial traer del callback, por si se llama de distintos lugares
        $.ajax({
            type: "POST",
            url: myApp.Urls.AgregarArticulos,
            dataType: 'json',
            data: params,
            success: this.agregarMultipleCallback,
            context: this
        });
    },

    agregarMultipleCallback: function (data) {
        if (data.Error) {
            MostrarNotificacionError(data);
            return;
        }

        MiniCart.actualizar(data.MiniCart);
        MiniCart.actualizarCantidadArticulos(data.CantidadArticulos);

        var msj = "Hay " + data.CantidadAgregados + " unidades de estos artículos en el carrito";

        if (data.CantidadAgregados == 0)
            msj = "";

        var hayError = false;
        if (data.MensajeExtra)
        {
            msj += "\n" + data.MensajeExtra;
            hayError = true;
        }
        

        if (data.CantidadAgregados > 0) {
            MostrarNotificacionFront(myApp.Notificaciones.Felicitaciones, msj, hayError);
            if (data.AbrirMinicart)
                MiniCart.abrir();
        }
        else { MostrarNotificacionFront('', msj, hayError); }




        for (var i in data.GoogleAnalyticsList) {
            //GoogleAnalytics.agregarArticulo(data.GoogleAnalyticsList[i]);
            GoogleAnalytics4.addToCart(data.GoogleAnalyticsList[i]);
        }
    },
    //#endregion

    //#region Eliminar
    eliminar: function (articuloId, cantidadPrevia) {
        var params = {
            ArticuloId: articuloId,
            PedidoArticuloADevolverId: 0,
        };

        var valoresPrevios = {
            ArticuloId: articuloId,
            Cantidad: cantidadPrevia            
        };

        // TODO: RUBY - considerar pasar como parametro que datos/partial traer del callback, por si se llama de distintos lugares
        $.ajax({
            type: "POST",
            url: myApp.Urls.QuitarArticuloMiniCart, // TODO: RUBY - por ahora uso esta llamada, luego si requiere otro callback se cambia
            dataType: 'json',
            data: params,
            success: function (data) { this.eliminarCallback(data, valoresPrevios); },
            context: this
        });
    },

    eliminarCallback: function (data, valoresPrevios) {
        if (data.Error) {
            this.actualizarDetalle(valoresPrevios);
            MostrarNotificacionError(data);
            return;
        }

        var msj = "El artículo fue eliminado correctamente";
        MostrarNotificacionFront('', msj);

        var detalle = {
            ArticuloId: valoresPrevios.ArticuloId,
            Cantidad: 0
        };

        this.actualizarDetalle(detalle);

        MiniCart.actualizar(data.MiniCart);
        MiniCart.actualizarCantidadArticulos(data.CantidadArticulos);

        GoogleAnalytics4.removeFromCart(data.GoogleAnalytics);
    },
    //#endregion

    actualizarDetalle: function (data) {
        if (data == undefined)
            return;

        var div = $('#contenedorArticulos .add-button-datos[articuloid="' + data.ArticuloId + '"]');
        if (!div.exists()) {

            div = $('#contenedorArticulos .addtocart_btn[articuloid="' + data.ArticuloId + '"]');
            if (!div.exists())
                return;
        }

        var input = div.find('.qty-input');
        input.val(data.Cantidad);
        input.attr('oldvalue', data.Cantidad);

        this.actualizarBoton(div);
    },

    actualizarBoton: function (div) {
        if (!div)
            return;

        var input = div.find('.qty-input');
        var cantidad = input.val();

        if (div.hasClass('add-button-con-cajas'))
            this.actualizarBotonConCajas(div, cantidad);
        else
            this.actualizarBotonDefault(div, cantidad);
    },

    actualizarBotonDefault: function (div, cantidad) {
        var boton = div.find('.qty-box');
        var isOpen = boton.hasClass('open');

        if (cantidad <= 0 && isOpen)
            boton.removeClass('open');
        else if (cantidad > 0 && !isOpen)
            boton.addClass('open');
    },

    actualizarBotonConCajas: function (div, cantidad) {
        var conCantidad = div.hasClass('con-cantidad');

        if (cantidad <= 0 && conCantidad)
            div.removeClass('con-cantidad');
        else if (cantidad > 0 && !conCantidad)
            div.addClass('con-cantidad');


        var cantxcaja = this.getCantXCaja(div);
        var cantCajas = Math.trunc(cantidad / cantxcaja);

        var contenedorCantCajas = div.find('.cantidad-cajas');

        contenedorCantCajas.html(cantCajas);
    },

    //actualizarDetalleEnQuickView: function (data) {
    //    if (data == undefined)
    //        return;

    //    $("#qvPartial .txtCantidad").val(data.Cantidad);
    //},

    actualizarDetalleEnDetalleArticulo: function (data) {
        if (data == undefined)
            return;

        //$(".seleccion-articulo-combos .qty-box .txtCantidad").val(data.Cantidad);

        if (typeof DetalleArticuloCombos != 'undefined')
            DetalleArticuloCombos.actualizarCantidadPedida(data.ArticuloId, data.Cantidad);
    },

    getStep: function (div) {
        if (div == null)
            return 1;

        var step = parseInt(div.attr('step'));
        if (isNaN(step) || step <= 0)
            return 1;

        return step;
    },

    getCantXCaja: function (div) {
        if (div == null)
            return 1;

        var cantxcaja = parseInt(div.attr('cantxcaja'));
        if (isNaN(cantxcaja) || cantxcaja <= 0)
            return 1;

        return cantxcaja;
    },

    //#region Observer MiniCart
    conectarConMiniCart: function () {
        if (typeof MiniCart == 'undefined')
            return;

        MiniCart.registrar(this.onMiniCartEliminar, 'eliminar');
        MiniCart.registrar(this.onMiniCartVaciar, 'vaciar');
    },

    onMiniCartEliminar: function (tipoEvento, articuloId) {
        var data = {
            ArticuloId: articuloId,
            Cantidad: 0
        };

        Galeria.actualizarDetalle(data);
    },

    onMiniCartVaciar: function () {

        var divs = $('#contenedorArticulos .add-button-datos');

        // esto es por si en el front sobreescribieron el PartialArticuloMiniatura... igual hay que ir arreglando los fronts para que no lo sobreescriban
        if (!divs.exists())
            divs = $('#contenedorArticulos .addtocart_btn');

        divs.find('.qty-input').val(0).attr('oldvalue', 0);
        divs.find('.qty-box.open').removeClass('open');
    }
    //#endregion

};