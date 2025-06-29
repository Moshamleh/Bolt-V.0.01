#!/usr/bin/env python3
"""
Test the upgraded manual type extraction logic
"""

import sys
import os
sys.path.append('project')

from scraper_with_deduplication import EnhancedCarManualScraper, ScrapingConfig

def test_upgraded_extraction():
    """Test the upgraded manual type extraction"""
    config = ScrapingConfig()
    scraper = EnhancedCarManualScraper(config)
    
    # Test cases demonstrating the new capabilities
    test_cases = [
        # New supported formats
        ("/kia-rio-2020-owner-handbook", "Kia Rio 2020 Owner Handbook", "kia"),
        ("/audi-a4-2020-navigation-manual", "Audi A4 2020 Navigation System", "audi"),
        ("/mazda-cx5-2020-manual", "Mazda CX-5 2020 Owner Manual", "mazda"),
        ("/ford-focus-2020-guide", "Ford Focus 2020 Audio System Guide", "ford"),
        ("/toyota-camry-2019-quick", "Toyota Camry 2019 Quick Start Guide", "toyota"),
        ("/bmw-x3-2021-infotainment", "BMW X3 2021 Infotainment Manual", "bmw"),
        ("/honda-civic-2020-navigation", "Honda Civic 2020 Navigation Manual", "honda"),
        ("/nissan-altima-2020-audio", "Nissan Altima 2020 Audio System Manual", "nissan"),
    ]
    
    print("🔥 Testing Upgraded Manual Type Extraction\n")
    
    for href, title, brand in test_cases:
        print(f"Testing: {href}")
        print(f"Title: {title}")
        
        # Test URL validation
        is_valid = scraper.is_valid_manual_url(href, brand)
        print(f"✅ Valid URL: {is_valid}")
        
        if is_valid:
            # Test manual extraction
            manual = scraper.extract_manual_info(href, title, brand)
            if manual:
                print(f"📖 Manual Type: {manual.manual_type}")
                print(f"   Brand: {manual.brand}")
                print(f"   Model: {manual.model}")
                print(f"   Year: {manual.year}")
            else:
                print(f"❌ Failed to extract manual info")
        
        print("-" * 50)
    
    # Test the MANUAL_TYPE_MAPPING
    print("\n🗂️ Manual Type Mapping Test:")
    test_mappings = [
        "owner-handbook", "navigation", "infotainment", "quick-guide", 
        "audio", "service-repair", "manual", "guide"
    ]
    
    for test_type in test_mappings:
        mapped = scraper.MANUAL_TYPE_MAPPING.get(test_type, "Not mapped")
        print(f"'{test_type}' → '{mapped}'")

if __name__ == "__main__":
    test_upgraded_extraction()