const express = require("express");
const { getAlgorithmByName } = require("../services/algorithmService");
const { explainAlgorithm } = require("../services/aiService");
const router = express.Router();

// POST /api/ai/explain { algorithm: "Merge Sort" }
router.post("/explain", async (req, res) => {
  const name = req.body && req.body.algorithm;
  const algo = getAlgorithmByName(name);
  if (!algo) return res.status(404).json({ error: "Algorithm not found" });
  try {
    const result = await explainAlgorithm(algo);
    res.json({ algorithm: algo.name, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate an explanation" });
  }
});

module.exports = router;
