const enToPtBtn  = document.getElementById("enToPtBtn");
const ptToEnBtn  = document.getElementById("ptToEnBtn");
const restoreBtn = document.getElementById("restoreBtn");
const status     = document.getElementById("status");

function setStatus(msg, type = "info") {
  const colors = { loading: "#60a5fa", success: "#34d399", error: "#f87171", info: "#64748b" };
  status.textContent = msg;
  status.style.color = colors[type] || colors.info;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isInjectableTab(tab) {
  if (!tab?.id || !tab?.url) return false;
  const blocked = ["chrome://", "chrome-extension://", "about:", "edge://", "data:"];
  return !blocked.some((p) => tab.url.startsWith(p));
}

async function sendTranslate(sourceLang, targetLang) {
  const tab = await getActiveTab();
  if (!isInjectableTab(tab)) {
    setStatus("❌ Esta página não pode ser traduzida.", "error");
    return;
  }
  setStatus("⏳ Traduzindo...", "loading");
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "translate-page",
      sourceLang,
      targetLang
    });
    if (response?.success) {
      setStatus("✅ Tradução aplicada.", "success");
    } else {
      setStatus(`⚠️ ${response?.error || "Erro desconhecido"}`, "error");
    }
  } catch (e) {
    setStatus("❌ Verifique se o servidor está rodando (node server.js).", "error");
  }
}

enToPtBtn.addEventListener("click",  () => sendTranslate("en", "pt"));
ptToEnBtn.addEventListener("click",  () => sendTranslate("pt", "en"));

restoreBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!isInjectableTab(tab)) return;
  setStatus("⏳ Restaurando...", "loading");
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "restore-page" });
    setStatus(response?.success ? "✅ Restaurado." : "⚠️ Erro ao restaurar.", response?.success ? "success" : "error");
  } catch (e) {
    setStatus("❌ Erro ao restaurar.", "error");
  }
});
