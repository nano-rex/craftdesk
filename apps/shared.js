(function () {
  const nav = document.createElement("nav");
  nav.className = "craftdesk-nav";
  nav.setAttribute("aria-label", "Craftdesk navigation");
  nav.innerHTML = '<a class="craftdesk-brand" href="../../index.html"><span class="craftdesk-mark">CD</span>Craftdesk</a><a class="craftdesk-home" href="../../index.html">Home</a><a href="../gantt/gantt.html">Planner</a><a href="../converter/index.html">Converter</a><a href="../min-doc/index.html">PDF editor</a><a href="../weather/index.html">Weather</a><span class="craftdesk-local">Local only</span>';
  if (window.parent !== window) {
    document.body.classList.add("craftdesk-embedded");
    return;
  }
  document.body.insertBefore(nav, document.body.firstChild);
}());
