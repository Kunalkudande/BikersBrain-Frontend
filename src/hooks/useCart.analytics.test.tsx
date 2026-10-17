import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "./useCart";
import { cartApi, visitorApi } from "@/lib/api";
vi.mock("@/lib/api", () => ({
  cartApi: { get: vi.fn(), addItem: vi.fn() },
  productsApi: { getBySlug: vi.fn() },
  visitorApi: { track: vi.fn() },
}));
const auth = { isAuthenticated: false, isAdmin: false };
vi.mock("./useAuth", () => ({ useAuth: () => auth }));
const product = {
  id: "product",
  name: "Coil",
  slug: "coil",
  brand: "Test",
  price: 100,
  stock: 2,
  images: [],
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  auth.isAuthenticated = false;
  auth.isAdmin = false;
  vi.mocked(cartApi.get).mockResolvedValue({
    success: true,
    data: { id: "cart", items: [] },
  } as never);
});
afterEach(cleanup);
it("tracks successful guest cart increases once and ignores a stock-capped repeat", async () => {
  const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
  await act(() => result.current.addItem("product", 2, undefined, { product }));
  expect(visitorApi.track).toHaveBeenCalledTimes(1);
  expect(vi.mocked(visitorApi.track).mock.calls[0][3]).toBe("add_to_cart");
  await act(() => result.current.addItem("product", 1, undefined, { product }));
  expect(visitorApi.track).toHaveBeenCalledTimes(1);
});
it("does not record failed authenticated cart requests or admin activity", async () => {
  auth.isAuthenticated = true;
  vi.mocked(cartApi.addItem).mockRejectedValueOnce(new Error("out of stock"));
  const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
  await act(async () => {
    await expect(result.current.addItem("product", 1)).rejects.toThrow(
      "out of stock",
    );
  });
  expect(visitorApi.track).not.toHaveBeenCalled();
  auth.isAdmin = true;
  vi.mocked(cartApi.addItem).mockResolvedValue({
    success: true,
    data: { id: "cart", items: [] },
  } as never);
  // Remount to reflect the changed admin authentication context.
  cleanup();
  const admin = renderHook(() => useCart(), { wrapper: CartProvider });
  await act(() => admin.result.current.addItem("product", 1));
  expect(visitorApi.track).not.toHaveBeenCalled();
});
