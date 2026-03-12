const topicInput = document.getElementById("topicInput");
const contentInput = document.getElementById("contentInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const modelInput = document.getElementById("modelInput");
const xPreview = document.getElementById("xPreview");
const linkedinPreview = document.getElementById("linkedinPreview");
const statusMessage = document.getElementById("statusMessage");
const modeValue = document.getElementById("modeValue");
const toneValue = document.getElementById("toneValue");
const draftCount = document.getElementById("draftCount");
const xCount = document.getElementById("xCount");
const xCounterInline = document.getElementById("xCounterInline");
const hooksList = document.getElementById("hooksList");
const draftsList = document.getElementById("draftsList");
const quickOpenButton = document.getElementById("quickOpenButton");
const copyLinkedInButton = document.getElementById("copyLinkedInButton");
const saveDraftButton = document.getElementById("saveDraftButton");
const refreshDraftsButton = document.getElementById("refreshDraftsButton");
const toneChips = Array.from(document.querySelectorAll(".tone-chip"));
const toast = document.getElementById("toast");

const state = {
  tone: "professional",
  mode: "Auto",
  currentDraftId: null,
  drafts: [],
  generateTimer: null,
  lastGeneratedSignature: ""
};

function setStatus(message) {
  statusMessage.textContent = message;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function cleanInput(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function clampXText(text) {
  const normalized = cleanInput(text).replace(/\s+/g, " ");
  return normalized.length <= 280 ? normalized : `${normalized.slice(0, 277).trimEnd()}...`;
}

function currentSignature() {
  return JSON.stringify({
    topic: cleanInput(topicInput.value),
    content: cleanInput(contentInput.value),
    tone: state.tone,
    model: cleanInput(modelInput.value),
    hasKey: Boolean(cleanInput(apiKeyInput.value))
  });
}

function buildHooks(topic) {
  return [
    `A practical system for ${topic}`,
    `What changes when you use ${topic} consistently`,
    `A simple playbook to start using ${topic}`
  ];
}

function buildTemplatePosts() {
  const topic = cleanInput(topicInput.value);
  const content = cleanInput(contentInput.value);
  const tone = state.tone;

  if (!topic && !content) {
    return {
      source: "template",
      mode: "empty",
      hooks: [],
      linkedinText: "",
      xText: ""
    };
  }

  if (content) {
    return {
      source: "template",
      mode: "content",
      hooks: buildHooks(topic || "your content"),
      linkedinText: content,
      xText: clampXText(content)
    };
  }

  const linkedinVariants = {
    professional: `${topic} is becoming a practical advantage for teams that want faster execution and better consistency.\n\nA simple way to start is to pick one repeated task, improve the workflow, and measure the result for 2 weeks.\n\nSmall systems create compounding results. What part of your process would you automate first?`,
    bold: `Most teams still treat ${topic} like a nice-to-have. The smart teams use it as a growth lever.\n\nThe biggest mistake is trying to automate everything at once. Start with one bottleneck, fix it, and scale only after it works.\n\nSpeed matters, but repeatability matters more. Which process would you rebuild first?`,
    educational: `If you are exploring ${topic}, start with one workflow that repeats every week and map the steps before you automate it.\n\nLook for tasks with clear inputs, predictable steps, and measurable outcomes. Those are the easiest wins.\n\nOne reliable automation can save hours every week. Which workflow would you test first?`
  };

  const xVariants = {
    professional: `${topic} helps teams save time, remove repetition, and create more consistent output. Start with one painful repetitive task, simplify it, then improve week by week. #automation #buildinpublic`,
    bold: `${topic} is not optional anymore. The teams moving fastest are removing repetitive work first and compounding that advantage every week. #automation #buildinpublic`,
    educational: `Want to start with ${topic}? Pick one repeatable task, document the steps, automate the boring parts, and measure the gain for 2 weeks. #automation #buildinpublic`
  };

  return {
    source: "template",
    mode: "topic",
    hooks: buildHooks(topic),
    linkedinText: linkedinVariants[tone],
    xText: clampXText(xVariants[tone])
  };
}

function updateXCount() {
  const count = xPreview.value.trim().length;
  const label = `${count} / 280`;
  xCount.textContent = label;
  xCounterInline.textContent = label;
}

function setBusy(isBusy) {
  document.body.classList.toggle("is-busy", isBusy);
  [quickOpenButton, copyLinkedInButton, saveDraftButton, refreshDraftsButton, ...toneChips].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

function snippet(text) {
  const value = cleanInput(text).replace(/\s+/g, " ");
  return value.length > 120 ? `${value.slice(0, 117).trimEnd()}...` : value || "No preview yet.";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function renderHooks(hooks) {
  hooksList.innerHTML = "";
  if (!hooks || !hooks.length) {
    hooksList.innerHTML = "<li>Type a topic to generate platform-ready hooks.</li>";
    return;
  }
  hooks.forEach((hook) => {
    const item = document.createElement("li");
    item.textContent = hook;
    hooksList.appendChild(item);
  });
}

function applyToneSelection(tone) {
  state.tone = tone;
  toneValue.textContent = `${tone.charAt(0).toUpperCase()}${tone.slice(1)}`;
  toneChips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.tone === tone));
  scheduleAutoGenerate();
}

function populateEditor(draft) {
  state.currentDraftId = draft.id || null;
  topicInput.value = draft.topic || "";
  contentInput.value = draft.content || "";
  xPreview.value = draft.xText || "";
  linkedinPreview.value = draft.linkedinText || "";
  applyToneSelection(draft.tone || "professional");
  state.mode = draft.content ? "Content" : "Auto";
  modeValue.textContent = state.mode;
  updateXCount();
  setStatus(`Loaded draft: ${draft.title}`);
}

function renderDrafts() {
  draftCount.textContent = String(state.drafts.length);
  if (!state.drafts.length) {
    draftsList.innerHTML = '<p class="empty-state">No saved drafts yet.</p>';
    return;
  }
  draftsList.innerHTML = state.drafts.map((draft) => {
    const updated = new Date(draft.updatedAt).toLocaleString();
    return `
      <article class="draft-item">
        <div class="draft-item-header">
          <div>
            <h3 class="draft-title">${escapeHtml(draft.title)}</h3>
            <p class="draft-meta">${escapeHtml(draft.tone || "professional")} tone · Updated ${escapeHtml(updated)}</p>
          </div>
          <span class="badge">${draft.content ? "Content" : "Topic"}</span>
        </div>
        <p class="draft-snippet">${escapeHtml(snippet(draft.linkedinText || draft.content || draft.topic))}</p>
        <div class="draft-item-actions">
          <button class="ds-button ds-button--ghost" type="button" data-action="load" data-id="${escapeHtml(draft.id)}">Load</button>
          <button class="ds-button ds-button--ghost" type="button" data-action="delete" data-id="${escapeHtml(draft.id)}">Delete</button>
        </div>
      </article>`;
  }).join("");
}

async function loadDrafts() {
  const data = await requestJson("/api/drafts");
  state.drafts = data.drafts || [];
  renderDrafts();
}

async function autoGenerate(force = false) {
  const signature = currentSignature();
  const hasInput = cleanInput(topicInput.value) || cleanInput(contentInput.value);

  if (!hasInput) {
    xPreview.value = "";
    linkedinPreview.value = "";
    renderHooks([]);
    modeValue.textContent = "Auto";
    updateXCount();
    setStatus("Ready. Type a topic and the drafts will appear automatically.");
    state.lastGeneratedSignature = "";
    return;
  }

  if (!force && signature === state.lastGeneratedSignature) {
    return;
  }

  setBusy(true);
  try {
    let data;
    try {
      data = await requestJson("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput.value,
          content: contentInput.value,
          tone: state.tone,
          apiKey: apiKeyInput.value,
          model: modelInput.value
        })
      });
    } catch (_error) {
      data = buildTemplatePosts();
      data.warning = "Server generation failed, so local auto-drafting was used.";
    }

    xPreview.value = data.xText || "";
    linkedinPreview.value = data.linkedinText || "";
    renderHooks(data.hooks || []);
    state.mode = data.source === "groq" ? "AI Auto" : data.mode === "content" ? "Content Auto" : "Auto";
    modeValue.textContent = state.mode;
    updateXCount();
    state.lastGeneratedSignature = signature;

    if (data.warning) {
      setStatus(data.warning);
    } else {
      setStatus("Drafts updated automatically for X and LinkedIn.");
    }
  } finally {
    setBusy(false);
  }
}

