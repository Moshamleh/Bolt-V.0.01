import os
import asyncio
import csv
import httpx
from urllib.parse import urljoin
from playwright.async_api import async_playwright
from tqdm import tqdm
import img2pdf

BASE_URL = "https://www.carmanualsonline.info"
DOWNLOAD_DIR = "data/manuals"

async def scrape_all_pages(base_url: str, page, folder_name: str):
    image_urls = []
    for i in range(1, 100):  # upper limit safety stop
        url = base_url if i == 1 else f"{base_url}/{i}"
        try:
            await page.goto(url, timeout=60000)
            await page.wait_for_selector('img[src^="/img/"]', timeout=5000)
            images = await page.query_selector_all('img[src^="/img/"]')
            if not images:
                break
            for img in images:
                src = await img.get_attribute("src")
                if src:
                    image_urls.append(urljoin(BASE_URL, src))
        except:
            break
    return image_urls

async def scrape_images_to_pdf(manual_url: str, folder_name: str):
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    pdf_path = os.path.join(DOWNLOAD_DIR, f"{folder_name}.pdf")
    if os.path.exists(pdf_path):
        print(f"✅ Already downloaded: {pdf_path}")
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"🔍 Scraping all pages for {folder_name}...")
        image_urls = await scrape_all_pages(manual_url, page, folder_name)

        if len(image_urls) < 15:
            print(f"❌ Only {len(image_urls)} images found. Likely incomplete: {folder_name}")
            await browser.close()
            return

        print(f"📄 Found {len(image_urls)} pages for {folder_name}. Downloading...")

        image_bytes = []
        async with httpx.AsyncClient() as client:
            for img_url in tqdm(image_urls, desc=f"Downloading {folder_name}"):
                try:
                    response = await client.get(img_url, timeout=30)
                    if response.status_code == 200:
                        image_bytes.append(response.content)
                except Exception as e:
                    print(f"⚠️ Failed to download {img_url}: {e}")

        if image_bytes:
            with open(pdf_path, "wb") as f:
                f.write(img2pdf.convert(image_bytes))
            print(f"✅ PDF created: {pdf_path}")
        else:
            print(f"❌ No images downloaded for {folder_name}")

        await browser.close()

async def main():
    csv_path = "manual_url_metadata.csv"
    with open(csv_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            brand = row["brand"]
            model = row["model"]
            year = row["year"]
            url = row["url"]
            folder_name = f"{brand}-{model}-{year}".replace(" ", "-").lower()
            try:
                await scrape_images_to_pdf(url, folder_name)
            except Exception as e:
                print(f"💥 Failed on {folder_name}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
