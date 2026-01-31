export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST only");

  const auth = req.headers["x-auth"];
  if (process.env.RELAY_KEY && auth !== process.env.RELAY_KEY) {
    return res.status(401).send("unauthorized");
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); }
    catch { return res.status(400).send("bad json"); }
  }

  const name = String(payload?.name || "").trim();
  const msg  = String(payload?.msg  || "");

  if (!name) return res.status(400).send("missing name");

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return res.status(500).send("missing DISCORD_BOT_TOKEN");

  let map = {};
  try { map = JSON.parse(process.env.CHANNEL_MAP_JSON || "{}"); }
  catch { return res.status(500).send("bad CHANNEL_MAP_JSON"); }

  const channelId = map[name];
  if (!channelId) return res.status(400).send("unknown name (no channel mapping)");

  const discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;

  try {
    const r = await fetch(discordUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: msg.slice(0, 1900),
        allowed_mentions: { parse: [] }
      })
    });

    const text = await r.text();
    return res.status(r.status).send(text || "ok");
  } catch {
    return res.status(500).send("discord fetch failed");
  }
}
