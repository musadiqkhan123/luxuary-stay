import Icon from './Icon.jsx';

// Read-only stars, or an input when onChange is given
export default function Stars({ value = 0, onChange, size = 16 }) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <span className="stars" aria-label={`${value} out of 5`}>
        {stars.map((s) => (
          <Icon key={s} name="star" size={size} className={s <= Math.round(value) ? 'star-on' : 'star-off'} />
        ))}
      </span>
    );
  }
  return (
    <div className="stars stars-input" role="radiogroup" aria-label="Rating">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
        >
          <Icon name="star" size={28} className={s <= value ? 'star-on' : 'star-off'} />
        </button>
      ))}
    </div>
  );
}
