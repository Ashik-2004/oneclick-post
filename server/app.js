const path = require("path");
const express = require("express");

const { generatePosts, clampXText, cleanInput } = require("./generate");
const { openSessions, prepareEverywhere, prepareXOnly, prepareLinkedInOnly } = require("./poster");
const { listDrafts, saveDraft, deleteDraft } = require("./drafts");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use("/design-system", express.static(path.join(process.cwd(), "design-system")));
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api/health", async (_req, res) => {
  const drafts = await listDrafts().catch(() => []);
  res.json({
    success: true,
    appName: "One-Touch Social Poster",
    drafts: drafts.length,
    platforms: ["X", "LinkedIn"],
    generatorModes: ["professional", "bold", "educational"],
    aiProvider: process.env.GROQ_API_KEY ? "Groq configured" : "Template fallback"
  });
});

app.get("/api/drafts", async (_req, res) => {
  try {
    const drafts = await listDrafts();
    res.json({ drafts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const result = await generatePosts(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/drafts", async (req, res) => {
  try {
    const payload = req.body || {};
    const title = cleanInput(payload.title) || cleanInput(payload.topic) || cleanInput(payload.content) || "Untitled draft";
    const saved = await saveDraft({
      id: payload.id,
      title,
      topic: cleanInput(payload.topic),
      content: cleanInput(payload.content),
      tone: payload.tone,
      linkedinText: cleanInput(payload.linkedinText),
      xText: clampXText(cleanInput(payload.xText))
    });
    res.json({ success: true, draft: saved });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/drafts/:id", async (req, res) => {
  try {
    await deleteDraft(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/open-sessions", async (_req, res) => {
  try {
    const context = await openSessions();
    res.json({
      success: true,
      message: "Browser opened. Log into X and LinkedIn once in the Playwright window, then close the browser when login is finished."
    });

    setTimeout(async () => {
      await context.close().catch(() => {});
    }, 120000);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/prepare", async (req, res) => {
  try {
    const { linkedinText, xText } = req.body || {};

    if (!linkedinText || !xText) {
      return res.status(400).json({ error: "Both LinkedIn and X text are required." });
    }

    const result = await prepareEverywhere({ linkedinText, xText: clampXText(xText) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/prepare-x", async (req, res) => {
  try {
    const { xText } = req.body || {};

    if (!xText) {
      return res.status(400).json({ error: "X text is required." });
    }

    const result = await prepareXOnly({ xText: clampXText(xText) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/prepare-linkedin", async (req, res) => {
  try {
    const { linkedinText } = req.body || {};

    if (!linkedinText) {
      return res.status(400).json({ error: "LinkedIn text is required." });
    }

    const result = await prepareLinkedInOnly({ linkedinText: cleanInput(linkedinText) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Social poster running at http://localhost:${port}`);
});
