const apps = {
  gantt: { title: "Project planner", kicker: "TIMELINES", src: "apps/gantt/gantt.html" },
  converter: { title: "File converter", kicker: "LOCAL FORMATS", src: "apps/converter/index.html" },
  "min-doc": { title: "PDF editor", kicker: "DOCUMENTS", src: "apps/min-doc/index.html" },
  weather: { title: "Weather report", kicker: "OBSERVATIONS", src: "apps/weather/index.html" }
};
const intro = document.querySelector("#intro");
const view = document.querySelector("#toolView");
const frame = document.querySelector("#toolFrame");
const title = document.querySelector("#toolTitle");
const kicker = document.querySelector("#toolKicker");
const tabs = [...document.querySelectorAll(".tab")];
function openApp(name, updateHash = true) {
  const app = apps[name] || apps.gantt;
  intro.hidden = true; view.hidden = false; frame.src = app.src; title.textContent = app.title; kicker.textContent = app.kicker;
  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.app === name));
  localStorage.setItem("craftdesk-app", name);
  if (updateHash) history.replaceState(null, "", `#${name}`);
}
function showHome() { intro.hidden = false; view.hidden = true; frame.removeAttribute("src"); tabs.forEach(tab => tab.classList.remove("active")); history.replaceState(null, "", location.pathname); }
document.querySelectorAll("[data-app]").forEach(el => el.addEventListener("click", () => openApp(el.dataset.app)));
document.querySelector("#backButton").addEventListener("click", showHome);
const initial = location.hash.slice(1) || localStorage.getItem("craftdesk-app");
if (apps[initial]) openApp(initial, false);
