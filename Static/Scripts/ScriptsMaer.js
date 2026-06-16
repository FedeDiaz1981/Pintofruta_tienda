
function removeItemFromCart(id, name, price, qty, url, opencart) {
    if (typeof ga === 'function') {
        ga('ec:addProduct', {
            'id': id,
            'name': name,
            'category': '', /*category,*/
            'brand': '',/*brand,*/
            //'variant': variant,
            'price': price,
            'quantity': qty
        });
        ga('ec:setAction', 'remove');
        ga('send', 'event', 'UX', 'click', 'remove from cart');     // Send data using an event.
    }

    if (opencart)
        MiniCart.abrir();



    //ActualizarCantidadEnCarrito();

};

function isLocalPreview() {
    return window.location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
}

function showGenericModal(event) {
    var src = event.target || event.srcElement;

    // find the parent that contains proper decorations
    var url = $(src).closest("*[data-url]").data('url');

    // trigger an HTTP GET
    $.get(url, function (data) {
        // fill content and show modal
        $('#modalGeneric').html(data);
        $('#modalGeneric').modal('show');
    });
}


function ActualizarSubTotales(cant, decimales = 2, cultureInfo = 'es-AR', currencySymbol = '$ ') {
    var subtotal = parseFloat(0);
    var cantidadTotal = parseFloat(0);
    var descuentos = 0;

    $(".txtCantidad").each(function () {
        var precio = this.getAttribute("precio");
        var precioEspecial = this.getAttribute("precioEspecial");
        var multiplicadorUnidadesxCaja = this.getAttribute("multiplicadorUnidadesxCaja") ?? 1;

        var hayModificadorDePrecioConLeyenda = (this.getAttribute("hayModificadorDePrecioConLeyenda") ?? 'false') == 'true';
        var cantidadDeModificadorDePrecio = parseInt(this.getAttribute("cantidadDeModificadorDePrecio") ?? '0');
        var precioModificado = parseFloat(this.getAttribute("precioModificado") ?? '0');

        var value = (this.value == undefined || this.value == '') ? 0 : this.value;
        var cantidad = cant != undefined ? cant : parseInt(value);
        cantidad = cantidad * multiplicadorUnidadesxCaja;

        if (precioEspecial != 0 && precioEspecial != null) {
            descuentos += (precio - precioEspecial) * cantidad;
            precio = precioEspecial;
        }

        cantidadTotal += cantidad;

        var importe = 0;

        if (hayModificadorDePrecioConLeyenda) {
            var cantAPrecioModificado = Math.trunc(cantidad / cantidadDeModificadorDePrecio) * cantidadDeModificadorDePrecio;
            importe = precioModificado * cantAPrecioModificado + (cantidad % cantidadDeModificadorDePrecio) * precio;
        } else {
            importe = cantidad * precio;
        }

        subtotal += parseFloat(importe.toFixed(decimales));
    });

    var subTotalText = new Intl.NumberFormat(cultureInfo).format(subtotal);

    //var subTotalText = '$ ' + subtotal.toFixed(decimales);
    $('#subtotal').text(currencySymbol + subTotalText);
    $('#lblSubTotalPrecio').html(currencySymbol + subTotalText);
    $('#lblSubTotalCantidad').html(cantidadTotal);

    if (descuentos > 0) {
        $('#eliminable').remove();
        $('#DescuentosAplicados').show();
        var row = '<tr id="eliminable">' +
            '<td> Descuentos: </td>' +
            '<td>' + currencySymbol + new Intl.NumberFormat(cultureInfo).format(descuentos.toFixed(decimales)) + '</td>' +
            '</tr>';

        $('#DetallesDescuentosAplicados').append(row);
    } else {
        $('#DescuentosAplicados').hide();

    }

};

