import ipaddress
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

TRACKING_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"}

def clean_url(url: str) -> str:
    """Strip known tracking parameters from the URL."""
    if not url:
        return url
    
    try:
        parsed = urlparse(url)
        if not parsed.query:
            return url
            
        query_params = parse_qsl(parsed.query, keep_blank_values=True)
        cleaned_params = [(k, v) for k, v in query_params if k.lower() not in TRACKING_PARAMS]
        
        new_query = urlencode(cleaned_params)
        return urlunparse(parsed._replace(query=new_query))
    except Exception:
        return url

def validate_url(url: str) -> bool:
    """Reject private IPs, localhost, unsafe schemes to prevent SSRF."""
    if not url:
        return False
        
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
            
        hostname = parsed.hostname
        if not hostname:
            return False
            
        if hostname.lower() == "localhost":
            return False
            
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local:
                return False
        except ValueError:
            pass
            
        return True
    except Exception:
        return False
