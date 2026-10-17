import { rename } from "node:fs/promises";

// A static index.html would win over Vercel's root rewrite and bypass homepage SSR.
// Keep the template inside the function bundle, outside the public root index.
await rename(new URL("../dist/index.html", import.meta.url), new URL("../dist/app-shell.html", import.meta.url));
console.log("Prepared server-rendered storefront template.");
