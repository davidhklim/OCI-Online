# OCI Online – Cover Letter Generator

A Flask web application to automate personalized cover-letter generation. Upload a Word template, select target firms, and download a ZIP of `.docx` files.

**Live demo:** https://oci-online.onrender.com/

---

## Features

- Merge Word templates (`.docx`) with firm-specific data  
- Generate multiple cover letters in batch as a ZIP archive  
- REST API endpoints for:
  - Retrieving firm data (`GET /firms`)
  - Uploading template (`POST /upload-template`)
  - Generating letters (`POST /generate`)
- Replaceable mock data in `app.py` with Google Sheets, database, CSV or Excel  

---

## Prerequisites

- Python 3.8 or later  
- pipenv or pip  
- (Optional) Microsoft Word for PDF conversion via `docx2pdf`  

---

## Usage

1. **Prepare your template**  
   - Download and open the cover-letter template.  
   - Retain placeholders in `«FieldName»` format:
     - `«Firm»` – full firm name  
     - `«Short_Name»` – abbreviated firm name  
     - `«Salutations»` – honourific (e.g. “Ms.”)  
     - `«Contact»` – hiring manager’s name  
     - `«Title»` – hiring manager’s title  
     - `«Street»` – street address  
     - `«City»` – city, province, postal code  

2. **Upload template**  
   - Click **Upload Template** on the landing page.  
   - Select your `.docx` template file.  

3. **Select firms**  
   - After upload succeeds, choose one or more firms from the list.  

4. **Generate cover letters**  
   - Click **Generate**.  
   - Download `cover_letters.zip`, containing files named:
     ```
     [TemplateName] (Short_Name).docx
     ```
     e.g. `ElleWoods_CoverLetter (BLG).docx`  

5. **Optional: OCI Tracker**  
   - Use the OCI Tracker to organise your applications.  
   - Copy it to your own drive for personal tracking.  

---

## Installation

```bash
git clone https://github.com/your-username/OCIOnline.git
cd OCIOnline
pipenv install           # or python -m venv .venv && pip install -r requirements.txt
export FLASK_APP=app.py  # macOS/Linux
set FLASK_APP=app.py     # Windows PowerShell
flask run
