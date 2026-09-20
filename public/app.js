const idea = document.getElementById("idea");
const count = document.getElementById("count");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const exampleBtn = document.getElementById("exampleBtn");
const status = document.getElementById("status");
const output = document.getElementById("output");

const example =
  "Build a mobile app for college students that helps them find teammates for football, basketball, badminton and other sports. Students should be able to create profiles, discover players nearby, create matches, join matches and chat with teammates. The app should be simple, mobile-friendly and free for students.";

function updateCount() {
  count.textContent = `${idea.value.length.toLocaleString()} / 12,000`;
}

function list(items) {
  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(pitch) {
  output.innerHTML = `
    <div class="result-section">
      <h3>Summary</h3>
      <p>${escapeHtml(pitch.summary)}</p>
    </div>

    <div class="result-section">
      <h3>Problem</h3>
      <p>${escapeHtml(pitch.problem)}</p>
    </div>

    <div class="result-section">
      <h3>Solution</h3>
      <p>${escapeHtml(pitch.solution)}</p>
    </div>

    <div class="result-section">
      <h3>Target Users</h3>
      ${list(pitch.targetUsers)}
    </div>

    <div class="result-section">
      <h3>Business Model</h3>
      ${list(pitch.businessModel)}
    </div>

    <div class="result-section">
      <h3>Key Features</h3>
      ${list(pitch.features)}
    </div>

    <div class="result-section">
      <h3>MVP Plan</h3>
      ${list(pitch.mvpPlan)}
    </div>

    <div class="result-section">
      <h3>Risks & Assumptions</h3>
      ${list(pitch.risks)}
    </div>
  `;
}

idea.addEventListener("input", updateCount);

clearBtn.addEventListener("click", () => {
  idea.value = "";
  updateCount();
  status.textContent = "";
  output.innerHTML = `<div class="empty">Your generated pitch will appear here.</div>`;
});

exampleBtn.addEventListener("click", () => {
  idea.value = example;
  updateCount();
  idea.focus();
});

generateBtn.addEventListener("click", async () => {
  const text = idea.value.trim();

  if (!text) {
    status.textContent = "Enter a startup idea first.";
    return;
  }

  generateBtn.disabled = true;
  status.textContent = "Generating locally with QVAC...";
  output.innerHTML = `<div class="empty">Running local AI inference...</div>`;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea: text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Generation failed.");
    }

    render(data.pitch);
    status.textContent = `Generated locally with ${data.model}.`;
  } catch (error) {
    status.textContent = error.message;
    output.innerHTML = `<div class="empty">Generation failed.</div>`;
  } finally {
    generateBtn.disabled = false;
  }
});

updateCount();

async function checkHealth() {
  const badge = document.getElementById("qvacBadge");

  try {
    const response = await fetch("/health");
    const data = await response.json();

    if (data.status === "ok" && data.local && data.qvac) {
      badge.textContent = "QVAC · LOCAL READY";
    }
  } catch {
    badge.textContent = "QVAC · LOCAL";
  }
}

checkHealth();
