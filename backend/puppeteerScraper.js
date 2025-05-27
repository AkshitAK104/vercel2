const puppeteer = require('puppeteer');

async function scrapeAmazonProduct(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#productTitle", { timeout: 15000 });

  const data = await page.evaluate(() => {
    const title = document.querySelector("#productTitle")?.innerText.trim() || "";
    const brand = document.querySelector("#bylineInfo")?.innerText.trim() || "";
    const price =
      document.querySelector("#priceblock_ourprice")?.innerText.trim() ||
      document.querySelector("#priceblock_dealprice")?.innerText.trim() ||
      document.querySelector("#priceblock_saleprice")?.innerText.trim() ||
      document.querySelector(".a-price .a-offscreen")?.innerText.trim() ||
      "";
    return { title, brand, price };
  });

  await browser.close();
  return data;
}

async function scrapeFlipkartProduct(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for price selector (update if Flipkart changes HTML)
  await page.waitForSelector("._30jeq3", { timeout: 15000 }).catch(() => {});
  const data = await page.evaluate(() => {
    const name = document.querySelector("span.B_NuCI")?.innerText.trim() || "";
    const price = document.querySelector("._30jeq3")?.innerText.trim() || null;
    return { name, price };
  });

  await browser.close();
  return data;
}

module.exports = { scrapeAmazonProduct, scrapeFlipkartProduct };
