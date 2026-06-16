window.GoogleAnalytics = window.GoogleAnalytics || {};
(function (api) {
  var noop = function () {};
  window.GoogleAnalytics = new Proxy(api, {
    get: function (target, prop) {
      return prop in target ? target[prop] : noop;
    }
  });
})(window.GoogleAnalytics);
