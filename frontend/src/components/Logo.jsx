import { Leaf } from 'lucide-react';

export default function Logo({ light = false }) {
  return (
    <a href="#top" className={`brand-lockup${light ? ' brand-lockup-light' : ''}`} aria-label="Fieldwell home">
      <span className="brand-mark"><Leaf size={19} strokeWidth={2.3} /></span>
      <span className="brand-wordmark">fieldwell<span>.</span></span>
    </a>
  );
}
