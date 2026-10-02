// Algorithm Service: reads algorithm information from data/algorithms.json
const path = require("path");
const algorithms = require(path.join(__dirname, "..", "data", "algorithms.json"));

function getAllAlgorithms() {
  return algorithms;
}

// Case-insensitive search by name
function getAlgorithmByName(name) {
  if (!name) return null;
  const wanted = String(name).trim().toLowerCase();
  return algorithms.find((a) => a.name.toLowerCase() === wanted) || null;
}

module.exports = { getAllAlgorithms, getAlgorithmByName };
