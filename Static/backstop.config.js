module.exports = {
  id: "pintofruta-responsive",
  viewports: [
    {
      label: "desktop-wide",
      width: 1440,
      height: 900
    },
    {
      label: "laptop",
      width: 1366,
      height: 768
    },
    {
      label: "tablet",
      width: 1024,
      height: 1366
    },
    {
      label: "tablet-landscape",
      width: 1366,
      height: 1024
    },
    {
      label: "mobile-large",
      width: 430,
      height: 932
    },
    {
      label: "mobile-small",
      width: 390,
      height: 844
    }
  ],
  onBeforeScript: "puppet/onBefore.js",
  onReadyScript: "backstop/onReady.js",
  scenarios: [
    {
      label: "Home",
      url: "http://127.0.0.1:8787/index.html",
      readyEvent: "",
      readySelector: "",
      delay: 5000,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay", ".nav-nav .pixelstrap.sm-horizontal.mobile-menu-open", ".hero-carousel-shell", ".sub-footer", "#trendProductsSwiper", ".trend-swiper"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: "Busqueda",
      url: "http://127.0.0.1:8787/busqueda.html",
      readyEvent: "",
      readySelector: "",
      delay: 2500,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay", ".nav-nav .pixelstrap.sm-horizontal.mobile-menu-open", ".hero-carousel-shell", ".sub-footer", "#trendProductsSwiper", ".trend-swiper"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: "Galeria",
      url: "http://127.0.0.1:8787/galeria.html",
      readyEvent: "",
      readySelector: "",
      delay: 2500,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay", ".nav-nav .pixelstrap.sm-horizontal.mobile-menu-open", ".hero-carousel-shell", ".sub-footer", "#trendProductsSwiper", ".trend-swiper"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.2,
      requireSameDimensions: true
    },
    {
      label: "DetalleArticulo",
      url: "http://127.0.0.1:8787/detallearticulo.html",
      readyEvent: "",
      readySelector: "",
      delay: 2500,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay", ".nav-nav .pixelstrap.sm-horizontal.mobile-menu-open", ".hero-carousel-shell", ".sub-footer", "#trendProductsSwiper", ".trend-swiper"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.2,
      requireSameDimensions: true
    },
    {
      label: "AdminDemo",
      url: "http://127.0.0.1:8787/admin-demo.html",
      readyEvent: "",
      readySelector: "#panelApp",
      delay: 3500,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.15,
      requireSameDimensions: true
    },
    {
      label: "Carrito",
      url: "http://127.0.0.1:8787/carrito.html",
      readyEvent: "",
      readySelector: "",
      delay: 2500,
      hideSelectors: [".modal-backdrop", "#exampleModal", ".tap-top", "#cart_side", "#myAccount", ".boton-whatsapp", ".sm-jquery-disable-overlay", ".nav-nav .pixelstrap.sm-horizontal.mobile-menu-open", ".hero-carousel-shell", ".sub-footer", "#trendProductsSwiper", ".trend-swiper"],
      removeSelectors: [],
      hoverSelector: "",
      clickSelector: "",
      postInteractionWait: 0,
      selectors: [],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.25,
      requireSameDimensions: true
    }
  ],
  paths: {
    bitmaps_reference: "backstop_data/bitmaps_reference",
    bitmaps_test: "backstop_data/bitmaps_test",
    engine_scripts: "backstop_data/engine_scripts",
    html_report: "backstop_data/html_report",
    ci_report: "backstop_data/ci_report"
  },
  report: ["browser"],
  engine: "puppeteer",
  engineOptions: {
    args: ["--no-sandbox"]
  },
  misMatchThreshold: 0.15,
  asyncCaptureLimit: 2,
  asyncCompareLimit: 20,
  debug: false,
  debugWindow: false
};
