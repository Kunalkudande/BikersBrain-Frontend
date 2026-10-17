import { createRoot } from "react-dom/client";
import { StorefrontDataProvider } from "./lib/storefrontData";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary isOuterBoundary>
    <StorefrontDataProvider data={window.__STOREFRONT_DATA__ || null}><App /></StorefrontDataProvider>
  </ErrorBoundary>
);
