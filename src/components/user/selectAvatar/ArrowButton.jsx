// src/components/selectAvatar/ArrowButton.jsx
export default function ArrowButton({ direction }) {
  return (
    <button className={`arrow-button ${direction}`}>
      {direction === 'left' ? '◀' : '▶'}
    </button>
  );
}