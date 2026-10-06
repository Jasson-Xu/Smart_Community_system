import vinext from "vinext";
import { defineConfig } from "vite";

// The EC2 server uses Vinext's standalone Node output without the local
// Cloudflare Workers development adapter.
export default defineConfig({ plugins: [vinext()] });
