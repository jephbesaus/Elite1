// Fonction serverless Vercel — /api/ai-assistant
//
// Reçoit { system, messages } depuis le front-end, appelle l'API Anthropic
// avec la clé stockée côté serveur (jamais exposée au navigateur), et
// renvoie le texte généré.
//
// Configuration requise sur Vercel :
//   Project Settings → Environment Variables → ANTHROPIC_API_KEY = sk-ant-...

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "ANTHROPIC_API_KEY manquante. Ajoutez-la dans Vercel → Project Settings → Environment Variables.",
    });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Paramètre 'messages' manquant ou invalide." });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: system || "",
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: "Erreur API Anthropic", detail: errText });
      return;
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((block) => block.text || "")
      .join("\n")
      .trim();

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
