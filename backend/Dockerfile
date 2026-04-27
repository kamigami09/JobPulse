FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

# Use gunicorn for stability, with reload for dev
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--reload", "--workers", "2", "run:app"]