function scheduleAutoGenerate() {
  window.clearTimeout(state.generateTimer);
  state.generateTimer = window.setTimeout(() => {
    autoGenerate();
  }, 500);
}

async function saveDraft() {
  setBusy(true);
  setStatus("Saving your draft locally...");
  try {
    const data = await requestJson("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: state.currentDraftId,
        title: topicInput.value || contentInput.value || linkedinPreview.value || xPreview.value,
        topic: topicInput.value,
        content: contentInput.value,
        tone: state.tone,
        linkedinText: linkedinPreview.value,
        xText: xPreview.value
      })
    });
    state.currentDraftId = data.draft.id;
    await loadDrafts();
    setStatus("Draft saved locally.");
    showToast("Draft saved");
  } catch (error) {
    setStatus(error.message);
    showToast(error.message);
  } finally {
    setBusy(false);
  }
}

async function copyLinkedIn() {
  const text = cleanInput(linkedinPreview.value);
  if (!text) {
    setStatus("No LinkedIn text yet. Type a topic first.");
    return;
  }
  await navigator.clipboard.writeText(text).catch(() => {});
  setStatus("LinkedIn text copied.");
  showToast("LinkedIn copied");
}

async function openBrowserAssist() {
  await autoGenerate();
  const finalX = cleanInput(xPreview.value);
  const finalLinkedIn = cleanInput(linkedinPreview.value);
  if (!finalX || !finalLinkedIn) {
    throw new Error("Type a topic or paste content first.");
  }
  await navigator.clipboard.writeText(finalLinkedIn).catch(() => {});
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(finalX)}`, "_blank", "noopener");
  window.open("https://www.linkedin.com/feed/", "_blank", "noopener");
  setStatus("X opened with your post. LinkedIn opened and the LinkedIn text was copied to your clipboard.");
  showToast("X and LinkedIn opened");
}

async function deleteDraftById(id) {
  setBusy(true);
  setStatus("Deleting draft...");
  try {
    await requestJson(`/api/drafts/${id}`, { method: "DELETE" });
    if (state.currentDraftId === id) {
      state.currentDraftId = null;
    }
    await loadDrafts();
    setStatus("Draft deleted.");
    showToast("Draft deleted");
  } catch (error) {
    setStatus(error.message);
    showToast(error.message);
  } finally {
    setBusy(false);
  }
}

async function hydrateDashboard() {
  try {
    const health = await requestJson("/api/health");
    draftCount.textContent = String(health.drafts || 0);
  } catch (_error) {
    setStatus("App loaded, but health data could not be fetched.");
  }
  await loadDrafts().catch(() => {
    draftsList.innerHTML = '<p class="empty-state">Could not load drafts.</p>';
  });
}

quickOpenButton.addEventListener("click", async () => {
  try {
    await openBrowserAssist();
  } catch (error) {
    setStatus(error.message);
    showToast(error.message);
  }
});
copyLinkedInButton.addEventListener("click", copyLinkedIn);
saveDraftButton.addEventListener("click", saveDraft);
refreshDraftsButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await loadDrafts();
    setStatus("Draft list refreshed.");
    showToast("Drafts refreshed");
  } finally {
    setBusy(false);
  }
});

[topicInput, contentInput, apiKeyInput, modelInput].forEach((element) => {
  element.addEventListener("input", scheduleAutoGenerate);
});

xPreview.addEventListener("input", updateXCount);

toneChips.forEach((chip) => {
  chip.addEventListener("click", () => applyToneSelection(chip.dataset.tone));
});

draftsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const draft = state.drafts.find((item) => item.id === button.dataset.id);
  if (!draft) {
    return;
  }
  if (button.dataset.action === "load") {
    populateEditor(draft);
    showToast("Draft loaded");
    return;
  }
  if (button.dataset.action === "delete") {
    deleteDraftById(draft.id);
  }
});

updateXCount();
applyToneSelection(state.tone);
renderHooks([]);
hydrateDashboard();