// TODO: RUBY - sacar esta funcion de donde se use -> ActualizarCantidadEnCarrito - Tienen que traer ya por callback las cosas o llamar de última a MiniCart.actualizarCantidadArticulos()
function ActualizarCantidadEnCarrito() {
    if (isLocalPreview()) {
        return;
    }
    $.ajax({
        type: "POST",
        url: myApp.Urls.GetCantidadArticulosCarrito,
        data: "",
        success: function (data) {
            $("#carritoCantidad").html(data.CantidadArticulos);
        }
    });
}


function EstoyEn(UrlPath) {

    var pathCompletoActual = window.location.pathname.substring(1);

    if (UrlPath.includes("/"))
        return pathCompletoActual.toLowerCase() == UrlPath.toLowerCase();

    var splitPathActual = pathCompletoActual.split('/');
    var pathActual = splitPathActual[splitPathActual.length - 1];

    return pathActual.toLowerCase() == UrlPath.toLowerCase();
};

//LoadMask = {
//    show: function (mensajeCustom) {
//        if (mensajeCustom) {
//            $('#LoadMaskMessage').text(mensajeCustom);
//        }

//        $('#loadMask').modal('show');
//    },

//    hide: function () {
//        $('#loadMask').modal('hide');
//    },
//};

function MostrarPopUp() {
    if (isLocalPreview()) {
        return;
    }

    $.post(myApp.Urls.MostrarPopUp, function (data) {
        $(data).modal('show');
        $("#popUpModal").appendTo("body");
    });
};

function MostrarNotificacionError(data) {
    if (!data.Error)
        return;

    var mensaje = 'Ocurrió un error. Vuelva a intentar m&aacutes tarde';
    if (data.EsEcommerceException)
        mensaje = data.Mensaje;

    MostrarNotificacion(true, 'Atenci&oacute;n', mensaje, true);
};

function MostrarNotificacionFront(titulo, mensaje, error) {
    MostrarNotificacion(true, titulo, mensaje, error);
};

function MostrarNotificacionBack(titulo, mensaje, error) {
    MostrarNotificacion(false, titulo, mensaje, error);
};

function MostrarNotificacion(esFront, titulo, mensaje, error) {
    if (error == undefined)
        error = false;

    if (isLocalPreview()) {
        if (titulo != undefined && mensaje != undefined && error != undefined) {
            Notificacion.show(esFront, titulo, mensaje, error);
        }
        return;
    }

    //Si no se le paso a mano el titulo el mensaje y el error, va al back a buscar el popupdata seteado.
    if (titulo != undefined && mensaje != undefined && error != undefined) {
        Notificacion.show(esFront, titulo, mensaje, error);
    }
    else {
        $.ajax({
            url: myApp.Urls.MostrarNotificacion,
            data: '',
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                Notificacion.show(esFront, response.titulo, response.mensaje, response.error);
            }
        });
    }
};

Notificacion = {
    show: function (esFront, titulo, mensaje, error) {
        $.notify({
            icon: error ? "fa fa-circle" : "fa fa-check",
            title: titulo,
            message: mensaje
        }, {
            element: 'body',
            position: null,
            type: error ? "error" : "success",
            allow_dismiss: true,
            newest_on_top: false,
            showProgressbar: !error,
            placement: {
                from: "top",
                align: "right"
            },
            offset: 20,
            spacing: 10,
            z_index: 10031,
            delay: esFront ? (error ? myApp.Notificaciones.delayError : myApp.Notificaciones.delay) : 0,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            },
            icon_type: 'class',
            template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
                '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">x</button>' +
                '<span class = "alert-{0}" data-notify="icon"></span> ' +
                '<span class = "alert-{0}" data-notify="title">{1}</span> ' +
                '<span class = "alert-{0}" data-notify="message">{2}</span>' +
                '<div class="progress" data-notify="progressbar">' +
                '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                '</div>' +
                '<a href="{3}" target="{4}" data-notify="url"></a>' +
                '</div>'
        });
    },
};

