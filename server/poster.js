const path = require("path");
const { chromium } = require("playwright");

const profileDir = path.join(process.cwd(), "browser-data");

async function launchContext() {
  return chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1440, height: 960 }
  });
}

async function firstPage(context) {
  const existing = context.pages()[0];
  return existing || context.newPage();
}

async function waitForAny(page, selectors, timeout = 15000) {
  for (const selector of selectors) {
    try {
      const handle = await page.waitForSelector(selector, { timeout });
      return { handle, selector };
    } catch (_error) {
      continue;
    }
  }

  throw new Error(`Could not find any expected selector: ${selectors.join(", ")}`);
}

async function clickAny(page, selectors, timeout = 15000) {
  const { handle } = await waitForAny(page, selectors, timeout);
  await handle.click();
}

async function fillComposer(page, selectors, text) {
  const { handle, selector } = await waitForAny(page, selectors, 20000);

  if (selector.includes("textarea") || selector.includes("input")) {
    await handle.fill(text);
    return;
  }

  await handle.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type(text, { delay: 5 });
}

async function ensureLoggedIn(page, url, loggedInSelectors, loginSelectors, platformName) {
  await page.goto(url, { waitUntil: "domcontentloaded" });

  for (const selector of loggedInSelectors) {
    const found = await page.locator(selector).first().isVisible().catch(() => false);
    if (found) {
      return;
    }
  }

  for (const selector of loginSelectors) {
    const found = await page.locator(selector).first().isVisible().catch(() => false);
    if (found) {
      throw new Error(`Please log into ${platformName} first by clicking Open Sessions.`);
    }
  }
}

async function openSessions() {
  const context = await launchContext();
  const xPage = await firstPage(context);
  await xPage.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
  const linkedinPage = context.pages()[1] || (await context.newPage());
  await linkedinPage.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
  return context;
}

async function prepareXPage(page, text) {
  await ensureLoggedIn(
    page,
    "https://x.com/compose/post",
    ["[data-testid='SideNav_NewTweet_Button']", "[data-testid='tweetTextarea_0']", "a[href='/home']"],
    ["input[name='text']", "input[autocomplete='username']"],
    "X"
  );

  await fillComposer(page, ["[data-testid='tweetTextarea_0']", "div[role='textbox'][data-testid='tweetTextarea_0']"], text);
}

async function prepareLinkedInPage(page, text) {
  await ensureLoggedIn(
    page,
    "https://www.linkedin.com/feed/",
    ["button[aria-label*='Start a post']", "div.share-box-feed-entry__trigger", "button.share-box-feed-entry__trigger"],
    ["#username", "input[name='session_key']"],
    "LinkedIn"
  );

  await clickAny(page, ["button[aria-label*='Start a post']", "div.share-box-feed-entry__trigger", "button.share-box-feed-entry__trigger"], 20000);
  await fillComposer(page, ["div[role='textbox']", "div.ql-editor[contenteditable='true']"], text);
}

async function prepareXOnly({ xText }) {
  const context = await launchContext();

  try {
    const xPage = await firstPage(context);
    await prepareXPage(xPage, xText);
    return {
      success: true,
      message: "X is opened with the post box filled. Review it and press Post on X."
    };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

async function prepareLinkedInOnly({ linkedinText }) {
  const context = await launchContext();

  try {
    const linkedinPage = await firstPage(context);
    await prepareLinkedInPage(linkedinPage, linkedinText);
    return {
      success: true,
      message: "LinkedIn is opened with the post box filled. Review it and press Post on LinkedIn."
    };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

async function prepareEverywhere({ linkedinText, xText }) {
  const context = await launchContext();

  try {
    const xPage = await firstPage(context);
    const linkedinPage = context.pages()[1] || (await context.newPage());

    await prepareXPage(xPage, xText);
    await prepareLinkedInPage(linkedinPage, linkedinText);

    return {
      success: true,
      message: "X and LinkedIn are opened with both post boxes filled. Review them and press Post on each site."
    };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

module.exports = {
  openSessions,
  prepareEverywhere,
  prepareXOnly,
  prepareLinkedInOnly
};
