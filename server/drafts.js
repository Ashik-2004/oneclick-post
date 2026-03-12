const fs = require("fs/promises");
const path = require("path");

const draftsFile = path.join(process.cwd(), "data", "drafts.json");

async function ensureDraftFile() {
  try {
    await fs.access(draftsFile);
  } catch (error) {
    await fs.mkdir(path.dirname(draftsFile), { recursive: true });
    await fs.writeFile(draftsFile, "[]");
  }
}

async function readDrafts() {
  await ensureDraftFile();
  const raw = await fs.readFile(draftsFile, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function writeDrafts(drafts) {
  await ensureDraftFile();
  await fs.writeFile(draftsFile, `${JSON.stringify(drafts, null, 2)}\n`);
}

async function listDrafts() {
  const drafts = await readDrafts();
  return drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function saveDraft(draft) {
  const drafts = await readDrafts();
  const now = new Date().toISOString();
  const id = draft.id || `draft_${Date.now()}`;
  const normalized = {
    id,
    title: draft.title || "Untitled draft",
    topic: draft.topic || "",
    content: draft.content || "",
    tone: draft.tone || "professional",
    linkedinText: draft.linkedinText || "",
    xText: draft.xText || "",
    createdAt: draft.createdAt || now,
    updatedAt: now
  };

  const nextDrafts = drafts.filter((item) => item.id !== id);
  nextDrafts.unshift(normalized);
  await writeDrafts(nextDrafts.slice(0, 25));
  return normalized;
}

async function deleteDraft(id) {
  const drafts = await readDrafts();
  const nextDrafts = drafts.filter((item) => item.id !== id);
  await writeDrafts(nextDrafts);
}

module.exports = {
  listDrafts,
  saveDraft,
  deleteDraft
};
