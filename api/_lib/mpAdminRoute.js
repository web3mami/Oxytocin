import { requireAdmin } from "./auth.js";
import {
  generateAndSaveMpBracket,
  getMpBracketDraft,
  normalizeBracket,
  saveMpBracket,
  validateBracketForPublish,
} from "./mpBracketStore.js";
import {
  getMpFixturesDraft,
  saveMpFixtures,
  validateMpFixturesForPublish,
} from "./mpFixturesStore.js";
import {
  getMpRosterDraft,
  saveMpRoster,
  validateMpRosterForPublish,
} from "./mpRosterStore.js";

/** @param {import("http").IncomingMessage & { query?: Record<string, string | string[]> }} req */
export function mpAdminSegments(req) {
  const fromQuery = req.query?.path;
  if (fromQuery) {
    return Array.isArray(fromQuery) ? fromQuery : [fromQuery];
  }
  const pathname = (req.url || "").split("?")[0];
  const prefix = "/api/admin/mp";
  if (pathname === prefix) return [];
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length + 1).split("/").filter(Boolean);
  }
  return [];
}

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {string[]} segments
 * @param {object} [body]
 */
export async function handleMpAdmin(req, res, segments, body = {}) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    res.statusCode = auth.status;
    res.end(JSON.stringify({ error: auth.error }));
    return;
  }

  const [resource, action] = segments;

  if (resource === "roster") {
    if (action === "publish" && req.method === "POST") {
      const teams = body?.teams;
      if (!Array.isArray(teams)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "teams array is required." }));
        return;
      }
      const check = validateMpRosterForPublish(teams);
      if (!check.ok) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: check.error }));
        return;
      }
      try {
        const payload = await saveMpRoster(teams, { publish: true });
        res.end(JSON.stringify({ ok: true, published: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp roster publish]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to publish MP roster" }));
      }
      return;
    }

    if (!action && req.method === "GET") {
      try {
        const draft = await getMpRosterDraft();
        res.end(JSON.stringify({ ok: true, ...draft }));
      } catch (err) {
        console.error("[admin/mp roster GET]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to load MP roster" }));
      }
      return;
    }

    if (!action && req.method === "PUT") {
      const teams = body?.teams;
      if (!Array.isArray(teams)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "teams array is required." }));
        return;
      }
      try {
        const payload = await saveMpRoster(teams, { publish: false });
        res.end(JSON.stringify({ ok: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp roster PUT]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to save MP roster" }));
      }
      return;
    }
  }

  if (resource === "fixtures") {
    if (action === "publish" && req.method === "POST") {
      const matches = body?.matches;
      if (!Array.isArray(matches)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "matches array is required." }));
        return;
      }
      const roster = await getMpRosterDraft();
      const check = validateMpFixturesForPublish(matches, roster.teams);
      if (!check.ok) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: check.error }));
        return;
      }
      try {
        const payload = await saveMpFixtures(matches, { publish: true });
        res.end(JSON.stringify({ ok: true, published: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp fixtures publish]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to publish MP fixtures" }));
      }
      return;
    }

    if (!action && req.method === "GET") {
      try {
        const draft = await getMpFixturesDraft();
        res.end(JSON.stringify({ ok: true, ...draft }));
      } catch (err) {
        console.error("[admin/mp fixtures GET]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to load MP fixtures" }));
      }
      return;
    }

    if (!action && req.method === "PUT") {
      const matches = body?.matches;
      if (!Array.isArray(matches)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "matches array is required." }));
        return;
      }
      try {
        const payload = await saveMpFixtures(matches, { publish: false });
        res.end(JSON.stringify({ ok: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp fixtures PUT]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to save MP fixtures" }));
      }
      return;
    }
  }

  if (resource === "bracket") {
    if (action === "generate" && req.method === "POST") {
      try {
        const roster = await getMpRosterDraft();
        const teamNames = (roster.teams ?? []).map((t) => t.name).filter(Boolean);
        if (!teamNames.length) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Save MP teams before generating the cup bracket." }));
          return;
        }
        const payload = await generateAndSaveMpBracket(teamNames);
        res.end(JSON.stringify({ ok: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp bracket generate]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to generate MP bracket" }));
      }
      return;
    }

    if (action === "publish" && req.method === "POST") {
      const bracket = body?.bracket;
      if (!bracket || typeof bracket !== "object") {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "bracket object is required." }));
        return;
      }
      const roster = await getMpRosterDraft();
      const check = validateBracketForPublish(normalizeBracket(bracket), roster.teams);
      if (!check.ok) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: check.error }));
        return;
      }
      try {
        const payload = await saveMpBracket(normalizeBracket(bracket), { publish: true });
        res.end(JSON.stringify({ ok: true, published: true, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp bracket publish]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to publish MP bracket" }));
      }
      return;
    }

    if (!action && req.method === "GET") {
      try {
        const draft = await getMpBracketDraft();
        res.end(
          JSON.stringify({
            ok: true,
            bracket: draft,
            published: draft.published,
            updatedAt: draft.updatedAt,
          }),
        );
      } catch (err) {
        console.error("[admin/mp bracket GET]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to load MP bracket" }));
      }
      return;
    }

    if (!action && req.method === "PUT") {
      const bracket = body?.bracket;
      if (!bracket || typeof bracket !== "object") {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "bracket object is required." }));
        return;
      }
      try {
        const existing = await getMpBracketDraft();
        const payload = await saveMpBracket(normalizeBracket(bracket), {
          publish: Boolean(existing.published),
        });
        res.end(JSON.stringify({ ok: true, published: payload.published, ...payload }));
      } catch (err) {
        if (err?.code === "NO_STORAGE") {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.error("[admin/mp bracket PUT]", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to save MP bracket" }));
      }
      return;
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Unknown MP admin route" }));
}
