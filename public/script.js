// ALGOMENTOR frontend logic
const $ = (id) => document.getElementById(id);
const state = { algorithms: [], current: null, score: 0, answered: 0, total: 0 };

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Small, safe Markdown formatter: headings, bold, italics, inline code, code blocks, lists
function renderMarkdown(md) {
  const lines = escapeHtml(md.replace(/\r/g, "")).split("\n");
  let html = "", inList = null, inCode = false, code = [];
  const inline = (t) => t
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  const closeList = () => { if (inList) { html += `</${inList}>`; inList = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim().startsWith("```")) {
      if (inCode) { html += `<pre><code>${code.join("\n")}</code></pre>`; code = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    let m;
    if ((m = line.match(/^#{1,6}\s+(.*)/))) { closeList(); const lvl = line.startsWith("###") ? 3 : 2; html += `<h${lvl}>${inline(m[1])}</h${lvl}>`; }
    else if ((m = line.match(/^\s*[-*]\s+(.*)/))) { if (inList !== "ul") { closeList(); html += "<ul>"; inList = "ul"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (inList !== "ol") { closeList(); html += "<ol>"; inList = "ol"; } html += `<li>${inline(m[1])}</li>`; }
    else if (/^\s*-{3,}\s*$/.test(line) || !line.trim()) { closeList(); }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  if (inCode) html += `<pre><code>${code.join("\n")}</code></pre>`;
  closeList();
  return html;
}

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// 1. Load algorithm list
async function loadAlgorithms() {
  const select = $("algoSelect");
  try {
    state.algorithms = await api("/api/algorithms");
    select.innerHTML = `<option value="">Select algorithm</option>` +
      state.algorithms.map((a) => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join("");
    select.disabled = false;
  } catch (e) {
    select.innerHTML = `<option value="">Unavailable</option>`;
    showError("listError", "Could not load algorithms. Check that the server is running, then refresh the page.");
  }
}

function showError(id, msg) { const el = $(id); el.textContent = msg; el.classList.remove("hidden"); }

// 2. Show algorithm info cards
function showInfo(algo) {
  const box = $("infoCards");
  if (!algo) { box.classList.add("hidden"); return; }
  box.innerHTML = [
    ["Category", algo.category], ["Difficulty", algo.difficulty],
    ["Time complexity", algo.timeComplexity], ["Space complexity", algo.spaceComplexity],
  ].map(([k, v]) => `<div class="info-card"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join("")
    + `<p class="info-desc">${escapeHtml(algo.description)}</p>`;
  box.classList.remove("hidden");
}

$("algoSelect").addEventListener("change", (e) => {
  state.current = state.algorithms.find((a) => a.name === e.target.value) || null;
  showInfo(state.current);
  $("explainBtn").disabled = !state.current;
});

// 3. Ask the AI for an explanation
$("explainBtn").addEventListener("click", async () => {
  if (!state.current) return;
  const btn = $("explainBtn");
  btn.disabled = true;
  $("mentor").classList.remove("hidden");
  $("practice").classList.add("hidden");
  $("mentorTitle").textContent = state.current.name;
  $("explanation").innerHTML = "";
  $("aiNote").classList.add("hidden");
  $("toQuizBtn").classList.add("hidden");
  $("aiStatus").textContent = "AI thinking";
  $("aiStatus").className = "status";
  $("loading").classList.remove("hidden");
  $("mentor").scrollIntoView();

  try {
    const data = await api("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorithm: state.current.name }),
    });
    $("explanation").innerHTML = renderMarkdown(data.explanation);
    if (data.source === "gemini") {
      $("aiStatus").textContent = "AI ready";
    } else {
      $("aiStatus").textContent = "Offline mode";
      $("aiStatus").className = "status offline";
      $("aiNote").textContent = "Showing the basic explanation because the AI service is not available right now.";
      $("aiNote").classList.remove("hidden");
    }
    $("toQuizBtn").classList.remove("hidden");
  } catch (e) {
    $("explanation").innerHTML = `<p class="error">Could not get an explanation: ${escapeHtml(e.message)}. Try again in a moment.</p>`;
    $("aiStatus").textContent = "Error";
    $("aiStatus").className = "status offline";
  } finally {
    $("loading").classList.add("hidden");
    btn.disabled = false;
  }
});

// 4. Load the quiz
$("toQuizBtn").addEventListener("click", loadQuiz);

async function loadQuiz() {
  if (!state.current) return;
  state.score = 0; state.answered = 0;
  $("scoreBadge").textContent = "Score: 0";
  $("finalScore").classList.add("hidden");
  $("practice").classList.remove("hidden");
  const list = $("quizList");
  list.innerHTML = `<div class="panel loading"><span class="spinner"></span> Loading questions…</div>`;
  $("practice").scrollIntoView();
  try {
    const questions = await api(`/api/quiz/${encodeURIComponent(state.current.name)}`);
    state.total = questions.length;
    list.innerHTML = "";
    questions.forEach((q, i) => list.appendChild(renderQuestion(q, i)));
  } catch (e) {
    list.innerHTML = `<p class="error">Could not load the quiz: ${escapeHtml(e.message)}</p>`;
  }
}

function renderQuestion(q, index) {
  const card = document.createElement("div");
  card.className = "panel question";
  card.innerHTML = `<p class="q-num">Question ${index + 1}</p><h3>${escapeHtml(q.question)}</h3>
    <div class="options">${q.options.map((o) => `<button class="option" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}</div>
    <div class="feedback hidden"></div>`;
  card.querySelectorAll(".option").forEach((btn) => btn.addEventListener("click", () => submitAnswer(q, btn, card)));
  return card;
}

// 5. Submit an answer and show feedback
async function submitAnswer(q, btn, card) {
  const buttons = card.querySelectorAll(".option");
  buttons.forEach((b) => (b.disabled = true));
  const fb = card.querySelector(".feedback");
  try {
    const r = await api("/api/quiz/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: q.id, selectedAnswer: btn.dataset.value }),
    });
    buttons.forEach((b) => { if (b.dataset.value === r.correctAnswer) b.classList.add("correct"); });
    if (r.correct) {
      state.score++;
      fb.className = "feedback good";
      fb.innerHTML = `<b>✓ Correct!</b> ${escapeHtml(r.explanation)}`;
    } else {
      btn.classList.add("wrong");
      fb.className = "feedback bad";
      fb.innerHTML = `<b>✗ Not quite.</b> The correct answer is <strong>${escapeHtml(r.correctAnswer)}</strong>. ${escapeHtml(r.explanation)}`;
    }
    state.answered++;
    $("scoreBadge").textContent = `Score: ${state.score}`;
    if (state.answered === state.total) showFinal();
  } catch (e) {
    buttons.forEach((b) => (b.disabled = false));
    fb.className = "feedback bad";
    fb.textContent = `Could not check your answer: ${e.message}. Please try again.`;
  }
}

// 6. Final score and percentage
function showFinal() {
  const pct = Math.round((state.score / state.total) * 100);
  const msg = pct === 100 ? "Perfect! You've mastered this one." : pct >= 60 ? "Nice work, you've got the basics." : "Keep learning, you've got this!";
  const box = $("finalScore");
  box.innerHTML = `<p class="q-num">Quiz complete</p><h3>${state.score}/${state.total} · ${pct}%</h3><p class="muted">${msg}</p>
    <button class="btn" id="retryBtn">Try again</button>`;
  box.classList.remove("hidden");
  $("retryBtn").addEventListener("click", loadQuiz);
  box.scrollIntoView({ block: "center" });
}

loadAlgorithms();
