_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_pdf(data: bytes) -> str | None:
    """Returns an error string, or None if the file is a valid PDF within size limits."""
    if len(data) > _MAX_BYTES:
        return f"File exceeds 5 MB limit ({len(data) // 1024} KB uploaded)"
    if not data.startswith(b"%PDF"):
        return "File must be a valid PDF"
    return None
