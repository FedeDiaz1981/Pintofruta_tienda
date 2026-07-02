var Filtros = {

    init: function (config) {

        Filtros.url = config.url;

        $("#filtroPrecios").bootstrapSlider();

        Filtros.initEvents();
    },

    initEvents: function () {

        $('#sortingOption').change(Filtros.filtrar);
        //$('.filtroColores li').click(Filtros.filtrar); // paso esto directo al método que sigue
        Filtros.colorSelectorInit();
        $('.filtroTalles input').change(Filtros.filtrar);
        $('.filtroAtributos input').change(Filtros.filtrar);
        $('.filtroEtiquetas input').change(Filtros.filtrar);
        $("#filtroPrecios").on("slideStop", Filtros.filtrarPorPrecio);
        $('#precioMin, #precioMax').on('keyup change', delay(Filtros.filtrarPorPrecio, 1500));

        $("#filtroPrecios").on("slide", Filtros.preciosOnSlideHandler);

        $('.eliminarFiltro').click(Filtros.eliminarFiltro);
        $('.filter-del-btn').click(Filtros.eliminarFiltros);


        
        Filtros.showMoreInit();
    },

    colorSelectorInit: function () {
        $('.color-selector ul li').off('click'); // apago lo anterior porque era seleccion simple

        $('.color-selector ul li').click(function () {
            $(this).toggleClass('active');
            Filtros.filtrar();
        });
    },

    preciosOnSlideHandler: function () {
        Filtros.actualizarTextboxPrecios();
        var positionSlider = $(".slider").position();

        $("#filtroPrecios").css({
            left: positionSlider.left + $(".min-slider-handle").position().left,
            top: positionSlider.top - 30,
            position: 'absolute'
        });
    },

    eliminarFiltro: function () {
        var filtroAQuitar = $(this).attr('filtrourl');
        Filtros.filtrar(filtroAQuitar);
    },

    showMoreInit: function () {
        this.showMoreInitByFilter('.filtroColores');
        this.showMoreInitByFilter('.filtroTalles');
        this.showMoreInitByFilter('.filtroEtiquetas');

        var filtrosAtributos = $('.filtroAtributos');
        filtrosAtributos.each(function () {
            var filtro = $(this);
            Filtros.showMoreInitByFilter(filtro);
        });
    },

    showMoreInitByFilter: function (filtro) {
        if ($.type(filtro) == 'string')
            filtro = $(filtro);

        var lnkShowMore = filtro.find('.lnkShowMore');
        var step = lnkShowMore.attr('step');
        filtro.find('.divShowMore').slice(0, step).show();
        lnkShowMore.click(Filtros.showMoreHandler);

        if (!filtro.find('.divShowMore:hidden').exists())
            lnkShowMore.hide();
    },

    showMoreHandler: function (e) {
        e.preventDefault();
        var lnkShowMore = $(this);
        var filtro = lnkShowMore.closest('.filtroColores, .filtroTalles, .filtroAtributos, .filtroEtiquetas');
        var step = lnkShowMore.attr('step');
        filtro.find('.divShowMore:hidden').slice(0, step).slideDown();

        if (!filtro.find('.divShowMore:hidden').exists())
            lnkShowMore.fadeOut('slow');
    },

    filtrarPorPrecio: function () {
        // del de precios chequeo que haya cambiado porque puede ser un click sin cambio de valores
        var minPrecio = $("#precioMin").val();
        var maxPrecio = $("#precioMax").val();

        var minInicial = $("#precioMin").attr('initValue');
        var maxInicial = $("#precioMax").attr('initValue');

        if (minPrecio == minInicial && maxPrecio == maxInicial)
            return;

        Filtros.filtrar();
    },

    filtrar: function (filtroAQuitar) {
        var filtros = Filtros.getFiltros();

        if (filtroAQuitar)
            filtros = filtros.filter(x => x.url != filtroAQuitar)

        var urlParams = Filtros.armarParametrosUrl(filtros);
        window.location = Filtros.url + urlParams;
    },


    eliminarFiltros: function () {        
        window.location = Filtros.url;
    },

    getUrlConFiltros: function (url) {
        var filtros = this.getFiltros();

        var urlParams = this.armarParametrosUrl(filtros);
        return url + urlParams;
    },

    getFiltros: function () {
        var filtros = [];

        var filtroColores = this.getFiltroColores();
        if (filtroColores != null)
            filtros.push(filtroColores);

        var filtroTalles = this.getFiltroTalles();
        if (filtroTalles != null)
            filtros.push(filtroTalles);

        var filtroPrecios = this.getFiltroPrecios();
        if (filtroPrecios != null)
            filtros.push(filtroPrecios);

        var filtrosAtributos = this.getFiltrosAtributos();
        if (filtrosAtributos != null)
            filtros.push(...filtrosAtributos);

        var filtroEtiquetas = this.getFiltroEtiquetas();
        if (filtroEtiquetas != null)
            filtros.push(filtroEtiquetas);

        var filtroSort = this.getFiltroSort();
        if (filtroSort != null)
            filtros.push(filtroSort);

        var filtroBusqueda = this.getFiltroBusqueda();
        if (filtroBusqueda != null)
            filtros.push(filtroBusqueda);

        var filtroSubmenu = this.getFiltroSubmenu();
        if (filtroSubmenu != null)
            filtros.push(filtroSubmenu);

        return filtros;
    },

    getFiltroColores: function () {
        var filtroColores = $('.filtroColores');
        if (!filtroColores.exists())
            return;

        var coloresActivos = filtroColores.find('li.active');
        if (!coloresActivos.exists())
            return;

        var coloresIds = coloresActivos.map((i, e) => $(e).attr('opcionId')).get();

        var filtro = {
            url: filtroColores.attr('filtroUrl'),
            valor: coloresIds
        };

        return filtro;
    },

    getFiltroTalles: function () {
        var filtroTalles = $('.filtroTalles');
        if (!filtroTalles.exists())
            return;

        var tallesActivos = filtroTalles.find('input:checked');
        if (!tallesActivos.exists())
            return;

        var tallesIds = tallesActivos.map((i, e) => $(e).attr('opcionId')).get();

        var filtro = {
            url: filtroTalles.attr('filtroUrl'),
            valor: tallesIds
        }

        return filtro;
    },

    getFiltroPrecios: function () {
        var filtroPrecios = $("#filtroPrecios");
        if (!filtroPrecios.exists())
            return;

        var minPrecio = $("#precioMin").val();
        var maxPrecio = $("#precioMax").val();


        var minPosible = $("#precioMin").attr('min');
        var maxPosible = $("#precioMax").attr('max');

        if (minPrecio == minPosible && maxPrecio == maxPosible)
            return;

        var filtro = {
            url: filtroPrecios.attr('filtroUrl'),
            valor: minPrecio + '-' + maxPrecio
        }
        return filtro;
    },

    getFiltrosAtributos: function () {
        var filtrosAtributos = $('.filtroAtributos');
        if (!filtrosAtributos.exists())
            return;

        var filtros = [];

        filtrosAtributos.each(function () {
            var filtroAtributos = $(this);
            var atributosActivos = filtroAtributos.find('input:checked');
            if (!atributosActivos.exists())
                return;

            var atributosIds = atributosActivos.map((i, e) => $(e).attr('opcionId')).get();

            var filtro = {
                url: filtroAtributos.attr('filtroUrl'),
                valor: atributosIds
            }

            filtros.push(filtro);
        });

        return filtros;
    },

    getFiltroEtiquetas: function () {
        var filtroEtiquetas = $('.filtroEtiquetas');
        if (!filtroEtiquetas.exists())
            return;

        var etiquetasActivas = filtroEtiquetas.find('input:checked');
        if (!etiquetasActivas.exists())
            return;

        var etiquetasIds = etiquetasActivas.map((i, e) => $(e).attr('opcionId')).get();

        var filtro = {
            url: filtroEtiquetas.attr('filtroUrl'),
            valor: etiquetasIds
        }

        return filtro;
    },

    getFiltroSort: function () {
        var sortingOption = $('#sortingOption').val();
        if (sortingOption == '')
            return;

        var filtro = {
            url: 'sortingOption',
            valor: sortingOption
        }

        return filtro;
    },

    getFiltroBusqueda: function () {
        var valorBusqueda = $('input[name="valorBusqueda"]').val();
        if (valorBusqueda == '')
            return;

        var filtro = {
            url: 'valorBusqueda',
            valor: valorBusqueda
        }

        return filtro;
    },

    getFiltroSubmenu: function () {
        var subMenuIdString = $('select.categoriaBusqueda').children("option:selected").val();
        if (subMenuIdString == '')
            return;

        var filtro = {
            url: 'subMenuIdString', // TODO: RUBY - cambiar esta url del averrrrno
            valor: subMenuIdString
        }

        return filtro;
    },

    armarParametrosUrl: function (filtros) {
        if (!$.isArray(filtros) || filtros.length == 0)
            return '';

        var paramsUrl = '';
        filtros.forEach(function (filtro) {

            if (paramsUrl != '')
                paramsUrl += '&';

            paramsUrl += filtro.url + '=';

            var valor = filtro.valor;
            if ($.isArray(valor))
                valor = valor.join();

            paramsUrl += valor;
        })

        return '?' + paramsUrl;
    },

    actualizarTextboxPrecios: function () {
        var arrPrecios = $("#filtroPrecios").val().split(',');
        if (!$.isArray(arrPrecios) || arrPrecios.length < 2)
            return;

        var min = arrPrecios[0];
        var max = arrPrecios[1];
        $("#precioMin").val(min);
        $("#precioMax").val(max);
    }

};