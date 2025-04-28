document.addEventListener('DOMContentLoaded', () => {
  let tplPath = null,
      firms   = [];

  const statusBar    = document.getElementById('status-bar');
  const statusText   = document.getElementById('status-text');
  const uploadForm   = document.getElementById('upload-form');
  const generateBtn  = document.getElementById('generate-button');
  const uploadStatus = document.getElementById('upload-status');
  const vanList      = document.getElementById('firm-list-vancouver');
  const torList      = document.getElementById('firm-list-toronto');

  function showStatus(txt, indet = true, pct = null) {
    statusText.textContent = txt;
    statusBar.style.display = 'block';
    if (indet) {
      statusBar.removeAttribute('value');
    } else if (pct !== null) {
      statusBar.value = pct;
    }
  }

  function hideStatus() {
    statusBar.style.display = 'none';
    statusText.textContent = '';
  }

  async function fetchFirms() {
    const resp = await fetch('/firms');
    firms = await resp.json();
    vanList.innerHTML = '';
    torList.innerHTML = '';
    firms.forEach((f, i) => {
      const li  = document.createElement('li');
      const lbl = document.createElement('label');
      const cb  = document.createElement('input');
      cb.type  = 'checkbox';
      cb.value = i;
      lbl.className = 'firm-label';
      lbl.append(cb, ` ${f.Firm}`);
      li.append(lbl);
      f.City.toLowerCase().startsWith('vancouver')
        ? vanList.append(li)
        : torList.append(li);
    });
  }

  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    showStatus('Uploading template…');
    const fd = new FormData();
    const fileInput = document.getElementById('template');
    if (!fileInput.files.length) {
      uploadStatus.textContent = 'No file selected';
      hideStatus();
      return;
    }
    fd.append('template', fileInput.files[0]);

    try {
      const resp = await fetch('/upload-template', { method: 'POST', body: fd });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const { template_path } = await resp.json();
      tplPath = template_path;
      uploadStatus.textContent = 'Template uploaded!';
      generateBtn.disabled = false;
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = 'Upload error';
    } finally {
      hideStatus();
    }
  });

  generateBtn.addEventListener('click', () => {
    if (!tplPath) {
      return alert('Please upload a template first.');
    }
    const checked = Array.from(document.querySelectorAll(
      '#firm-list-vancouver input:checked, #firm-list-toronto input:checked'
    ));
    if (!checked.length) {
      return alert('Select at least one firm.');
    }
    const sel = checked.map(cb => firms[+cb.value]);

    showStatus('Starting…', true);
    const payload = JSON.stringify({ template_path: tplPath, selected_firms: sel });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/generate');
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const p = Math.round(e.loaded / e.total * 50);
        showStatus(`Uploading… ${p}%`, false, p);
      }
    };
    xhr.onloadstart = () => {
      statusText.textContent = 'Merging…';
      statusBar.removeAttribute('value');
    };
    xhr.onprogress = e => {
      if (e.lengthComputable) {
        const p = Math.round(e.loaded / e.total * 50) + 50;
        showStatus(`Downloading… ${p}%`, false, p);
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'cover_letters.zip';
        document.body.append(a);
        a.click();
        a.remove();
        showStatus('Done! Downloading…', false, 100);
      } else {
        statusText.textContent = `Error ${xhr.status}`;
      }
      setTimeout(hideStatus, 1500);
    };
    xhr.onerror = () => {
      statusText.textContent = 'Network error.';
      setTimeout(hideStatus, 2000);
    };

    xhr.send(payload);
  });

  fetchFirms();
});
