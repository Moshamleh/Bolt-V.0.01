#!/usr/bin/env python3
"""
Clean Duplicate Manual Entries
This script removes duplicate entries from existing CSV files
"""

import csv
import logging
from pathlib import Path
from typing import Set, List, Dict
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_unique_key(row: Dict[str, str]) -> str:
    """Generate unique key for a manual entry"""
    return row.get('url', '')

def get_content_hash(row: Dict[str, str]) -> str:
    """Generate content-based hash for deeper deduplication"""
    content = f"{row.get('brand', '')}_{row.get('model', '')}_{row.get('year', '')}_{row.get('title', '')}".lower()
    return hashlib.md5(content.encode()).hexdigest()

def clean_csv_duplicates(input_file: str, output_file: str) -> tuple:
    """Clean duplicates from CSV file
    
    Returns:
        (original_count, unique_count, duplicates_removed)
    """
    input_path = Path(input_file)
    output_path = Path(output_file)
    
    if not input_path.exists():
        logger.error(f"Input file not found: {input_file}")
        return 0, 0, 0
    
    # Create output directory
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    seen_urls: Set[str] = set()
    seen_content_hashes: Set[str] = set()
    unique_rows: List[Dict[str, str]] = []
    
    original_count = 0
    duplicates_removed = 0
    
    logger.info(f"Processing: {input_file}")
    
    with open(input_path, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        for row in reader:
            original_count += 1
            
            # Generate unique identifiers
            url_key = get_unique_key(row)
            content_hash = get_content_hash(row)
            
            # Check for duplicates
            is_duplicate = False
            
            if url_key in seen_urls:
                logger.debug(f"URL duplicate found: {url_key}")
                is_duplicate = True
            elif content_hash in seen_content_hashes:
                logger.debug(f"Content duplicate found: {content_hash}")
                is_duplicate = True
            
            if is_duplicate:
                duplicates_removed += 1
                if duplicates_removed % 1000 == 0:
                    logger.info(f"Processed {original_count} rows, removed {duplicates_removed} duplicates")
            else:
                # Add to unique data
                seen_urls.add(url_key)
                seen_content_hashes.add(content_hash)
                unique_rows.append(row)
    
    # Write cleaned data
    with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_rows)
    
    unique_count = len(unique_rows)
    
    logger.info(f"Cleaning completed:")
    logger.info(f"  - Original entries: {original_count}")
    logger.info(f"  - Unique entries: {unique_count}")
    logger.info(f"  - Duplicates removed: {duplicates_removed}")
    logger.info(f"  - Deduplication rate: {(duplicates_removed / max(original_count, 1) * 100):.1f}%")
    logger.info(f"  - Output saved to: {output_file}")
    
    return original_count, unique_count, duplicates_removed

def clean_all_csv_files(input_dir: str = "scraped_data", output_dir: str = "scraped_data/cleaned") -> None:
    """Clean all CSV files in a directory"""
    input_path = Path(input_dir)
    
    if not input_path.exists():
        logger.error(f"Input directory not found: {input_dir}")
        return
    
    csv_files = list(input_path.glob("*.csv"))
    
    if not csv_files:
        logger.warning(f"No CSV files found in: {input_dir}")
        return
    
    logger.info(f"Found {len(csv_files)} CSV files to clean")
    
    total_original = 0
    total_unique = 0
    total_duplicates = 0
    
    for csv_file in csv_files:
        output_file = Path(output_dir) / csv_file.name
        
        try:
            original, unique, duplicates = clean_csv_duplicates(str(csv_file), str(output_file))
            total_original += original
            total_unique += unique
            total_duplicates += duplicates
        except Exception as e:
            logger.error(f"Error processing {csv_file}: {e}")
    
    logger.info(f"\n{'='*60}")
    logger.info(f"OVERALL CLEANING SUMMARY:")
    logger.info(f"  - Files processed: {len(csv_files)}")
    logger.info(f"  - Total original entries: {total_original}")
    logger.info(f"  - Total unique entries: {total_unique}")
    logger.info(f"  - Total duplicates removed: {total_duplicates}")
    logger.info(f"  - Overall deduplication rate: {(total_duplicates / max(total_original, 1) * 100):.1f}%")
    logger.info(f"{'='*60}")

def main():
    """Main function to clean duplicates"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean duplicate manual entries from CSV files")
    parser.add_argument("--input", "-i", help="Input CSV file or directory", default="scraped_data")
    parser.add_argument("--output", "-o", help="Output CSV file or directory", default="scraped_data/cleaned")
    parser.add_argument("--single", action="store_true", help="Process single file instead of directory")
    
    args = parser.parse_args()
    
    if args.single:
        # Process single file
        if not args.output.endswith('.csv'):
            args.output += '.csv'
        clean_csv_duplicates(args.input, args.output)
    else:
        # Process directory
        clean_all_csv_files(args.input, args.output)

if __name__ == "__main__":
    main()