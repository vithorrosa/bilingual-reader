const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API do tradutor rodando" });
});

app.post("/translate", async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;

    if (!Array.isArray(texts)) {
      return res.status(400).json({ error: "texts deve ser um array" });
    }

    const translations = [];

    for (const text of texts) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();

      // Remove prefixo [en->pt] que a MyMemory às vezes retorna
      let translated = data?.responseData?.translatedText || text;
      translated = translated.replace(/^\[[a-z]{2}->[a-z]{2}\]\s*/i, "").trim();

      translations.push(translated);

      // Pausa para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return res.json({ translations });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});