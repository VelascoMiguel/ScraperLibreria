const puppeteer = require("puppeteer");
const URL_GOOGLE_MAPS = "https://www.google.com/maps";

const express = require("express");
const app = express();
const port = process.env.PORT ? process.env.PORT : 8000;

app.get("/", async (req, res) => {

  res.send(`Bienvenido al scraper`);
});

app.get("/scrape", async (req, res) => {
  let urls = await scrapeData();

  res.send(`Se ejecuto el script, aqui las URLS ${urls}`);
});

app.listen(port, () =>{
  console.log("App listening in port ", port)
})

async function scrapeData() {
  let browser = await createBrowser();

  let page = await createPage(browser);

  await navigateAndSearch(URL_GOOGLE_MAPS, page);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await autoScroll(page);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let urls = await obtainUrls(page);

  await browser.close();

  return urls;
}

async function createBrowser() {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
  });

  return browser;
}

async function createPage(browser) {
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  return page;
}

async function navigateAndSearch(url, page) {
  await page.goto(url);

  await page.waitForSelector("#searchboxinput");

  await page.type("#searchboxinput", "Libreria, Flores Capital Federal");

  await page.click("#searchbox-searchbutton");
}

async function obtainUrls(page) {
  await page.waitForNetworkIdle();

  await page.waitForSelector(".hfpxzc", {
    visible: true,
    timeout: 3000,
  });

  let urls = [];

  const elements = await page.$$(".hfpxzc");
  for (const element of elements) {
    await element.click();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await page.waitForSelector(".rogA2c.ITvuef", {
        visible: true,
        timeout: 2000,
      });

      let url = await page.evaluate(() => {
        let url = document.querySelector(".rogA2c.ITvuef").textContent;

        return url;
      });

      if (
        !urls.includes(url) &&
        url != "facebook.com" &&
        url != "listado.mercadolibre.com.ar" &&
        url != "mitiendanube.com" &&
        url != "mercadoshops.com.ar" &&
        url != "negocio.site" &&
        url != "instagram.com"
      ) {
        let urlFormateada = `https://www.${url}`;

        urls.push(urlFormateada);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("No tiene URL");
    }
  }

  console.log(urls);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const pageContent = await page.content();
      const matches = pageContent.match(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net)\b/g
      );

      if (matches) {
        console.log(`Correos encontrados en ${url}:`);
        console.log(matches);
      } else {
        console.log(`No se encontraron correos en ${url}`);
      }
    } catch (error) {
      console.log("Error navegando a la URL", url);
    }
  }

  return urls;
}

async function autoScroll(page) {
  const selector =
    '.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd[aria-label="Resultados de Libreria, Flores Capital Federal"][role="feed"][tabindex="-1"]';

  await page.waitForSelector(selector);

  let lastScrollHeight = 0;

  while (true) {
    const currentScrollHeight = await page.evaluate((selector) => {
      const scrollableSection = document.querySelector(selector);
      if (scrollableSection) {
        scrollableSection.scrollTop = scrollableSection.scrollHeight;
        return scrollableSection.scrollHeight;
      }
      return 0;
    }, selector);

    if (lastScrollHeight === currentScrollHeight) {
      break;
    }

    lastScrollHeight = currentScrollHeight;

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
