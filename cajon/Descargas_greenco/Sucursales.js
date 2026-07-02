var Sucursales = {

    init: function (config) {

        Sucursales.UrlDefinirSucursal = config.UrlDefinirSucursal;

        Sucursales.initEvents();

        if (!config.HaySucursalDefinida)
            Sucursales.showModal();
    },

    initEvents: function () {
        $('#cboSucursal').change(Sucursales.elegirSucursalHandler);
        $('#btnElegirSucursal').click(Sucursales.elegirSucursalDesdeModalHandler);
    },

    elegirSucursalHandler: function () {
        var sucursalId = $('#cboSucursal').val();
        if (sucursalId <= 0)
            return;

        Sucursales.definirSucursal(sucursalId);
    },

    elegirSucursalDesdeModalHandler: function () {
        var sucursalId = $('#cboSucursalModal').val();
        if (sucursalId <= 0)
            return;

        Sucursales.definirSucursal(sucursalId);
    },

    definirSucursal: function (sucursalId) {
        var url = this.UrlDefinirSucursal.replace("sucursalIdValue", sucursalId);
        window.location = url;
    },

    showModal: function () {
        $("#modalSucursal").modal({ backdrop: "static", keyboard: false });
    }
};