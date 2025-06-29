#!/usr/bin/env python3
"""
Enhanced Car Manual Scraper with Global Deduplication
Features:
- Global deduplication across all brands and pages
- Persistent duplicate tracking with file-based storage
- Better manual page structure understanding
- Comprehensive validation and error handling
- Resume capability from previous runs
"""

import csv
import re
import time
import random
import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import hashlib
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper_dedup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ScrapingConfig:
    """Configuration for the scraper"""
    base_url: str = "https://www.carmanualsonline.info"
    max_pages: int = 1000
    max_retries: int = 3
    timeout: int = 20
    delay_range: Tuple[float, float] = (1.0, 2.0)
    max_workers: int = 3
    extract_pages: bool = False  # Set to True to extract all page URLs
    
    headers: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        if self.headers is None:
            self.headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }

@dataclass
class ManualEntry:
    """Data structure for a manual entry"""
    brand: str
    model: str
    year: str
    title: str
    slug: str
    url: str
    manual_type: str = ""
    pages_count: str = ""
    file_size: str = ""
    image_pages: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "brand": self.brand,
            "model": self.model,
            "year": self.year,
            "title": self.title,
            "slug": self.slug,
            "url": self.url,
            "manual_type": self.manual_type,
            "pages_count": self.pages_count,
            "file_size": self.file_size,
            "total_image_pages": str(len(self.image_pages)),
            "image_pages": "|".join(self.image_pages)
        }
    
    def get_unique_key(self) -> str:
        """Generate unique key for deduplication"""
        # Use URL as the primary unique identifier
        return self.url
    
    def get_content_hash(self) -> str:
        """Generate content-based hash for deeper deduplication"""
        content = f"{self.brand}_{self.model}_{self.year}_{self.manual_type}".lower()
        return hashlib.md5(content.encode()).hexdigest()

class DeduplicationManager:
    """Manages global deduplication across scraping sessions"""
    
    def __init__(self, dedup_file: str = "scraped_data/seen_urls.json"):
        self.dedup_file = Path(dedup_file)
        self.seen_urls: Set[str] = set()
        self.seen_content_hashes: Set[str] = set()
        self.load_seen_data()
    
    def load_seen_data(self):
        """Load previously seen URLs and hashes"""
        if self.dedup_file.exists():
            try:
                with open(self.dedup_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.seen_urls = set(data.get('urls', []))
                    self.seen_content_hashes = set(data.get('content_hashes', []))
                logger.info(f"[DEDUP] Loaded {len(self.seen_urls)} seen URLs and {len(self.seen_content_hashes)} content hashes")
            except Exception as e:
                logger.warning(f"[DEDUP] Could not load deduplication data: {e}")
                self.seen_urls = set()
                self.seen_content_hashes = set()
    
    def save_seen_data(self):
        """Save seen URLs and hashes to file"""
        self.dedup_file.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.dedup_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'urls': list(self.seen_urls),
                    'content_hashes': list(self.seen_content_hashes),
                    'last_updated': datetime.now().isoformat()
                }, f, indent=2)
            logger.info(f"[DEDUP] Saved {len(self.seen_urls)} URLs and {len(self.seen_content_hashes)} content hashes")
        except Exception as e:
            logger.error(f"[DEDUP] Could not save deduplication data: {e}")
    
    def is_duplicate(self, manual: ManualEntry) -> bool:
        """Check if manual is a duplicate"""
        url_key = manual.get_unique_key()
        content_hash = manual.get_content_hash()
        
        if url_key in self.seen_urls:
            logger.debug(f"[DEDUP] URL duplicate found: {url_key}")
            return True
        
        if content_hash in self.seen_content_hashes:
            logger.debug(f"[DEDUP] Content duplicate found: {content_hash}")
            return True
        
        return False
    
    def add_manual(self, manual: ManualEntry):
        """Add manual to seen data"""
        self.seen_urls.add(manual.get_unique_key())
        self.seen_content_hashes.add(manual.get_content_hash())

