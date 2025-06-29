import os
import time
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.carmanualsonline.info"
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def get_image_links(manual_slug):
    image_links = []
    for page in range(1, 1000):  # Try up to 1000 page chunks
        page_url = f"{BASE_URL}/{manual_slug}/{page}" if page > 1 else f"{BASE_URL}/{manual_slug}"
        print(f"🔍 Checking: {page_url}")

        try:
            res = requests.get(page_url, headers=HEADERS, timeout=15)
            if res.status_code != 200:
                print("⛔ End of pages reached.")
                break

            soup = BeautifulSoup(res.text, "html.parser")
            images = soup.find_all("img")
            count = 0

            for img in images:
                src = img.get("src")
                if src and "/manuals/" in src:
                    full_img_url = src if src.startswith("http") else BASE_URL + src
                    image_links.append(full_img_url)
                    count += 1

            print(f"🖼️ Found {count} images on page {page}")

            if count == 0:
                break  # No more images, stop crawling

            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ Error on page {page}: {e}")
            break

    return image_links

# === RUN IT ===
if __name__ == "__main__":
    manual_slug = "jeep-wrangler-unlimited-sahara-2014-owners-manual"
    images = get_image_links(manual_slug)

    # Save to file
    os.makedirs("manual_images", exist_ok=True)
    with open(f"manual_images/{manual_slug.replace('/', '_')}.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(images))

    print(f"\n✅ Done! Found {len(images)} image links.")
