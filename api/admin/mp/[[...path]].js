import { handleMpAdmin, mpAdminSegments } from "../../_lib/mpAdminRoute.js";

export default async function handler(req, res) {
  if (!["GET", "PUT", "POST"].includes(req.method ?? "")) {
    res.setHeader("Allow", "GET, PUT, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const segments = mpAdminSegments(req);
  await handleMpAdmin(req, res, segments, req.body ?? {});
}
