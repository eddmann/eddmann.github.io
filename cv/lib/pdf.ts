import puppeteer from "puppeteer";

export async function renderPdf(html: string, outPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");

    // Tailwind CDN compiles utility CSS in-browser after the script loads.
    // Probe for an applied utility before printing so the PDF isn't unstyled.
    await page.waitForFunction(
      () => {
        const probe = document.getElementById("tw-probe");
        if (!probe) return true;
        return getComputedStyle(probe).padding !== "0px";
      },
      { timeout: 5000 },
    );

    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
