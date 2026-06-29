(function () {
  const DB_NAME = 'focusword-reader';
  const DB_VERSION = 1;
  const STORE_NAME = 'documents';
  const LAST_DOCUMENT_ID = 'last-document';
  const FALLBACK_KEY = 'focusword:last-document:v2';

  const $ = (selector) => document.querySelector(selector);
  let restoring = false;
  let sourceLabelObserver = null;

  function setStatus(message) {
    const status = $('#status');
    if (status) status.textContent = message;
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/\u0000/g, ' ')
      .replace(/\uFFFE|\uFFFF|￾/g, '')
      .replace(/\r/g, '\n')
      .replace(/([a-zà-ÿ])\-\n([a-zà-ÿ])/gi, '$1$2')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function wordCount(text) {
    return (cleanText(text).replace(/\n\s*\n/g, ' ').match(/\S+/g) || []).length;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB indisponible'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Ouverture IndexedDB impossible'));
    });
  }

  async function dbPut(key, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Écriture IndexedDB impossible'));
    }).finally(() => db.close());
  }

  async function dbGet(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Lecture IndexedDB impossible'));
      tx.onerror = () => reject(tx.error || new Error('Transaction IndexedDB impossible'));
    }).finally(() => db.close());
  }

  async function saveDocument(text, label) {
    const cleaned = cleanText(text);
    if (cleaned.length < 10) return false;

    const payload = {
      text: cleaned,
      label: label || 'Document importé',
      savedAt: Date.now(),
      wordCount: wordCount(cleaned),
      version: 2,
    };

    try {
      await dbPut(LAST_DOCUMENT_ID, payload);
      try {
        localStorage.setItem(FALLBACK_KEY, JSON.stringify({ ...payload, text: cleaned.slice(0, 900000) }));
      } catch (error) {
        // IndexedDB is the real storage; localStorage is only a degraded fallback.
      }
      return true;
    } catch (error) {
      try {
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload));
        return true;
      } catch (fallbackError) {
        console.warn('FocusWord persistence failed', error, fallbackError);
        return false;
      }
    }
  }

  async function loadSavedDocument() {
    try {
      const fromDb = await dbGet(LAST_DOCUMENT_ID);
      if (fromDb && fromDb.text) return fromDb;
    } catch (error) {
      console.warn('FocusWord IndexedDB restore failed, trying localStorage', error);
    }

    try {
      const fallback = JSON.parse(localStorage.getItem(FALLBACK_KEY) || 'null');
      if (fallback && fallback.text) return fallback;
    } catch (error) {
      console.warn('FocusWord localStorage restore failed', error);
    }
    return null;
  }

  function pinSourceLabel(label) {
    const sourceName = $('#sourceName');
    if (!sourceName || !label) return;
    if (sourceLabelObserver) sourceLabelObserver.disconnect();

    const apply = () => {
      if (sourceName.textContent === 'Texte collé') sourceName.textContent = label;
    };
    apply();
    sourceLabelObserver = new MutationObserver(apply);
    sourceLabelObserver.observe(sourceName, { childList: true, characterData: true, subtree: true });
  }

  async function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function extractPdfText(file) {
    if (!window.pdfjsLib) throw new Error('PDF.js indisponible');
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      pages.push(content.items.map((item) => item.str).join(' '));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return pages.join('\n\n');
  }

  function bindClickToToggle() {
    const stage = $('.stage');
    const playToggle = $('#playToggle');
    if (!stage || !playToggle) return;

    stage.style.cursor = 'pointer';
    stage.addEventListener('click', () => playToggle.click());
  }

  function bindDocumentPersistence() {
    const pasteArea = $('#pasteArea');
    const loadPasteButton = $('#loadPasteButton');
    const fileInput = $('#fileInput');

    if (loadPasteButton && pasteArea) {
      loadPasteButton.addEventListener('click', async () => {
        if (restoring) return;
        const saved = await saveDocument(pasteArea.value, 'Texte collé');
        if (saved) setStatus('Texte chargé et sauvegardé dans ce navigateur. Il reviendra après rafraîchissement.');
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const text = isPdf ? await extractPdfText(file) : await readTextFile(file);
          const saved = await saveDocument(text, file.name);
          if (saved) setStatus(`Document importé et sauvegardé localement : ${file.name}. Il reviendra après rafraîchissement.`);
        } catch (error) {
          console.warn('FocusWord could not persist the imported file', error);
        }
      });
    }
  }

  async function restoreLastDocument() {
    const pasteArea = $('#pasteArea');
    const loadPasteButton = $('#loadPasteButton');
    if (!pasteArea || !loadPasteButton) return;

    const saved = await loadSavedDocument();
    if (!saved || !saved.text || cleanText(saved.text).length < 10) return;

    restoring = true;
    pasteArea.value = saved.text;
    loadPasteButton.click();
    pinSourceLabel(saved.label);
    setTimeout(() => {
      restoring = false;
      setStatus(`Document restauré depuis ce navigateur : ${saved.label || 'document sauvegardé'}. Clique sur l’affichage pour reprendre.`);
    }, 0);
  }

  bindClickToToggle();
  bindDocumentPersistence();
  restoreLastDocument();
})();
