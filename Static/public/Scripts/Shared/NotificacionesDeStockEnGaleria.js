var NotificacionesDeStockEnGaleria = {

    EsUsuarioLogueado: true,

    EnviandoSolicitud: false,

    init: function (configs) {

        var me = NotificacionesDeStockEnGaleria;

        me.EsUsuarioLogueado = configs.EsUsuarioLogueado;

        // no hay initEvents porque el evento lo estoy colgando directo desde html, porque los artículos se cargan progresivamente
        // con ajax. De enlazar el evento manualmente acá, habría que setear el evento para los artículos cargados por ajax en cada reload...
        // me pareció más complejo de lo que hacía falta
    },

    notificacionDeStockHandler: function (sender) {
        var me = NotificacionesDeStockEnGaleria;

        if (me.EnviandoSolicitud)
            return;

        if (!me.EsUsuarioLogueado) {
            var $notifContainer = $(sender).closest('.solicitud-notificacion-stock');
            $notifContainer.find('.notificacion-stock-logueo').slideToggle();
            return;
        }

        me.enviarNotificacion(sender);
    },

    enviarNotificacion: function (sender) {
        var me = NotificacionesDeStockEnGaleria;

        var $notifContainer = $(sender).closest('.solicitud-notificacion-stock');

        var articuloId = $notifContainer.attr('articuloid');
        if (isNaN(articuloId) || articuloId <= 0)
            return;

        me.EnviandoSolicitud = true;
        $notifContainer.find('.notificacion-stock-texto').html('Enviando solicitud...');

        var params = {
            articuloId: articuloId
        };

        $.ajax({
            type: "POST",
            url: myApp.Urls.SolicitarNotificacionDeStock,
            dataType: 'json',
            data: params,
            success: function (data) { this.enviarNotificacionCallback(data, $notifContainer); },
            context: me
        });
    },

    enviarNotificacionCallback: function (data, $notifContainer) {
        this.EnviandoSolicitud = false;

        if (data.Error) {
            $notifContainer.find('.notificacion-stock-texto').html('No se pudo enviar la solicitud. Haga click aquí para intentar nuevamente');

            MostrarNotificacionError(data);
            return;
        }

        $notifContainer.find('.notificacion-stock-texto').html('¡Solicitud enviada!');
        //Te avisaremos cuando entre nuevamente en stock <-- le saqué esa parte para que no modifique el tamaño de los recuadros
    }
};