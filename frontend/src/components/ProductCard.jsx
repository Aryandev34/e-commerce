import { useState } from 'react';
import { Check, Plus, Star } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ProductPack from './ProductPack.jsx';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

export default function ProductCard({ product, index = 0, onQuickView }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = Number(product.stock) <= 0;
  const cartLine = items.find((line) => String(line.product.id) === String(product.id));
  const atStockLimit = !unavailable && cartLine && cartLine.quantity >= Number(product.stock);

  const handleAdd = () => {
    if (unavailable || atStockLimit || !addItem(product)) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article className="product-card" style={{ '--card-index': index }}>
      <div className="product-card-visual-wrap">
        <ProductPack product={product} />
        {product.badge && <span className={`product-badge${product.badge === 'Bestseller' ? ' badge-dark' : ''}`}>{product.badge}</span>}
        <button className="quick-look" type="button" onClick={() => onQuickView?.(product)} aria-label={`View ${product.name}`} title="Quick view">
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="product-card-content">
        <div className="product-category-row">
          <span>{product.category_name || 'Farm essentials'}</span>
          <span className="rating"><Star size={12} fill="currentColor" strokeWidth={0} /> {product.rating || '4.8'} <em>({product.review_count || 0})</em></span>
        </div>
        <h3>{product.name}</h3>
        <p className="product-subtitle">{product.subtitle || product.description}</p>
        <div className="product-card-bottom">
          <div className="product-price-wrap">
            <strong>{money(product.price)}</strong>
            {product.compare_at_price && <del>{money(product.compare_at_price)}</del>}
            <span>{product.unit ? ` / ${product.unit}` : ''}</span>
          </div>
          <button
            className={`add-button${added ? ' added' : ''}`}
            type="button"
            onClick={handleAdd}
            disabled={unavailable || atStockLimit}
            aria-label={unavailable ? `${product.name} is out of stock` : atStockLimit ? `Maximum available quantity of ${product.name} is in your cart` : `Add ${product.name} to cart`}
          >
            {unavailable ? <span className="out-of-stock">Sold out</span> : atStockLimit ? <span className="out-of-stock">In cart</span> : added ? <Check size={16} /> : <Plus size={17} />}
          </button>
        </div>
      </div>
    </article>
  );
}
