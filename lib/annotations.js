/**
 * Fetchr Pitch Deck — Annotation System
 * Adds persistent annotation/comment layer to any deck.
 * Requires: supabase-js CDN + supabase-config.js loaded before this file.
 */
(function () {
  'use strict';

  // ── Deck ID from <html data-deck-id="..."> or folder name ──
  const deckId = document.documentElement.dataset.deckId ||
    window.location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || 'unknown';

  // ── State ──
  let annotations = [];
  let annotationMode = false;
  let currentSlide = 0;
  let panelOpen = false;
  let pendingClick = null; // { xPct, yPct } waiting for form submission

  // ── Detect current slide number ──
  function getCurrentSlide() {
    const active = document.querySelector('.slide.active');
    if (active && active.dataset.slide !== undefined) {
      return parseInt(active.dataset.slide, 10);
    }
    return 0;
  }

  // ── Watch for slide changes ──
  function watchSlideChanges() {
    // Poll for slide changes (works with any navigation system)
    setInterval(function () {
      const s = getCurrentSlide();
      if (s !== currentSlide) {
        currentSlide = s;
        renderPins();
        renderPanel();
      }
    }, 200);
  }

  // ══════════════════════════════════════════════
  //  SUPABASE CRUD
  // ══════════════════════════════════════════════

  async function fetchAnnotations() {
    const { data, error } = await _supabase
      .from('annotations')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Annotations] Fetch error:', error);
      return;
    }
    annotations = data || [];
    renderPins();
    renderPanel();
    updateBadge();
  }

  async function createAnnotation(ann) {
    const { data, error } = await _supabase
      .from('annotations')
      .insert([ann])
      .select()
      .single();

    if (error) {
      console.error('[Annotations] Create error:', error);
      return null;
    }
    annotations.push(data);
    renderPins();
    renderPanel();
    updateBadge();
    return data;
  }

  async function resolveAnnotation(id) {
    const ann = annotations.find(a => a.id === id);
    if (!ann) return;
    const newResolved = !ann.resolved;

    const { error } = await _supabase
      .from('annotations')
      .update({ resolved: newResolved })
      .eq('id', id);

    if (error) {
      console.error('[Annotations] Resolve error:', error);
      return;
    }
    ann.resolved = newResolved;
    renderPins();
    renderPanel();
  }

  async function deleteAnnotation(id) {
    const { error } = await _supabase
      .from('annotations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Annotations] Delete error:', error);
      return;
    }
    annotations = annotations.filter(a => a.id !== id);
    renderPins();
    renderPanel();
    updateBadge();
  }

  // ══════════════════════════════════════════════
  //  BUILD UI
  // ══════════════════════════════════════════════

  function buildUI() {
    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'ann-toggle';
    toggle.id = 'annToggle';
    toggle.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="ann-badge" id="annBadge"></span>
    `;
    document.body.appendChild(toggle);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'ann-panel';
    panel.id = 'annPanel';
    panel.innerHTML = `
      <div class="ann-panel-header">
        <span class="ann-panel-title">Annotations</span>
        <button class="ann-panel-close" id="annPanelClose">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="ann-slide-tabs" id="annSlideTabs"></div>
      <div class="ann-list" id="annList"></div>
      <div class="ann-form" id="annForm">
        <div class="ann-form-header">
          <span class="ann-form-label">New annotation</span>
          <span class="ann-form-pos" id="annFormPos"></span>
        </div>
        <input class="ann-form-author" id="annAuthor" type="text" placeholder="Your name" maxlength="50">
        <textarea class="ann-form-textarea" id="annContent" placeholder="Write your comment or suggestion..."></textarea>
        <div class="ann-form-row">
          <div class="ann-type-toggle">
            <button class="ann-type-btn active" data-type="comment">Comment</button>
            <button class="ann-type-btn" data-type="suggestion">Suggestion</button>
          </div>
          <button class="ann-form-submit" id="annSubmit" disabled>Post</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    bindEvents();
  }

  // ══════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════

  function bindEvents() {
    const toggle = document.getElementById('annToggle');
    const panel = document.getElementById('annPanel');
    const closeBtn = document.getElementById('annPanelClose');
    const form = document.getElementById('annForm');
    const submitBtn = document.getElementById('annSubmit');
    const contentInput = document.getElementById('annContent');
    const authorInput = document.getElementById('annAuthor');

    // Load saved author name
    const savedAuthor = localStorage.getItem('ann_author');
    if (savedAuthor) authorInput.value = savedAuthor;

    // Toggle button — opens panel + annotation mode
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panelOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    closeBtn.addEventListener('click', function () {
      closePanel();
    });

    // Type toggle buttons
    panel.querySelectorAll('.ann-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        panel.querySelectorAll('.ann-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Submit
    submitBtn.addEventListener('click', function () {
      submitAnnotation();
    });

    // Enable/disable submit
    contentInput.addEventListener('input', function () {
      submitBtn.disabled = !contentInput.value.trim();
    });

    // Keyboard shortcut: Ctrl+Shift+A to toggle
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (panelOpen) closePanel(); else openPanel();
      }
      // Escape closes panel
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
      }
    });

    // Click on slide to place annotation
    document.addEventListener('click', function (e) {
      if (!annotationMode) return;
      // Ignore clicks on the panel, toggle, or pins
      if (e.target.closest('.ann-panel') || e.target.closest('.ann-toggle') || e.target.closest('.ann-pin')) return;

      const slide = e.target.closest('.slide.active');
      if (!slide) return;

      // Prevent slide navigation
      e.stopPropagation();
      e.preventDefault();

      const rect = slide.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      pendingClick = { xPct: Math.round(xPct * 100) / 100, yPct: Math.round(yPct * 100) / 100 };

      // Show form
      const form = document.getElementById('annForm');
      form.classList.add('visible');
      document.getElementById('annFormPos').textContent =
        'Slide ' + currentSlide + ' · ' + pendingClick.xPct.toFixed(0) + '%, ' + pendingClick.yPct.toFixed(0) + '%';
      document.getElementById('annContent').focus();
    }, true);
  }

  function openPanel() {
    panelOpen = true;
    annotationMode = true;
    document.body.classList.add('ann-mode-active');
    document.getElementById('annPanel').classList.add('open');
    document.getElementById('annToggle').classList.add('active');
    currentSlide = getCurrentSlide();
    renderPanel();
    renderPins();
  }

  function closePanel() {
    panelOpen = false;
    annotationMode = false;
    document.body.classList.remove('ann-mode-active');
    document.getElementById('annPanel').classList.remove('open');
    document.getElementById('annToggle').classList.remove('active');
    document.getElementById('annForm').classList.remove('visible');
    pendingClick = null;
  }

  async function submitAnnotation() {
    if (!pendingClick) return;

    const content = document.getElementById('annContent').value.trim();
    if (!content) return;

    const author = document.getElementById('annAuthor').value.trim() || 'Anonymous';
    const type = document.querySelector('.ann-type-btn.active').dataset.type;

    // Save author for next time
    localStorage.setItem('ann_author', author);

    const ann = {
      deck_id: deckId,
      slide_number: currentSlide,
      x_percent: pendingClick.xPct,
      y_percent: pendingClick.yPct,
      content: content,
      author: author,
      type: type,
      resolved: false
    };

    document.getElementById('annSubmit').disabled = true;
    const result = await createAnnotation(ann);

    if (result) {
      // Reset form
      document.getElementById('annContent').value = '';
      document.getElementById('annForm').classList.remove('visible');
      pendingClick = null;
      document.getElementById('annSubmit').disabled = true;
    }
  }

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════

  function renderPins() {
    // Remove existing pins
    document.querySelectorAll('.ann-pin').forEach(p => p.remove());

    if (!panelOpen) return;

    const slideEl = document.querySelector('.slide.active');
    if (!slideEl) return;

    const slideAnns = annotations.filter(a => a.slide_number === currentSlide);
    slideAnns.forEach(function (ann, i) {
      const pin = document.createElement('div');
      pin.className = 'ann-pin' + (ann.resolved ? ' resolved' : '');
      pin.style.left = ann.x_percent + '%';
      pin.style.top = ann.y_percent + '%';
      pin.innerHTML = '<span class="ann-pin-number">' + (i + 1) + '</span>';
      pin.title = ann.author + ': ' + ann.content.substring(0, 60);

      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        // Scroll to this annotation in the panel
        const card = document.querySelector('[data-ann-id="' + ann.id + '"]');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.borderColor = 'rgba(59,130,246,0.5)';
          setTimeout(() => { card.style.borderColor = ''; }, 1500);
        }
      });

      slideEl.appendChild(pin);
    });
  }

  function renderPanel() {
    renderSlideTabs();
    renderAnnotationList();
  }

  function renderSlideTabs() {
    const container = document.getElementById('annSlideTabs');
    if (!container) return;

    // Find all slides
    const slides = document.querySelectorAll('.slide');
    let html = '';

    slides.forEach(function (s, i) {
      const slideNum = parseInt(s.dataset.slide, 10);
      const count = annotations.filter(a => a.slide_number === slideNum).length;
      const isActive = slideNum === currentSlide;
      html += '<button class="ann-slide-tab' + (isActive ? ' active' : '') + '" data-slide-num="' + slideNum + '">'
        + 'S' + slideNum
        + (count > 0 ? '<span class="tab-count">(' + count + ')</span>' : '')
        + '</button>';
    });

    container.innerHTML = html;

    // Tab click -> navigate the actual deck slide
    container.querySelectorAll('.ann-slide-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        const targetSlide = parseInt(tab.dataset.slideNum, 10);
        // Use deck's own goTo for proper animations
        if (window._deckGoTo) {
          const cur = window._deckGetCurrent ? window._deckGetCurrent() : currentSlide;
          const dir = targetSlide > cur ? 'down' : 'up';
          window._deckGoTo(targetSlide, dir);
        }
        currentSlide = targetSlide;
        renderPanel();
        renderPins();
      });
    });
  }

  function renderAnnotationList() {
    const container = document.getElementById('annList');
    if (!container) return;

    const slideAnns = annotations.filter(a => a.slide_number === currentSlide);

    if (slideAnns.length === 0) {
      container.innerHTML = `
        <div class="ann-empty">
          <div class="ann-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span class="ann-empty-text">No annotations on this slide</span>
          <span class="ann-empty-hint">Click anywhere on the slide to add one</span>
        </div>
      `;
      return;
    }

    let html = '';
    slideAnns.forEach(function (ann, i) {
      const initials = ann.author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const timeAgo = getTimeAgo(ann.created_at);

      html += `
        <div class="ann-card ${ann.resolved ? 'resolved' : ''}" data-ann-id="${ann.id}">
          <div class="ann-card-header">
            <div class="ann-card-author">
              <div class="ann-card-avatar">${initials}</div>
              <span class="ann-card-name">${escapeHtml(ann.author)}</span>
            </div>
            <span class="ann-card-time">${timeAgo}</span>
          </div>
          <span class="ann-card-type ${ann.type}">${ann.type}</span>
          <div class="ann-card-content">${escapeHtml(ann.content)}</div>
          <div class="ann-card-actions">
            <button class="ann-card-btn copy" onclick="window._annCopy(this, '${ann.id}')">Copy</button>
            <button class="ann-card-btn resolve" onclick="window._annResolve('${ann.id}')">${ann.resolved ? 'Unresolve' : 'Resolve'}</button>
            <button class="ann-card-btn delete" onclick="window._annDelete('${ann.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function updateBadge() {
    const badge = document.getElementById('annBadge');
    if (!badge) return;
    const unresolvedCount = annotations.filter(a => !a.resolved).length;
    badge.textContent = unresolvedCount > 0 ? unresolvedCount : '';
  }

  // ══════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getTimeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return diffMin + 'm ago';
    if (diffHr < 24) return diffHr + 'h ago';
    if (diffDay < 30) return diffDay + 'd ago';
    return then.toLocaleDateString();
  }

  function copyAnnotation(btnEl, id) {
    const ann = annotations.find(a => a.id === id);
    if (!ann) return;
    const text = ann.content;
    navigator.clipboard.writeText(text).then(function () {
      btnEl.textContent = 'Copied!';
      btnEl.classList.add('copied');
      setTimeout(function () {
        btnEl.textContent = 'Copy';
        btnEl.classList.remove('copied');
      }, 1500);
    });
  }

  // Expose resolve/delete/copy for inline onclick handlers
  window._annResolve = resolveAnnotation;
  window._annDelete = deleteAnnotation;
  window._annCopy = copyAnnotation;

  // ══════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════

  function init() {
    // Wait for Supabase to be ready
    if (typeof _supabase === 'undefined') {
      console.error('[Annotations] Supabase client not found. Load supabase-config.js first.');
      return;
    }

    currentSlide = getCurrentSlide();
    buildUI();
    fetchAnnotations();
    watchSlideChanges();

    // Subscribe to real-time changes
    _supabase
      .channel('annotations-' + deckId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'annotations',
        filter: 'deck_id=eq.' + deckId
      }, function () {
        // Re-fetch on any change from other users
        fetchAnnotations();
      })
      .subscribe();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
