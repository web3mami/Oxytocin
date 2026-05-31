import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { requireAdmin } from "./api/_lib/auth.js";
import { listPlayers, registerPlayer } from "./api/_lib/players.js";
import { validateRegistration } from "./api/_lib/validate.js";

function localApiPlugin(env) {
  if (!process.env.ADMIN_PASSWORD && env.VITE_ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = env.VITE_ADMIN_PASSWORD;
  }
  if (!process.env.ADMIN_PASSWORD && env.MODE === "development") {
    process.env.ADMIN_PASSWORD = "oxytocin-dev";
  }

  return {
    name: "oxytocin-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url?.startsWith("/api/")) return next();

        res.setHeader("Content-Type", "application/json");

        if (url === "/api/players" && req.method === "GET") {
          try {
            const players = await listPlayers();
            res.end(JSON.stringify({ count: players.length }));
          } catch (err) {
            console.error("[players]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to load players" }));
          }
          return;
        }

        if (url === "/api/admin/players" && req.method === "GET") {
          const auth = requireAdmin({ headers: req.headers });
          if (!auth.ok) {
            res.statusCode = auth.status;
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }
          try {
            const players = await listPlayers();
            res.end(JSON.stringify({ players, count: players.length }));
          } catch (err) {
            console.error("[admin/players]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to load registrations" }));
          }
          return;
        }

        if (url === "/api/register" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = validateRegistration(JSON.parse(body || "{}"));
              if (!parsed.ok) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: parsed.error }));
                return;
              }
              const player = await registerPlayer(parsed.data);
              res.statusCode = 201;
              res.end(JSON.stringify({ player }));
            } catch (err) {
              if (err?.code === "DUPLICATE" || err?.code === "FULL") {
                res.statusCode = 409;
                res.end(JSON.stringify({ error: err.message }));
                return;
              }
              console.error("[register]", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Registration failed" }));
            }
          });
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    localApiPlugin({ ...loadEnv(mode, process.cwd(), ""), MODE: mode }),
  ],
}));
