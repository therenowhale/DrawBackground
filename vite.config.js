import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const wallpaperFile = join(process.cwd(), "work", "wallpaper.svg");

function wallpaperApi() {
  return {
    name: "local-wallpaper-api",
    configureServer(server) {
      server.middlewares.use("/api/wallpaper", (req, res, next) => {
        if (req.method === "GET") {
          try {
            const svg = readFileSync(wallpaperFile, "utf8");
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.end(svg);
          } catch {
            res.statusCode = 204;
            res.end();
          }
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.setEncoding("utf8");
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            if (!body.includes("<svg")) {
              res.statusCode = 400;
              res.end("Expected SVG");
              return;
            }
            mkdirSync(dirname(wallpaperFile), { recursive: true });
            writeFileSync(wallpaperFile, body, "utf8");
            res.statusCode = 204;
            res.end();
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [react(), wallpaperApi()] });
