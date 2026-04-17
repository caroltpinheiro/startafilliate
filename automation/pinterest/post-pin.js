#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { chromium } = require("playwright");

dotenv.config({ quiet: true });

const ROOT_DIR = path.resolve(__dirname, "../..");
const ARTIFACTS_DIR = path.join(ROOT_DIR, "artifacts");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value.trim();
}

function asBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.fill(value);
      return selector;
    }
  }
  return null;
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.click();
      return selector;
    }
  }
  return null;
}

async function selectBoardIfNeeded(page, boardName) {
  if (!boardName) {
    return;
  }

  await clickFirst(page, [
    'button:has-text("Choose board")',
    'button:has-text("Select board")',
    'button:has-text("Board")',
  ]);

  await page.waitForTimeout(1000);
  const boardOption = page.locator(`text="${boardName}"`).first();
  if ((await boardOption.count()) === 0) {
    throw new Error(`Board nao encontrado: "${boardName}"`);
  }
  await boardOption.click();
}

async function main() {
  let browser;
  let context;
  let page;

  try {
    const email = getRequiredEnv("PINTEREST_EMAIL");
    const password = getRequiredEnv("PINTEREST_PASSWORD");
    const imagePathRaw = getRequiredEnv("PIN_IMAGE_PATH");
    const title = getRequiredEnv("PIN_TITLE");
    const pinLink = getRequiredEnv("PIN_LINK");
    const description = process.env.PIN_DESCRIPTION || "";
    const boardName = process.env.PIN_BOARD_NAME || "";

    const headless = asBoolean(process.env.HEADLESS, true);
    const dryRun = asBoolean(process.env.DRY_RUN, false);
    const slowMo = Number(process.env.SLOW_MO || 0);
    const imagePath = path.resolve(ROOT_DIR, imagePathRaw);

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Imagem nao encontrada: ${imagePath}`);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    browser = await chromium.launch({ headless, slowMo });
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    console.log("1/4 Abrindo login do Pinterest...");
    await page.goto("https://www.pinterest.com/login/", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    console.log("2/4 Fazendo login...");
    const emailSelector = await fillFirst(
      page,
      ['input[name="id"]', 'input[type="email"]'],
      email
    );
    const passwordSelector = await fillFirst(
      page,
      ['input[name="password"]', 'input[type="password"]'],
      password
    );

    if (!emailSelector || !passwordSelector) {
      throw new Error("Nao consegui localizar os campos de login.");
    }

    const submitSelector = await clickFirst(page, [
      'button[type="submit"]',
      'div[role="button"]:has-text("Log in")',
      'div[role="button"]:has-text("Entrar")',
    ]);
    if (!submitSelector) {
      throw new Error("Nao consegui localizar o botao de login.");
    }

    await page.waitForLoadState("networkidle", { timeout: 120000 });

    console.log("3/4 Abrindo criacao do pin...");
    await page.goto("https://www.pinterest.com/pin-creation-tool/", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);

    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) === 0) {
      throw new Error("Nao consegui localizar o campo de upload da imagem.");
    }
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(2000);

    const titleOk = await fillFirst(page, [
      'input[placeholder*="title"]',
      'textarea[placeholder*="title"]',
      'input[id*="title"]',
      'textarea[id*="title"]',
      'div[contenteditable="true"][aria-label*="title"]',
    ], title);

    if (!titleOk) {
      throw new Error("Nao consegui preencher o titulo.");
    }

    if (description.trim()) {
      await fillFirst(page, [
        'textarea[placeholder*="description"]',
        'textarea[id*="description"]',
        'div[contenteditable="true"][aria-label*="description"]',
      ], description);
    }

    const linkOk = await fillFirst(page, [
      'input[placeholder*="link"]',
      'input[placeholder*="URL"]',
      'input[id*="link"]',
      'input[id*="destination"]',
    ], pinLink);

    if (!linkOk) {
      throw new Error("Nao consegui preencher o link de destino.");
    }

    await selectBoardIfNeeded(page, boardName);

    if (dryRun) {
      const previewShot = path.join(
        ARTIFACTS_DIR,
        `pin-preview-${Date.now()}.png`
      );
      await page.screenshot({ path: previewShot, fullPage: true });
      console.log(`Dry run concluido. Preview salvo em: ${previewShot}`);
      return;
    }

    console.log("4/4 Publicando...");
    const publishOk = await clickFirst(page, [
      'button:has-text("Publish")',
      'button:has-text("Publicar")',
      'div[role="button"]:has-text("Publish")',
      'div[role="button"]:has-text("Publicar")',
    ]);
    if (!publishOk) {
      throw new Error("Nao consegui localizar o botao de publicar.");
    }

    await page.waitForLoadState("networkidle", { timeout: 120000 });
    const finalShot = path.join(ARTIFACTS_DIR, `pin-posted-${Date.now()}.png`);
    await page.screenshot({ path: finalShot, fullPage: true });
    console.log(`Pin publicado com sucesso. Evidencia: ${finalShot}`);
  } catch (error) {
    const errorShot = path.join(ARTIFACTS_DIR, `pin-error-${Date.now()}.png`);
    if (page) {
      await page.screenshot({ path: errorShot, fullPage: true }).catch(() => {});
      console.error(`Screenshot de erro: ${errorShot}`);
    }
    console.error(`Erro na automacao: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

main();