class ScrapingStats:
    """Track scraping statistics with deduplication metrics"""
    def __init__(self):
        self.start_time = datetime.now()
        self.brands_processed = 0
        self.total_manuals = 0
        self.duplicates_found = 0
        self.unique_manuals = 0
        self.failed_requests = 0
        self.retries_used = 0
        self.brand_stats = {}
    
    def add_brand_result(self, brand: str, total_found: int, unique_added: int, duplicates: int, failed_requests: int = 0):
        self.brands_processed += 1
        self.total_manuals += total_found
        self.unique_manuals += unique_added
        self.duplicates_found += duplicates
        self.failed_requests += failed_requests
        self.brand_stats[brand] = {
            'total_found': total_found,
            'unique_added': unique_added,
            'duplicates': duplicates
        }
        
    def get_summary(self) -> Dict:
        duration = datetime.now() - self.start_time
        return {
            "duration_seconds": duration.total_seconds(),
            "brands_processed": self.brands_processed,
            "total_manuals_found": self.total_manuals,
            "unique_manuals_added": self.unique_manuals,
            "duplicates_found": self.duplicates_found,
            "deduplication_rate": f"{(self.duplicates_found / max(self.total_manuals, 1) * 100):.1f}%",
            "failed_requests": self.failed_requests,
            "retries_used": self.retries_used,
            "avg_unique_per_brand": self.unique_manuals / max(self.brands_processed, 1),
            "brand_breakdown": self.brand_stats
        }

