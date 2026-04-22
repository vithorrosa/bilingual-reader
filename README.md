<h1 align="center">🌐 Bilingual Reader</h1>

<p align="center">
  <strong>Extensão Chrome para leitura bilíngue — original em cima, tradução embaixo, frase por frase.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-Server-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/MyMemory-Translation_API-00B4D8?style=for-the-badge"/>
</p>

---

## 📖 O que é

**Bilingual Reader** é uma extensão Chrome que transforma qualquer página da web em uma experiência de leitura bilíngue.

Inspirado no [Language Reactor](https://www.languagereactor.com/), o projeto exibe o texto original e a tradução lado a lado — frase por frase — diretamente na página, sem abrir abas ou popups.

Ideal para quem está aprendendo inglês e quer consumir conteúdo real enquanto estuda.

---

## ✨ Funcionalidades

- 🔤 **Tradução frase por frase** — cada sentença traduzida individualmente, não o bloco inteiro
- 📌 **Original sempre em cima** — mantém o texto da página, tradução logo abaixo em cinza
- 🖱️ **Clique em qualquer palavra** — tooltip aparece com a tradução daquela palavra específica
- 🔁 **Inglês → Português e Português → Inglês** — dois botões no popup para escolher a direção
- ♻️ **Restaurar página** — remove todas as traduções e volta ao estado original
- ⚡ **Cache de palavras** — palavras já clicadas não fazem nova chamada à API

---

## 🏗️ Arquitetura

```
bilingual-reader/
├── meu-tradutor/          # Extensão Chrome
│   ├── manifest.json      # Configuração da extensão (Manifest V3)
│   ├── content.js         # Injeta e manipula o DOM da página
│   ├── popup.html         # Interface do botão da extensão
│   ├── popup.js           # Lógica dos botões do popup
│   └── styles.css         # Estilos dos blocos bilíngues
│
└── tradutor-api/          # Servidor Node.js
    ├── server.js          # API Express que chama a MyMemory
    └── package.json
```

### Fluxo de funcionamento

```
Usuário clica "Traduzir"
        ↓
popup.js envia mensagem via chrome.tabs.sendMessage
        ↓
content.js recebe, coleta elementos da página (p, h1, li...)
        ↓
Quebra cada parágrafo em frases individuais
        ↓
Envia frases para localhost:3000/translate
        ↓
server.js chama MyMemory Translation API
        ↓
Traduções retornam e são inseridas abaixo de cada frase
        ↓
Palavras do original viram spans clicáveis com tooltip
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- Google Chrome
- Conta gratuita na [MyMemory API](https://mymemory.translated.net/register)

### 1. Clone o repositório

```bash
git clone https://github.com/vithorrosa/bilingual-reader.git
cd bilingual-reader
```

### 2. Inicie o servidor de tradução

```bash
cd tradutor-api
npm install
node server.js
```

Deve aparecer:
```
Servidor rodando em http://localhost:3000
```

### 3. Carregue a extensão no Chrome

1. Acesse `chrome://extensions`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `meu-tradutor`

### 4. Teste

1. Abra qualquer página em inglês (ex: [example.com](https://example.com))
2. Clique no ícone da extensão
3. Clique em **Inglês → Português**
4. Clique em qualquer palavra para ver o tooltip de tradução

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **JavaScript (ES2022)** | Lógica da extensão e manipulação de DOM |
| **Chrome Extensions API (MV3)** | Comunicação entre popup e content script |
| **Node.js + Express** | Servidor local de tradução |
| **MyMemory Translation API** | API gratuita de tradução |
| **CSS3** | Estilização dos blocos bilíngues |

---

## ⚠️ Limitações conhecidas

- Requer o servidor `node server.js` rodando localmente
- MyMemory API tem limite de requisições diárias no plano gratuito
- Palavras técnicas (RFC, HTTP, DNS) podem não ter tradução
- Sites com carregamento dinâmico (SPAs) podem precisar de F5 após carregar

---

## 🗺️ Próximas melhorias

- [ ] Detecção automática de idioma da página
- [ ] Painel de vocabulário — salva palavras clicadas para revisão
- [ ] Cache persistente entre sessões
- [ ] Suporte a textos carregados dinamicamente
- [ ] Publicação na Chrome Web Store

---

## 👨‍💻 Autor

Desenvolvido por **Vithor Rosa** — QA Engineer aprendendo inglês do jeito mais técnico possível.
> 🤖 Projeto desenvolvido com auxílio do [Claude](https://claude.ai) (Anthropic)
<p>
  <a href="https://www.linkedin.com/in/vitor-rosa-2886883b8/" target="_blank">
    <img src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white"/>
  </a>
  <a href="https://vithorrosa.github.io/qa-portfolio" target="_blank">
    <img src="https://img.shields.io/badge/-Portfólio-00FF88?style=for-the-badge&logo=github&logoColor=black"/>
  </a>
</p>