function recargarComboHandler(cboSelector, url, paramProp) {
    return function () {
        var params = {};
        params[paramProp] = $(this).val();

        combo = $(cboSelector);
        combo.find('option').remove().end().append('<option value="">--Seleccione--</option>').val('');

        $.ajax({
            type: "POST",
            url: url,
            data: params,
            datatype: "json",
            success: function (data) {
                if (data.Error)
                    return;

                $.each(data.Lista, (i, e) => {
                    combo.append('<option value="' + e.Value + '">' + e.Text + '</option>');
                });
            }
        });
    }
}

// EXTENSIONES JQuery - si hay varias hay que sacarlas a otro archivo
$.fn.exists = function () {
    return this.length !== 0;
}

$.fn.scrollPosReaload = function () {
    if (localStorage) {
        var posReader = localStorage["posStorage"];
        if (posReader) {
            $(window).scrollTop(posReader);
            localStorage.removeItem("posStorage");
        }
        $(this).click(function (e) {
            localStorage["posStorage"] = $(window).scrollTop();
        });
        return true;
    }
    return false;
}


function delay(fn, ms) {
    let timer = 0
    return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function hidetopheaderonScroll() {
    var prevScrollpos = window.pageYOffset;
    window.onscroll = function () {
        var currentScrollPos = window.pageYOffset;
        if (prevScrollpos > currentScrollPos) {
            document.getElementsByClassName("top-header")[0].style.top = "0";
        } else {
            document.getElementsByClassName("top-header")[0].style.top = "-50px";
        }
        prevScrollpos = currentScrollPos;
    }
}

$(document).ajaxError(function (event, request, settings) {
    if (settings.error != undefined)
        return;

    if (settings.success == undefined)
        return;

    if (request.responseJSON) {
        if (settings.context == undefined)
            settings.success(request.responseJSON);
        else
            settings.success.bind(settings.context, request.responseJSON)();
    }
})


$.validator.unobtrusive.adapters.add('requiredif', ['dependentproperty', 'desiredvalue'], function (options) {
    options.rules['requiredif'] = options.params;
    options.messages['requiredif'] = options.message;
});

$.validator.addMethod('requiredif', function (value, element, parameters) {
    var desiredvalue = parameters.desiredvalue;
    desiredvalue = (desiredvalue == null ? '' : desiredvalue).toString();
    var controlType = $("input[id$='" + parameters.dependentproperty + "']").attr("type");
    var actualvalue = {}
    if (controlType == "checkbox" || controlType == "radio") {
        var control = $("input[id$='" + parameters.dependentproperty + "']:checked");
        actualvalue = control.val();
    } else {
        actualvalue = $("#" + parameters.dependentproperty).val();
    }
    if ($.trim(desiredvalue).toLowerCase() === $.trim(actualvalue).toLocaleLowerCase()) {
        var isValid = $.validator.methods.required.call(this, value, element, parameters);
        return isValid;
    }
    return true;
});


var messages;
var time;



$(document).ready(function () {
    if (isLocalPreview()) {
        return;
    }
    $.ajax({
        type: "POST",
        url: myApp.Urls.GetMensajesRotativos,
        dataType: 'json',
        success: function (data) {
            if (data.Mensajes) { 
            messages = data.Mensajes.split('\r\n').filter(Boolean);
                time = data.Tiempo;
            }
        },
        context: this
    });
});

var intervalID;

function changeTitle() {
    if (messages.length > 0) {
        document.title = messages.shift();
        messages.push(document.title);
    }
}

document.addEventListener("visibilitychange", function () {
    if (messages == undefined) { return; }
    if (document.hidden && messages.length > 0) {
        if (document.title != undefined) {
            document.oldTitle = document.title;
            intervalID = setInterval(changeTitle, time);
        }
    } else {
        clearInterval(intervalID);
        if (document.oldTitle == undefined) {
            document.oldTitle = document.title;
        }
        document.title = document.oldTitle;
    }
});
