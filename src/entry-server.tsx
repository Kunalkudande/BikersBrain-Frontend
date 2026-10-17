import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { StorefrontDataProvider, type StorefrontData } from "@/lib/storefrontData";
import { serializeJsonLd } from "@/lib/seo";
import SEO from "@/components/SEO";
import Index from "@/pages/Index";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ReturnPolicy from "@/pages/ReturnPolicy";
import ShippingPolicy from "@/pages/ShippingPolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/NotFound";

export function render(data: StorefrontData) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  if (data.categories) queryClient.setQueryData(["categories-public"], { success: true, data: data.categories });
  if (data.products && data.url.split("?")[0] === "/") queryClient.setQueryData(["products", "featured-gear"], { success: true, data: data.products });
  const helmetContext: any = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <StorefrontDataProvider data={data}>
          <AuthProvider><CartProvider><WishlistProvider>
            <StaticRouter location={data.url}>
              <MotionConfig reducedMotion="always">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  {["/login", "/register", "/forgot-password", "/reset-password", "/cart", "/checkout", "/account", "/wishlist", "/order-success", "/track-order", "/admin/*"].map(path => <Route key={path} path={path} element={<SEO title="BikersBrain" noSuffix noIndex />} />)}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MotionConfig>
            </StaticRouter>
          </WishlistProvider></CartProvider></AuthProvider>
        </StorefrontDataProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  queryClient.clear();
  const { helmet } = helmetContext;
  return {
    html,
    head: [helmet.title, helmet.meta, helmet.link, helmet.script].map(tag => tag.toString()).join("\n"),
    dataScript: `<script id="storefront-data">window.__STOREFRONT_DATA__=${serializeJsonLd(data)};</script>`,
  };
}
