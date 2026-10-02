// Quiz Service: reads questions from data/quizzes.json and checks answers
const path = require("path");
const quizzes = require(path.join(__dirname, "..", "data", "quizzes.json"));

// Remove the correct answer before sending questions to the browser
function hideAnswer(q) {
  const { correctAnswer, explanation, ...publicPart } = q;
  return publicPart;
}

function getAllQuizzes() {
  return quizzes.map(hideAnswer);
}

function getQuizByAlgorithm(algorithmName) {
  const wanted = String(algorithmName || "").trim().toLowerCase();
  return quizzes.filter((q) => q.algorithm.toLowerCase() === wanted).map(hideAnswer);
}

function checkAnswer(quizId, selectedAnswer) {
  const q = quizzes.find((x) => x.id === quizId);
  if (!q) return null;
  return {
    quizId,
    selectedAnswer,
    correct: q.correctAnswer === selectedAnswer,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  };
}

module.exports = { getAllQuizzes, getQuizByAlgorithm, checkAnswer };
