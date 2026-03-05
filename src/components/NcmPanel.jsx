import NcmRow from "./NcmRow";

export default function NcmPanel({
  title,
  items,
  favoritosSet,
  onToggleFavorito,
  onOpen,
  emptyText,
}) {
  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>

      <div className="panel__list">
        {items.length === 0 ? (
          <div className="panel__empty">{emptyText}</div>
        ) : (
          items.map((item) => (
            <NcmRow
              key={item.Codigo}
              item={item}
              isFavorito={favoritosSet.has(item.Codigo)}
              onToggleFavorito={onToggleFavorito}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}