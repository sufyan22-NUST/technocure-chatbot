/**
 * Technocure Chat Widget Loader
 * Embed on any website with a single <script> tag.
 *
 * Usage (WordPress or any HTML page):
 *   <script src="https://YOUR-NETLIFY-SITE.netlify.app/widget.js" async></script>
 */
(function () {
  "use strict";

  // Prevent double-loading
  if (document.getElementById("technocure-widget-iframe")) return;

  var WIDGET_ORIGIN = (function () {
    var scripts = document.getElementsByTagName("script");
    var current = scripts[scripts.length - 1];
    var src = current.getAttribute("src") || "";
    return src.replace("/widget.js", "");
  })();

  // Inject minimal reset styles for the iframe container
  var style = document.createElement("style");
  style.textContent =
    "#technocure-widget-iframe{position:fixed;bottom:0;right:0;width:420px;height:640px;border:none;z-index:2147483647;background:transparent;pointer-events:none;}";
  document.head.appendChild(style);

  // Create the iframe pointing to the /embed route
  var iframe = document.createElement("iframe");
  iframe.id = "technocure-widget-iframe";
  iframe.src = WIDGET_ORIGIN + "/embed";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("title", "Technocure Chat Widget");
  iframe.style.pointerEvents = "auto";

  // Append once DOM is ready
  function mount() {
    document.body.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
