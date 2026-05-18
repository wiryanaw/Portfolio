/* Dynamic Island Table of Contents — vanilla JS */
(function () {
  'use strict';

  var sections  = [];
  var activeId  = null;
  var isExpanded = false;
  var container, pill, pillText, pillFill, menu, menuList, backdrop;

  /* ─── Build section list ──────────────────────────────── */
  function buildSections() {
    document.querySelectorAll('.cs-section').forEach(function (sec, i) {
      var titleEl = sec.querySelector('.section-title');
      if (!titleEl) return;

      var text = titleEl.textContent.trim();
      var slug = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || ('section-' + i);
      if (!sec.id) sec.id = slug;

      sections.push({ id: sec.id, text: text, level: 2, element: sec });

      sec.querySelectorAll('.subsection').forEach(function (sub, j) {
        var subTitleEl = sub.querySelector('.subsection-title');
        if (!subTitleEl) return;

        var subText = subTitleEl.textContent.trim();
        var subSlug = subText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || ('sub-' + i + '-' + j);
        if (!sub.id) sub.id = subSlug;

        sections.push({ id: sub.id, text: subText, level: 3, element: sub });
      });
    });
  }

  /* ─── Build DOM ───────────────────────────────────────── */
  function buildDOM() {
    var circumference = 2 * Math.PI * 9.75; // ~61.26

    backdrop = document.createElement('div');
    backdrop.id = 'toc-backdrop';

    container = document.createElement('div');
    container.id = 'toc-container';

    // Pill
    pill = document.createElement('div');
    pill.id = 'toc-pill';
    pill.innerHTML =
      '<div class="toc-dot"></div>' +
      '<span id="toc-current-text">Contents</span>' +
      '<svg id="toc-progress-svg" width="24" height="24" viewBox="0 0 24 24">' +
        '<circle class="toc-track" cx="12" cy="12" r="9.75" fill="none" stroke-width="2.5"/>' +
        '<circle class="toc-fill"  cx="12" cy="12" r="9.75" fill="none" stroke-width="2.5"' +
          ' stroke-dasharray="' + circumference.toFixed(2) + '"' +
          ' stroke-dashoffset="' + circumference.toFixed(2) + '"' +
          ' stroke-linecap="round"/>' +
      '</svg>';

    // Menu
    menu = document.createElement('div');
    menu.id = 'toc-menu';
    menu.innerHTML =
      '<div class="toc-menu-header">' +
        '<span class="toc-menu-label">Table of Contents</span>' +
        '<button class="toc-close-btn" aria-label="Close">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
            '<path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"' +
              ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div id="toc-list"></div>';

    container.appendChild(pill);
    container.appendChild(menu);
    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    pillText = document.getElementById('toc-current-text');
    pillFill = container.querySelector('.toc-fill');
    menuList = document.getElementById('toc-list');

    // Build list items
    sections.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'toc-item' + (s.level === 3 ? ' toc-item-sub' : '');
      btn.dataset.id = s.id;

      var span = document.createElement('span');
      span.className = 'toc-item-text';
      span.textContent = s.text;

      var dot = document.createElement('span');
      dot.className = 'toc-item-dot';

      btn.appendChild(span);
      btn.appendChild(dot);
      menuList.appendChild(btn);
    });
  }

  /* ─── Events ──────────────────────────────────────────── */
  function bindEvents() {
    container.addEventListener('click', function () {
      if (!isExpanded) expand();
    });

    menu.querySelector('.toc-close-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      collapse();
    });

    backdrop.addEventListener('click', collapse);

    menuList.addEventListener('click', function (e) {
      var btn = e.target.closest('.toc-item');
      if (!btn) return;
      e.stopPropagation();
      var found = sections.find(function (s) { return s.id === btn.dataset.id; });
      if (found) {
        var y = found.element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      collapse();
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function expand() {
    isExpanded = true;
    container.classList.add('expanded');
    backdrop.classList.add('visible');
  }

  function collapse() {
    isExpanded = false;
    container.classList.remove('expanded');
    backdrop.classList.remove('visible');
  }

  /* ─── Scroll spy + progress ───────────────────────────── */
  function handleScroll() {
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].element.getBoundingClientRect().top;
      if (top <= 120) { current = sections[i].id; } else { break; }
    }
    if (!current && sections.length) current = sections[0].id;

    if (current !== activeId) {
      activeId = current;
      var found = sections.find(function (s) { return s.id === activeId; });
      pillText.textContent = found ? found.text : 'Contents';
      menuList.querySelectorAll('.toc-item').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.id === activeId);
      });
    }

    var total = document.documentElement.scrollHeight - window.innerHeight;
    var pct   = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
    var circ  = 2 * Math.PI * 9.75;
    pillFill.style.strokeDashoffset = circ - (pct / 100) * circ;
  }

  /* ─── Entry point ─────────────────────────────────────── */
  function init() {
    buildSections();
    if (sections.length === 0) return;
    buildDOM();
    bindEvents();
  }

  // HRIS has a password gate — wait for it to unlock
  var gate = document.getElementById('gate');
  if (gate) {
    var obs = new MutationObserver(function () {
      if (gate.classList.contains('unlocked')) {
        obs.disconnect();
        setTimeout(init, 150);
      }
    });
    obs.observe(gate, { attributes: true, attributeFilter: ['class'] });
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})();
