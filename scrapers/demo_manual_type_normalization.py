#!/usr/bin/env python3
"""
Demo of Manual Type Normalization
Shows how the enhanced scraper normalizes various manual types
"""

import sys
sys.path.append('.')

from scraper_with_deduplication import EnhancedCarManualScraper, ScrapingConfig

def demo_normalization():
    """Demo the manual type normalization with real-world examples"""
    
    config = ScrapingConfig()
    scraper = EnhancedCarManualScraper(config)
    
    print("🚀 Manual Type Normalization Demo")
    print("="*80)
    print("This demo shows how various manual URL patterns are normalized to clean types:\n")
    
    # Real-world examples that would be found on the website
    examples = [
        # Standard patterns
        ("/audi-a4-2020-owner-manual", "Audi A4 2020 Owner Manual"),
        ("/bmw-3-series-2019-service-repair-manual", "BMW 3 Series Service Repair Manual"),
        ("/toyota-camry-2021-user-handbook", "Toyota Camry User Handbook"),
        ("/honda-civic-2020-workshop-manual", "Honda Civic Workshop Manual"),
        
        # Compound types with hyphens
        ("/ford-f150-2021-owner-handbook", "Ford F150 Owner Handbook"),
        ("/mercedes-e-class-2020-navigation-manual", "Mercedes E-Class Navigation System Manual"),
        ("/nissan-altima-2019-service-repair-manual", "Nissan Altima Service & Repair Manual"),
        
        # Electronic systems
        ("/bmw-x5-2021-audio-manual", "BMW X5 Audio System Manual"),
        ("/audi-q7-2020-infotainment-manual", "Audi Q7 Infotainment Guide"),
        ("/lexus-rx-2019-navigation-manual", "Lexus RX Navigation Manual"),
        
        # Technical manuals
        ("/ford-mustang-2020-wiring-manual", "Ford Mustang Wiring Diagrams"),
        ("/chevrolet-silverado-2021-parts-manual", "Chevrolet Silverado Parts Manual"),
        ("/dodge-ram-2019-electrical-manual", "Dodge Ram Electrical Systems Manual"),
        
        # Alternative formats and edge cases
        ("/volkswagen-golf-2020-guide", "VW Golf User Guide"),
        ("/subaru-outback-2019-handbook", "Subaru Outback Handbook"),
        ("/mazda-cx5-2021-quick-guide", "Mazda CX-5 Quick Start Guide"),
        ("/tesla-model-3-2020-manual", "Tesla Model 3 Manual"),
        
        # Fallback cases
        ("/porsche-911-manual", "Porsche 911 Manual"),
        ("/ferrari-488-service-guide", "Ferrari 488 Service Guide"),
    ]
    
    for href, title in examples:
        # Extract brand from href
        brand = href.split('-')[0].strip('/')
        
        try:
            manual = scraper.extract_manual_info(href, title, brand)
            
            if manual:
                print(f"📄 URL: {href}")
                print(f"   Title: {title}")
                print(f"   → Brand: {manual.brand}")
                print(f"   → Model: {manual.model}")
                print(f"   → Year: {manual.year}")
                print(f"   → Type: {manual.manual_type}")
                print()
            else:
                print(f"❌ Failed to extract: {href}")
                print()
                
        except Exception as e:
            print(f"💥 Error processing {href}: {e}")
            print()
    
    print("="*80)
    print("✨ Key Normalization Features:")
    print("• owner-handbook → Owner Manual")
    print("• service-repair → Service Manual") 
    print("• navigation-manual → Navigation Manual")
    print("• user-guide → User Manual (from title context)")
    print("• class/series → Manual (false positive handling)")
    print("• Compound types → Simplified standard types")
    print("• Missing types → Inferred from title/URL")
    print("="*80)

def show_type_mapping():
    """Show the complete type mapping reference"""
    
    print("\n📚 Complete Manual Type Mapping Reference")
    print("="*80)
    
    mappings = {
        "Owner/User Manuals": [
            "owner → Owner Manual",
            "owners → Owner Manual", 
            "user → User Manual",
            "handbook → Owner Manual",
            "owner-handbook → Owner Manual",
            "driver → Driver Manual"
        ],
        "Service/Repair Manuals": [
            "service → Service Manual",
            "repair → Repair Manual", 
            "workshop → Workshop Manual",
            "maintenance → Maintenance Manual",
            "service-repair → Service Manual"
        ],
        "Electronic Systems": [
            "navigation → Navigation Manual",
            "audio → Audio Manual",
            "radio → Radio Manual", 
            "infotainment → Infotainment Manual",
            "multimedia → Multimedia Manual"
        ],
        "Technical Manuals": [
            "wiring → Wiring Manual",
            "electrical → Electrical Manual",
            "parts → Parts Manual",
            "engine → Engine Manual",
            "transmission → Transmission Manual"
        ],
        "Guides & References": [
            "guide → Guide",
            "quick → Quick Guide",
            "instruction → Instruction Manual",
            "reference → Reference Manual",
            "troubleshooting → Troubleshooting Guide"
        ]
    }
    
    for category, items in mappings.items():
        print(f"\n🔹 {category}:")
        for item in items:
            print(f"   {item}")
    
    print("\n🔧 Special Handling:")
    print("   • Missing/unknown types → Inferred from title")
    print("   • 'class', 'series', 'model' → Manual (false positives)")  
    print("   • Title context used for ambiguous cases")
    print("   • 'manual' keyword detection for fallbacks")
    print("="*80)

if __name__ == "__main__":
    demo_normalization()
    show_type_mapping()