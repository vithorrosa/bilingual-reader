// ============================================================
// GUARD CONTRA DUPLA INJEÇÃO
// ============================================================
if (window.__bilingualInjected) {
  // já carregado — ignora silenciosamente
} else {
  window.__bilingualInjected = true;

  // ============================================================
  // CONSTANTES
  // ============================================================
  const WRAPPER_CLASS     = "bilingual-wrapper";
  const PAIR_CLASS        = "bilingual-pair";
  const ORIGINAL_CLASS    = "bilingual-original";
  const TRANSLATION_CLASS = "bilingual-translation";
  const WORD_SPAN_CLASS   = "bilingual-word";
  const TOOLTIP_ID        = "bilingual-tooltip";
  const PROCESSED_ATTR    = "data-bilingual-processed";
  const SERVER_URL        = "http://localhost:3000/translate";

  const wordCache = new Map();

  // ============================================================
  // TOOLTIP DE PALAVRA (clique para traduzir)
  // ============================================================
  function getOrCreateTooltip() {
    let tip = document.getElementById(TOOLTIP_ID);
    if (!tip) {
      tip = document.createElement("div");
      tip.id = TOOLTIP_ID;
      tip.style.cssText = `
        position: fixed; z-index: 2147483647;
        background: #1e293b; color: #f1f5f9;
        border: 1px solid #3b82f6; border-radius: 8px;
        padding: 8px 12px; font-size: 13px;
        font-family: system-ui, sans-serif; line-height: 1.4;
        max-width: 220px; box-shadow: 0 4px 16px rgba(0,0,0,.4);
        pointer-events: none; opacity: 0;
        transition: opacity .15s ease; display: none;
      `;
      document.body.appendChild(tip);
      document.addEventListener("click", (e) => {
        if (!e.target.classList.contains(WORD_SPAN_CLASS)) hideTooltip();
      });
    }
    return tip;
  }

  function positionTooltip(tip, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const h = tip.offsetHeight || 56;
    let top  = rect.top - h - 8;
    if (top < 8) top = rect.bottom + 8;
    let left = rect.left;
    if (left + 224 > window.innerWidth) left = window.innerWidth - 228;
    tip.style.top  = `${top}px`;
    tip.style.left = `${left}px`;
  }

  function showTooltipLoading(anchorEl) {
    const tip = getOrCreateTooltip();
    tip.innerHTML = `<span style="color:#94a3b8;font-size:12px;">⏳ traduzindo...</span>`;
    tip.style.display = "block";
    positionTooltip(tip, anchorEl);
    tip.style.opacity = "1";
  }

  function showTooltip(word, translation, anchorEl) {
    const tip = getOrCreateTooltip();
    const same = translation.toLowerCase() === word.toLowerCase();
    tip.innerHTML = same
      ? `<div style="color:#f87171;font-size:12px;">⚠️ Sem tradução encontrada para <b>${word}</b></div>`
      : `
        <div style="color:#94a3b8;font-size:11px;margin-bottom:3px;">📖 ${word}</div>
        <div style="color:#60a5fa;font-weight:700;font-size:14px;">→ ${translation}</div>
      `;
    tip.style.display = "block";
    positionTooltip(tip, anchorEl);
    tip.style.opacity = "1";
  }

  function hideTooltip() {
    const tip = document.getElementById(TOOLTIP_ID);
    if (tip) {
      tip.style.opacity = "0";
      setTimeout(() => { tip.style.display = "none"; }, 150);
    }
  }

  // ============================================================
  // TRADUÇÃO VIA SERVIDOR LOCAL (localhost:3000)
  // ============================================================
  async function translateTexts(texts, sourceLang, targetLang) {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, sourceLang, targetLang })
    });

    if (!response.ok) throw new Error(`Servidor retornou HTTP ${response.status}`);

    const data = await response.json();
    return (data.translations || []).map((t) =>
      // Remove prefixo [en->pt] que a MyMemory às vezes retorna
      t.replace(/^\[[a-z]{2}->[a-z]{2}\]\s*/i, "").trim()
    );
  }

  // ============================================================
  // TRADUÇÃO DE PALAVRA ÚNICA (tooltip)
  // Usa MyMemory diretamente com contexto para melhorar resultado
  // ============================================================
  async function translateWord(word, sourceLang, targetLang) {
    const key = `${word}|${sourceLang}|${targetLang}`;
    if (wordCache.has(key)) return wordCache.get(key);

    const clean = word.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").trim();
    if (!clean || clean.length < 2) return word;

    try {
      // Envia a palavra com ponto para forçar tradução como unidade semântica
      const query = encodeURIComponent(clean + ".");
      const url = `https://api.mymemory.translated.net/get?q=${query}&langpair=${sourceLang}|${targetLang}&de=tradutor@extensao.com`;
      const response = await fetch(url);
      const data = await response.json();

      let result = data?.responseData?.translatedText || clean;
      // Remove ponto que adicionamos e prefixo [xx->yy] se vier
      result = result
        .replace(/^\[[a-z]{2}->[a-z]{2}\]\s*/i, "")
        .replace(/\.$/, "")
        .trim();

      // Se a API devolveu igual, tenta pegar de matches alternativos
      if (result.toLowerCase() === clean.toLowerCase() && data?.matches?.length) {
        const alt = data.matches
          .filter(m => m.translation && m.translation.toLowerCase() !== clean.toLowerCase())
          .sort((a, b) => b.quality - a.quality)[0];
        if (alt) result = alt.translation.replace(/\.$/, "").trim();
      }

      wordCache.set(key, result);
      return result;
    } catch {
      return clean;
    }
  }

  // ============================================================
  // WRAPPING DE PALAVRAS EM SPANS CLICÁVEIS
  // ============================================================
  function wrapWordsInElement(element, sourceLang, targetLang) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      const parts = textNode.nodeValue.split(/(\s+)/);
      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (/^\s+$/.test(part) || part === "") {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        const span = document.createElement("span");
        span.textContent = part;
        span.className = WORD_SPAN_CLASS;

        span.addEventListener("mouseenter", () => {
          span.style.background = "rgba(59,130,246,0.15)";
          span.style.color = "#93c5fd";
          span.style.borderRadius = "3px";
        });
        span.addEventListener("mouseleave", () => {
          span.style.background = "";
          span.style.color = "";
        });

        span.addEventListener("click", async (e) => {
          e.stopPropagation();
          const word = part.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").trim();
          if (!word || word.length < 2) return;
          showTooltipLoading(span);
          try {
            const translation = await translateWord(word, sourceLang, targetLang);
            showTooltip(word, translation, span);
          } catch {
            showTooltip(word, "⚠️ erro ao traduzir", span);
          }
        });

        fragment.appendChild(span);
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  // ============================================================
  // SELEÇÃO DE ELEMENTOS CANDIDATOS
  // ============================================================
  function getCandidateElements() {
    const elements = [
      ...document.querySelectorAll("p, li, blockquote, h1, h2, h3, h4, h5, h6")
    ];
    return elements.filter((el) => {
      if (!el) return false;
      if (el.closest(`.${WRAPPER_CLASS}`)) return false;
      if (el.getAttribute(PROCESSED_ATTR) === "true") return false;
      const text = el.innerText?.trim();
      if (!text || text.length < 2 || text.length > 1200) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return true;
    });
  }

  // ============================================================
  // QUEBRA DE PARÁGRAFO EM FRASES/LINHAS
  // ============================================================
  function splitIntoLines(text) {
    return text
      .split(/\n+/)
      .flatMap((line) =>
        line
          .split(/(?<=[.!?])\s+/)
          .map((p) => p.trim())
          .filter(Boolean)
      )
      .filter(Boolean);
  }

  // ============================================================
  // MONTA O BLOCO BILÍNGUE
  // Original em cima (herda estilo da página)
  // Tradução embaixo (cinza, menor)
  // Cada palavra do original é clicável
  // ============================================================
  function buildBilingualBlock(element, originalLines, translatedLines, sourceLang, targetLang) {
    const wrapper = document.createElement("div");
    wrapper.className = WRAPPER_CLASS;

    for (let i = 0; i < originalLines.length; i++) {
      const pair = document.createElement("div");
      pair.className = PAIR_CLASS;

      // Linha original — palavras clicáveis
      const originalDiv = document.createElement("div");
      originalDiv.className = ORIGINAL_CLASS;
      originalDiv.textContent = originalLines[i] || "";
      wrapWordsInElement(originalDiv, sourceLang, targetLang);

      // Linha traduzida
      const translationDiv = document.createElement("div");
      translationDiv.className = TRANSLATION_CLASS;
      translationDiv.textContent = translatedLines[i] || "";

      pair.appendChild(originalDiv);
      pair.appendChild(translationDiv);
      wrapper.appendChild(pair);
    }

    element.style.display = "none";
    element.setAttribute(PROCESSED_ATTR, "true");
    element.insertAdjacentElement("afterend", wrapper);
  }

  // ============================================================
  // FLUXO PRINCIPAL
  // ============================================================
  async function translatePage(sourceLang, targetLang) {
    const elements = getCandidateElements();
    if (!elements.length) throw new Error("Nenhum texto encontrado na página.");

    for (const element of elements) {
      const originalText  = element.innerText.trim();
      const originalLines = splitIntoLines(originalText);
      if (!originalLines.length) continue;

      try {
        const translatedLines = await translateTexts(originalLines, sourceLang, targetLang);
        buildBilingualBlock(element, originalLines, translatedLines, sourceLang, targetLang);
      } catch (err) {
        console.error("[Bilíngue] Erro ao traduzir elemento:", err.message);
        // Continua para o próximo elemento
      }

      // Pequena pausa para não sobrecarregar o servidor
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // ============================================================
  // RESTAURAÇÃO
  // ============================================================
  function restorePage() {
    document.querySelectorAll(`.${WRAPPER_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`[${PROCESSED_ATTR}="true"]`).forEach((el) => {
      el.style.display = "";
      el.removeAttribute(PROCESSED_ATTR);
    });
    document.getElementById(TOOLTIP_ID)?.remove();
    wordCache.clear();
  }

  // ============================================================
  // LISTENER DE MENSAGENS
  // ============================================================
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "translate-page") {
      translatePage(message.sourceLang, message.targetLang)
        .then(() => sendResponse({ success: true }))
        .catch((err) => {
          console.error("[Bilíngue]", err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    if (message.action === "restore-page") {
      restorePage();
      sendResponse({ success: true });
      return false;
    }
  });

} // fim do guard
