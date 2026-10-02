const express = require("express");
const { getAllAlgorithms, getAlgorithmByName } = require("../services/algorithmService");
const router = express.Router();

// GET /api/algorithms  -> list of all algorithms
router.get("/", (req, res) => res.json(getAllAlgorithms()));

// GET /api/algorithms/:name -> one algorithm
router.get("/:name", (req, res) => {
  const algo = getAlgorithmByName(req.params.name);
  if (!algo) return res.status(404).json({ error: "Algorithm not found" });
  res.json(algo);
});

module.exports = router;
