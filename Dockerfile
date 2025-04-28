# 1) Base image with Python 3.9
FROM python:3.9-slim

# 2) Install LibreOffice (needed by docx2pdf on Linux)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libreoffice-writer \
      libreoffice-core \
      libglib2.0-0 \
      libsm6 \
      libxext6 \
      libxrender1 && \
    rm -rf /var/lib/apt/lists/*

# 3) Set working directory
WORKDIR /app

# 4) Copy & install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5) Copy the rest of your application code
COPY . .

# 6) Expose the port your Flask app listens on
EXPOSE 5000

# 7) Start the app with Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2"]
