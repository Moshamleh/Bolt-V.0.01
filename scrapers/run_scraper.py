#!/usr/bin/env python3
"""
Simple runner script for the car manual scraper
"""

import sys
import argparse
from pathlib import Path
from scrape_all_manuals_improved import CarManualScraper, ScrapingConfig
from config import BRANDS, SCRAPING_CONFIG, HEADERS
import logging

def setup_logging(level="INFO"):
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, level),
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('scraper.log'),
            logging.StreamHandler()
        ]
    )

def main():
    parser = argparse.ArgumentParser(description='Car Manual Scraper')
    parser.add_argument('--brands', nargs='+', help='Specific brands to scrape', default=BRANDS)
    parser.add_argument('--max-pages', type=int, default=1000, help='Maximum pages per brand')
    parser.add_argument('--timeout', type=int, default=20, help='Request timeout in seconds')
    parser.add_argument('--delay', type=float, nargs=2, default=[1.0, 2.0], help='Delay range between requests')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    parser.add_argument('--output-dir', default='scraped_data', help='Output directory')
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)
    
    # Create configuration
    config = ScrapingConfig(
        max_pages=args.max_pages,
        timeout=args.timeout,
        delay_range=tuple(args.delay),
        headers=HEADERS
    )
    
    # Create output directory
    Path(args.output_dir).mkdir(exist_ok=True)
    
    logger.info(f"🚀 Starting scraper for {len(args.brands)} brands")
    logger.info(f"📁 Output directory: {args.output_dir}")
    logger.info(f"⚙️  Config: max_pages={args.max_pages}, timeout={args.timeout}s")
    
    try:
        with CarManualScraper(config) as scraper:
            manuals = scraper.scrape_all_brands(args.brands)
            
        logger.info(f"✅ Scraping completed successfully!")
        logger.info(f"📊 Total manuals collected: {len(manuals)}")
        
    except KeyboardInterrupt:
        logger.info("⏹️  Scraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Scraping failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()