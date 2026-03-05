export default function NcmRow({ item, isFavorito, onToggleFavorito, onOpen }) {
  return (
    <div className="ncmRow">
      <button className="ncmRow__content" onClick={() => onOpen(item.Codigo)}>
        <span className="ncmRow__codigo">{item.Codigo}</span>
        <span className="ncmRow__sep">-</span>
        <span className="ncmRow__descricao">{item.Descricao}</span>
      </button>

      <button
        className={`ncmRow__star ${isFavorito ? "isFav" : ""}`}
        onClick={(e) => {
          e.stopPropagation(); // impede de vazar pro botão da linha
          onToggleFavorito(item); // passa o item completo
        }}
        aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        ★
      </button>
    </div>
  );
}