export default function EmptyState({ title, message }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
