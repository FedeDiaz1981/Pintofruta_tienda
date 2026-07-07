(function($) {
    "use strict";

    function shouldShowPromoModal() {
        var host = window.location.hostname;
        return host === "localhost" || host === "127.0.0.1" || host === "::1";
    }

    $(window).on('load', function() {
        if (shouldShowPromoModal()) {
            $('#exampleModal').modal('show');
        }
    });

    $(document).on('click', '#exampleModal .close', function (e) {
        e.preventDefault();
        $('#exampleModal').modal('hide');
    });

    $('#exampleModal').on('click', function (e) {
        if (e.target === this) {
            $('#exampleModal').modal('hide');
        }
    });

    $('#exampleModal').on('hidden.bs.modal', function () {
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    });

    function openSearch() {
        document.getElementById("search-overlay").style.display = "block";
    }

    function closeSearch() {
        document.getElementById("search-overlay").style.display = "none";
    }
  
})(jQuery);

  function dismiss(){
    document.getElementById('dismiss').style.display='none';
};
