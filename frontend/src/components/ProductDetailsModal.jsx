import { useEffect } from 'react';
import { ArrowRight, Check, ShieldCheck, Star, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ProductPack from './ProductPack.jsx';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

export default function ProductDetailsModal({ product, onClose }) {
  const { addItem, items } = useCart();
  const cartLine = items.find((line) => String(line.product.id) === String(product?.id));
  const atStockLimit = Boolean(cartLine && cartLine.quantity >= Number(product?.stock));
  useEffect(() => {
    if (!product) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('drawer-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('drawer-open');
    };
  }, [product, onClose]);

  if (!product) return null;
  return (
    <div className="details-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
        <button className="icon-button details-close" aria-label="Close product details" onClick={onClose}><X size={20} /></button>
        <div className="details-art"><ProductPack product={product} /></div>
        <div className="details-copy">
          <p className="eyebrow">{product.category_name || 'Farm essentials'}</p>
          <div className="details-rating"><Star size={14} fill="currentColor" strokeWidth={0} /> {product.rating || '4.8'} <span>({product.review_count || 0} thoughtful reviews)</span></div>
          <h2 id="details-title">{product.name}</h2>
          <p className="details-subtitle">{product.subtitle}</p>
          <p className="details-description">{product.description}</p>
          <div className="details-meta"><span>Size</span><strong>{product.unit}</strong><span>Availability</span><strong>{Number(product.stock) > 0 ? 'In stock, ready to ship' : 'Currently out of stock'}</strong></div>
          <div className="label-reminder"><ShieldCheck size={19} /><p><strong>Care starts with the label.</strong><br />Always read and follow all label directions and local regulations. Store safely away from children and animals.</p></div>
          <div className="details-buy-row"><strong>{money(product.price)}</strong><button className="button button-dark" disabled={Number(product.stock) <= 0 || atStockLimit} onClick={() => { if (addItem(product)) onClose(); }}>{Number(product.stock) <= 0 ? 'Out of stock' : atStockLimit ? 'Quantity in cart' : <>Add to cart <ArrowRight size={16} /></>}</button></div>
          {Number(product.stock) > 0 && <p className="in-stock-note"><Check size={13} /> In stock and ready for careful packing</p>}
        </div>
      </section>
    </div>
  );
}
