// Thin wrapper around the Anthropic Messages API. Every function here
// returns `null` (never throws) when no API key is configured or the
// call fails — callers always have a rule-based fallback ready (see
// insightsController.js) so the feature works either way, just with
// smarter/more personalized text once a key is added.
//
// Uses Node's built-in fetch (Node 18+) instead of the Anthropic SDK to
// avoid adding a dependency for what's a handful of REST calls.

const isConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function callClaude(systemPrompt, userPrompt, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Anthropic API");
  return text;
}

// Given anonymized aggregate stats (no names beyond item/party labels
// already visible to this account), produce a short narrative: guessed
// business type, the standout insight, and 2-3 concrete suggestions.
exports.generateBusinessSummary = async (stats) => {
  if (!isConfigured()) return null;

  const prompt =
    "Here is aggregate sales/inventory data for one small business:\n\n" +
    JSON.stringify(stats, null, 2) +
    "\n\nIn under 180 words, plain prose (no markdown headers, no bullet " +
    "symbols): (1) name what type of business this most likely is and the " +
    "one-line reason why, (2) call out the single most useful insight in " +
    "this data, (3) give 2-3 concrete, specific, numbers-based suggestions " +
    "to improve revenue or reduce risk. Be direct — no generic filler like " +
    "'consider marketing more'.";

  try {
    return await callClaude(
      "You are a concise, pragmatic small-business analyst. You only know " +
        "what is in the data given to you in the user message — never " +
        "invent facts, names, or numbers not present there.",
      prompt,
      500
    );
  } catch (err) {
    console.error("AI business summary failed:", err.message);
    return null;
  }
};

// Draft a short, sendable message for a reminder (payment request,
// supplier payback, a call prompt, a new-order nudge, or a plain note).
exports.draftReminderMessage = async ({ type, partyName, partyType, amount, note, dueDate }) => {
  if (!isConfigured()) return null;

  const dueStr = dueDate ? new Date(dueDate).toLocaleDateString() : null;
  const prompt =
    `Draft a short (2-4 sentences), friendly, professional message suitable ` +
    `to send by SMS or WhatsApp to a ${partyType === "SUPPLIER" ? "supplier" : "customer"} ` +
    `named ${partyName}.\nPurpose: ${type}.` +
    (amount ? `\nAmount involved: Rs ${amount}.` : "") +
    (note ? `\nContext from the business owner: ${note}.` : "") +
    (dueStr ? `\nRelevant date: ${dueStr}.` : "") +
    `\nOutput only the message text — no subject line, no quotes, no preamble.`;

  try {
    return await callClaude(
      "You draft short, warm, professional business messages. Output only " +
        "the message text itself.",
      prompt,
      300
    );
  } catch (err) {
    console.error("AI reminder draft failed:", err.message);
    return null;
  }
};

exports.isConfigured = isConfigured;
