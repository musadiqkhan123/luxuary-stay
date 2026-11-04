import { useEffect, useState } from 'react';

// Animates the first number inside a string, e.g. "Rs 1,462,064" or "87%"
export default function CountUp({ value, duration = 900 }) {
  const text = String(value ?? '');
  const match = text.match(/-?[\d,]+(\.\d+)?/);
  const [display, setDisplay] = useState(match ? text.replace(match[0], '0') : text);

  useEffect(() => {
    if (!match || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return undefined;
    }
    const target = parseFloat(match[0].replace(/,/g, ''));
    const decimals = match[1] ? match[1].length - 1 : 0;
    const useCommas = match[0].includes(',');
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = target * eased;
      const formatted = useCommas
        ? current.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
        : current.toFixed(decimals);
      setDisplay(text.replace(match[0], formatted));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return <>{display}</>;
}
