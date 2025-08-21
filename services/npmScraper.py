#!/usr/bin/env python3
"""
NPM Package Scraper - Multithreaded Web Scraping for NPM Packages
Bypasses NPM API limitations by scraping the actual NPM website
Supports sorting by size, date, and other criteria across ALL packages
"""

import os
import json
import requests
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus, urljoin
from dataclasses import dataclass
import re

# Configuration
DEFAULT_THREADS = 10
SMALL_SLEEP = 0.5
MEDIUM_SLEEP = 1
BIG_SLEEP = 2
REQUEST_TIMEOUT = 10
MAX_RETRIES = 3

@dataclass
class NpmPackage:
    """NPM Package data structure"""
    name: str
    version: str
    description: str
    author: str
    license: str
    size: int  # unpacked size in bytes
    files: int
    downloads_weekly: int
    downloads_monthly: int
    dependents: int
    last_publish: str
    homepage: str
    repository: str
    keywords: List[str]
    quality_score: float
    popularity_score: float
    maintenance_score: float

class NpmScraper:
    """Multithreaded NPM package scraper"""
    
    def __init__(self, threads: int = DEFAULT_THREADS):
        self.threads = threads
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.results: List[NpmPackage] = []
        self.lock = threading.Lock()
        
    def sleep_and_log(self, sleep_time: float, message: str = "") -> None:
        """Sleep with logging"""
        if message:
            print(f"{message} - Sleeping for {sleep_time}s")
        time.sleep(sleep_time)
    
    def make_request(self, url: str, retries: int = MAX_RETRIES) -> Optional[requests.Response]:
        """Make HTTP request with retries"""
        for attempt in range(retries):
            try:
                response = self.session.get(url, timeout=REQUEST_TIMEOUT)
                if response.status_code == 200:
                    return response
                elif response.status_code == 429:  # Rate limited
                    self.sleep_and_log(BIG_SLEEP * (attempt + 1), f"Rate limited on {url}")
                    continue
                else:
                    print(f"HTTP {response.status_code} for {url}")
                    
            except requests.exceptions.RequestException as e:
                print(f"Request failed for {url}: {e}")
                if attempt < retries - 1:
                    self.sleep_and_log(MEDIUM_SLEEP * (attempt + 1))
                    
        return None
    
    def extract_package_from_search_page(self, html: str) -> List[Dict[str, Any]]:
        """Extract package info from NPM search results page"""
        packages = []
        
        # NPM search results are typically in JSON within script tags
        # Look for the __INITIAL_STATE__ or similar data
        json_pattern = r'window\.__INITIAL_STATE__\s*=\s*({.+?});'
        match = re.search(json_pattern, html, re.DOTALL)
        
        if match:
            try:
                data = json.loads(match.group(1))
                # Navigate the NPM data structure
                search_results = data.get('search', {}).get('packages', [])
                
                for pkg_data in search_results:
                    package_info = {
                        'name': pkg_data.get('name', ''),
                        'version': pkg_data.get('version', ''),
                        'description': pkg_data.get('description', ''),
                        'author': pkg_data.get('author', {}).get('name', ''),
                        'license': pkg_data.get('license', ''),
                        'downloads_weekly': pkg_data.get('downloads', {}).get('weekly', 0),
                        'downloads_monthly': pkg_data.get('downloads', {}).get('monthly', 0),
                        'dependents': pkg_data.get('dependents', 0),
                        'last_publish': pkg_data.get('date', ''),
                        'homepage': pkg_data.get('links', {}).get('homepage', ''),
                        'repository': pkg_data.get('links', {}).get('repository', ''),
                        'keywords': pkg_data.get('keywords', []),
                        'quality_score': pkg_data.get('score', {}).get('detail', {}).get('quality', 0),
                        'popularity_score': pkg_data.get('score', {}).get('detail', {}).get('popularity', 0),
                        'maintenance_score': pkg_data.get('score', {}).get('detail', {}).get('maintenance', 0),
                    }
                    packages.append(package_info)
                    
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from search page: {e}")
                
        return packages
    
    def get_package_details(self, package_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed package information from NPM package page"""
        url = f"https://www.npmjs.com/package/{package_name}"
        response = self.make_request(url)
        
        if not response:
            return None
            
        html = response.text
        
        # Extract package details from the page
        details = {}
        
        # Look for package size information
        size_pattern = r'"unpackedSize":(\d+)'
        size_match = re.search(size_pattern, html)
        if size_match:
            details['size'] = int(size_match.group(1))
            
        # Look for file count
        files_pattern = r'"fileCount":(\d+)'
        files_match = re.search(files_pattern, html)
        if files_match:
            details['files'] = int(files_match.group(1))
            
        return details
    
    def search_packages(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search for packages on a specific page"""
        encoded_query = quote_plus(query)
        url = f"https://www.npmjs.com/search?q={encoded_query}&page={page}"
        
        print(f"Searching page {page}: {url}")
        response = self.make_request(url)
        
        if not response:
            return []
            
        packages = self.extract_package_from_search_page(response.text)
        print(f"Found {len(packages)} packages on page {page}")
        
        return packages
    
    def worker_thread(self, task_queue: List[Dict[str, Any]]) -> None:
        """Worker thread for processing packages"""
        thread_id = threading.current_thread().ident
        
        for task in task_queue:
            try:
                if task['type'] == 'enrich_package':
                    package_data = task['package']
                    details = self.get_package_details(package_data['name'])
                    
                    if details:
                        package_data.update(details)
                    
                    # Create NpmPackage object
                    npm_package = NpmPackage(
                        name=package_data.get('name', ''),
                        version=package_data.get('version', ''),
                        description=package_data.get('description', ''),
                        author=package_data.get('author', ''),
                        license=package_data.get('license', ''),
                        size=package_data.get('size', 0),
                        files=package_data.get('files', 0),
                        downloads_weekly=package_data.get('downloads_weekly', 0),
                        downloads_monthly=package_data.get('downloads_monthly', 0),
                        dependents=package_data.get('dependents', 0),
                        last_publish=package_data.get('last_publish', ''),
                        homepage=package_data.get('homepage', ''),
                        repository=package_data.get('repository', ''),
                        keywords=package_data.get('keywords', []),
                        quality_score=package_data.get('quality_score', 0),
                        popularity_score=package_data.get('popularity_score', 0),
                        maintenance_score=package_data.get('maintenance_score', 0),
                    )
                    
                    with self.lock:
                        self.results.append(npm_package)
                        
                    print(f"Thread {thread_id}: Processed {package_data['name']}")
                    
            except Exception as e:
                print(f"Thread {thread_id}: Error processing task: {e}")
                
            # Small delay between requests
            self.sleep_and_log(SMALL_SLEEP)
    
    def search_and_enrich(self, query: str, max_pages: int = 10, sort_by: str = 'relevance') -> List[NpmPackage]:
        """
        Search for packages and enrich with detailed information
        
        Args:
            query: Search query
            max_pages: Maximum pages to scrape
            sort_by: Sort criteria ('size', 'date', 'downloads', 'relevance')
        """
        print(f"Starting NPM search for '{query}' with {self.threads} threads")
        print(f"Will scrape up to {max_pages} pages")
        
        # Step 1: Collect all packages from search pages
        all_packages = []
        
        for page in range(1, max_pages + 1):
            packages = self.search_packages(query, page)
            if not packages:
                print(f"No more packages found at page {page}, stopping")
                break
                
            all_packages.extend(packages)
            self.sleep_and_log(MEDIUM_SLEEP, f"Completed page {page}")
            
        print(f"Found {len(all_packages)} total packages across {page} pages")
        
        # Step 2: Create tasks for enrichment
        tasks = []
        for package_data in all_packages:
            tasks.append({
                'type': 'enrich_package',
                'package': package_data
            })
        
        # Step 3: Distribute tasks across threads
        chunk_size = len(tasks) // self.threads
        task_chunks = [tasks[i:i + chunk_size] for i in range(0, len(tasks), chunk_size)]
        
        # Step 4: Execute with thread pool
        with ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = [executor.submit(self.worker_thread, chunk) for chunk in task_chunks]
            
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    print(f"Thread execution error: {e}")
        
        # Step 5: Sort results
        self.sort_results(sort_by)
        
        print(f"Completed! Found and enriched {len(self.results)} packages")
        return self.results
    
    def sort_results(self, sort_by: str) -> None:
        """Sort results by specified criteria"""
        if sort_by == 'size':
            self.results.sort(key=lambda x: x.size, reverse=True)
        elif sort_by == 'date':
            self.results.sort(key=lambda x: x.last_publish, reverse=True)
        elif sort_by == 'downloads':
            self.results.sort(key=lambda x: x.downloads_weekly, reverse=True)
        elif sort_by == 'dependents':
            self.results.sort(key=lambda x: x.dependents, reverse=True)
        # 'relevance' keeps original order
        
        print(f"Results sorted by {sort_by}")
    
    def save_results(self, filename: str) -> None:
        """Save results to JSON file"""
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        full_filename = f"{filename}-{timestamp}.json"
        
        data = []
        for package in self.results:
            data.append({
                'name': package.name,
                'version': package.version,
                'description': package.description,
                'author': package.author,
                'license': package.license,
                'size': package.size,
                'files': package.files,
                'downloads_weekly': package.downloads_weekly,
                'downloads_monthly': package.downloads_monthly,
                'dependents': package.dependents,
                'last_publish': package.last_publish,
                'homepage': package.homepage,
                'repository': package.repository,
                'keywords': package.keywords,
                'quality_score': package.quality_score,
                'popularity_score': package.popularity_score,
                'maintenance_score': package.maintenance_score,
            })
        
        with open(full_filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Results saved to {full_filename}")

def main():
    """Main execution function"""
    scraper = NpmScraper(threads=DEFAULT_THREADS)
    
    # Example usage
    query = "react"
    max_pages = 20  # This could fetch 400+ packages (20 per page)
    sort_by = "size"  # or "date", "downloads", "dependents", "relevance"
    
    results = scraper.search_and_enrich(query, max_pages, sort_by)
    
    # Display top 10 results
    print(f"\nTop 10 packages sorted by {sort_by}:")
    for i, package in enumerate(results[:10], 1):
        print(f"{i}. {package.name} ({package.version})")
        print(f"   Size: {package.size:,} bytes, Files: {package.files}")
        print(f"   Downloads: {package.downloads_weekly:,}/week")
        print(f"   Dependents: {package.dependents:,}")
        print(f"   Published: {package.last_publish}")
        print()
    
    # Save results
    scraper.save_results(f"npm-{query}-{sort_by}")

if __name__ == "__main__":
    main()
