import requests
from bs4 import BeautifulSoup

def extract_job_details(url: str):
    """Attempt to extract job title and company from the URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "success": False,
        "message": ""
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 1. Try og:title
        og_title = soup.find("meta", property="og:title")
        raw_title = og_title["content"] if og_title and og_title.get("content") else ""
        
        # 2. Fallback to <title>
        if not raw_title:
            raw_title = soup.title.string if soup.title else ""
            
        if not raw_title:
            result["message"] = "No title found in HTML"
            return result
            
        raw_title = raw_title.strip()
        
        # Heuristics for splitting "Job Title at Company" or "Job Title | Company"
        if " at " in raw_title:
            parts = raw_title.split(" at ", 1)
            result["title"] = parts[0].strip()
            
            comp_part = parts[1].split(" in ", 1)
            result["company"] = comp_part[0].strip()
            if len(comp_part) > 1:
                result["location"] = comp_part[1].strip()
        elif " | " in raw_title:
            parts = raw_title.split(" | ")
            result["title"] = parts[0].strip()
            if len(parts) > 1:
                result["company"] = parts[1].strip()
        elif " - " in raw_title:
            parts = raw_title.split(" - ")
            result["title"] = parts[0].strip()
            if len(parts) > 1:
                result["company"] = parts[1].strip()
        else:
            result["title"] = raw_title
            
        result["success"] = True
        
    except requests.exceptions.RequestException as e:
        result["message"] = f"Network or HTTP error: {str(e)}"
    except Exception as e:
        result["message"] = f"Scraping error: {str(e)}"
        
    return result