class EnhancedCarManualScraper:
    """Enhanced scraper with global deduplication"""
    
    # Enhanced manual type mapping for normalization
    MANUAL_TYPE_MAPPING = {
        # Owner/User manuals
        "owner": "Owner Manual",
        "owners": "Owner Manual", 
        "user": "User Manual",
        "users": "User Manual",
        "handbook": "Owner Manual",
        "owner-handbook": "Owner Manual",
        "user-handbook": "User Manual", 
        "driver": "Driver Manual",
        "drivers": "Driver Manual",
        
        # Service/Repair manuals
        "service": "Service Manual",
        "repair": "Repair Manual", 
        "workshop": "Workshop Manual",
        "maintenance": "Maintenance Manual",
        "service-repair": "Service Manual",
        "repair-service": "Service Manual",
        
        # Electronics manuals
        "navigation": "Navigation Manual",
        "nav": "Navigation Manual",
        "audio": "Audio Manual",
        "infotainment": "Infotainment Manual",
        "radio": "Radio Manual", 
        "multimedia": "Multimedia Manual",
        "entertainment": "Entertainment Manual",
        
        # Technical manuals
        "wiring": "Wiring Manual",
        "electrical": "Electrical Manual", 
        "parts": "Parts Manual",
        "engine": "Engine Manual",
        "transmission": "Transmission Manual",
        "technical": "Technical Manual",
        
        # Guides and instructions
        "guide": "Guide",
        "quick": "Quick Guide",
        "quick-guide": "Quick Guide",
        "instruction": "Instruction Manual",
        "instructions": "Instruction Manual",
        "reference": "Reference Manual", 
        "troubleshooting": "Troubleshooting Guide",
        
        # General manual types
        "manual": "Manual",
        "operating": "Operating Manual",
        "operation": "Operating Manual",
        "installation": "Installation Manual",
        "assembly": "Assembly Manual",
        "diagnostic": "Diagnostic Manual",
        "safety": "Safety Manual",
        "warranty": "Warranty Information"
    }
    
    def __init__(self, config: ScrapingConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update(config.headers)
        self.stats = ScrapingStats()
        self.dedup_manager = DeduplicationManager()
        
        # Create output directory
        self.output_dir = Path("scraped_data")
        self.output_dir.mkdir(exist_ok=True)
        
        # Manual type patterns for validation
        self.manual_types = [
            "owners", "user", "service", "repair", "workshop", 
            "instruction", "maintenance", "driver", "handbook"
        ]
        
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()
        self.dedup_manager.save_seen_data()
        
    def make_request_with_retry(self, url: str) -> Optional[requests.Response]:
        """Make HTTP request with retry logic"""
        for attempt in range(self.config.max_retries):
            try:
                response = self.session.get(url, timeout=self.config.timeout)
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                self.stats.retries_used += 1
                if attempt == self.config.max_retries - 1:
                    logger.error(f"Failed to fetch {url} after {self.config.max_retries} attempts: {e}")
                    return None
                else:
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"Attempt {attempt + 1} failed for {url}, retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
        
        return None
    
    def is_valid_manual_url(self, href: str, brand: str) -> bool:
        """Check if URL is a valid manual page"""
        # Filter out query parameters, view pages, warning pages, and google vignette noise
        if "?" in href or "/view/" in href or "warning" in href or "#google_vignette" in href:
            return False
            
        # Enhanced pattern to catch more manual types including hyphenated ones
        manual_types_extended = self.manual_types + [
            "owner-handbook", "user-handbook", "navigation-manual", "navigation", 
            "infotainment", "manual", "guide", "quick", "quick-guide",
            "audio", "radio", "multimedia", "wiring", "electrical", 
            "parts", "engine", "transmission", "troubleshooting"
        ]
        
        # Create dynamic pattern with all manual types
        manual_types_pattern = "|".join(manual_types_extended)
        
        # More flexible pattern that can match various URL structures
        patterns = [
            r"^/" + brand + r"-[\w\-]+-\d{4}-(" + manual_types_pattern + r")-manual",  # Standard format
            r"^/" + brand + r"-[\w\-]+-\d{4}-(" + manual_types_pattern + r")$",       # Without "-manual" suffix
            r"^/" + brand + r"-[\w\-]+-(" + manual_types_pattern + r")-manual",       # Without year
            r"^/" + brand + r"-[\w\-]+-(" + manual_types_pattern + r")$",             # Simple format
        ]
        
        # Try each pattern
        for pattern in patterns:
            if re.search(pattern, href):
                return True
        
        # Fallback: if it contains "manual" and matches basic brand-model structure
        if "manual" in href.lower():
            basic_pattern = r"^/" + brand + r"-[\w\-]+"
            return bool(re.search(basic_pattern, href))
            
        return False
    
    def normalize_manual_type(self, raw_type: str, title: str, href: str) -> str:
        """Normalize manual type to standard format"""
        if not raw_type or raw_type == "unknown":
            # Try to extract from title or href if raw_type is missing
            combined_text = f"{title} {href}".lower()
            
            # Check for manual type keywords in title/href
            type_keywords = {
                'owner': 'Owner Manual',
                'user': 'User Manual', 
                'service': 'Service Manual',
                'repair': 'Repair Manual',
                'workshop': 'Workshop Manual',
                'maintenance': 'Maintenance Manual',
                'instruction': 'Instruction Manual',
                'handbook': 'Owner Manual',
                'driver': 'Driver Manual',
                'navigation': 'Navigation Manual',
                'audio': 'Audio Manual',
                'radio': 'Radio Manual',
                'infotainment': 'Infotainment Manual',
                'quick': 'Quick Guide',
                'reference': 'Reference Manual',
                'technical': 'Technical Manual',
                'parts': 'Parts Manual',
                'wiring': 'Wiring Manual',
                'electrical': 'Electrical Manual'
            }
            
            for keyword, normalized in type_keywords.items():
                if keyword in combined_text:
                    return normalized
            
            # If manual is mentioned anywhere, assume it's a valid manual
            if 'manual' in combined_text:
                return 'Manual'
            
            return 'Unknown'
        
        # Normalize the raw type
        raw_type_lower = raw_type.lower().replace("-", " ").replace("_", " ")
        
        # Manual type mapping for normalization
        type_mapping = {
            # Owner/User manuals
            'owner': 'Owner Manual',
            'owners': 'Owner Manual',
            'user': 'User Manual',
            'users': 'User Manual',
            'handbook': 'Owner Manual',
            'owner handbook': 'Owner Manual',
            'user handbook': 'User Manual',
            'driver': 'Driver Manual',
            'drivers': 'Driver Manual',
            
            # Service/Repair manuals  
            'service': 'Service Manual',
            'repair': 'Repair Manual',
            'workshop': 'Workshop Manual',
            'maintenance': 'Maintenance Manual',
            'service repair': 'Service Manual',
            'repair service': 'Service Manual',
            
            # Instruction manuals
            'instruction': 'Instruction Manual',
            'instructions': 'Instruction Manual',
            'guide': 'Guide',
            'quick guide': 'Quick Guide',
            'quick': 'Quick Guide',
            
            # Technical manuals
            'technical': 'Technical Manual',
            'reference': 'Reference Manual',
            'parts': 'Parts Manual',
            'wiring': 'Wiring Manual',
            'electrical': 'Electrical Manual',
            'engine': 'Engine Manual',
            'transmission': 'Transmission Manual',
            
            # Electronic systems
            'navigation': 'Navigation Manual',
            'nav': 'Navigation Manual',
            'audio': 'Audio Manual',
            'radio': 'Radio Manual',
            'infotainment': 'Infotainment Manual',
            'multimedia': 'Multimedia Manual',
            'entertainment': 'Entertainment Manual',
            
            # Other types
            'operating': 'Operating Manual',
            'operation': 'Operating Manual',
            'installation': 'Installation Manual',
            'assembly': 'Assembly Manual',
            'troubleshooting': 'Troubleshooting Guide',
            'diagnostic': 'Diagnostic Manual',
            'safety': 'Safety Manual',
            'warranty': 'Warranty Information'
        }
        
        # Try exact match first
        if raw_type_lower in type_mapping:
            return type_mapping[raw_type_lower]
        
        # Try partial matches for compound types
        for key, normalized in type_mapping.items():
            if key in raw_type_lower:
                return normalized
        
        # Special handling for common false positives
        if raw_type_lower in ['class', 'series', 'model']:
            # These are likely part of model name, not manual type
            return 'Manual'
        
        # If no mapping found, clean up and title case
        cleaned = raw_type.replace("-", " ").replace("_", " ").strip()
        if cleaned:
            # Add "Manual" if not present
            if 'manual' not in cleaned.lower():
                cleaned += ' Manual'
            return cleaned.title()
        
        return 'Manual'
    
    def extract_manual_info(self, href: str, title: str, brand: str) -> Optional[ManualEntry]:
        """Extract manual information from URL and title with normalized manual type"""
        try:
            # Enhanced pattern to capture manual type
            pattern = brand + r"-([\w-]+)-(\d{4})-([^-]+)-manual"
            match = re.search(pattern, href)
            
            if not match:
                # Try alternative patterns
                patterns = [
                    brand + r"-([\w-]+)-(\d{4})-([^-/]+)",  # Without "-manual" suffix
                    brand + r"-([\w-]+)-(\d{4})$",         # Just brand-model-year
                    brand + r"-([\w-]+)-([^-/]+)-manual",  # Without year
                ]
                
                for alt_pattern in patterns:
                    match = re.search(alt_pattern, href)
                    if match:
                        break
                
                if not match:
                    # Fallback: check if it looks like a manual
                    if 'manual' in href.lower() or 'manual' in title.lower():
                        # Try to extract basic info
                        basic_pattern = brand + r"-([\w-]+)"
                        basic_match = re.search(basic_pattern, href)
                        if basic_match:
                            model = basic_match.group(1).replace("-", " ").title()
                            year = ""
                            # Try to extract year from title or href
                            year_match = re.search(r'\b(19|20)\d{2}\b', title + " " + href)
                            if year_match:
                                year = year_match.group(0)
                            
                            manual_type = self.normalize_manual_type("", title, href)
                            full_url = self.config.base_url + href
                            
                            return ManualEntry(
                                brand=brand.title(),
                                model=model,
                                year=year,
                                title=title.strip(),
                                slug=href,
                                url=full_url,
                                manual_type=manual_type
                            )
                    return None
            
            # Extract components
            model = match.group(1).replace("-", " ").title()
            
            if len(match.groups()) >= 3:
                # Pattern with year and type
                year = match.group(2)
                raw_manual_type = match.group(3) if len(match.groups()) >= 3 else ""
            elif len(match.groups()) == 2:
                # Pattern might be model-type or model-year
                second_part = match.group(2)
                if re.match(r'^\d{4}$', second_part):  # It's a year
                    year = second_part
                    raw_manual_type = ""
                else:  # It's a type
                    year = ""
                    raw_manual_type = second_part
            else:
                year = ""
                raw_manual_type = ""
            
            # Enhanced normalization using the mapping dictionary
            raw_type_normalized = raw_manual_type.lower().replace("_", "-").strip()
            
            # Special handling: if we extracted something generic like "guide" or "manual"
            # but title has more specific info, prefer title context
            if raw_type_normalized in ['guide', 'manual'] and title:
                title_lower = title.lower()
                if 'user guide' in title_lower or 'user manual' in title_lower:
                    raw_type_normalized = 'user'
                elif 'owner guide' in title_lower or 'owner manual' in title_lower:
                    raw_type_normalized = 'owner'
                elif 'service guide' in title_lower or 'service manual' in title_lower:
                    raw_type_normalized = 'service'
                elif 'navigation' in title_lower:
                    raw_type_normalized = 'navigation'
                elif 'audio' in title_lower or 'radio' in title_lower:
                    raw_type_normalized = 'audio'
                elif 'infotainment' in title_lower:
                    raw_type_normalized = 'infotainment'
            
            # Use enhanced mapping for normalization
            manual_type = self.MANUAL_TYPE_MAPPING.get(
                raw_type_normalized, 
                self.normalize_manual_type(raw_manual_type, title, href)
            )
            
            full_url = self.config.base_url + href
            
            return ManualEntry(
                brand=brand.title(),
                model=model,
                year=year,
                title=title.strip(),
                slug=href,
                url=full_url,
                manual_type=manual_type
            )
            
        except Exception as e:
            logger.warning(f"Failed to extract info from {href}: {e}")
            return None
    
    def enhance_manual_with_page_info(self, manual: ManualEntry) -> ManualEntry:
        """Get additional info from the manual page itself"""
        try:
            response = self.make_request_with_retry(manual.url)
            if not response:
                return manual
                
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Look for pages count and file size info
            info_text = soup.get_text()
            
            # Extract pages count
            pages_match = re.search(r'Pages?:\s*(\d+)', info_text)
            if pages_match:
                manual.pages_count = pages_match.group(1)
            
            # Extract file size
            size_match = re.search(r'PDF Size:\s*([\d.]+ [A-Z]+)', info_text)
            if size_match:
                manual.file_size = size_match.group(1)
                
            logger.debug(f"Enhanced manual info: {manual.pages_count} pages, {manual.file_size}")
            
        except Exception as e:
            logger.debug(f"Could not enhance manual info for {manual.url}: {e}")
        
        return manual
    
    def extract_image_pages(self, manual: ManualEntry) -> List[str]:
        """Extract all image page URLs from a manual
        
        Args:
            manual: ManualEntry object containing the base manual URL
            
        Returns:
            List of all valid page URLs including the base URL
        """
        page_urls = [manual.url]  # Start with the base URL (page 1)
        page_number = 2
        max_pages = 10000  # Safety limit
        consecutive_failures = 0
        max_consecutive_failures = 3
        
        logger.info(f"[PAGES] Starting page extraction for: {manual.url}")
        
        while page_number <= max_pages and consecutive_failures < max_consecutive_failures:
            page_url = f"{manual.url}/{page_number}"
            
            try:
                response = self.make_request_with_retry(page_url)
                
                if not response or response.status_code == 404:
                    logger.debug(f"[PAGES] Page {page_number} returned 404, stopping")
                    break
                
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
                    "last page"
                ]
                
                if any(indicator in page_content for indicator in end_indicators):
                    logger.debug(f"[PAGES] Found end indicator on page {page_number}, stopping")
                    break
                
                # Check if page has actual manual content (images or manual text)
                has_manual_content = (
                    soup.find("img") or
                    "manual" in page_content or
                    "page" in page_content and str(page_number) in page_content
                )
                
                if not has_manual_content:
                    consecutive_failures += 1
                    logger.debug(f"[PAGES] Page {page_number} has no manual content (attempt {consecutive_failures})")
                    
                    if consecutive_failures >= max_consecutive_failures:
                        logger.debug(f"[PAGES] Too many consecutive failures, stopping at page {page_number}")
                        break
                else:
                    consecutive_failures = 0  # Reset failure counter
                    page_urls.append(page_url)
                    logger.debug(f"[PAGES] Added page {page_number}: {page_url}")
                
                # Progress update for large manuals
                if page_number % 100 == 0:
                    logger.info(f"[PAGES] Processed {page_number} pages for {manual.title}")
                
                page_number += 1
                
                # Small delay to be respectful
                time.sleep(0.1)
                
            except requests.exceptions.RequestException as e:
                logger.debug(f"[PAGES] Request failed for page {page_number}: {e}")
                consecutive_failures += 1
                
                if consecutive_failures >= max_consecutive_failures:
                    logger.warning(f"[PAGES] Too many request failures, stopping at page {page_number}")
                    break
                    
                page_number += 1
                
            except Exception as e:
                logger.error(f"[PAGES] Unexpected error on page {page_number}: {e}")
                consecutive_failures += 1
                page_number += 1
        
        total_pages = len(page_urls)
        logger.info(f"[PAGES] Found {total_pages} pages for manual: {manual.title}")
        
        # Update manual with actual page count if not already set
        if not manual.pages_count and total_pages > 1:
            manual.pages_count = str(total_pages)
        
        return page_urls
    
    def scrape_brand_page(self, brand: str, page_num: int) -> Tuple[List[ManualEntry], int, int]:
        """Scrape a single page for a brand
        
        Returns:
            (list_of_manuals, duplicates_found, total_found)
        """
        url = f"{self.config.base_url}/b/{brand}"
        if page_num > 1:
            url += f"/{page_num}"
            
        response = self.make_request_with_retry(url)
        if not response:
            return [], 0, 0
            
        try:
            soup = BeautifulSoup(response.text, "html.parser")
            links = soup.find_all("a", href=True)
            unique_manuals = []
            duplicates_found = 0
            total_found = 0
            
            for link in links:
                href = link["href"]
                
                if not self.is_valid_manual_url(href, brand):
                    continue
                
                # Only process links with meaningful text
                link_text = link.text.strip()
                if not link_text or len(link_text) < 5:
                    continue
                    
                manual = self.extract_manual_info(href, link_text, brand)
                if manual:
                    total_found += 1
                    
                    # Check for duplicates using global deduplication
                    if self.dedup_manager.is_duplicate(manual):
                        duplicates_found += 1
                        logger.debug(f"[DEDUP] Skipping duplicate: {manual.url}")
                        continue
                    
                    # Enhance manual with additional info
                    manual = self.enhance_manual_with_page_info(manual)
                    
                    # Extract all image page URLs if needed
                    if hasattr(self.config, 'extract_pages') and self.config.extract_pages:
                        manual.image_pages = self.extract_image_pages(manual)
                        logger.info(f"[PAGES] Extracted {len(manual.image_pages)} image page URLs for {manual.title}")
                    
                    # Add to seen data
                    self.dedup_manager.add_manual(manual)
                    unique_manuals.append(manual)
                    logger.debug(f"[NEW] Found unique manual: {manual.url}")
            
            return unique_manuals, duplicates_found, total_found
            
        except Exception as e:
            logger.error(f"Error parsing page {url}: {e}")
            return [], 0, 0
    
    def scrape_brand(self, brand: str) -> List[ManualEntry]:
        """Scrape all pages for a single brand with deduplication"""
        logger.info(f"[SEARCH] Starting scrape for brand: {brand}")
        all_manuals = []
        page_num = 1
        failed_requests = 0
        consecutive_empty_pages = 0
        total_duplicates = 0
        total_found = 0
        
        while page_num <= self.config.max_pages:
            manuals, duplicates, found = self.scrape_brand_page(brand, page_num)
            
            total_duplicates += duplicates
            total_found += found
            
            if not manuals and found == 0:
                failed_requests += 1
                consecutive_empty_pages += 1
                if consecutive_empty_pages >= 3:
                    logger.info(f"[STOP] Stopping after {consecutive_empty_pages} consecutive empty pages")
                    break
            else:
                consecutive_empty_pages = 0
                all_manuals.extend(manuals)
                logger.info(f"[PAGE] Page {page_num}: Found {found} total, {len(manuals)} unique, {duplicates} duplicates")
            
            page_num += 1
            time.sleep(random.uniform(*self.config.delay_range))
        
        logger.info(f"[DONE] Completed {brand}: {len(all_manuals)} unique manuals (out of {total_found} total, {total_duplicates} duplicates)")
        self.stats.add_brand_result(brand, total_found, len(all_manuals), total_duplicates, failed_requests)
        
        return all_manuals
    
    def save_brand_data(self, brand: str, manuals: List[ManualEntry]):
        """Save individual brand data to CSV"""
        if not manuals:
            return
            
        filename = self.output_dir / f"manuals_{brand}.csv"
        
        fieldnames = ["brand", "model", "year", "title", "slug", "url", "manual_type", "pages_count", "file_size", "total_image_pages", "image_pages"]
        
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows([manual.to_dict() for manual in manuals])
        
        logger.info(f"[SAVE] Saved {len(manuals)} unique manuals to {filename}")
    
    def save_all_data(self, all_manuals: List[ManualEntry]):
        """Save all collected data"""
        filename = self.output_dir / "manual_metadata_deduplicated.csv"
        
        fieldnames = ["brand", "model", "year", "title", "slug", "url", "manual_type", "pages_count", "file_size", "total_image_pages", "image_pages"]
        
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows([manual.to_dict() for manual in all_manuals])
        
        logger.info(f"[SAVE] Saved complete deduplicated dataset: {len(all_manuals)} manuals to {filename}")
    
    def save_stats(self):
        """Save scraping statistics"""
        stats_file = self.output_dir / "scraping_stats_deduplicated.json"
        
        with open(stats_file, "w", encoding="utf-8") as f:
            json.dump(self.stats.get_summary(), f, indent=2, default=str)
        
        logger.info(f"[STATS] Saved statistics to {stats_file}")
    
    def scrape_all_brands(self, brands: List[str]) -> List[ManualEntry]:
        """Scrape all brands with global deduplication"""
        all_manuals = []
        completed_count = 0
        
        logger.info(f"[START] Starting scrape for {len(brands)} brands with global deduplication")
        logger.info(f"[DEDUP] Starting with {len(self.dedup_manager.seen_urls)} previously seen URLs")
        
        # Process brands sequentially to maintain proper deduplication
        for i, brand in enumerate(brands, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"[BRAND] Processing {i}/{len(brands)}: {brand}")
            logger.info(f"{'='*60}")
            
            try:
                brand_manuals = self.scrape_brand(brand)
                all_manuals.extend(brand_manuals)
                
                # Save individual brand data
                self.save_brand_data(brand, brand_manuals)
                
                # Progress update
                logger.info(f"[PROGRESS] {i}/{len(brands)} brands completed")
                logger.info(f"[TOTAL] Running totals: {len(all_manuals)} unique manuals, {self.stats.duplicates_found} duplicates")
                
                # Save deduplication data periodically
                if i % 5 == 0:
                    self.dedup_manager.save_seen_data()
                
            except Exception as e:
                logger.error(f"[ERROR] Failed to process brand {brand}: {e}")
                continue
        
        # Save final data
        self.save_all_data(all_manuals)
        self.save_stats()
        
        # Print final summary
        summary = self.stats.get_summary()
        logger.info(f"""
        [COMPLETE] SCRAPING COMPLETE WITH DEDUPLICATION!
        [SUMMARY] Final Summary:
        - Duration: {summary['duration_seconds']:.1f} seconds
        - Brands processed: {summary['brands_processed']}/{len(brands)}
        - Total manuals found: {summary['total_manuals_found']}
        - Unique manuals saved: {summary['unique_manuals_added']}
        - Duplicates removed: {summary['duplicates_found']}
        - Deduplication rate: {summary['deduplication_rate']}
        - Failed requests: {summary['failed_requests']}
        - Average unique per brand: {summary['avg_unique_per_brand']:.1f}
        """)
        
        return all_manuals

