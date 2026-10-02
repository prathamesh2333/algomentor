# ALGOMENTOR

AI-powered web app that explains algorithms to beginners and quizzes them.

- Frontend: HTML, CSS, JavaScript (`public/`)
- Backend: Node.js + Express (`server.js`, `routes/`, `services/`)
- Data: `data/algorithms.json`, `data/quizzes.json`
- AI: Google Gemini API (key in the `GEMINI_API_KEY` environment variable)

## API
| Method | Route | What it does |
|---|---|---|
| GET | /api/algorithms | List all algorithms |
| GET | /api/algorithms/:name | One algorithm |
| POST | /api/ai/explain | `{ "algorithm": "Merge Sort" }` -> AI explanation |
| GET | /api/quiz/:algorithm | Questions (answers hidden) |
| POST | /api/quiz/check | `{ "quizId": "ms1", "selectedAnswer": "O(n log n)" }` |
| GET | /api/health | Server status |

## Run locally
    npm install
    npm start
Open http://localhost:5000. Without a key the app uses a basic offline explanation.

## Tests
    npm test
