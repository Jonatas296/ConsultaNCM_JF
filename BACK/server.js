/* eslint-env node */
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Cache em memória (para não baixar a base toda hora)
let baseNcm = null;
let baseCarregando = null; // evita downloads simultâneos
/*
app.get("/", (req, res) => {
  res
    .status(200)
    .send("API SIS_JS_NCM online. Use /api/teste e /api/ncm/search?q=...");
});

app.get("/api/teste", (req, res) => {
  res.status(200).json({ ok: true, mensagem: "Backend funcionando!" });
});
*/
async function carregarBaseSiscomex() {
  if (baseNcm) return baseNcm;

  // Se já tem um download em andamento, aguarda ele
  if (baseCarregando) return baseCarregando;

  const url =
    "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";

  baseCarregando = (async () => {
    console.log("🔄 Baixando base Siscomex...");
    console.log("URL:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SIS_JS_NCM/1.0",
      },
    });

    console.log("Siscomex status:", response.status);
    console.log("Siscomex content-type:", response.headers.get("content-type"));

    const text = await response.text(); // lê como texto primeiro (diagnóstico)

    if (!response.ok) {
      console.log("Siscomex body (primeiros 500):", text.slice(0, 500));
      throw new Error(`Falha Siscomex: HTTP ${response.status}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse falhou. Body (primeiros 500):", text.slice(0, 500));
      throw new Error("Resposta da Siscomex não era JSON válido");
    }

    // CORREÇÃO: a resposta pode vir como objeto com lista em alguma chave
    let lista = null;

    // Caso 1: já veio como array
    if (Array.isArray(parsed)) {
      lista = parsed;
    }

    // Caso 2: veio como objeto contendo um array em alguma chave
    if (!lista && parsed && typeof parsed === "object") {
      for (const value of Object.values(parsed)) {
        if (Array.isArray(value) && value.length > 0 && value[0]?.Codigo) {
          lista = value;
          break;
        }
      }
    }

    if (!lista) {
      console.log("⚠️ Não encontrei lista de NCM no JSON. Chaves:", Object.keys(parsed || {}));
      console.log("Body (primeiros 500):", text.slice(0, 500));
      throw new Error("Resposta inesperada da Siscomex (não encontrei lista)");
    }

    console.log("Base carregada:", lista.length, "registros");
    baseNcm = lista;
    return baseNcm;
  })();

  try {
    return await baseCarregando;
  } finally {
    // libera o lock de carregamento mesmo se falhar
    baseCarregando = null;
  }
}
///identenfica se é numero ou texto
app.get("/api/ncm/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ erro: "Parâmetro 'q' é obrigatório" });
    }

    const base = await carregarBaseSiscomex();

    const isNum = /^[0-9.]+$/.test(q);

    let resultados;
    if (isNum) {
      resultados = base.filter((item) => item?.Codigo?.startsWith(q));
    } else {
      const termo = q.toLowerCase();
      resultados = base.filter(
        (item) => item?.Descricao && item.Descricao.toLowerCase().includes(termo)
      );
    }

    return res.status(200).json(resultados.slice(0, 50));
  } catch (error) {
    console.error("Erro real /api/ncm/search:", error);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});