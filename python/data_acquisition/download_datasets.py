"""
Dataset Download Script for Game Suite ML Training
Downloads public datasets for: Connect-4, Tic-Tac-Toe, Word Chain vocabulary

Run: python download_datasets.py
"""

import os
import sys
import urllib.request
import zipfile
import shutil
from pathlib import Path

# Dataset URLs
DATASETS = {
    'connect4_uci': {
        'url': 'https://archive.ics.uci.edu/static/public/26/connect+4.zip',
        'description': 'UCI Connect-4 Dataset (67,557 positions)',
        'license': 'CC BY 4.0'
    },
    'tictactoe_uci': {
        'url': 'https://archive.ics.uci.edu/static/public/101/tic+tac+toe+endgame.zip',
        'description': 'UCI Tic-Tac-Toe Endgame Dataset (958 positions)', 
        'license': 'CC BY 4.0'
    },
    'english_words': {
        'url': 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
        'description': 'English Word List for Word Chain (370k+ words)',
        'license': 'Unlicense'
    }
}

def download_file(url: str, dest_path: str, desc: str = '') -> bool:
    """Download a file with progress indicator."""
    print(f"  Downloading: {desc or url}")
    try:
        # Add headers to avoid 403 errors
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as response:
            total_size = response.getheader('Content-Length')
            if total_size:
                total_size = int(total_size)
            
            with open(dest_path, 'wb') as out_file:
                downloaded = 0
                block_size = 8192
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    downloaded += len(buffer)
                    out_file.write(buffer)
                    if total_size:
                        pct = (downloaded / total_size) * 100
                        print(f"\r  Progress: {pct:.1f}%", end='', flush=True)
                print()
        return True
    except Exception as e:
        print(f"  Error downloading: {e}")
        return False


def extract_zip(zip_path: str, extract_to: str) -> bool:
    """Extract a zip file."""
    print(f"  Extracting: {zip_path}")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(extract_to)
        return True
    except Exception as e:
        print(f"  Error extracting: {e}")
        return False


def download_all_datasets(output_dir: str = 'datasets'):
    """Download all available datasets."""
    base_dir = Path(__file__).parent / output_dir
    base_dir.mkdir(parents=True, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("Game Suite Dataset Downloader")
    print("=" * 60)
    
    results = {}
    
    for name, info in DATASETS.items():
        print(f"\n[{name}] {info['description']}")
        print(f"  License: {info['license']}")
        
        dataset_dir = base_dir / name
        dataset_dir.mkdir(exist_ok=True)
        
        url = info['url']
        filename = url.split('/')[-1]
        dest_path = dataset_dir / filename
        
        if download_file(url, str(dest_path), filename):
            # Extract if zip
            if filename.endswith('.zip'):
                if extract_zip(str(dest_path), str(dataset_dir)):
                    results[name] = 'success'
                else:
                    results[name] = 'extract_failed'
            else:
                results[name] = 'success'
        else:
            results[name] = 'download_failed'
    
    # Summary
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    for name, status in results.items():
        icon = "✓" if status == 'success' else "✗"
        print(f"  {icon} {name}: {status}")
    
    print(f"\nDatasets saved to: {base_dir.absolute()}")
    return results


if __name__ == '__main__':
    download_all_datasets()
