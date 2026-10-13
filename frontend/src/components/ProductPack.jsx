import { Leaf, ShieldCheck, Sprout, Stethoscope } from 'lucide-react';

export default function ProductPack({ product, mini = false }) {
  const icon = product.category === 'animal-health' ? Stethoscope : product.category === 'crop-protection' ? ShieldCheck : Sprout;
  const Icon = icon;
  return (
    <div className={`product-visual tone-${product.image_tone || 'sage'}${mini ? ' product-visual-mini' : ''}`} aria-hidden="true">
      <span className="visual-orbit orbit-one" />
      <span className="visual-orbit orbit-two" />
      <span className="visual-leaf leaf-one"><Leaf size={30} strokeWidth={1.25} /></span>
      <span className="visual-leaf leaf-two"><Leaf size={22} strokeWidth={1.25} /></span>
      <div className={`product-pack pack-${product.pack_type || 'bottle'}`}>
        {product.pack_type === 'bottle' && <span className="pack-cap" />}
        {product.pack_type === 'spray' && <span className="spray-top"><i /></span>}
        {product.pack_type === 'pouch' && <span className="pouch-seal" />}
        <div className="pack-label">
          <span className="pack-brand">fieldwell<span>®</span></span>
          <span className="pack-icon"><Icon size={mini ? 9 : 13} strokeWidth={1.7} /></span>
          <strong>{product.name}</strong>
          <span className="pack-product-type">{product.category_name || 'Farm care'}</span>
          <span className="pack-unit">{product.unit}</span>
        </div>
      </div>
      {!mini && <span className="visual-stamp">GOOD<br />GROWING</span>}
    </div>
  );
}
