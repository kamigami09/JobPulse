import hashlib
import os
import uuid

from flask import current_app


def _base() -> str:
    return current_app.config["UPLOAD_DIR"]


def save_resume(user_id: int, file_bytes: bytes, original_filename: str) -> dict:
    content_hash = hashlib.sha256(file_bytes).hexdigest()
    user_dir = os.path.join(_base(), "resumes", str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    rel_path = os.path.join("resumes", str(user_id), f"{uuid.uuid4().hex}.pdf")
    with open(os.path.join(_base(), rel_path), "wb") as fh:
        fh.write(file_bytes)
    return {"storage_path": rel_path, "content_hash": content_hash}


def get_resume_abs_path(storage_path: str) -> str:
    return os.path.join(_base(), storage_path)


def delete_resume_file(storage_path: str) -> None:
    try:
        os.remove(get_resume_abs_path(storage_path))
    except FileNotFoundError:
        pass
