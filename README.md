# OCI Online – Cover Letter Generator

A Flask-based web application that automates the creation of personalized cover letters using firm-specific data. Upload your Word template, select the firms you’d like to apply to, and download a ZIP of ready-to-send `.docx` files.

**Live demo:** https://oci-online.onrender.com/

---

## Features

- Automated merge of Word templates (`.docx`) with firm data  
- Batch generation of cover letters packaged as a ZIP archive  
- REST API endpoints for firm data, template upload, and letter generation  
- Mock data included in `app.py` (easily replaceable with Google Sheets or your own data source)  

---

## Prerequisites

- Python 3.8+  
- [pipenv](https://pipenv.pypa.io/) or `pip`  
- (Optional) Microsoft Word for `docx2pdf` PDF conversion  

---

## Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-username/OCIOnline.git
   cd OCIOnline
