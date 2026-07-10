module.exports = async (page, scenario, viewport) => {
  console.log(`SCENARIO > ${scenario.label} @ ${viewport.label}`);

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.setAttribute("data-backstop-disable-animations", "true");
    style.textContent = `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }

      .carousel,
      .swiper,
      .swiper-wrapper,
      .swiper-slide {
        transition: none !important;
      }

      .hero-carousel-shell .carousel-item {
        display: none !important;
      }

      .hero-carousel-shell .carousel-item:first-child {
        display: block !important;
      }
    `;
    document.head.appendChild(style);

    document.querySelectorAll(".carousel").forEach((node) => {
      try {
        if (window.jQuery && window.jQuery(node).carousel) {
          window.jQuery(node).carousel("pause");
        }
      } catch (error) {
        void error;
      }
    });

    document.querySelectorAll(".swiper").forEach((node) => {
      if (node.swiper && typeof node.swiper.autoplay !== "undefined") {
        try {
          node.swiper.autoplay.stop();
        } catch (error) {
          void error;
        }
      }
    });

    document.querySelectorAll(".hero-carousel-shell, .carousel[data-ride='carousel']").forEach((node) => {
      try {
        if (window.jQuery && window.jQuery(node).carousel) {
          window.jQuery(node).carousel("pause");
        }
      } catch (error) {
        void error;
      }

      const items = node.querySelectorAll(".carousel-item");
      items.forEach((item, index) => {
        item.classList.toggle("active", index === 0);
      });
    });

    if (window.jQuery) {
      try {
        window.jQuery(".nav-nav .pixelstrap.sm-horizontal").removeClass("mobile-menu-open");
        window.jQuery(".sm-jquery-disable-overlay").remove();
        window.jQuery(".nav-nav .pixelstrap.sm-horizontal").each(function () {
          if (window.jQuery(this).smartmenus && typeof window.jQuery(this).smartmenus === "function") {
            try {
              window.jQuery(this).smartmenus("hideAll");
            } catch (error) {
              void error;
            }
          }
        });
      } catch (error) {
        void error;
      }
    }
  });
};
