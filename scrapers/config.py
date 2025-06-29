"""
Configuration settings for the car manual scraper
"""

# Scraping configuration
SCRAPING_CONFIG = {
    "base_url": "https://www.carmanualsonline.info",
    "max_pages": 1000,
    "max_retries": 3,
    "timeout": 20,
    "delay_range": (1.0, 2.0),  # Random delay between requests
    "max_workers": 3,  # For future concurrent processing
}

# HTTP Headers
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Car brands to scrape
BRANDS = [
    "abarth", "acura", "alfa-romeo", "audi", "bmw", "buick", "cadillac", "chevrolet",
    "chrysler", "citroen", "dacia", "daewoo", "daihatsu", "datsun", "dodge", "ferrari",
    "fiat", "ford", "gmc", "honda", "hyundai", "infiniti", "isuzu", "jaguar", "jeep",
    "kia", "lamborghini", "lancia", "land-rover", "lexus", "lincoln", "lotus", "maserati",
    "mazda", "mercedes-benz", "mini", "mitsubishi", "nissan", "opel", "peugeot", "pontiac",
    "porsche", "ram", "renault", "saab", "saturn", "seat", "skoda", "smart", "subaru",
    "suzuki", "tesla", "toyota", "vauxhall", "volkswagen", "volvo", "yamaha"
]

# Manual types to recognize
MANUAL_TYPES = [
    "owners", "user", "service", "repair", "workshop", 
    "instruction", "maintenance", "driver", "handbook",
    "operating", "technical", "parts"
]

# Output settings
OUTPUT_CONFIG = {
    "base_dir": "scraped_data",
    "backup_frequency": 10,  # Save backup every N brands
    "create_individual_files": True,
    "create_combined_file": True,
    "save_statistics": True
}

# Logging configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "scraper.log",
    "console": True
}