document.addEventListener('DOMContentLoaded', () => {
  let tplPath = null, firms = [], previewUrl = '';

  const statusBar    = document.getElementById('status-bar');
  const statusText   = document.getElementById('status-text');
  const uploadForm   = document.getElementById('upload-form');
  const previewBtn   = document.getElementById('preview-button');
  const generateBtn  = document.getElementById('generate-button');
  const uploadStatus = document.getElementById('upload-status');
  const vanList      = document.getElementById('firm-list-vancouver');
  const torList      = document.getElementById('firm-list-toronto');

  const modal    = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('modal-close');
  const exitBtn  = document.getElementById('modal-exit');
  const iframe   = document.getElementById('modal-iframe');

  function showStatus(txt, indet = true, pct = null) {
    statusText.textContent = txt;
    statusBar.style.display = 'block';
    if (indet) statusBar.removeAttribute('value');
    else if (pct !== null) statusBar.value = pct;
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
      const li = document.createElement('li');
      const label = document.createElement('label');
      label.className = 'firm-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.value = i;
      label.append(cb, document.createTextNode(` ${f.Firm}`));
      li.append(label);
      if (f.City.toLowerCase().startsWith('vancouver')) {
        vanList.append(li);
      } else {
        torList.append(li);
      }
    });
  }

  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    showStatus('Uploading template…');
    previewBtn.disabled = generateBtn.disabled = true;
    const fd = new FormData();
    fd.append('template', document.getElementById('template').files[0]);
    try {
      const resp = await fetch('/upload-template', { method: 'POST', body: fd });
      if (!resp.ok) throw new Error('Upload failed');
      tplPath = (await resp.json()).template_path;
      uploadStatus.textContent = 'Template uploaded!';
      previewBtn.disabled = generateBtn.disabled = false;
    } catch {
      uploadStatus.textContent = 'Upload error';
    } finally {
      hideStatus();
    }
  });

  previewBtn.addEventListener('click', async () => {
    if (!tplPath) return alert('Please upload a template first.');
    const checked = Array.from(document.querySelectorAll(
      '#firm-list-vancouver input:checked, #firm-list-toronto input:checked'
    ));
    if (!checked.length) return alert('Please select at least one firm.');
    const sel = checked.map(cb => firms[+cb.value]);

    showStatus('Generating preview…');
    const resp = await fetch('/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_path: tplPath, selected_firms: sel })
    });
    hideStatus();
    if (!resp.ok) return alert('Preview failed.');
    const { url } = await resp.json();
    iframe.src = url;
    modal.classList.remove('hidden');
  });

  closeBtn.onclick = () => modal.classList.add('hidden');
  exitBtn.onclick  = () => modal.classList.add('hidden');

  generateBtn.addEventListener('click', () => {
    if (!tplPath) return alert('Please upload a template first.');
    const checked = Array.from(document.querySelectorAll(
      '#firm-list-vancouver input:checked, #firm-list-toronto input:checked'
    ));
    if (!checked.length) return alert('Please select at least one firm.');
    const sel = checked.map(cb => firms[+cb.value]);

    statusBar.style.display = 'block';
    statusBar.removeAttribute('value');
    statusText.textContent = 'Starting generation…';

    const payload = JSON.stringify({
      template_path: tplPath,
      selected_firms: sel
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/generate');
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 50);
        showStatus(`Uploading data… ${pct}%`, false, pct);
      }
    };

    xhr.onloadstart = () => {
      statusText.textContent = 'Merging on server…';
      statusBar.removeAttribute('value');
    };

    xhr.onprogress = e => {
      if (e.lengthComputable) {
        const downloadPct = Math.round((e.loaded / e.total) * 50) + 50;
        showStatus(`Downloading ZIP… ${downloadPct}%`, false, downloadPct);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = 'cover_letters.zip';
        document.body.append(link);
        link.click();
        link.remove();
        showStatus('Done! Download starting…', false, 100);
      } else {
        statusText.textContent = `Error: ${xhr.status}`;
      }
      setTimeout(hideStatus, 1500);
    };

    xhr.onerror = () => {
      statusText.textContent = 'Network error during generation.';
      setTimeout(hideStatus, 2000);
    };

    xhr.send(payload);
  });

  fetchFirms();
});
