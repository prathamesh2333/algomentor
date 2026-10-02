// AI Service: builds an instructional prompt and asks Google Gemini for an explanation.
// The API key is read from the GEMINI_API_KEY environment variable (never stored in code).

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Models are tried in order. If one is unavailable or busy, the next is used.
function modelList() {
  const list = [process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash"];
  return [...new Set(list.filter(Boolean))];
}

function buildPrompt(algo) {
  return `You are ALGOMENTOR, a friendly tutor who explains algorithms to complete beginners.

Explain the algorithm below using simple language, short sentences and small examples.

Algorithm: ${algo.name}
Category: ${algo.category}
Difficulty: ${algo.difficulty}
Description: ${algo.description}
Time complexity: ${algo.timeComplexity}
Space complexity: ${algo.spaceComplexity}
Example input: ${algo.exampleInput}

Use exactly these Markdown sections, in this order:
## 1. What is ${algo.name}?
## 2. Why do we use it?
## 3. How does it work?
## 4. Step-by-step example
(Walk through the example input above, one step per line.)
## 5. Time and space complexity
(Explain ${algo.timeComplexity} time and ${algo.spaceComplexity} space in plain words.)
## 6. A simple analogy
## 7. Common beginner mistakes

Rules: use **bold** for key terms and \`inline code\` for arrays and values. Keep the whole answer under 450 words. Do not add any introduction before section 1.`;
}

// Used when no API key is set or the AI service cannot be reached,
// so the app still works during a demo.
function offlineExplanation(algo) {
  return `## 1. What is ${algo.name}?
${algo.description}

## 2. Why do we use it?
${algo.name} is a **${algo.category.toLowerCase()}** algorithm rated **${algo.difficulty}** for beginners.

## 3. Example input
\`${algo.exampleInput}\`

## 4. Time and space complexity
- Time: \`${algo.timeComplexity}\`
- Space: \`${algo.spaceComplexity}\`

*This is the basic offline explanation. Add a Gemini API key to get the full AI explanation.*`;
}

async function callGemini(model, prompt, key) {
  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && data.error.message) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Empty response from AI");
  return text;
}

async function explainAlgorithm(algo) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { explanation: offlineExplanation(algo), source: "offline", note: "GEMINI_API_KEY is not set" };
  }
  const prompt = buildPrompt(algo);
  let lastError;
  for (const model of modelList()) {
    try {
      const explanation = await callGemini(model, prompt, key);
      return { explanation, source: "gemini", model };
    } catch (err) {
      lastError = err;
      console.warn(`[AI] ${model} failed: ${err.message}`);
      // A wrong key will fail for every model, so stop early
      if (err.status === 400 && /api key/i.test(err.message)) break;
      if (err.status === 401 || err.status === 403) break;
    }
  }
  return {
    explanation: offlineExplanation(algo),
    source: "offline",
    note: `AI service unavailable: ${lastError ? lastError.message : "unknown error"}`,
  };
}

module.exports = { explainAlgorithm, buildPrompt };
