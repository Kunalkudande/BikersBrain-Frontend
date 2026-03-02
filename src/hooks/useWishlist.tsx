import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { userApi, productsApi } from "@/lib/api";
import { useAuth } from "./useAuth";

const GUEST_WL_KEY = "bb_guest_wishlist";

/* ── Types ─────────────────────────────────────── */

export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPrice?: number;
  rating: number;
  stock: number;
  images: { imageUrl: string }[];
}

export interface WishlistItem {
  id: string;
  product: WishlistProduct;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  /** Check if a product ID is currently wishlisted */
  has: (productId: string) => boolean;
  /** Toggle wishlist: add if absent, remove if present */
  toggle: (productId: string, snapshot?: WishlistProduct) => Promise<void>;
  /** Remove a product from wishlist */
  remove: (productId: string) => Promise<void>;
  /** Full refresh */
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

/* ── localStorage helpers ─────────────────────── */

function loadGuest(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_WL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuest(items: WishlistItem[]) {
  localStorage.setItem(GUEST_WL_KEY, JSON.stringify(items));
}

/* ── Provider ─────────────────────────────────── */

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [guestItems, setGuestItems] = useState<WishlistItem[]>(loadGuest);
  const [isLoading, setIsLoading] = useState(false);

  /* Fetch server wishlist when authenticated */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await userApi.getWishlist();
      if (res.success) setItems(res.data as WishlistItem[]);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Merge guest wishlist → server on login */
  useEffect(() => {
    if (!isAuthenticated || guestItems.length === 0) return;
    const merge = async () => {
      for (const item of guestItems) {
        try {
          await userApi.addToWishlist(item.product.id);
        } catch {
          /* ignore */
        }
      }
      saveGuest([]);
      setGuestItems([]);
      refresh();
    };
    merge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /* Active list = server items when logged in, guest items otherwise */
  const activeItems = isAuthenticated ? items : guestItems;

  const has = useCallback(
    (productId: string) =>
      activeItems.some((i) => i.product.id === productId),
    [activeItems]
  );

  /* Toggle */
  const toggle = async (productId: string, snapshot?: WishlistProduct) => {
    if (has(productId)) {
      await remove(productId);
      return;
    }

    /* ── Add ── */
    if (!isAuthenticated) {
      let productData = snapshot;
      if (!productData) {
        try {
          const res = await productsApi.getBySlug(productId);
          if (res.success) {
            const p = res.data as any;
            productData = {
              id: p.id,
              name: p.name,
              slug: p.slug,
              brand: p.brand,
              price: Number(p.price),
              discountPrice: p.discountPrice
                ? Number(p.discountPrice)
                : undefined,
              rating: Number(p.rating ?? 0),
              stock: p.stock,
              images: p.images,
            };
          }
        } catch {
          /* ignore */
        }
      }
      if (!productData) return;

      const updated = [
        ...loadGuest(),
        {
          id: `guest-wl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          product: productData,
        },
      ];
      saveGuest(updated);
      setGuestItems([...updated]);
      return;
    }

    /* Authenticated */
    await userApi.addToWishlist(productId);
    await refresh();
  };

  /* Remove */
  const remove = async (productId: string) => {
    if (!isAuthenticated) {
      const updated = loadGuest().filter((i) => i.product.id !== productId);
      saveGuest(updated);
      setGuestItems([...updated]);
      return;
    }
    await userApi.removeFromWishlist(productId);
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        items: activeItems,
        isLoading,
        has,
        toggle,
        remove,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within <WishlistProvider>");
  return ctx;
}
