#!/usr/bin/env python3
"""
Test Manual Type Normalization
"""

import sys
sys.path.append('.')

from scraper_with_deduplication import EnhancedCarManualScraper, ScrapingConfig

def test_manual_type_normalization():
    """Test the manual type normalization function"""
    
    config = ScrapingConfig()
    scraper = EnhancedCarManualScraper(config)
    
    # Test cases: (raw_type, title, href, expected_result)
    test_cases = [
        # Standard mappings
        ("owner", "BMW 3 Series Owner Manual", "/bmw-3-series-2020-owner-manual", "Owner Manual"),
        ("user", "Audi A4 User Guide", "/audi-a4-2019-user-manual", "User Manual"),
        ("service", "Mercedes Service Manual", "/mercedes-c-class-2018-service-manual", "Service Manual"),
        ("repair", "Toyota Repair Guide", "/toyota-camry-2020-repair-manual", "Repair Manual"),
        ("workshop", "Honda Workshop Manual", "/honda-civic-2019-workshop-manual", "Workshop Manual"),
        
        # Compound types with hyphens
        ("owner-handbook", "Ford Owner Handbook", "/ford-focus-2021-owner-handbook", "Owner Manual"),
        ("user-handbook", "Nissan User Handbook", "/nissan-altima-2020-user-handbook", "User Manual"),
        ("service-repair", "VW Service Repair Manual", "/vw-golf-2019-service-repair-manual", "Service Manual"),
        ("navigation-manual", "BMW Navigation Manual", "/bmw-x3-2020-navigation-manual", "Navigation Manual"),
        
        # Electronic systems
        ("audio", "Audi Audio System Manual", "/audi-a6-2021-audio-manual", "Audio Manual"),
        ("radio", "Toyota Radio Manual", "/toyota-rav4-2020-radio-manual", "Radio Manual"),
        ("infotainment", "Mercedes Infotainment Guide", "/mercedes-e-class-2021-infotainment-manual", "Infotainment Manual"),
        
        # Technical manuals
        ("wiring", "Ford Wiring Diagram Manual", "/ford-f150-2020-wiring-manual", "Wiring Manual"),
        ("electrical", "BMW Electrical Manual", "/bmw-5-series-2019-electrical-manual", "Electrical Manual"),
        ("parts", "Honda Parts Manual", "/honda-accord-2020-parts-manual", "Parts Manual"),
        
        # Fallback cases - empty raw_type but manual in title/href
        ("", "BMW 3 Series Owner Manual 2020", "/bmw-3-series-2020-owner-manual", "Owner Manual"),
        ("", "Service Manual for Audi A4", "/audi-a4-2019-service-guide", "Service Manual"),
        ("", "Toyota Camry Navigation System Manual", "/toyota-camry-2020-nav-guide", "Navigation Manual"),
        ("", "Honda Civic Manual", "/honda-civic-2019-manual", "Manual"),
        
        # Unknown/missing type with manual keyword
        ("unknown", "Ford F150 Manual", "/ford-f150-2020-manual", "Manual"),
        ("", "Some Car Manual", "/some-car-manual", "Manual"),
        
        # Edge cases
        ("quick", "Quick Start Guide", "/bmw-x5-2020-quick-guide", "Quick Guide"),
        ("installation", "Installation Instructions", "/aftermarket-radio-installation", "Installation Manual"),
        ("troubleshooting", "Troubleshooting Guide", "/engine-troubleshooting-guide", "Troubleshooting Guide"),
        
        # Custom types that should get "Manual" appended
        ("custom-type", "Custom Manual", "/car-custom-type-manual", "Custom Type Manual"),
        ("special", "Special Instructions", "/special-instructions", "Special Manual"),
    ]
    
    print("🧪 Testing Manual Type Normalization")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for raw_type, title, href, expected in test_cases:
        try:
            result = scraper.normalize_manual_type(raw_type, title, href)
            
            if result == expected:
                print(f"✅ PASS: '{raw_type}' → '{result}'")
                passed += 1
            else:
                print(f"❌ FAIL: '{raw_type}' → '{result}' (expected: '{expected}')")
                failed += 1
                
        except Exception as e:
            print(f"💥 ERROR: '{raw_type}' → Exception: {e}")
            failed += 1
    
    print("="*70)
    print(f"📊 Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️  {failed} tests failed")
    
    return failed == 0

def test_extract_manual_info():
    """Test the complete extract_manual_info function"""
    
    config = ScrapingConfig()
    scraper = EnhancedCarManualScraper(config)
    
    # Test cases: (href, title, brand, expected_manual_type)
    test_cases = [
        # Standard format
        ("/audi-a4-2020-owner-manual", "Audi A4 2020 Owner Manual", "audi", "Owner Manual"),
        ("/bmw-3-series-2019-service-repair-manual", "BMW 3 Series Service Repair Manual", "bmw", "Service Manual"),
        ("/toyota-camry-2021-navigation-manual", "Toyota Camry Navigation System", "toyota", "Navigation Manual"),
        
        # Alternative formats
        ("/honda-civic-2020-handbook", "Honda Civic Handbook", "honda", "Owner Manual"),
        ("/ford-focus-workshop-manual", "Ford Focus Workshop Manual", "ford", "Workshop Manual"),
        
        # Fallback cases
        ("/mercedes-c-class-manual", "Mercedes C-Class Manual", "mercedes", "Manual"),
        ("/vw-golf-2019-guide", "VW Golf User Guide", "vw", "User Manual"),
    ]
    
    print("\n🧪 Testing extract_manual_info Function")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for href, title, brand, expected_type in test_cases:
        try:
            manual = scraper.extract_manual_info(href, title, brand)
            
            if manual and manual.manual_type == expected_type:
                print(f"✅ PASS: {href} → '{manual.manual_type}'")
                print(f"   Full result: {manual.brand} {manual.model} {manual.year} {manual.manual_type}")
                passed += 1
            elif manual:
                print(f"❌ FAIL: {href} → '{manual.manual_type}' (expected: '{expected_type}')")
                print(f"   Full result: {manual.brand} {manual.model} {manual.year} {manual.manual_type}")
                failed += 1
            else:
                print(f"💥 ERROR: {href} → No manual extracted")
                failed += 1
                
        except Exception as e:
            print(f"💥 ERROR: {href} → Exception: {e}")
            failed += 1
    
    print("="*70)
    print(f"📊 Results: {passed} passed, {failed} failed")
    
    return failed == 0

if __name__ == "__main__":
    print("🚀 Starting Manual Type Normalization Tests\n")
    
    test1_passed = test_manual_type_normalization()
    test2_passed = test_extract_manual_info()
    
    print("\n" + "="*70)
    if test1_passed and test2_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED")
    print("="*70)