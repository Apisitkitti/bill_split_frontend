import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // LIFF loads this page inside LINE's in-app browser, which reaches the dev
    // server over a tunnel rather than through localhost.
    host: true,

    // Vite rejects requests whose Host header it does not recognise, so that a
    // page on a hostname an attacker controls cannot point at this dev server
    // and read the response. The tunnel hands out a new subdomain on every
    // restart, so the suffix is listed rather than one host — a leading dot
    // matches any subdomain. Note "*" is not a wildcard here; Vite reads it as
    // a literal hostname and still blocks everything.
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io"],
  },
});
