import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { listTeams, registerTeam } from "./api/_lib/teams.js";
import { validateRegistration } from "./api/_lib/validate.js";

function localApiPlugin() {
  return {
    name: "oxytocin-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url?.startsWith("/api/")) return next();

        res.setHeader("Content-Type", "application/json");

        if (url === "/api/teams" && req.method === "GET") {
          try {
            const teams = await listTeams();
            res.end(JSON.stringify({ teams, count: teams.length }));
          } catch (err) {
            console.error("[teams]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to load teams" }));
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
              const team = await registerTeam(parsed.data);
              res.statusCode = 201;
              res.end(JSON.stringify({ team }));
            } catch (err) {
              if (err?.code === "DUPLICATE") {
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

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});
