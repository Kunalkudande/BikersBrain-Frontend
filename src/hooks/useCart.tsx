import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { cartApi, productsApi } from "@/lib/api";
import { useAuth } from "./useAuth";

const GUEST_CART_KEY = "bb_guest_cart";

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    price: number;
    discountPrice?: number;
    stock: number;
    images: { imageUrl: string }[];
  };
  variant?: {
    id: string;
    size: string;
    color: string;
    stock: number;
    additionalPrice: number;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

type ProductSnapshot = Pick<CartItem, "product" | "variant">;

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  isGuest: boolean;
  addItem: (productId: string, quantity: number, variantId?: string, snapshot?: ProductSnapshot) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadGuestCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]"); } catch { return []; }
}
function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<CartItem[]>(loadGuestCart);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) { setCart(null); return; }
    try {
      setIsLoading(true);
      const res = await cartApi.get();
      if (res.success) setCart(res.data as Cart);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  // When user logs in, merge guest cart items into server cart then clear guest cart
  useEffect(() => {
    if (!isAuthenticated || guestItems.length === 0) return;
    const merge = async () => {
      for (const item of guestItems) {
        try { await cartApi.addItem(item.productId, item.quantity, item.variantId); } catch { /* ignore */ }
      }
      saveGuestCart([]);
      setGuestItems([]);
      refreshCart();
    };
    merge();
  }, [isAuthenticated]); // only fires when auth state changes

  const addItem = async (productId: string, quantity: number, variantId?: string, snapshot?: ProductSnapshot) => {
    if (!isAuthenticated) {
      // Guest mode: store in localStorage
      let productData = snapshot?.product;
      let variantData = snapshot?.variant;

      if (!productData) {
        // Fetch product details if no snapshot provided
        try {
          const res = await productsApi.getBySlug(productId); // fallback: won`t work with ID
          if (res.success) {
            const p = res.data as any;
            productData = { id: p.id, name: p.name, slug: p.slug, brand: p.brand, price: Number(p.price), discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined, stock: p.stock, images: p.images };
          }
        } catch { /* ignore */ }
      }
      if (!productData) return;

      const items = loadGuestCart();
      const idx = items.findIndex(i => i.productId === productId && (i.variantId || undefined) === (variantId || undefined));
      if (idx >= 0) {
        items[idx].quantity = Math.min(items[idx].quantity + quantity, items[idx].product.stock);
      } else {
        items.push({
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          productId,
          variantId,
          quantity,
          product: productData,
          variant: variantData,
        });
      }
      saveGuestCart(items);
      setGuestItems([...items]);
      return;
    }
    const res = await cartApi.addItem(productId, quantity, variantId);
    if (res.success) setCart(res.data as Cart);
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (!isAuthenticated) {
      const items = loadGuestCart().map(i => i.id === itemId ? { ...i, quantity } : i);
      saveGuestCart(items);
      setGuestItems([...items]);
      return;
    }
    const res = await cartApi.updateItem(itemId, quantity);
    if (res.success) setCart(res.data as Cart);
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated) {
      const items = loadGuestCart().filter(i => i.id !== itemId);
      saveGuestCart(items);
      setGuestItems([...items]);
      return;
    }
    const res = await cartApi.removeItem(itemId);
    if (res.success) setCart(res.data as Cart);
  };

  const clearCartAction = async () => {
    if (!isAuthenticated) {
      saveGuestCart([]);
      setGuestItems([]);
      return;
    }
    await cartApi.clear();
    setCart(null);
  };

  const isGuest = !isAuthenticated;

  // Return effective cart: server cart for auth users, localStorage cart for guests
  const effectiveCart: Cart | null = isAuthenticated
    ? cart
    : guestItems.length > 0 ? { id: "guest", items: guestItems } : null;

  const itemCount = effectiveCart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart: effectiveCart,
        itemCount,
        isLoading,
        isGuest,
        addItem,
        updateItem,
        removeItem,
        clearCart: clearCartAction,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
