import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NcmPanel from "../components/NcmPanel";
import "./HomePage.css";

const API_BASE = "http://localhost:5000";
const LS_KEY = "ncm_favoritos_v1";

function stripHtmlTags(s) {
  return String(s || "").replace(/<[^>]*>/g, " ");
}

function normalizeText(s) {
  const withoutTags = stripHtmlTags(s);
  return withoutTags
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNumericQuery(q) {
  return /^[0-9.]+$/.test(q);
}

export default function HomePage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [favoritos, setFavoritos] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(favoritos));
    } catch {
      // ignora
    }
  }, [favoritos]);

  const favoritosSet = useMemo(() => {
    return new Set(
      favoritos.map((f) => f?.Codigo ?? f?.codigo).filter(Boolean)
    );
  }, [favoritos]);

  function toggleFavorito(item) {
    const codigo = item?.Codigo ?? item?.codigo;
    const descricao = item?.Descricao ?? item?.descricao;

    if (!codigo) return;

    const normalizedItem = {
      Codigo: String(codigo),
      Descricao: String(descricao || ""),
      Data_Inicio: item?.Data_Inicio,
      Data_Fim: item?.Data_Fim,
      Tipo_Ato_Ini: item?.Tipo_Ato_Ini,
      Numero_Ato_Ini: item?.Numero_Ato_Ini,
      Ano_Ato_Ini: item?.Ano_Ato_Ini,
    };

    setFavoritos((prev) => {
      const exists = prev.some((x) => (x?.Codigo ?? x?.codigo) === normalizedItem.Codigo);
      return exists
        ? prev.filter((x) => (x?.Codigo ?? x?.codigo) !== normalizedItem.Codigo)
        : [normalizedItem, ...prev];
    });
  }

  function openDetails(codigo) {
    if (!codigo) return;
    navigate(`/ncm/${codigo}`);
  }

  async function buscar() {
    setError(null);
    setResultados([]);

    const qRaw = query.trim();
    if (!qRaw) {
      setError("Digite um código ou descrição.");
      return;
    }

    try {
      setLoading(true);

    
      const resp = await fetch(
        `${API_BASE}/api/ncm/search?q=${encodeURIComponent(qRaw)}`
      );

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        console.log("Backend error:", resp.status, body);
        throw new Error("Falha no backend");
      }

      const data = await resp.json();
      const arr = Array.isArray(data) ? data : [];

      //se for texto: aplica filtro extra com normalização (acentos/tags)
      if (!isNumericQuery(qRaw)) {
        const nq = normalizeText(qRaw);
        setResultados(
          arr.filter((item) => normalizeText(item?.Descricao ?? item?.descricao).includes(nq))
        );
      } else {
        setResultados(arr);
      }
    } catch (e) {
      console.log(e);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") buscar();
  }

  return (
    <div className="page">
      <div className="container">
        <header className="brand">
          <div className="brand__logo">
            <div className="brand__logoMark">JF</div>
            <div className="brand__logoText">
              <div className="brand__name">José Filho</div>
              <div className="brand__sub">Contabilidade</div>
            </div>
          </div>

          <div className="title">NCM DOS PRODUTOS</div>
        </header>

        <div className="searchBar">
          <input
            className="searchBar__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite código ou descrição"
            spellCheck={false}
          />
          
          <button className="searchBar__btn" onClick={buscar} disabled={loading} type="button">
            🔍
          </button>
        </div>

        {loading && <div className="loading">Carregando...</div>}
        {error && <div className="error">{error}</div>}

        <div className="panels">
          <NcmPanel
            title="Resultados"
            items={resultados}
            favoritosSet={favoritosSet}
            onToggleFavorito={toggleFavorito}
            onOpen={openDetails}
            emptyText={query.trim() ? "Nenhum resultado." : "O resultado aparecerá aqui."}
          />

          <NcmPanel
            title="Favoritos"
            items={favoritos}
            favoritosSet={favoritosSet}
            onToggleFavorito={toggleFavorito}
            onOpen={openDetails}
            emptyText="Nenhum favorito ainda."
          />
        </div>

        <div className="hint">
          Agora o código também lista resultados.
        </div>
      </div>
    </div>
  );
}