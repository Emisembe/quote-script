// River Musa theme behaviour: mobile menu, sticky-header shadow, brand initials,
// hero title accent, copy-link button and footer year. No dependencies.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  // Mobile menu
  var header = doc.getElementById('site-header');
  var toggle = doc.getElementById('nav-toggle');
  var drawer = doc.getElementById('site-nav');
  var desktop = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : null;

  function setMenu(open) {
    if (!header || !toggle) return;
    if (open) {
      header.classList.add('nav-open');
      root.classList.add('nav-locked');
    } else {
      header.classList.remove('nav-open');
      root.classList.remove('nav-locked');
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (header && toggle && drawer) {
    toggle.addEventListener('click', function () {
      setMenu(!header.classList.contains('nav-open'));
    });
    // Close after choosing a link (also covers same-page #anchors)
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === 'A') { setMenu(false); return; }
        t = t.parentNode;
      }
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && header.classList.contains('nav-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    if (desktop) {
      var onChange = function () { if (desktop.matches) setMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }
  }

  // Shadow under the sticky header once the page scrolls
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (window.pageYOffset > 8) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Initials in the round brand mark when no logo image is set ("The River Musa Show" -> "RM")
  var mark = doc.querySelector('.brand-mark');
  var name = doc.querySelector('.brand-name');
  if (mark && name && !mark.querySelector('img')) {
    var skip = { the: 1, a: 1, an: 1 };
    var words = name.textContent.trim().split(/\s+/).filter(function (w) {
      return w && !skip[w.toLowerCase()];
    });
    mark.textContent = words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  // Hero title: first word white, the rest in the accent colour
  var title = doc.querySelector('.hero-title');
  if (title && title.children.length === 0) {
    var parts = title.textContent.trim().split(/\s+/);
    if (parts.length > 1) {
      title.textContent = parts[0] + ' ';
      var accent = doc.createElement('span');
      accent.className = 'accent';
      accent.textContent = parts.slice(1).join(' ');
      title.appendChild(accent);
    }
  }

  // Card images: ask Blogger/YouTube for a 16:9 size instead of the full image or a 72px thumbnail
  var cardImgs = doc.querySelectorAll('img.js-resize');
  for (var c = 0; c < cardImgs.length; c++) {
    var src = cardImgs[c].getAttribute('src') || '';
    var sized = src
      .replace(/\/s\d+(-c)?\//, '/w720-h405-c/')
      .replace(/\/w\d+-h\d+(-[a-z]+)*\//, '/w720-h405-c/')
      .replace(/=s\d+(-c)?$/, '=w720-h405-c')
      .replace(/=w\d+-h\d+(-[a-z]+)*$/, '=w720-h405-c')
      .replace(/(ytimg\.com\/vi\/[^/]+\/)default\.jpg$/, '$1hqdefault.jpg');
    if (sized !== src) cardImgs[c].setAttribute('src', sized);
  }

  // Dates: show "12 October 2026" style dates whatever the blog's timestamp format is
  var dates = doc.querySelectorAll('time.js-date');
  for (var d = 0; d < dates.length; d++) {
    var when = new Date(dates[d].getAttribute('datetime'));
    if (!isNaN(when.getTime())) {
      dates[d].textContent = when.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }

  // Host card: a photo placed in the gadget's content replaces the microphone icon
  var hostImg = doc.querySelector('.host-role img');
  var avatar = doc.querySelector('.host-avatar');
  if (hostImg && avatar) {
    avatar.innerHTML = '';
    avatar.appendChild(hostImg);
  }

  // Copy-link share button
  var copyBtns = doc.querySelectorAll('[data-copy-url]');
  for (var i = 0; i < copyBtns.length; i++) {
    copyBtns[i].addEventListener('click', function () {
      var btn = this;
      var url = btn.getAttribute('data-copy-url');
      var done = function () {
        var label = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = label; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
  }

  // Footer year
  var years = doc.querySelectorAll('.js-year');
  for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());
})();