def main():
    """Main execution function"""
    # Define brands to scrape
    BRANDS = [
        "kia", "lamborghini", "land-rover", "lexus", "lincoln", 
        "mazda", "mercedes-benz", "mini", "mitsubishi", "nissan"
    ]

    # Create configuration - set extract_pages=True to get all page URLs
    config = ScrapingConfig(
        extract_pages=True,  # Set to True to extract all page URLs for each manual
        max_retries=3,
        timeout=30
    )
    
    # Run scraper with deduplication
    with EnhancedCarManualScraper(config) as scraper:
        manuals = scraper.scrape_all_brands(BRANDS)
        
        # Show some statistics about page extraction
        if config.extract_pages:
            total_pages = sum(len(manual.image_pages) for manual in manuals if manual.image_pages)
            manuals_with_pages = sum(1 for manual in manuals if manual.image_pages and len(manual.image_pages) > 1)
            logger.info(f"[PAGES] Extracted {total_pages} total page URLs from {manuals_with_pages} manuals")
        
        logger.info(f"[FINAL] Scraping completed! {len(manuals)} unique manuals collected.")

def extract_pages_for_existing_csv(csv_file: str, output_file: str = None):
    """Extract page URLs for manuals from existing CSV file"""
    if not output_file:
        output_file = csv_file.replace('.csv', '_with_pages.csv')
    
    config = ScrapingConfig(extract_pages=True)
    
    with EnhancedCarManualScraper(config) as scraper:
        # Read existing CSV
        manuals = []
        with open(csv_file, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                manual = ManualEntry(
                    brand=row['brand'],
                    model=row['model'],
                    year=row['year'],
                    title=row['title'],
                    slug=row['slug'],
                    url=row['url'],
                    manual_type=row.get('manual_type', ''),
                    pages_count=row.get('pages_count', ''),
                    file_size=row.get('file_size', '')
                )
                
                # Extract page URLs
                logger.info(f"[EXTRACT] Extracting pages for: {manual.title}")
                manual.image_pages = scraper.extract_image_pages(manual)
                manuals.append(manual)
        
        # Save updated data
        fieldnames = ["brand", "model", "year", "title", "slug", "url", "manual_type", "pages_count", "file_size", "total_image_pages", "image_pages"]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows([manual.to_dict() for manual in manuals])
        
        total_pages = sum(len(manual.image_pages) for manual in manuals if manual.image_pages)
        logger.info(f"[COMPLETE] Extracted {total_pages} total page URLs, saved to {output_file}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "extract":
        # Extract pages for existing CSV
        if len(sys.argv) < 3:
            print("Usage: python scraper_with_deduplication.py extract <csv_file> [output_file]")
            sys.exit(1)
        
        csv_file = sys.argv[2]
        output_file = sys.argv[3] if len(sys.argv) > 3 else None
        extract_pages_for_existing_csv(csv_file, output_file)
    else:
        # Run normal scraping
        main()