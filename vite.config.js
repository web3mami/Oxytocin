import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { listPublicRoster } from "./api/_lib/teams.js";
import { draftBrDuos } from "./api/_lib/draftBr.js";
import { saveBrRoster } from "./api/_lib/rosterStore.js";
import { handleMpAdmin, mpAdminSegments } from "./api/_lib/mpAdminRoute.js";
import { requireAdmin } from "./api/_lib/auth.js";
import { deletePlayer, listPlayers, registerPlayer } from "./api/_lib/players.js";
import { validateRegistration } from "./api/_lib/validate.js";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function localApiPlugin(env) {
  if (!process.env.DATABASE_URL && env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }
  if (!process.env.ADMIN_PASSWORD && env.ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD;
  }
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

        if (url === "/api/admin/players" && req.method === "POST") {
          const auth = requireAdmin({ headers: req.headers });
          if (!auth.ok) {
            res.statusCode = auth.status;
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }
          readJsonBody(req)
            .then(async (body) => {
              const parsed = validateRegistration(body);
              if (!parsed.ok) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: parsed.error }));
                return;
              }
              try {
                const player = await registerPlayer(parsed.data);
                res.statusCode = 201;
                res.end(JSON.stringify({ ok: true, player }));
              } catch (err) {
                if (err?.code === "DUPLICATE") {
                  res.statusCode = 409;
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
                console.error("[admin/players POST]", err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to add registration" }));
              }
            })
            .catch(() => {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid JSON body" }));
            });
          return;
        }

        if (url?.startsWith("/api/admin/players") && req.method === "DELETE") {
          const auth = requireAdmin({ headers: req.headers });
          if (!auth.ok) {
            res.statusCode = auth.status;
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }
          const id = new URL(req.url, "http://localhost").searchParams.get("id");
          try {
            const result = await deletePlayer(id);
            res.end(JSON.stringify({ ok: true, id: result.id }));
          } catch (err) {
            if (err?.code === "NOT_FOUND") {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            if (err?.code === "INVALID") {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            console.error("[admin/players DELETE]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to delete registration" }));
          }
          return;
        }

        if (url === "/api/roster" && req.method === "GET") {
          try {
            const roster = await listPublicRoster();
            res.end(JSON.stringify(roster));
          } catch (err) {
            console.error("[roster]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to load rosters" }));
          }
          return;
        }

        if (url === "/api/admin/draft-br" && req.method === "POST") {
          const auth = requireAdmin({ headers: req.headers });
          if (!auth.ok) {
            res.statusCode = auth.status;
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }
          try {
            const players = await listPlayers();
            const brPlayers = players.filter((p) => p.modeBr);
            const draft = draftBrDuos(brPlayers);
            res.end(JSON.stringify({ ok: true, ...draft }));
          } catch (err) {
            if (err?.code === "INVALID_COUNT") {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            console.error("[admin/draft-br]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to draft BR teams" }));
          }
          return;
        }

        if (url?.startsWith("/api/admin/mp") && ["GET", "PUT", "POST"].includes(req.method ?? "")) {
          const segments = mpAdminSegments(req);
          if (req.method === "GET") {
            await handleMpAdmin(req, res, segments, {});
            return;
          }
          readJsonBody(req)
            .then(async (body) => {
              await handleMpAdmin(req, res, segments, body);
            })
            .catch(() => {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid JSON body" }));
            });
          return;
        }

        if (url === "/api/admin/publish-br-roster" && req.method === "POST") {
          const auth = requireAdmin({ headers: req.headers });
          if (!auth.ok) {
            res.statusCode = auth.status;
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }
          readJsonBody(req)
            .then(async (body) => {
              const squads = body?.squads;
              if (!Array.isArray(squads) || !squads.length) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Draft squads are required to publish." }));
                return;
              }
              const payload = await saveBrRoster({
                squads,
                reserve: body?.reserve ?? [],
                meta: body?.meta ?? null,
              });
              res.end(JSON.stringify({ ok: true, published: true, ...payload }));
            })
            .catch((err) => {
              if (err?.code === "NO_STORAGE") {
                res.statusCode = 503;
                res.end(JSON.stringify({ error: err.message }));
                return;
              }
              console.error("[admin/publish-br-roster]", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to publish BR roster" }));
            });
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
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
}));
