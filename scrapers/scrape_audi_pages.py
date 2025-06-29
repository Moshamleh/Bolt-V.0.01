import os
import csv
import requests
import time
import logging
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin, urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import mimetypes
from typing import Optional, Tuple

# Configuration
INPUT_CSV = "scraped_data/manuals_audi.csv"
OUTPUT_DIR = Path("scraped_data/audi_pages")
LOG_FILE = "scraped_data/scraping.log"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Setup logging
def setup_logging():
    """Setup logging configuration"""
    log_dir = Path(LOG_FILE).parent
    log_dir.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(LOG_FILE, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

def create_session() -> requests.Session:
    """Create a requests session with retry strategy"""
    session = requests.Session()
    
    # Define retry strategy
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update(HEADERS)
    
    return session

def get_file_extension(url: str, content_type: str = None) -> str:
    """Determine file extension from URL or content type"""
    # Try to get extension from URL
    parsed_url = urlparse(url)
    path = parsed_url.path
    if path and '.' in path:
        return Path(path).suffix.lower()
    
    # Try to get extension from content type
    if content_type:
        extension = mimetypes.guess_extension(content_type.split(';')[0])
        if extension:
            return extension.lower()
    
    # Default to .jpg for images
    return '.jpg'

def download_image(session: requests.Session, img_url: str, img_path: Path, 
                  max_retries: int = 3) -> bool:
    """Download an individual image with retry logic"""
    if img_path.exists():
        logging.info(f"⏭️  Skipping existing file: {img_path.name}")
        return True
    
    for attempt in range(max_retries):
        try:
            logging.info(f"🔄 Downloading: {img_url} (attempt {attempt + 1})")
            
            with session.get(img_url, timeout=30, stream=True) as response:
                response.raise_for_status()
                
                # Get proper file extension
                content_type = response.headers.get('content-type', '')
                if not img_path.suffix or img_path.suffix == '.jpg':
                    proper_ext = get_file_extension(img_url, content_type)
                    if proper_ext != img_path.suffix:
                        img_path = img_path.with_suffix(proper_ext)
                
                # Download with streaming to handle large files
                with open(img_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                logging.info(f"✅ Downloaded: {img_path.name}")
                return True
                
        except requests.exceptions.RequestException as e:
            logging.warning(f"⚠️  Attempt {attempt + 1} failed for {img_url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                logging.error(f"❌ Failed to download {img_url} after {max_retries} attempts")
                return False
        except Exception as e:
            logging.error(f"❌ Unexpected error downloading {img_url}: {e}")
            return False
    
    return False

def scrape_manual_images(session: requests.Session, manual_url: str, manual_slug: str) -> Tuple[int, int]:
    """Scrape images from a manual page
    
    Returns:
        Tuple of (successful_downloads, total_images)
    """
    safe_slug = manual_slug.strip("/").replace("/", "_").replace(":", "_")
    manual_folder = OUTPUT_DIR / safe_slug
    manual_folder.mkdir(parents=True, exist_ok=True)

    logging.info(f"📘 Scraping manual: {manual_url}")
    logging.info(f"📁 Output folder: {manual_folder}")

    try:
        # Get the manual page
        response = session.get(manual_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Find all manual images - try multiple selectors
        image_selectors = [
            "img[data-src]",           # Original selector
            "img[data-lazy-src]",      # Alternative lazy loading
            "img[src]",                # Regular src images
            ".manual-page img",        # Class-based selector
        ]
        
        all_images = []
        for selector in image_selectors:
            images = soup.select(selector)
            for img in images:
                # Get image URL from various attributes
                img_src = (img.get('data-src') or 
                          img.get('data-lazy-src') or 
                          img.get('src'))
                if img_src and img_src not in [i[0] for i in all_images]:
                    all_images.append((img_src, img))
        
        if not all_images:
            logging.warning(f"⚠️  No images found for {manual_url}")
            return 0, 0

        logging.info(f"🔍 Found {len(all_images)} images to download")
        
        successful_downloads = 0
        
        # Download each image
        for i, (img_src, img_tag) in enumerate(all_images, 1):
            try:
                img_url = urljoin(manual_url, img_src)
                
                # Generate filename
                img_filename = f"page_{i:03d}"
                img_path = manual_folder / f"{img_filename}.jpg"  # Default extension
                
                # Download the image
                if download_image(session, img_url, img_path):
                    successful_downloads += 1
                
                # Small delay between downloads
                time.sleep(0.5)
                
            except Exception as e:
                logging.error(f"❌ Error processing image {i}: {e}")

        logging.info(f"✅ Successfully downloaded {successful_downloads}/{len(all_images)} images for {manual_slug}")
        return successful_downloads, len(all_images)

    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Network error scraping {manual_url}: {e}")
        return 0, 0
    except Exception as e:
        logging.error(f"❌ Unexpected error scraping {manual_url}: {e}")
        return 0, 0

def load_csv_data(csv_path: str) -> list:
    """Load and validate CSV data"""
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    data = []
    with open(csv_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        
        required_columns = ["url", "slug"]
        if not all(col in reader.fieldnames for col in required_columns):
            raise ValueError(f"CSV must contain columns: {required_columns}")
        
        for row_num, row in enumerate(reader, 1):
            if not row["url"] or not row["slug"]:
                logging.warning(f"⚠️  Skipping row {row_num}: missing URL or slug")
                continue
            data.append(row)
    
    return data

def main():
    """Main function to orchestrate the scraping process"""
    setup_logging()
    logging.info("🚀 Starting Audi manual scraping")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        # Load CSV data
        manual_data = load_csv_data(INPUT_CSV)
        logging.info(f"📊 Loaded {len(manual_data)} manuals to process")
        
        if not manual_data:
            logging.error("❌ No valid manual data found")
            return
        
        # Create session
        session = create_session()
        
        # Track statistics
        total_manuals = len(manual_data)
        processed_manuals = 0
        total_images_downloaded = 0
        total_images_found = 0
        
        # Process each manual
        for i, row in enumerate(manual_data, 1):
            logging.info(f"\n{'='*60}")
            logging.info(f"📋 Processing manual {i}/{total_manuals}: {row['slug']}")
            logging.info(f"{'='*60}")
            
            downloaded, found = scrape_manual_images(session, row["url"], row["slug"])
            
            processed_manuals += 1
            total_images_downloaded += downloaded
            total_images_found += found
            
            # Progress update
            logging.info(f"📈 Progress: {i}/{total_manuals} manuals, "
                        f"{total_images_downloaded}/{total_images_found} images downloaded")
            
            # Respectful delay between manuals
            if i < total_manuals:
                logging.info("⏱️  Waiting before next manual...")
                time.sleep(2.0)
        
        # Final statistics
        logging.info(f"\n{'='*60}")
        logging.info(f"🎉 SCRAPING COMPLETED!")
        logging.info(f"📊 Final Statistics:")
        logging.info(f"   • Manuals processed: {processed_manuals}/{total_manuals}")
        logging.info(f"   • Images downloaded: {total_images_downloaded}/{total_images_found}")
        logging.info(f"   • Success rate: {(total_images_downloaded/max(total_images_found, 1)*100):.1f}%")
        logging.info(f"{'='*60}")
        
    except Exception as e:
        logging.error(f"❌ Fatal error in main: {e}")
        raise

if __name__ == "__main__":
    main()
