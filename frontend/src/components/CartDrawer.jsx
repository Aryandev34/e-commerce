import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ProductPack from './ProductPack.jsx';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
const FREE_SHIPPING_AT = 50;

export default function CartDrawer({ open, onClose }) {
  const { items, itemCount, subtotal, setQuantity, removeItem, checkout } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({ full_name: '', email: '', shipping_address: '' });
  const shipping = subtotal >= FREE_SHIPPING_AT || subtotal === 0 ? 0 : 5.95;
  const total = subtotal + shipping;
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100);
  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('drawer-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('drawer-open');
    };
  }, [open, onClose]);

  const canSubmit = useMemo(() => (
    customer.full_name.trim() && customer.email.trim() && customer.shipping_address.trim()
  ), [customer]);

  if (!open) return null;

  const handleCheckout = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await checkout(customer);
      setConfirmation(result?.order_number || 'FW-THANKYOU');
      setIsCheckout(false);
    } catch (requestError) {
      setError(requestError.message || 'We could not place that order. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndReset = () => {
    onClose();
    window.setTimeout(() => {
      setConfirmation(null);
      setIsCheckout(false);
      setError('');
    }, 250);
  };

  return (
    <div className="drawer-scrim" onMouseDown={(event) => event.target === event.currentTarget && closeAndReset()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Your good growing kit</p>
            <h2 id="cart-title">{confirmation ? 'Order placed' : isCheckout ? 'Almost there' : `Your cart${itemCount ? ` (${itemCount})` : ''}`}</h2>
          </div>
          <button className="icon-button close-drawer" aria-label="Close cart" onClick={closeAndReset}><X size={20} /></button>
        </div>

        {confirmation ? (
          <div className="order-confirmation">
            <span className="confirmation-mark"><Check size={27} /></span>
            <p className="eyebrow">Thank you for growing with us</p>
            <h3>That's a good order.</h3>
            <p>We’ve received your order. A confirmation is on its way to your inbox.</p>
            <div className="order-number"><span>Order reference</span><strong>{confirmation}</strong></div>
            <button className="button button-dark full-width" onClick={closeAndReset}>Back to the shop <ArrowRight size={16} /></button>
          </div>
        ) : isCheckout ? (
          <form className="checkout-form" onSubmit={handleCheckout}>
            <button type="button" className="back-link" onClick={() => { setIsCheckout(false); setError(''); }}><ArrowLeft size={15} /> Back to cart</button>
            <div className="checkout-intro"><span className="checkout-icon"><ShieldCheck size={19} /></span><div><strong>Safe, simple checkout</strong><span>Your details stay private and protected.</span></div></div>
            <label>Full name<input autoComplete="name" required value={customer.full_name} onChange={(event) => setCustomer({ ...customer, full_name: event.target.value })} placeholder="Your name" /></label>
            <label>Email address<input autoComplete="email" type="email" required value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="you@example.com" /></label>
            <label>Delivery address<textarea autoComplete="street-address" required rows="3" value={customer.shipping_address} onChange={(event) => setCustomer({ ...customer, shipping_address: event.target.value })} placeholder="Street, town / city, postal code" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="checkout-total-row"><span>Order total</span><strong>{money(total)}</strong></div>
            <button className="button button-dark full-width checkout-submit" type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Placing your order…' : <>Place order <ArrowRight size={16} /></>}
            </button>
            <p className="checkout-terms">By placing your order, you agree to follow all product label instructions and applicable local regulations.</p>
          </form>
        ) : items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon"><ShoppingBag size={28} strokeWidth={1.5} /></span>
            <h3>Your cart is taking a little breather.</h3>
            <p>Find something thoughtful for the field, barn or garden.</p>
            <button className="button button-dark" onClick={closeAndReset}>Explore the shop <ArrowRight size={16} /></button>
          </div>
        ) : (
          <>
            <div className="shipping-progress">
              <p>{remaining > 0 ? <>You’re <strong>{money(remaining)} away</strong> from free shipping</> : <><strong>Lovely!</strong> Your order ships free.</>}</p>
              <div className="progress-track"><span style={{ width: `${freeShippingProgress}%` }} /></div>
            </div>
            <div className="cart-lines">
              {items.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <div className="cart-line-art"><ProductPack product={product} mini /></div>
                  <div className="cart-line-info">
                    <span className="cart-line-category">{product.category_name || 'Farm essentials'}</span>
                    <h3>{product.name}</h3>
                    <span className="cart-line-unit">{product.unit}</span>
                    <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                      <button aria-label="Decrease quantity" onClick={() => quantity <= 1 ? removeItem(product.id) : setQuantity(product.id, quantity - 1)}>
                        {quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                      </button>
                      <span>{quantity}</span>
                      <button aria-label="Increase quantity" disabled={quantity >= Number(product.stock)} onClick={() => setQuantity(product.id, quantity + 1)}><Plus size={13} /></button>
                    </div>
                  </div>
                  <div className="cart-line-total">{money(Number(product.price) * quantity)}<button className="remove-link" onClick={() => removeItem(product.id)}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className="drawer-summary">
              <div className="delivery-note"><span><ShoppingBag size={16} /> Standard delivery</span><span>{shipping ? money(shipping) : 'Free'} <ChevronDown size={14} /></span></div>
              <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div>
              <div className="summary-row summary-total"><strong>Total</strong><strong>{money(total)}</strong></div>
              <button className="button button-dark full-width" onClick={() => { setIsCheckout(true); setError(''); }}>Continue to checkout <ArrowRight size={16} /></button>
              <p className="secure-note"><ShieldCheck size={13} /> Secure checkout · Carefully packed · Label-first care</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
