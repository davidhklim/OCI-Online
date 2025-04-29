document.addEventListener('DOMContentLoaded', () => {
  let tplPath      = null,
      rawFirms     = [],
      firms        = [],        // will hold firms + originalIndex
      selectedSet  = new Set(); // track selected original indices

  const statusBar    = document.getElementById('status-bar');
  const statusText   = document.getElementById('status-text');
  const uploadForm   = document.getElementById('upload-form');
  const generateBtn  = document.getElementById('generate-button');
  const uploadStatus = document.getElementById('upload-status');
  const searchInput  = document.getElementById('firm-search');
  const countSpan    = document.getElementById('selected-count');

  const vanList      = document.getElementById('firm-list-vancouver');
  const torList      = document.getElementById('firm-list-toronto');
  const nyList       = document.getElementById('firm-list-newyork');

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

  // update the counter
  function updateCount() {
    countSpan.textContent = selectedSet.size;
  }

  // listen for any checkbox change in the three lists
  function handleCheckChange(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      const idx = parseInt(e.target.value, 10);
      if (e.target.checked) selectedSet.add(idx);
      else selectedSet.delete(idx);
      updateCount();
    }
  }
  vanList.addEventListener('change', handleCheckChange);
  torList.addEventListener('change', handleCheckChange);
  nyList.addEventListener('change', handleCheckChange);

  // render whichever array of firms is passed in
  function renderLists(data) {
    [vanList, torList, nyList].forEach(ul => ul.innerHTML = '');

    data.forEach(f => {
      const li  = document.createElement('li');
      const lbl = document.createElement('label');
      const cb  = document.createElement('input');
      cb.type  = 'checkbox';
      cb.value = f.originalIndex;
      if (selectedSet.has(f.originalIndex)) cb.checked = true;

      lbl.className = 'firm-label';
      lbl.append(cb, ` ${f.Firm}`);
      li.append(lbl);

      const city = f.City.toLowerCase();
      if (city.startsWith('vancouver'))       vanList.append(li);
      else if (city.startsWith('toronto'))    torList.append(li);
      else if (city.includes('new york'))     nyList.append(li);
    });

    // refresh the counter in case checkboxes were re-rendered
    updateCount();
  }

  // fetch from back-end, tag each firm with its original index
  async function fetchFirms() {
    const resp = await fetch('/firms');
    rawFirms = await resp.json();
    firms = rawFirms.map((f, i) => ({ ...f, originalIndex: i }));
    renderLists(firms);
  }

  // filter on search input
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      renderLists(firms);
    } else {
      const filtered = firms.filter(f =>
        f.Firm.toLowerCase().includes(q)
      );
      renderLists(filtered);
    }
  });

  // Upload form and generate button handlers remain unchanged
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
    const selectedFirms = Array.from(selectedSet).map(idx => rawFirms[idx]);
    if (!selectedFirms.length) {
      return alert('Select at least one firm.');
    }

    showStatus('Starting…', true);
    const payload = JSON.stringify({ template_path: tplPath, selected_firms: selectedFirms });
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
