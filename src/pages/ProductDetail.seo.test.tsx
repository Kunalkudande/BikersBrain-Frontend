import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { StorefrontDataProvider } from "@/lib/storefrontData";
import ProductDetail from "./ProductDetail";

const product = (slug: string, name: string) => ({ id: slug, slug, name, brand: "Test", category: "COILS", description: "Replacement ignition coil for the specified bike model.", price: 650, discountPrice: null, stock: 3, sku: slug, images: [], variants: [], reviews: [], specifications: null, rating: 0, totalReviews: 0 });
vi.mock("@/lib/api", () => ({
  productsApi: {
    getBySlug: vi.fn(async (slug: string) => ({ success: true, data: product(slug, "Coil B") })),
    getRelated: vi.fn(async () => ({ success: true, data: [] })),
    getCategories: vi.fn(async () => ({ success: true, data: [] })),
  },
  authApi: {}, newsletterApi: {}, userApi: {}, cartApi: {},
}));
afterEach(cleanup);

function Navigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/products/coil-b")}>Other product</button><button onClick={() => navigate("/products/coil-a")}>Original product</button></>;
}

describe("server-loaded product navigation", () => {
  it("restores the correct product when returning to the initial URL", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<HelmetProvider><QueryClientProvider client={queryClient}><StorefrontDataProvider data={{ url: "/products/coil-a", status: 200, product: product("coil-a", "Coil A"), categories: [] }}><AuthProvider><CartProvider><WishlistProvider><MemoryRouter initialEntries={["/products/coil-a"]}><Navigation /><Routes><Route path="/products/:slug" element={<ProductDetail />} /></Routes></MemoryRouter></WishlistProvider></CartProvider></AuthProvider></StorefrontDataProvider></QueryClientProvider></HelmetProvider>);
    expect(await screen.findByRole("heading", { name: "Coil A", level: 1 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Other product" }));
    expect(await screen.findByRole("heading", { name: "Coil B", level: 1 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Original product" }));
    expect(await screen.findByRole("heading", { name: "Coil A", level: 1 })).toBeInTheDocument();
    queryClient.clear();
  });
});
