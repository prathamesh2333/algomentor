const express = require("express");
const { getAllQuizzes, getQuizByAlgorithm, checkAnswer } = require("../services/quizService");
const router = express.Router();

// GET /api/quiz -> all questions (answers hidden)
router.get("/", (req, res) => res.json(getAllQuizzes()));

// GET /api/quiz/:algorithm -> questions for one algorithm
router.get("/:algorithm", (req, res) => {
  const questions = getQuizByAlgorithm(req.params.algorithm);
  if (!questions.length) return res.status(404).json({ error: "No quiz found for this algorithm" });
  res.json(questions);
});

// POST /api/quiz/check { quizId, selectedAnswer } -> result + explanation
router.post("/check", (req, res) => {
  const { quizId, selectedAnswer } = req.body || {};
  if (!quizId || typeof selectedAnswer !== "string") {
    return res.status(400).json({ error: "quizId and selectedAnswer are required" });
  }
  const result = checkAnswer(quizId, selectedAnswer);
  if (!result) return res.status(404).json({ error: "Question not found" });
  res.json(result);
});

module.exports = router;
