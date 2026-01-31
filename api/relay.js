export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("POST only");
    return;
  }

  const auth = req.headers["x-auth"];
  if (process.env.RELAY_KEY && auth !== process.env.RELAY_KEY) {
    res.status(401).send("unauthorized");
    return;
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      res.status(400).send("bad json");
      return;
    }
  }

  const name = String(payload?.name || "unknown");
  const msg  = String(payload?.msg  || "");

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    res.status(500).send("missing DISCORD_WEBHOOK_URL");
    return;
  }

  const body = {
    username: name,
    content: msg.slice(0, 1900),
    allowed_mentions: { parse: [] }
  };

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    res.status(r.status).send("ok");
  } catch (e) {
    res.status(500).send("discord fetch failed");
  }
}
