// Simple automatic tests: run with "npm test"
const assert = require("assert");
const app = require("./server");

const server = app.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
  const post = (p, b) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })
    .then(async (r) => ({ status: r.status, body: await r.json() }));
  try {
    let r = await get("/api/algorithms");
    assert.strictEqual(r.body.length, 5); console.log("✓ 5 algorithms listed");

    r = await get("/api/algorithms/merge%20sort");
    assert.strictEqual(r.body.timeComplexity, "O(n log n)"); console.log("✓ case-insensitive lookup works");

    r = await get("/api/quiz/Binary%20Search");
    assert.ok(r.body.length >= 2 && r.body.every((q) => !("correctAnswer" in q))); console.log("✓ quiz loads, answers hidden");

    r = await post("/api/quiz/check", { quizId: "ms1", selectedAnswer: "O(n log n)" });
    assert.strictEqual(r.body.correct, true); console.log("✓ correct answer accepted");

    r = await post("/api/quiz/check", { quizId: "ms1", selectedAnswer: "O(n)" });
    assert.strictEqual(r.body.correct, false); console.log("✓ wrong answer rejected");

    r = await post("/api/ai/explain", { algorithm: "Bubble Sort" });
    assert.ok(r.body.explanation.length > 50); console.log(`✓ explanation returned (source: ${r.body.source})`);

    r = await post("/api/ai/explain", { algorithm: "Quantum Sort" });
    assert.strictEqual(r.status, 404); console.log("✓ unknown algorithm gives 404");

    console.log("\nAll tests passed.");
  } catch (e) {
    console.error("TEST FAILED:", e.message); process.exitCode = 1;
  } finally { server.close(); }
});
