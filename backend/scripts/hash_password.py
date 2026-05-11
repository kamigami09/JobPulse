"""
Generate a bcrypt hash for AUTH_PASSWORD_HASH in backend/.env.

Usage:
    python scripts/hash_password.py
    # then enter the password when prompted (input is hidden)

Or pipe a password in (less secure, leaves it in shell history):
    echo "mypassword" | python scripts/hash_password.py
"""

import getpass
import sys
from pathlib import Path

# Allow running this script directly from backend/ without setting PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.utils.auth import hash_password  # noqa: E402


def main() -> int:
    if not sys.stdin.isatty():
        password = sys.stdin.readline().rstrip("\n")
    else:
        password = getpass.getpass("Password: ")
        confirm = getpass.getpass("Confirm:  ")
        if password != confirm:
            print("Passwords do not match.", file=sys.stderr)
            return 1

    if len(password) < 8:
        print("Password must be at least 8 characters.", file=sys.stderr)
        return 1

    print()
    print("Add this line to backend/.env (single quotes are important):")
    print()
    print(f"AUTH_PASSWORD_HASH='{hash_password(password)}'")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
