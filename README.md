# PitchForge

> Turn a rough startup idea into a structured pitch with local AI.

PitchForge is a private, on-device startup planning tool. Describe a business idea and the app generates a structured pitch covering the problem, solution, users, business model, features, MVP plan, and risks.

## Features

- Startup idea analysis
- Problem and solution breakdown
- Target-user identification
- Business model suggestions
- Key feature planning
- MVP roadmap
- Risk and assumption analysis
- One-click example
- Local AI inference through QVAC
- No cloud AI API

## Technology

- Node.js
- Express
- Vanilla HTML, CSS and JavaScript
- QVAC SDK 0.19.1
- Qwen3 0.6B Q4

## How It Works

Browser → Express backend → QVAC → local Qwen3 model → structured pitch → browser

## Run Locally

Install dependencies:

    npm install

Start the application:

    QVAC_CONFIG_PATH=./qvac.config.json npm start

Open:

    http://localhost:3000

## Health Check

The application provides a local health endpoint:

    http://localhost:3000/health

It reports QVAC availability, model loading state, SDK version, and local inference information.

## Privacy

PitchForge processes startup ideas locally through QVAC. No cloud AI API is required for generation.

## Author

lalitaditya568-droid

## License

MIT
