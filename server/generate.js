function clampXText(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= 280 ? normalized : `${normalized.slice(0, 277).trimEnd()}...`;
}

function cleanInput(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function withHashtags(text, tags) {
  const hashtagBlock = tags.length ? `\n\n${tags.map((tag) => `#${tag}`).join(" ")}` : "";
  return `${text}${hashtagBlock}`;
}

function buildTopicBase(topic) {
  return `${topic} helps teams save time, remove repetition, and create more consistent output.`;
}

function buildLinkedInFromTopic(topic, tone) {
  const intros = {
    professional: `${topic} is becoming a practical advantage for teams that want faster execution and better consistency.`,
    bold: `Most teams still treat ${topic} like a nice-to-have. The smart teams use it as a growth lever.`,
    educational: `If you are exploring ${topic}, start with one workflow that repeats every week and map the steps before you automate it.`
  };

  const middle = {
    professional: `A simple way to start is to pick one repeated task, improve the workflow, and measure the result for 2 weeks.`,
    bold: `The biggest mistake is trying to automate everything at once. Start with one bottleneck, fix it, and scale only after it works.`,
    educational: `Look for tasks with clear inputs, predictable steps, and measurable outcomes. Those are the easiest wins.`
  };

  const ending = {
    professional: `Small systems create compounding results. What part of your process would you automate first?`,
    bold: `Speed matters, but repeatability matters more. Which process would you rebuild first?`,
    educational: `One reliable automation can save hours every week. Which workflow would you test first?`
  };

  return [intros[tone], middle[tone], ending[tone]].join("\n\n");
}

function buildXFromTopic(topic, tone) {
  const variants = {
    professional: `${buildTopicBase(topic)} Start with one painful repetitive task, simplify it, then improve week by week.`,
    bold: `${topic} is not optional anymore. The teams moving fastest are removing repetitive work first and compounding that advantage every week.`,
    educational: `Want to start with ${topic}? Pick one repeatable task, document the steps, automate the boring parts, and measure the gain for 2 weeks.`
  };

  return clampXText(withHashtags(variants[tone], ["automation", "buildinpublic"]));
}

function buildHooks(topic) {
  return [
    `A practical system for ${topic}`,
    `What changes when you use ${topic} consistently`,
    `A simple playbook to start using ${topic}`
  ];
}

function summarizeInputs(topic, content) {
  const basis = content || topic;
  return basis.length > 72 ? `${basis.slice(0, 69).trimEnd()}...` : basis;
}

function generateTemplatePosts({ topic, content, tone = "professional" }) {
  const safeTopic = cleanInput(topic);
  const safeContent = cleanInput(content);
  const safeTone = ["professional", "bold", "educational"].includes(tone) ? tone : "professional";

  if (!safeTopic && !safeContent) {
    throw new Error("Add a topic or paste full content first.");
  }

  if (safeContent) {
    const linkedinText = safeContent;
    const xText = clampXText(safeContent);

    return {
      mode: "content",
      tone: safeTone,
      summary: summarizeInputs(safeTopic, safeContent),
      hooks: buildHooks(safeTopic || "your content"),
      linkedinText,
      xText,
      source: "template"
    };
  }

  return {
    mode: "topic",
    tone: safeTone,
    summary: summarizeInputs(safeTopic, safeContent),
    hooks: buildHooks(safeTopic),
    linkedinText: buildLinkedInFromTopic(safeTopic, safeTone),
    xText: buildXFromTopic(safeTopic, safeTone),
    source: "template"
  };
}

async function generateWithGroq({ topic, content, tone, apiKey, model }) {
  const safeTopic = cleanInput(topic);
  const safeContent = cleanInput(content);
  const safeTone = ["professional", "bold", "educational"].includes(tone) ? tone : "professional";
  const safeApiKey = cleanInput(apiKey || process.env.GROQ_API_KEY);
  const safeModel = cleanInput(model) || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!safeApiKey) {
    return generateTemplatePosts({ topic: safeTopic, content: safeContent, tone: safeTone });
  }

  const prompt = [
    "Create two social media posts from the user input.",
    `Tone: ${safeTone}`,
    "Return valid JSON only with keys: linkedinText, xText, hooks.",
    "linkedinText should be polished, professional, readable, and 3 short paragraphs max.",
    "xText must be under 280 characters including hashtags.",
    "hooks must be an array of exactly 3 short hook ideas.",
    safeContent ? `Full content: ${safeContent}` : `Topic: ${safeTopic}`
  ].join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${safeApiKey}`
    },
    body: JSON.stringify({
      model: safeModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You write concise, engaging social posts for LinkedIn and X. Always output valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq generation failed: ${errorText}`);
  }

  const data = await response.json();
  const contentText = data.choices?.[0]?.message?.content;
  if (!contentText) {
    throw new Error("Groq generation returned an empty response.");
  }

  const parsed = JSON.parse(contentText);
  const linkedinText = cleanInput(parsed.linkedinText || safeContent || buildLinkedInFromTopic(safeTopic, safeTone));
  const xText = clampXText(cleanInput(parsed.xText || safeContent || buildXFromTopic(safeTopic, safeTone)));
  const hooks = Array.isArray(parsed.hooks) ? parsed.hooks.map(cleanInput).filter(Boolean).slice(0, 3) : buildHooks(safeTopic || "your content");

  return {
    mode: safeContent ? "content" : "topic",
    tone: safeTone,
    summary: summarizeInputs(safeTopic, safeContent),
    hooks: hooks.length ? hooks : buildHooks(safeTopic || "your content"),
    linkedinText,
    xText,
    source: "groq",
    model: safeModel
  };
}

async function generatePosts(options) {
  try {
    return await generateWithGroq(options || {});
  } catch (error) {
    const fallback = generateTemplatePosts(options || {});
    return {
      ...fallback,
      warning: error.message
    };
  }
}

module.exports = {
  generatePosts,
  generateTemplatePosts,
  clampXText,
  cleanInput
};
