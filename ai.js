// Appelle la fonction serverless /api/ai-assistant (voir /api/ai-assistant.js).
// La clé API Anthropic reste côté serveur (variable d'environnement Vercel),
// jamais exposée dans le navigateur.

export async function askAI(systemPrompt, messages) {
  try {
    const res = await fetch("/api/ai-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: systemPrompt, messages }),
    });
    if (!res.ok) throw new Error("Réponse serveur invalide");
    const data = await res.json();
    return data.text || "Je n'ai pas pu générer de réponse, réessayez.";
  } catch (err) {
    return "⚠️ Assistant IA indisponible. Vérifiez que la clé ANTHROPIC_API_KEY est bien configurée dans les variables d'environnement Vercel (voir README.md).";
  }
}
