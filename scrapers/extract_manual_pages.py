#!/usr/bin/env python3
"""
Extract All Page URLs from Manual Links
This script takes manual URLs and extracts all their page URLs (page 1, 2, 3, ... N)
"""

import csv
import requests
import time
import logging
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('page_extraction.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ManualPageExtractor:
    """Extract all page URLs from a manual"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
        self.max_retries = 3
        self.timeout = 30
    
    def make_request_with_retry(self, url: str) -> Optional[requests.Response]:
        """Make HTTP request with retry logic"""
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=self.timeout)
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                if attempt == self.max_retries - 1:
                    logger.error(f"Failed to fetch {url} after {self.max_retries} attempts: {e}")
                    return None
                else:
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"Attempt {attempt + 1} failed for {url}, retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
        
        return None
    
    def extract_image_pages(self, manual_url: str, manual_title: str = "") -> List[str]:
        """Extract all image page URLs from a manual
        
        Args:
            manual_url: Base URL of the manual (e.g., https://www.carmanualsonline.info/audi-80-90-coupe-1988-service-repair-manual)
            manual_title: Title of the manual for logging
            
        Returns:
            List of all valid page URLs including the base URL
        """
        page_urls = [manual_url]  # Start with the base URL (page 1)
        page_number = 2
        max_pages = 10000  # Safety limit
        consecutive_failures = 0
        max_consecutive_failures = 5
        
        title_display = manual_title if manual_title else manual_url
        logger.info(f"🔍 [PAGES] Starting page extraction for: {title_display}")
        
        while page_number <= max_pages and consecutive_failures < max_consecutive_failures:
            page_url = f"{manual_url}/{page_number}"
            
            try:
                response = self.make_request_with_retry(page_url)
                
                if not response:
                    logger.debug(f"[PAGES] Page {page_number} not accessible (404 or error)")
                    consecutive_failures += 1
                    
                    # If we get several 404s in a row, likely we've reached the end
                    if consecutive_failures >= 3:
                        logger.debug(f"[PAGES] Multiple consecutive failures, stopping at page {page_number}")
                        break
                    
                    page_number += 1
                    continue
                
                # Check if page actually contains content
                soup = BeautifulSoup(response.text, "html.parser")
                page_content = soup.get_text().lower()
                
                # Check for indicators that we've reached the end
                end_indicators = [
                    "no next",
                    "page not found", 
                    "404", 
                    "not available",
                    "end of manual",
                    "last page",
                    "no more pages"
                ]
                
                if any(indicator in page_content for indicator in end_indicators):
                    logger.debug(f"[PAGES] Found end indicator on page {page_number}, stopping")
                    break
                
                # Check if page has actual manual content
                has_images = soup.find("img")
                has_manual_text = any(keyword in page_content for keyword in [
                    "manual", "page", "service", "repair", "owner", "instruction"
                ])
                has_page_number = str(page_number) in page_content
                
                # More lenient check - if we have any manual-related content
                has_manual_content = has_images or (has_manual_text and has_page_number)
                
                if not has_manual_content:
                    consecutive_failures += 1
                    logger.debug(f"[PAGES] Page {page_number} has no manual content (failure #{consecutive_failures})")
                    
                    # If we've had several failures but some successes, be more patient
                    max_failures = max_consecutive_failures if len(page_urls) < 10 else max_consecutive_failures + 2
                    
                    if consecutive_failures >= max_failures:
                        logger.debug(f"[PAGES] Too many consecutive failures ({consecutive_failures}), stopping")
                        break
                        
                    page_number += 1
                    continue
                else:
                    # Reset failure counter on success
                    consecutive_failures = 0
                    page_urls.append(page_url)
                    logger.debug(f"✅ [PAGES] Added page {page_number}: {page_url}")
                
                # Progress update for large manuals
                if page_number % 50 == 0:
                    logger.info(f"📄 [PAGES] Processed {page_number} pages for: {title_display}")
                
                page_number += 1
                
                # Small delay to be respectful
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ [PAGES] Unexpected error on page {page_number}: {e}")
                consecutive_failures += 1
                
                if consecutive_failures >= max_consecutive_failures:
                    logger.warning(f"[PAGES] Too many errors, stopping at page {page_number}")
                    break
                    
                page_number += 1
        
        total_pages = len(page_urls)
        logger.info(f"✅ [PAGES] Found {total_pages} pages for: {title_display}")
        
        return page_urls
    
    def close(self):
        """Close the session"""
        self.session.close()

def extract_pages_from_csv(input_csv: str, output_csv: str = None) -> None:
    """Extract page URLs for all manuals in a CSV file
    
    Args:
        input_csv: Path to input CSV file with manual data
        output_csv: Path to output CSV file (defaults to input_csv + '_with_pages.csv')
    """
    input_path = Path(input_csv)
    
    if not input_path.exists():
        logger.error(f"❌ Input CSV file not found: {input_csv}")
        return
    
    if not output_csv:
        output_csv = str(input_path).replace('.csv', '_with_pages.csv')
    
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    extractor = ManualPageExtractor()
    
    try:
        # Read input CSV
        with open(input_path, 'r', newline='', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            fieldnames = list(reader.fieldnames)
            
            # Add new fields if they don't exist
            if 'total_image_pages' not in fieldnames:
                fieldnames.append('total_image_pages')
            if 'image_pages' not in fieldnames:
                fieldnames.append('image_pages')
            
            rows = list(reader)
        
        logger.info(f"📊 Processing {len(rows)} manuals from {input_csv}")
        
        # Process each manual
        processed_rows = []
        for i, row in enumerate(rows, 1):
            manual_url = row.get('url', '')
            manual_title = row.get('title', '') or row.get('slug', '') or manual_url
            
            if not manual_url:
                logger.warning(f"⚠️  Row {i}: No URL found, skipping")
                row['total_image_pages'] = '0'
                row['image_pages'] = ''
                processed_rows.append(row)
                continue
            
            logger.info(f"\n📋 [{i}/{len(rows)}] Processing: {manual_title}")
            
            try:
                # Extract page URLs
                page_urls = extractor.extract_image_pages(manual_url, manual_title)
                
                # Update row with new data
                row['total_image_pages'] = str(len(page_urls))
                row['image_pages'] = '|'.join(page_urls)
                
                logger.info(f"✅ [{i}/{len(rows)}] Found {len(page_urls)} pages for: {manual_title}")
                
            except Exception as e:
                logger.error(f"❌ [{i}/{len(rows)}] Error processing {manual_title}: {e}")
                row['total_image_pages'] = '0'
                row['image_pages'] = ''
            
            processed_rows.append(row)
            
            # Progress save every 10 manuals
            if i % 10 == 0:
                logger.info(f"💾 Progress save: {i}/{len(rows)} completed")
                
                # Save progress
                with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(processed_rows)
            
            # Respectful delay between manuals
            time.sleep(1.0)
        
        # Final save
        with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(processed_rows)
        
        # Calculate statistics
        total_pages = sum(int(row.get('total_image_pages', 0)) for row in processed_rows)
        manuals_with_pages = sum(1 for row in processed_rows if int(row.get('total_image_pages', 0)) > 1)
        
        logger.info(f"""
        🎉 PAGE EXTRACTION COMPLETED!
        📊 Final Statistics:
        • Manuals processed: {len(processed_rows)}
        • Manuals with multiple pages: {manuals_with_pages}
        • Total page URLs extracted: {total_pages}
        • Average pages per manual: {total_pages / max(len(processed_rows), 1):.1f}
        • Output saved to: {output_csv}
        """)
        
    finally:
        extractor.close()

def extract_single_manual_pages(manual_url: str) -> List[str]:
    """Extract page URLs for a single manual URL
    
    Args:
        manual_url: URL of the manual
        
    Returns:
        List of all page URLs
    """
    extractor = ManualPageExtractor()
    
    try:
        page_urls = extractor.extract_image_pages(manual_url)
        
        print(f"\n📄 Manual: {manual_url}")
        print(f"📊 Total pages found: {len(page_urls)}")
        print("🔗 Page URLs:")
        for i, url in enumerate(page_urls, 1):
            print(f"  {i:3d}: {url}")
        
        return page_urls
        
    finally:
        extractor.close()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract all page URLs from car manual links")
    parser.add_argument("--csv", "-c", help="CSV file containing manual URLs")
    parser.add_argument("--output", "-o", help="Output CSV file (optional)")
    parser.add_argument("--url", "-u", help="Single manual URL to extract pages from")
    
    args = parser.parse_args()
    
    if args.url:
        # Extract pages for single URL
        extract_single_manual_pages(args.url)
    elif args.csv:
        # Extract pages for CSV file
        extract_pages_from_csv(args.csv, args.output)
    else:
        print("Usage:")
        print("  Extract pages from CSV:")
        print("    python extract_manual_pages.py --csv scraped_data/manuals_audi.csv")
        print("  Extract pages from single URL:")
        print("    python extract_manual_pages.py --url https://www.carmanualsonline.info/audi-80-90-coupe-1988-service-repair-manual")

if __name__ == "__main__":
    main()