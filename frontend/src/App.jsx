import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Leaf,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Star,
  Stethoscope,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import heroImage from './assets/field-hero.jpg';
import { getProducts } from './api.js';
import AnnouncementBar from './components/AnnouncementBar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Logo from './components/Logo.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProductDetailsModal from './components/ProductDetailsModal.jsx';
import { useCart } from './context/CartContext.jsx';
import { categories, fallbackProducts } from './data/products.js';

const categoryIcons = { sprout: Sprout, cow: Stethoscope, leaf: Leaf, sun: Sun };
const sortOptions = [
  { value: 'featured', label: 'Curated for you' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

function Header({ search, setSearch, onOpenCart, itemCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <AnnouncementBar />
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className={`main-nav${menuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
            <a href="#shop" onClick={closeMenu}>Shop all</a>
            <a href="#categories" onClick={closeMenu}>Shop by need</a>
            <a href="#promise" onClick={closeMenu}>Our promise</a>
            <a href="#journal" onClick={closeMenu}>Field notes</a>
          </nav>
          <div className="header-actions">
            <label className="header-search" aria-label="Search products">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your field fix" />
              {search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={13} /></button>}
            </label>
            <button className="cart-trigger" onClick={onOpenCart} aria-label={`Open cart, ${itemCount} items`}>
              <ShoppingBasket size={19} strokeWidth={1.8} /><span>Bag</span><span className="cart-count">{itemCount}</span>
            </button>
            <button className="mobile-menu-trigger" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function Hero() {
  return (
    <section className="hero" id="top" style={{ '--hero-image': `url("${heroImage}")` }}>
      <div className="hero-inner container">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> THE GOOD GROWING SHOP</p>
          <h1>Better crops.<br /><em>Thoughtful care.</em></h1>
          <p className="hero-description">Good things for the people who grow, tend and care. Find considered crop protection and animal health essentials, all in one place.</p>
          <div className="hero-actions">
            <a className="button button-lime" href="#shop">Shop the collection <ArrowRight size={16} /></a>
            <a className="hero-text-link" href="#categories">Explore by need <ArrowDownRight size={16} /></a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div>
            <p><strong>Good care travels.</strong><br />Loved by growers like you.</p>
          </div>
        </div>
        <div className="hero-note">
          <span className="note-topline"><span>FIELD NOTE</span><span>NO. 001</span></span>
          <span className="note-divider" />
          <p>For the ones who<br />make things <em>grow.</em></p>
          <a href="#promise" aria-label="Read our promise"><ArrowUpRight size={18} /></a>
        </div>
        <div className="hero-bottomline">
          <span>Crop care <i>·</i> Animal health <i>·</i> Good growing</span>
          <a href="#categories">SCROLL TO EXPLORE <ArrowDownRight size={15} /></a>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Fieldwell service promises">
      <div className="container trust-inner">
        <div className="trust-item"><span className="trust-icon"><Truck size={18} /></span><p><strong>Free shipping over $50</strong><span>Thoughtfully packed, right to you</span></p></div>
        <span className="trust-divider" />
        <div className="trust-item"><span className="trust-icon"><BadgeCheck size={18} /></span><p><strong>Only trusted essentials</strong><span>Quality checked, label first</span></p></div>
        <span className="trust-divider" />
        <div className="trust-item"><span className="trust-icon"><CircleHelp size={18} /></span><p><strong>Real people, real advice</strong><span>Here for the growing questions</span></p></div>
      </div>
    </section>
  );
}

function CategorySection({ onSelect }) {
  return (
    <section className="section category-section" id="categories">
      <div className="container">
        <div className="section-heading category-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> FIND YOUR KIND OF CARE</p><h2>What are you growing <em>for?</em></h2></div>
          <p className="section-aside">From the first planting to the daily checks, find the essentials for what matters on your farm.</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const Icon = categoryIcons[category.icon] || Sprout;
            return (
              <button className={`category-card category-${category.tint}`} key={category.slug} onClick={() => onSelect(category.slug)} style={{ '--category-index': index }}>
                <span className="category-icon"><Icon size={22} strokeWidth={1.65} /></span>
                <span className="category-card-bottom"><span><strong>{category.name}</strong><small>{category.count}</small></span><span className="category-arrow"><ArrowUpRight size={17} /></span></span>
                <span className="category-decoration" aria-hidden="true"><Icon size={80} strokeWidth={0.7} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductSection({ products, search, setSearch, activeCategory, setActiveCategory, sort, setSort, onQuickView, apiLive }) {
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = !query || [product.name, product.subtitle, product.description, product.category_name]
        .filter(Boolean).join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    if (sort === 'price-low') filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-high') filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'rating') filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    return filtered;
  }, [products, search, activeCategory, sort]);

  return (
    <section className="section products-section" id="shop">
      <div className="container">
        <div className="section-heading products-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> THE FIELDWELL EDIT</p><h2>Good things for your<br /><em>growing things.</em></h2></div>
          <div className="products-intro"><p>Carefully chosen essentials that work as hard as you do. Just the good stuff, without the guesswork.</p><span className={`catalog-status${apiLive ? ' status-live' : ''}`}><i /> {apiLive ? 'Live from our catalog' : 'A considered collection'}</span></div>
        </div>
        <div className="product-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filter by category">
            <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All essentials <span>{products.length}</span></button>
            {categories.map((category) => <button key={category.slug} className={activeCategory === category.slug ? 'active' : ''} onClick={() => setActiveCategory(category.slug)}>{category.short}</button>)}
          </div>
          <div className="toolbar-controls">
            <label className="shop-search"><Search size={15} /><input aria-label="Search the shop" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search essentials" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={13} /></button>}</label>
            <label className="sort-control"><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">{sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></label>
          </div>
        </div>
        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product, index) => <ProductCard key={product.id ?? product.slug} product={product} index={index} onQuickView={onQuickView} />)}
          </div>
        ) : (
          <div className="no-results"><span><Search size={22} /></span><h3>No essentials found just yet.</h3><p>Try a different search or browse all of our good growing things.</p><button className="button button-dark" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters <ArrowRight size={15} /></button></div>
        )}
        <div className="product-footnote"><span><ShieldCheck size={16} /> Careful choices. Clear information.</span><a href="#safety">Our product care promise <ArrowRight size={14} /></a></div>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="story-section" id="promise">
      <div className="container story-grid">
        <div className="story-photo" style={{ '--story-image': `url("${heroImage}")` }}>
          <div className="story-photo-caption"><span className="caption-mark"><Leaf size={18} /></span><span>Good growing is a practice.<br /><strong>We’re here for every part.</strong></span></div>
          <span className="photo-index">A LITTLE MORE CARE, EVERY DAY</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> OUR WAY OF GROWING</p>
          <h2>Care should be<br />the <em>easy part.</em></h2>
          <p className="story-lead">Your time belongs in the field, not lost in a maze of products. We bring thoughtful farm care into one clear, friendly place.</p>
          <div className="story-points">
            <div><span><Check size={15} /></span><p><strong>Chosen with intention</strong><small>Useful essentials from suppliers we trust.</small></p></div>
            <div><span><Check size={15} /></span><p><strong>Clear by design</strong><small>Helpful information, with label directions front and center.</small></p></div>
            <div><span><Check size={15} /></span><p><strong>Care that keeps going</strong><small>Real support before, during and after your order.</small></p></div>
          </div>
          <a className="text-link" href="#safety">More about our promise <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}

function ReviewSection() {
  const reviews = [
    { quote: 'Finally, an online shop that makes it simple to find what I need and understand what I’m buying.', person: 'Mara L.', detail: 'Small farm, Oregon', initials: 'ML', color: 'peach' },
    { quote: 'Thoughtful range, quick delivery and genuinely helpful people on the other end. A lovely change.', person: 'Jonah R.', detail: 'Orchard grower, Vermont', initials: 'JR', color: 'blue' },
    { quote: 'It feels like shopping with someone who gets the everyday rhythm of farm life.', person: 'Amira S.', detail: 'Market gardener, Maine', initials: 'AS', color: 'sage' },
  ];
  return (
    <section className="section reviews-section" id="journal">
      <div className="container">
        <div className="reviews-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> KIND WORDS FROM THE FIELD</p><h2>Good company<br /><em>grows here.</em></h2></div><div className="review-score"><div className="review-stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill="currentColor" strokeWidth={0} />)}</div><strong>4.9 <span>out of 5</span></strong><small>from growers in the know</small></div></div>
        <div className="review-grid">
          {reviews.map((review, index) => <article className="review-card" key={review.person} style={{ '--review-index': index }}>
            <div className="review-stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} fill="currentColor" strokeWidth={0} />)}</div>
            <blockquote>“{review.quote}”</blockquote>
            <div className="review-person"><span className={`review-avatar avatar-${review.color}`}>{review.initials}</span><p><strong>{review.person}</strong><small>{review.detail}</small></p><BadgeCheck className="verified-icon" size={17} /></div>
          </article>)}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!email.includes('@') || !email.includes('.')) { setError('Pop in a valid email address and try again.'); return; }
    setError('');
    setSubscribed(true);
  };
  return (
    <section className="newsletter-section" id="safety">
      <div className="container newsletter-inner">
        <div className="newsletter-icon"><Sprout size={22} /></div>
        <div className="newsletter-copy"><p className="eyebrow">A LITTLE FIELD NOTE, NOW AND THEN</p><h2>Good growing in your inbox.</h2><p>Seasonal tips, new finds and a little encouragement from our corner of the field.</p></div>
        {subscribed ? <div className="newsletter-success"><span><Check size={17} /></span><p><strong>You’re on the list.</strong><small>Look out for a note from us soon.</small></p></div> : <form className="newsletter-form" onSubmit={submit}>
          <div className="newsletter-input"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" aria-label="Your email address" required /><button type="submit" aria-label="Sign up for field notes"><ArrowRight size={18} /></button></div>
          {error ? <small className="newsletter-error">{error}</small> : <small>By joining, you agree to our <a href="#footer">privacy policy</a>. No weeds in your inbox.</small>}
        </form>}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="container footer-main">
        <div className="footer-brand"><Logo light /><p>More care for the growing things.<br />Made for the people behind them.</p><div className="footer-socials"><a href="mailto:hello@fieldwell.example" aria-label="Email Fieldwell"><CircleHelp size={16} /></a><a href="#top" aria-label="Back to top"><ArrowUpRight size={16} /></a></div></div>
        <div className="footer-column"><strong>Explore</strong><a href="#shop">Shop all</a><a href="#categories">Shop by need</a><a href="#journal">Field notes</a><a href="#promise">Our story</a></div>
        <div className="footer-column"><strong>Here to help</strong><a href="mailto:hello@fieldwell.example">Contact us</a><a href="#safety">Product care & safety</a><a href="#footer">Shipping & returns</a><a href="#footer">FAQs</a></div>
        <div className="footer-help"><span className="footer-help-icon"><CircleHelp size={17} /></span><div><strong>Questions out in the field?</strong><p>Our friendly team is here for you.</p><a href="mailto:hello@fieldwell.example">Say hello <ArrowRight size={14} /></a></div></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Fieldwell Supply Co.</span><div><a href="#footer">Privacy</a><a href="#footer">Terms</a><a href="#footer">Accessibility</a></div><span className="footer-made">Grown with care <Leaf size={13} /></span></div>
    </footer>
  );
}

export default function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [apiLive, setApiLive] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [cartOpen, setCartOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const { itemCount } = useCart();

  useEffect(() => {
    let stillMounted = true;
    getProducts().then((data) => {
      const rows = Array.isArray(data) ? data : data?.results;
      if (stillMounted && rows?.length) {
        setProducts(rows);
        setApiLive(true);
      }
    }).catch(() => {
      // Keep the storefront useful as a demo while the Django API is offline.
    });
    return () => { stillMounted = false; };
  }, []);

  const chooseCategory = (slug) => {
    setActiveCategory(slug);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <Header search={search} setSearch={setSearch} onOpenCart={() => setCartOpen(true)} itemCount={itemCount} />
      <main>
        <Hero />
        <TrustStrip />
        <CategorySection onSelect={chooseCategory} />
        <ProductSection products={products} search={search} setSearch={setSearch} activeCategory={activeCategory} setActiveCategory={setActiveCategory} sort={sort} setSort={setSort} onQuickView={setQuickProduct} apiLive={apiLive} />
        <StorySection />
        <ReviewSection />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ProductDetailsModal product={quickProduct} onClose={() => setQuickProduct(null)} />
    </div>
  );
}
