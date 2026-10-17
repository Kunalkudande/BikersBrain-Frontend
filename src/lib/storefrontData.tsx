import { createContext, useContext, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Public catalog data only. Never put account, cart, tokens or order data here. */
export interface StorefrontData {
  url: string;
  status: number;
  product?: any;
  products?: { items: any[]; total: number; totalPages: number };
  categories?: any[];
  posts?: any[];
  post?: any;
  blogPagination?: { totalPages: number };
}

const StorefrontContext = createContext<StorefrontData | null>(null);
export function StorefrontDataProvider({ data, children }: { data: StorefrontData | null; children: ReactNode }) {
  return <StorefrontContext.Provider value={data}>{children}</StorefrontContext.Provider>;
}

export function useStorefrontData() {
  const data = useContext(StorefrontContext);
  const { pathname, search } = useLocation();
  if (!data) return null;
  const initial = new URL(data.url, "https://store.invalid");
  return initial.pathname === pathname && initial.searchParams.toString() === new URLSearchParams(search).toString() ? data : null;
}

declare global {
  interface Window { __STOREFRONT_DATA__?: StorefrontData; }
}
