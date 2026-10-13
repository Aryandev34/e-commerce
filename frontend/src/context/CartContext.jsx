import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'fieldwell-cart-v1';

function loadCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      cartId: stored.cartId || null,
      items: Array.isArray(stored.items) ? stored.items : [],
    };
  } catch {
    return { cartId: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const initial = useRef(loadCart()).current;
  const [cartId, setCartId] = useState(initial.cartId);
  const [items, setItems] = useState(initial.items);
  const itemsRef = useRef(initial.items);
  const cartIdRef = useRef(initial.cartId);
  const createCartPromise = useRef(null);
  const remoteSyncQueue = useRef(Promise.resolve());
  const itemIdsRef = useRef(new Map(initial.items.filter((line) => line.remoteItemId).map((line) => [String(line.product.id), line.remoteItemId])));

  useEffect(() => {
    cartIdRef.current = cartId;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cartId, items }));
    } catch {
      // The cart remains usable for this tab when browser storage is unavailable.
    }
  }, [cartId, items]);

  const commitItems = useCallback((update) => {
    const nextItems = typeof update === 'function' ? update(itemsRef.current) : update;
    itemsRef.current = nextItems;
    setItems(nextItems);
    return nextItems;
  }, []);

  const rememberCartId = useCallback((id) => {
    cartIdRef.current = id;
    setCartId(id);
  }, []);

  const ensureRemoteCart = useCallback(async () => {
    if (cartIdRef.current) return cartIdRef.current;
    if (!createCartPromise.current) {
      createCartPromise.current = apiRequest('/carts/', {
        method: 'POST',
        body: JSON.stringify({}),
      }).then((cart) => {
        rememberCartId(cart.id);
        return cart.id;
      }).finally(() => {
        createCartPromise.current = null;
      });
    }
    return createCartPromise.current;
  }, [rememberCartId]);

  const rememberRemoteLine = useCallback((productId, remoteItemId) => {
    itemIdsRef.current.set(String(productId), remoteItemId);
    commitItems((current) => current.map((line) => (
      String(line.product.id) === String(productId) ? { ...line, remoteItemId } : line
    )));
  }, [commitItems]);

  const enqueueRemoteSync = useCallback((operation) => {
    const nextOperation = remoteSyncQueue.current.then(operation).catch(() => undefined);
    remoteSyncQueue.current = nextOperation;
    return nextOperation;
  }, []);

  const addItem = useCallback((product) => {
    const key = String(product.id);
    const existing = itemsRef.current.find((line) => String(line.product.id) === key);
    const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : Infinity;
    if (stock <= 0 || (existing && existing.quantity >= stock)) return false;
    if (existing) {
      commitItems((current) => current.map((line) => (
        String(line.product.id) === key ? { ...line, quantity: line.quantity + 1 } : line
      )));
    } else {
      commitItems((current) => [...current, { product, quantity: 1, remoteItemId: itemIdsRef.current.get(key) || null }]);
    }

    // Keep a remote API cart in sync when the Django service is running. The local cart
    // stays responsive and survives refreshes if the API is unavailable.
    void enqueueRemoteSync(async () => {
      const id = await ensureRemoteCart();
      const remoteCart = await apiRequest(`/carts/${id}/items/`, {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      const remoteLine = remoteCart?.items?.find((line) => String(line.product.id) === key);
      if (remoteLine) rememberRemoteLine(product.id, remoteLine.id);
    });
    return true;
  }, [commitItems, enqueueRemoteSync, ensureRemoteCart, rememberRemoteLine]);

  const setQuantity = useCallback((productId, quantity) => {
    const key = String(productId);
    const line = itemsRef.current.find((item) => String(item.product.id) === key);
    const stock = line && Number.isFinite(Number(line.product.stock)) ? Number(line.product.stock) : Infinity;
    const safeQuantity = Math.max(1, Math.min(Number(quantity) || 1, Math.max(1, stock)));
    commitItems((current) => current.map((item) => (
      String(item.product.id) === key ? { ...item, quantity: safeQuantity } : item
    )));
    void enqueueRemoteSync(async () => {
      const remoteItemId = itemIdsRef.current.get(key);
      const currentCartId = cartIdRef.current;
      if (!remoteItemId || !currentCartId) return;
      await apiRequest(`/carts/${currentCartId}/items/${remoteItemId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: safeQuantity }),
      });
    });
  }, [commitItems, enqueueRemoteSync]);

  const removeItem = useCallback((productId) => {
    const key = String(productId);
    const previousRemoteItemId = itemIdsRef.current.get(key);
    commitItems((current) => current.filter((line) => String(line.product.id) !== key));
    itemIdsRef.current.delete(key);
    void enqueueRemoteSync(async () => {
      const remoteItemId = previousRemoteItemId || itemIdsRef.current.get(key);
      const currentCartId = cartIdRef.current;
      if (!remoteItemId || !currentCartId) return;
      await apiRequest(`/carts/${currentCartId}/items/${remoteItemId}/`, { method: 'DELETE' });
      itemIdsRef.current.delete(key);
    });
  }, [commitItems, enqueueRemoteSync]);

  const clearCart = useCallback(() => {
    itemIdsRef.current.clear();
    cartIdRef.current = null;
    setCartId(null);
    commitItems([]);
  }, [commitItems]);

  const checkout = useCallback(async (customer) => {
    await remoteSyncQueue.current;
    if (cartIdRef.current) {
      const result = await apiRequest('/orders/checkout/', {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartIdRef.current, ...customer }),
      });
      clearCart();
      return result;
    }
    const orderNumber = `FW-${Date.now().toString().slice(-8)}`;
    clearCart();
    return { order_number: orderNumber, demo: true };
  }, [clearCart]);

  const subtotal = items.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const value = useMemo(() => ({
    items,
    itemCount,
    subtotal,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    checkout,
  }), [items, itemCount, subtotal, addItem, setQuantity, removeItem, clearCart, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
