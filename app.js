(function () {
  const DEFAULT_TEXT = `AUDITER L'OPACITÉ — Anatomie d'une crise qu'on ne veut pas voir.
Bluetouff.

Préface.
Ce livre n'aurait pas existé sans La Crise de Valeur(s) de Phil Roux. Pas comme un hommage de circonstance, mais comme une dette intellectuelle précise. Quand Phil a publié son texte, il a posé la question que personne d'autre ne posait : qu'est-ce que ça vaut, cette économie qu'on regarde tourner, quand ce qu'on appelle la valeur ne correspond plus à ce qu'on appelle le vrai ?

Ce livre ne prédit pas la prochaine crise financière. Il décrit une plomberie financière contemporaine, ses canalisations principales, ses joints fragiles, ses zones d'opacité, ses interconnexions invisibles. Il s'adresse au citoyen lucide : celui qui sent que quelque chose ne va pas, qui n'a ni le temps ni les outils techniques pour le formuler précisément, mais qui veut comprendre.

Prologue. Quand j'ai compris que tout était relié.
Ce livre est un audit. On va ouvrir les capots qu'on nous dit de ne pas ouvrir. On va lire le code qu'on nous dit qu'on ne saurait pas comprendre. On va cartographier les passerelles qu'on nous jure inexistantes. Et on va le faire avec une grammaire de hacker : une surface d'attaque, ça se cartographie ; un mécanisme d'opacité, ça se documente ; un système, ça s'audite.`;

  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    app: qs('#app'),
    word: qs('#word'),
    ghostLeft: qs('#ghostLeft'),
    ghostRight: qs('#ghostRight'),
    context: qs('#contextLine'),
    play: qs('#playToggle'),
    restart: qs('#restartButton'),
    back: qs('#backButton'),
    forward: qs('#forwardButton'),
    fullscreen: qs('#fullscreenButton'),
    theme: qs('#themeSelect'),
    wpm: qs('#wpmRange'),
    wpmValue: qs('#wpmValue'),
    chunk: qs('#chunkRange'),
    chunkValue: qs('#chunkValue'),
    font: qs('#fontRange'),
    fontValue: qs('#fontValue'),
    pause: qs('#pauseRange'),
    pauseValue: qs('#pauseValue'),
    progress: qs('#progressRange'),
    progressLabel: qs('#progressLabel'),
    wordsRead: qs('#wordsRead'),
    wordsTotal: qs('#wordsTotal'),
    remaining: qs('#remainingTime'),
    sourceName: qs('#sourceName'),
    paste: qs('#pasteArea'),
    loadPaste: qs('#loadPasteButton'),
    loadSample: qs('#loadSampleButton'),
    file: qs('#fileInput'),
    drop: qs('#dropZone'),
    status: qs('#status'),
    chapters: qs('#chapters'),
    focusAura: qs('#focusAura'),
  };

  const state = {
    rawText: '',
    sourceLabel: 'Extrait intégré — Auditer l’Opacité',
    tokens: [],
    index: 0,
    timer: null,
    playing: false,
    wpm: 360,
    chunkSize: 1,
    fontSize: 104,
    pausePower: 1.35,
    theme: 'deep',
    storageKey: '',
    lastRenderAt: 0,
  };

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

  function tokenize(text) {
    const prepared = cleanText(text)
      .replace(/\n\s*\n/g, ' ¶ ')
      .replace(/\n/g, ' ');
    return (prepared.match(/\S+/g) || [])
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += Math.max(1, Math.floor(text.length / 6000))) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= text.length;
    return `focusword:${(hash >>> 0).toString(36)}:${text.length}`;
  }

  function saveProgress() {
    if (!state.storageKey) return;
    const payload = {
      index: state.index,
      wpm: state.wpm,
      chunkSize: state.chunkSize,
      fontSize: state.fontSize,
      pausePower: state.pausePower,
      theme: state.theme,
      sourceLabel: state.sourceLabel,
      savedAt: Date.now(),
    };
    localStorage.setItem(state.storageKey, JSON.stringify(payload));
  }

  function restoreProgress() {
    if (!state.storageKey) return;
    const saved = localStorage.getItem(state.storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      state.index = Math.min(Math.max(0, Number(data.index) || 0), Math.max(0, state.tokens.length - 1));
      state.wpm = Number(data.wpm) || state.wpm;
      state.chunkSize = Number(data.chunkSize) || state.chunkSize;
      state.fontSize = Number(data.fontSize) || state.fontSize;
      state.pausePower = Number(data.pausePower) || state.pausePower;
      state.theme = data.theme || state.theme;
    } catch (error) {
      console.warn('Progression locale illisible', error);
    }
  }

  function visibleTokenAround(start, direction) {
    let cursor = start;
    while (cursor >= 0 && cursor < state.tokens.length) {
      const token = state.tokens[cursor];
      if (token !== '¶') return token;
      cursor += direction;
    }
    return '';
  }

  function currentChunk() {
    const result = [];
    let cursor = state.index;
    while (cursor < state.tokens.length && result.length < state.chunkSize) {
      const token = state.tokens[cursor];
      if (token !== '¶') result.push(token);
      cursor += 1;
    }
    return result.length ? result : [''];
  }

  function orpIndexFor(cleanWord) {
    const len = cleanWord.length;
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return 4;
  }

  function renderOrpWord(word) {
    const text = String(word || '');
    const match = text.match(/^([^\p{L}\p{N}]*)?([\p{L}\p{N}][\p{L}\p{N}'’\-‑]*)?([^\p{L}\p{N}]*)?$/u);
    if (!match || !match[2]) return `<span class="unit">${escapeHtml(text)}</span>`;
    const prefix = match[1] || '';
    const clean = match[2] || '';
    const suffix = match[3] || '';
    const pivot = Math.min(orpIndexFor(clean), clean.length - 1);
    return `<span class="unit"><span class="lead">${escapeHtml(prefix + clean.slice(0, pivot))}</span><span class="pivot">${escapeHtml(clean[pivot])}</span><span class="tail">${escapeHtml(clean.slice(pivot + 1) + suffix)}</span></span>`;
  }

  function punctuationMultiplier(chunk) {
    const joined = chunk.join(' ');
    const last = joined.trim();
    let multiplier = 1;
    if (/¶$/.test(last)) multiplier += state.pausePower * 1.4;
    if (/[.!?…]$/.test(last)) multiplier += state.pausePower;
    else if (/[;:]$/.test(last)) multiplier += state.pausePower * 0.65;
    else if (/[,)]$/.test(last)) multiplier += state.pausePower * 0.42;
    const letters = last.replace(/[^\p{L}\p{N}]/gu, '').length;
    if (letters >= 13) multiplier += 0.35;
    if (letters >= 18) multiplier += 0.3;
    return multiplier;
  }

  function nextDelay(chunk) {
    const wordsPerTick = Math.max(1, chunk.filter((w) => w !== '¶').length);
    const base = (60000 / Math.max(80, state.wpm)) * wordsPerTick;
    return Math.max(80, Math.round(base * punctuationMultiplier(chunk)));
  }

  function formatTime(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
    if (minutes < 1) return `${Math.ceil(minutes * 60)} s`;
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return secs ? `${mins} min ${secs}s` : `${mins} min`;
  }

  function render() {
    if (!state.tokens.length) return;
    const chunk = currentChunk();
    els.word.innerHTML = chunk.map(renderOrpWord).join('<span class="space"> </span>');
    els.word.style.setProperty('--reader-font-size', `${state.fontSize}px`);

    const prev = visibleTokenAround(state.index - 1, -1);
    const next = visibleTokenAround(state.index + Math.max(1, state.chunkSize), 1);
    els.ghostLeft.textContent = prev && prev !== '¶' ? prev : '';
    els.ghostRight.textContent = next && next !== '¶' ? next : '';

    const contextStart = Math.max(0, state.index - 7);
    const contextEnd = Math.min(state.tokens.length, state.index + 9);
    els.context.innerHTML = state.tokens.slice(contextStart, contextEnd)
      .filter((t) => t !== '¶')
      .map((t, offset) => {
        const absoluteGuess = contextStart + offset;
        const active = absoluteGuess >= state.index && absoluteGuess < state.index + state.chunkSize;
        return `<span class="${active ? 'active' : ''}">${escapeHtml(t)}</span>`;
      })
      .join(' ');

    els.progress.max = Math.max(1, state.tokens.length - 1);
    els.progress.value = state.index;
    const percent = Math.round((state.index / Math.max(1, state.tokens.length - 1)) * 100);
    els.progressLabel.textContent = `${percent}%`;
    els.wordsRead.textContent = String(Math.min(state.index, state.tokens.length));
    els.wordsTotal.textContent = String(state.tokens.length);
    const remainingWords = Math.max(0, state.tokens.length - state.index);
    els.remaining.textContent = formatTime(remainingWords / Math.max(1, state.wpm));
    els.sourceName.textContent = state.sourceLabel;
    els.play.textContent = state.playing ? 'Pause' : 'Lecture';
    els.play.setAttribute('aria-pressed', String(state.playing));
    document.body.dataset.theme = state.theme;

    els.wpm.value = state.wpm;
    els.wpmValue.textContent = `${state.wpm} m/min`;
    els.chunk.value = state.chunkSize;
    els.chunkValue.textContent = `${state.chunkSize} mot${state.chunkSize > 1 ? 's' : ''}`;
    els.font.value = state.fontSize;
    els.fontValue.textContent = `${state.fontSize}px`;
    els.pause.value = Math.round(state.pausePower * 100);
    els.pauseValue.textContent = `${Math.round(state.pausePower * 100)}%`;
    els.theme.value = state.theme;

    const pulse = Math.min(1, Math.max(0.15, state.wpm / 750));
    els.focusAura.style.setProperty('--pulse-speed', `${1.9 - pulse}s`);
  }

  function moveTo(index, shouldSave = true) {
    state.index = Math.min(Math.max(0, index), Math.max(0, state.tokens.length - 1));
    render();
    if (shouldSave) saveProgress();
  }

  function advanceCursor() {
    let cursor = state.index;
    let moved = 0;
    while (cursor < state.tokens.length && moved < state.chunkSize) {
      if (state.tokens[cursor] !== '¶') moved += 1;
      cursor += 1;
    }
    while (state.tokens[cursor] === '¶') cursor += 1;
    return cursor;
  }

  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    state.timer = null;
    render();
    saveProgress();
  }

  function scheduleNext(chunk) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      const next = advanceCursor();
      if (next >= state.tokens.length) {
        stop();
        moveTo(state.tokens.length - 1);
        setStatus('Lecture terminée. Reviens au début ou charge un nouveau texte.');
        return;
      }
      state.index = next;
      tick();
    }, nextDelay(chunk));
  }

  function tick() {
    if (!state.playing) return;
    const chunk = currentChunk();
    render();
    saveProgress();
    scheduleNext(chunk);
  }

  function play() {
    if (!state.tokens.length) return;
    state.playing = true;
    setStatus('Lecture en cours. Espace pour pause. Flèches pour naviguer.');
    tick();
  }

  function togglePlay() {
    state.playing ? stop() : play();
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function buildChapters(text) {
    const lines = cleanText(text).split('\n');
    const chapters = [];
    let runningIndex = 0;
    const titlePattern = /^(préface|prologue|épilogue|conclusion|sources|lexique|partie\s+\d+|chapitre\s+\d+|avertissement|liminaire|ouverture)\b/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        runningIndex += 1;
        continue;
      }
      if (titlePattern.test(line) || (line.length < 90 && line === line.toUpperCase() && /[A-ZÀ-Ý]/.test(line))) {
        chapters.push({ label: line, index: Math.max(0, runningIndex) });
      }
      runningIndex += tokenize(line).filter((t) => t !== '¶').length;
    }
    renderChapters(chapters.slice(0, 36));
  }

  function renderChapters(chapters) {
    els.chapters.innerHTML = '';
    if (!chapters.length) {
      els.chapters.innerHTML = '<p class="empty">Les sections détectées apparaîtront ici après import.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    chapters.forEach((chapter) => {
      const button = document.createElement('button');
      button.className = 'chapter-button';
      button.type = 'button';
      button.textContent = chapter.label;
      button.addEventListener('click', () => {
        stop();
        moveTo(chapter.index);
        setStatus(`Positionné sur : ${chapter.label}`);
      });
      fragment.appendChild(button);
    });
    els.chapters.appendChild(fragment);
  }

  function loadText(text, label = 'Texte importé') {
    const cleaned = cleanText(text);
    if (cleaned.length < 10) {
      setStatus('Texte trop court ou illisible.');
      return;
    }
    stop();
    state.rawText = cleaned;
    state.sourceLabel = label;
    state.tokens = tokenize(cleaned);
    state.storageKey = hashText(cleaned);
    state.index = 0;
    restoreProgress();
    buildChapters(cleaned);
    render();
    setStatus(`${state.tokens.length.toLocaleString('fr-FR')} mots chargés. Prêt pour lecture mot par mot.`);
  }

  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function extractPdfText(file) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js n’est pas encore chargé. Réessaie dans quelques secondes.');
    }
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      setStatus(`Extraction PDF : page ${pageNumber}/${pdf.numPages}…`);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      const pageText = content.items.map((item) => item.str).join(' ');
      pages.push(pageText);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return pages.join('\n\n');
  }

  async function handleFile(file) {
    if (!file) return;
    stop();
    setStatus(`Chargement de ${file.name}…`);
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const text = isPdf ? await extractPdfText(file) : await readFileAsText(file);
      loadText(text, file.name);
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Impossible de charger ce fichier.');
    }
  }

  function bindEvents() {
    els.play.addEventListener('click', togglePlay);
    els.restart.addEventListener('click', () => {
      stop();
      moveTo(0);
      setStatus('Retour au début.');
    });
    els.back.addEventListener('click', () => {
      stop();
      moveTo(state.index - 30);
      setStatus('Recul de 30 mots.');
    });
    els.forward.addEventListener('click', () => {
      stop();
      moveTo(state.index + 30);
      setStatus('Avance de 30 mots.');
    });
    els.fullscreen.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (error) {
        setStatus('Le plein écran n’a pas pu être activé sur ce navigateur.');
      }
    });
    els.wpm.addEventListener('input', (event) => {
      state.wpm = Number(event.target.value);
      render();
      saveProgress();
      if (state.playing) tick();
    });
    els.chunk.addEventListener('input', (event) => {
      state.chunkSize = Number(event.target.value);
      render();
      saveProgress();
    });
    els.font.addEventListener('input', (event) => {
      state.fontSize = Number(event.target.value);
      render();
      saveProgress();
    });
    els.pause.addEventListener('input', (event) => {
      state.pausePower = Number(event.target.value) / 100;
      render();
      saveProgress();
    });
    els.theme.addEventListener('change', (event) => {
      state.theme = event.target.value;
      render();
      saveProgress();
    });
    els.progress.addEventListener('input', (event) => {
      stop();
      moveTo(Number(event.target.value));
      setStatus('Position ajustée.');
    });
    els.loadPaste.addEventListener('click', () => loadText(els.paste.value, 'Texte collé'));
    els.loadSample.addEventListener('click', () => loadText(DEFAULT_TEXT, 'Extrait intégré — Auditer l’Opacité'));
    els.file.addEventListener('change', (event) => handleFile(event.target.files[0]));

    ['dragenter', 'dragover'].forEach((type) => {
      els.drop.addEventListener(type, (event) => {
        event.preventDefault();
        els.drop.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach((type) => {
      els.drop.addEventListener(type, (event) => {
        event.preventDefault();
        els.drop.classList.remove('is-dragging');
      });
    });
    els.drop.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));

    document.addEventListener('keydown', (event) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stop();
        moveTo(state.index - 10);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stop();
        moveTo(state.index + 10);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        state.wpm = Math.min(900, state.wpm + 20);
        render();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        state.wpm = Math.max(120, state.wpm - 20);
        render();
      } else if (event.key.toLowerCase() === 'f') {
        els.fullscreen.click();
      } else if (event.key.toLowerCase() === 'r') {
        stop();
        moveTo(0);
      } else if (event.key.toLowerCase() === 't') {
        const themes = ['deep', 'paper', 'contrast'];
        state.theme = themes[(themes.indexOf(state.theme) + 1) % themes.length];
        render();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
  }

  function init() {
    bindEvents();
    loadText(DEFAULT_TEXT, 'Extrait intégré — Auditer l’Opacité');
    setStatus('Charge un PDF, colle un texte, ou lance l’extrait intégré.');
  }

  init();
})();
