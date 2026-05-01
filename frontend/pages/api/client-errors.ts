import type { NextApiRequest, NextApiResponse } from "next";

const MAX_BODY_BYTES = 12_000;

type ResponseBody = {
  ok: boolean;
};

function sanitize(value: unknown, maxLength = 4000) {
  if (typeof value !== "string") {
    return undefined;
  }
  return value.replace(/[\r\n\t]+/g, " ").slice(0, maxLength);
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false });
    return;
  }

  const raw = JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    res.status(413).json({ ok: false });
    return;
  }

  const body = req.body ?? {};
  const entry = {
    event: "frontend.client_error",
    source: sanitize(body.source, 80),
    name: sanitize(body.name, 120),
    message: sanitize(body.message, 800),
    stack: sanitize(body.stack, 4000),
    componentStack: sanitize(body.componentStack, 3000),
    url: sanitize(body.url, 1000),
    userAgent: sanitize(body.userAgent, 500),
    timestamp: sanitize(body.timestamp, 80),
    remoteAddress: req.headers["x-forwarded-for"] ?? req.socket.remoteAddress,
  };

  console.error(JSON.stringify(entry));
  res.status(202).json({ ok: true });
}

