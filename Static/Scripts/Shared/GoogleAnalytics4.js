window.GoogleAnalytics4 = window.GoogleAnalytics4 || {};
(function (api) {
  var noop = function () {};
  window.GoogleAnalytics4 = new Proxy(api, {
    get: function (target, prop) {
      return prop in target ? target[prop] : noop;
    }
  });
})(window.GoogleAnalytics4);
