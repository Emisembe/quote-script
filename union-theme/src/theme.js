// Solidarity theme behaviour: menu with dropdowns, hero slideshow, label news blocks,
// latest-updates ticker, related posts, social icons and small helpers. No dependencies.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k) || attrs[k] == null) continue;
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'className') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function svg(paths, size) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = doc.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size || 18);
    s.setAttribute('height', size || 18);
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.4');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    var p = doc.createElementNS(ns, 'polyline');
    p.setAttribute('points', paths);
    s.appendChild(p);
    return s;
  }
  var CHEVRON_DOWN = '6 9 12 15 18 9';
  var CHEVRON_LEFT = '15 18 9 12 15 6';
  var CHEVRON_RIGHT = '9 18 15 12 9 6';

  // ---------------------------------------------------------------- menu
  var header = doc.getElementById('site-header');
  var toggle = doc.getElementById('nav-toggle');
  var drawer = doc.getElementById('site-nav');
  var desktop = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : null;

  function setMenu(open) {
    if (!header || !toggle) return;
    if (open) {
      drawer.style.top = Math.max(0, header.getBoundingClientRect().bottom) + 'px';
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
    // Dropdowns: every menu item with a nested list gets a toggle button for touch screens
    var parents = drawer.querySelectorAll('.site-nav li');
    for (var p = 0; p < parents.length; p++) {
      var li = parents[p];
      var sub = li.querySelector('ul');
      if (!sub || sub.parentNode !== li) continue;
      li.classList.add('has-sub');
      var link = li.querySelector('a');
      var btn = el('button', { type: 'button', className: 'sub-toggle', 'aria-expanded': 'false',
        'aria-label': 'Show submenu' + (link ? ': ' + link.textContent.trim() : '') }, [svg(CHEVRON_DOWN, 20)]);
      li.insertBefore(btn, sub);
      btn.addEventListener('click', function () {
        var item = this.parentNode;
        var open = !item.classList.contains('sub-open');
        item.classList.toggle('sub-open', open);
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    toggle.addEventListener('click', function () {
      setMenu(!header.classList.contains('nav-open'));
    });
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === 'A') {
          var href = t.getAttribute('href') || '';
          var item = t.parentNode;
          // "#" parents only open their submenu on phones
          if ((href === '#' || href === '') && item.classList.contains('has-sub')) {
            e.preventDefault();
            if (!(desktop && desktop.matches)) item.querySelector('.sub-toggle').click();
            return;
          }
          setMenu(false);
          return;
        }
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

  // ---------------------------------------------------------------- scroll effects
  var toTop = doc.querySelector('.to-top');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset;
      if (header) header.classList.toggle('is-scrolled', y > 50);
      if (toTop) toTop.classList.toggle('is-visible', y > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- brand and hero title
  var mark = doc.querySelector('.brand-mark');
  var name = doc.querySelector('.brand-name');
  if (mark && name && !mark.querySelector('img')) {
    var skip = { the: 1, a: 1, an: 1, of: 1, and: 1, for: 1 };
    var words = name.textContent.trim().split(/\s+/).filter(function (w) {
      return w && !skip[w.toLowerCase()];
    });
    mark.textContent = words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  // Last word of the hero title in the highlight colour ("... Workers Union")
  var heroTitle = doc.querySelector('.hero-title');
  if (heroTitle && heroTitle.children.length === 0) {
    var parts = heroTitle.textContent.trim().split(/\s+/);
    if (parts.length > 1) {
      heroTitle.textContent = parts.slice(0, -1).join(' ') + ' ';
      heroTitle.appendChild(el('span', { className: 'accent', text: parts[parts.length - 1] }));
    }
  }

  // ---------------------------------------------------------------- social icons
  var ICONS = {
    facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z',
    x: 'M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z',
    youtube: 'M23 7.2c-.3-1.1-1.1-2-2.2-2.3C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.8.4C2.1 5.2 1.3 6.1 1 7.2.6 9.1.6 12 .6 12s0 2.9.4 4.8c.3 1.1 1.1 2 2.2 2.3 1.9.4 8.8.4 8.8.4s6.9 0 8.8-.4c1.1-.3 1.9-1.2 2.2-2.3.4-1.9.4-4.8.4-4.8s0-2.9-.4-4.8zM9.7 15.5v-7l6 3.5-6 3.5z',
    instagram: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2.2c-2.7 0-3 0-4 .1-3.6.2-5.5 2.1-5.7 5.7-.1 1-.1 1.3-.1 4s0 3 .1 4c.2 3.6 2.1 5.5 5.7 5.7 1 .1 1.3.1 4 .1s3 0 4-.1c3.6-.2 5.5-2.1 5.7-5.7.1-1 .1-1.3.1-4s0-3-.1-4c-.2-3.6-2.1-5.5-5.7-5.7-1-.1-1.3-.1-4-.1zm0 1.8c2.6 0 2.9 0 4 .1 2.6.1 3.8 1.4 3.9 3.9.1 1 .1 1.3.1 4s0 2.9-.1 4c-.1 2.5-1.3 3.8-3.9 3.9-1 .1-1.3.1-4 .1s-2.9 0-4-.1c-2.6-.1-3.8-1.4-3.9-3.9-.1-1-.1-1.3-.1-4s0-2.9.1-4C4.2 5.4 5.4 4.2 8 4.1c1-.1 1.3-.1 4-.1z',
    linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.75H3V9.75zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6.1v6.1h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5h-4V9.75z',
    tiktok: 'M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9.1a6.4 6.4 0 1 0 5.5 6.3V8.6a8 8 0 0 0 4.6 1.5V6.7a4.7 4.7 0 0 1-4.6-4.7z',
    whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z',
    email: 'M2 5h20v14H2V5zm2 2v.5l8 5 8-5V7H4zm16 2.8-8 5-8-5V17h16V9.8z'
  };
  function networkOf(href) {
    var h = (href || '').toLowerCase();
    if (h.indexOf('mailto:') === 0) return 'email';
    if (/facebook\.com/.test(h)) return 'facebook';
    if (/(twitter\.com|\/\/x\.com|\.x\.com)/.test(h)) return 'x';
    if (/(youtube\.com|youtu\.be)/.test(h)) return 'youtube';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/linkedin\.com/.test(h)) return 'linkedin';
    if (/tiktok\.com/.test(h)) return 'tiktok';
    if (/(whatsapp\.com|wa\.me)/.test(h)) return 'whatsapp';
    return null;
  }
  var socialLinks = doc.querySelectorAll('.topbar-social .widget-content a');
  for (var s = 0; s < socialLinks.length; s++) {
    var a = socialLinks[s];
    var net = networkOf(a.getAttribute('href'));
    if (!net) continue;
    var label = a.textContent.trim();
    a.textContent = '';
    var ns = 'http://www.w3.org/2000/svg';
    var icon = doc.createElementNS(ns, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'social-icon');
    icon.setAttribute('aria-hidden', 'true');
    var path = doc.createElementNS(ns, 'path');
    path.setAttribute('d', ICONS[net]);
    icon.appendChild(path);
    a.appendChild(icon);
    a.appendChild(el('span', { className: 'social-text', text: label }));
    a.classList.add('has-icon');
    a.setAttribute('title', label);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  }
  // Repeat the social links in the footer
  var socialList = doc.querySelector('.topbar-social .widget-content ul');
  var footerSocial = doc.querySelector('.footer-social');
  if (socialList && footerSocial) {
    var copy = socialList.cloneNode(true);
    copy.className = 'social-list';
    var copied = copy.querySelectorAll('a');
    for (var cs = 0; cs < copied.length; cs++) {
      footerSocial.appendChild(copied[cs]);
    }
  }

  // ---------------------------------------------------------------- images and dates
  var googleImage = /^(https?:)?\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|ggpht\.com)\//i;
  var youtubeThumb = /^(https?:\/\/(img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)[a-z]*default\.jpg$/i;
  function sized(src, w, h) {
    if (!src) return src;
    var spec = 'w' + w + '-h' + h + '-c';
    if (googleImage.test(src)) {
      return src
        .replace(/\/s\d+(-[a-z]+)*\//i, '/' + spec + '/')
        .replace(/\/w\d+-h\d+(-[a-z]+)*\//i, '/' + spec + '/')
        .replace(/=s\d+(-[a-z]+)*$/i, '=' + spec)
        .replace(/=w\d+-h\d+(-[a-z]+)*$/i, '=' + spec);
    }
    if (youtubeThumb.test(src)) return src.replace(youtubeThumb, '$1hqdefault.jpg');
    return src;
  }
  var cardImgs = doc.querySelectorAll('img.js-resize');
  for (var c = 0; c < cardImgs.length; c++) {
    var src = cardImgs[c].getAttribute('src') || '';
    var better = sized(src, 720, 405);
    if (better !== src) cardImgs[c].setAttribute('src', better);
  }

  function niceDate(iso, long) {
    var when = new Date(iso);
    if (isNaN(when.getTime())) return '';
    return when.toLocaleDateString(undefined, { year: 'numeric', month: long ? 'long' : 'short', day: 'numeric' });
  }
  var dates = doc.querySelectorAll('time.js-date');
  for (var d = 0; d < dates.length; d++) {
    var text = niceDate(dates[d].getAttribute('datetime'), true);
    if (text) dates[d].textContent = text;
  }

  // ---------------------------------------------------------------- hero slideshow
  var media = doc.querySelector('.hero-media');
  var slides = media ? media.querySelectorAll('img') : [];
  if (media && slides.length > 1) {
    media.classList.add('is-slideshow');
    var current = 0;
    var timer = null;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = el('div', { className: 'slide-dots' });
    var show = function (n) {
      current = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('is-active', i === current);
        dots.children[i].setAttribute('aria-current', i === current ? 'true' : 'false');
      }
    };
    var play = function () {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () { show(current + 1); }, 5500);
    };
    for (var i = 0; i < slides.length; i++) {
      if (i > 0) slides[i].setAttribute('loading', 'lazy');
      dots.appendChild(el('button', { type: 'button', 'aria-label': 'Show slide ' + (i + 1), 'data-slide': i }));
    }
    dots.addEventListener('click', function (e) {
      var n = e.target.getAttribute('data-slide');
      if (n !== null) { show(parseInt(n, 10)); play(); }
    });
    var prev = el('button', { type: 'button', className: 'slide-btn slide-prev', 'aria-label': 'Previous slide' }, [svg(CHEVRON_LEFT, 20)]);
    var next = el('button', { type: 'button', className: 'slide-btn slide-next', 'aria-label': 'Next slide' }, [svg(CHEVRON_RIGHT, 20)]);
    prev.addEventListener('click', function () { show(current - 1); play(); });
    next.addEventListener('click', function () { show(current + 1); play(); });
    media.appendChild(prev);
    media.appendChild(next);
    media.appendChild(dots);
    media.addEventListener('mouseenter', function () { clearInterval(timer); });
    media.addEventListener('mouseleave', play);
    show(0);
    play();
  }

  // ---------------------------------------------------------------- Blogger feeds (JSONP)
  var feedId = 0;
  function loadFeed(label, count, done) {
    var cb = '__unionFeed' + (++feedId);
    var script = doc.createElement('script');
    var finished = false;
    var finish = function (data) {
      if (finished) return;
      finished = true;
      try { delete window[cb]; } catch (err) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      done(data);
    };
    window[cb] = function (json) { finish(json && json.feed ? json.feed.entry || [] : null); };
    script.onerror = function () { finish(null); };
    setTimeout(function () { finish(null); }, 12000);
    script.src = '/feeds/posts/summary' + (label ? '/-/' + encodeURIComponent(label) : '') +
      '?alt=json-in-script&max-results=' + count + '&callback=' + cb;
    doc.body.appendChild(script);
  }

  function plainText(html) {
    if (!html) return '';
    try {
      return (new DOMParser().parseFromString(html, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  function cut(text, n) {
    if (text.length <= n) return text;
    return text.slice(0, n).replace(/\s+\S*$/, '') + '…';
  }
  function parseEntry(e) {
    var url = '#';
    for (var i = 0; i < (e.link || []).length; i++) {
      if (e.link[i].rel === 'alternate') { url = e.link[i].href; break; }
    }
    var body = (e.content && e.content.$t) || (e.summary && e.summary.$t) || '';
    var img = e.media$thumbnail ? e.media$thumbnail.url : '';
    if (!img) {
      var m = body.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) img = m[1];
    }
    return {
      title: (e.title && e.title.$t) || 'Untitled post',
      url: url,
      date: e.published ? e.published.$t : '',
      image: img,
      text: plainText(body)
    };
  }

  function thumb(post, w, h, fallback) {
    var box = el('a', { className: 'feed-thumb', href: post.url, tabindex: '-1', 'aria-hidden': 'true' });
    if (post.image) {
      box.appendChild(el('img', { src: sized(post.image, w, h), alt: '', loading: 'lazy' }));
    } else {
      box.classList.add('feed-thumb-empty');
      box.textContent = (fallback || post.title).charAt(0);
    }
    return box;
  }
  function titleLink(post, tag) {
    return el(tag || 'h3', { className: 'feed-title' }, [el('a', { href: post.url, text: post.title })]);
  }
  function dateTag(post) {
    var t = niceDate(post.date);
    return t ? el('time', { className: 'feed-date', datetime: post.date, text: t }) : null;
  }
  function card(post, label) {
    return el('article', { className: 'feed-card' }, [
      thumb(post, 480, 270, label),
      el('div', { className: 'feed-body' }, [dateTag(post), titleLink(post)])
    ]);
  }

  var RENDER = {
    news: function (posts, label) {
      var first = posts[0];
      var out = [el('article', { className: 'feed-featured' }, [
        thumb(first, 640, 360, label),
        el('div', { className: 'feed-body' }, [dateTag(first), titleLink(first),
          first.text ? el('p', { className: 'feed-excerpt', text: cut(first.text, 120) }) : null])
      ])];
      if (posts.length > 1) {
        out.push(el('ul', { className: 'feed-list' }, posts.slice(1).map(function (p) {
          return el('li', null, [thumb(p, 184, 138, label), el('div', null, [dateTag(p), titleLink(p)])]);
        })));
      }
      return out;
    },
    message: function (posts, label) {
      var p = posts[0];
      return [el('article', { className: 'feed-message' }, [
        thumb(p, 800, 600, label),
        el('div', { className: 'feed-body' }, [titleLink(p),
          p.text ? el('p', { className: 'feed-excerpt', text: cut(p.text, 240) }) : null,
          el('a', { className: 'feed-readmore', href: p.url, text: 'Read the full message' })])
      ])];
    },
    tiles: function (posts, label) {
      return [el('div', { className: 'feed-tiles' }, posts.map(function (p) {
        return el('a', { className: 'feed-tile', href: p.url }, [
          p.image ? el('span', { className: 'feed-thumb' }, [el('img', { src: sized(p.image, 400, 400), alt: '', loading: 'lazy' })]) : null,
          el('span', { className: 'feed-tile-text' }, [dateTag(p), el('span', { className: 'feed-title', text: p.title })])
        ]);
      }))];
    },
    list: function (posts, label) {
      return [el('div', { className: 'feed-cards' }, posts.map(function (p) { return card(p, label); }))];
    },
    strip: function (posts, label) {
      var list = el('ul', { className: 'feed-strip' }, posts.map(function (p) { return el('li', null, [card(p, label)]); }));
      var step = function (dir) { list.scrollBy({ left: dir * list.clientWidth * 0.8, behavior: 'smooth' }); };
      var prev = el('button', { type: 'button', className: 'strip-btn strip-prev', 'aria-label': 'Scroll left' }, [svg(CHEVRON_LEFT, 20)]);
      var next = el('button', { type: 'button', className: 'strip-btn strip-next', 'aria-label': 'Scroll right' }, [svg(CHEVRON_RIGHT, 20)]);
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      return [el('div', { className: 'strip-wrap' }, [prev, list, next])];
    }
  };

  function isVisible(node) {
    return !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
  }

  var blocks = doc.querySelectorAll('.feed-block');
  for (var b = 0; b < blocks.length; b++) {
    (function (block) {
      var labelEl = block.querySelector('.feed-label');
      var items = block.querySelector('.feed-items');
      var label = labelEl ? labelEl.textContent.trim() : '';
      var kind = block.getAttribute('data-kind');
      var count = parseInt(block.getAttribute('data-count'), 10) || 4;
      var more = block.querySelector('.feed-more');
      if (more) more.setAttribute('href', label ? '/search/label/' + encodeURIComponent(label) : '/search');
      if (!items || !RENDER[kind]) return;
      // Homepage blocks are hidden on other pages: don't load their feeds there
      if (!isVisible(block)) return;
      loadFeed(label, count, function (entries) {
        items.textContent = '';
        if (!entries || !entries.length) {
          items.appendChild(el('p', { className: 'feed-status', text: entries ?
            'Nothing published under “' + label + '” yet.' : 'Posts could not be loaded right now.' }));
          return;
        }
        RENDER[kind](entries.map(parseEntry), label).forEach(function (n) { items.appendChild(n); });
      });
    })(blocks[b]);
  }

  // Latest-updates ticker
  var tickerList = doc.querySelector('.ticker-list');
  if (tickerList && isVisible(tickerList.parentNode)) {
    loadFeed('', 8, function (entries) {
      if (!entries || !entries.length) {
        doc.querySelector('.ticker').style.display = 'none';
        return;
      }
      var posts = entries.map(parseEntry);
      // Two copies so the CSS animation can loop seamlessly
      for (var round = 0; round < 2; round++) {
        posts.forEach(function (p) {
          var item = el('li', null, [el('a', { href: p.url, text: p.title })]);
          if (round === 1) item.setAttribute('aria-hidden', 'true');
          tickerList.appendChild(item);
        });
      }
      var hidden = tickerList.querySelectorAll('[aria-hidden] a');
      for (var h = 0; h < hidden.length; h++) hidden[h].setAttribute('tabindex', '-1');
    });
  }

  // Related articles on post pages (from the post's first label)
  var related = doc.querySelector('.related');
  var crumb = doc.querySelector('.breadcrumb .crumb-label');
  if (related && crumb) {
    var here = (window.location.href.split(/[?#]/)[0]).replace(/^https?:/, '');
    loadFeed(crumb.textContent.trim(), 6, function (entries) {
      if (!entries) return;
      var posts = entries.map(parseEntry).filter(function (p) {
        return p.url.split(/[?#]/)[0].replace(/^https?:/, '') !== here;
      }).slice(0, 3);
      if (!posts.length) return;
      var grid = related.querySelector('.related-grid');
      posts.forEach(function (p) { grid.appendChild(card(p)); });
      related.hidden = false;
    });
  }

  // ---------------------------------------------------------------- small helpers
  // Hide homepage bands whose section has no gadget (e.g. "numbers" left empty)
  var optional = doc.querySelectorAll('.js-hide-empty');
  for (var o = 0; o < optional.length; o++) {
    if (!optional[o].querySelector('.widget')) optional[o].hidden = true;
  }

  // "Join today" box on posts points wherever the header's Join button points
  var joinSource = doc.querySelector('.header-cta .widget-content a');
  var joinLinks = doc.querySelectorAll('.js-join-link');
  for (var j = 0; j < joinLinks.length; j++) {
    if (joinSource) {
      joinLinks[j].setAttribute('href', joinSource.getAttribute('href'));
    } else {
      joinLinks[j].parentNode.style.display = 'none';
    }
  }

  // Copy-link share button
  var copyBtns = doc.querySelectorAll('[data-copy-url]');
  for (var cb = 0; cb < copyBtns.length; cb++) {
    copyBtns[cb].addEventListener('click', function () {
      var btn = this;
      var url = btn.getAttribute('data-copy-url');
      var done = function () {
        var text = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = text; }, 1600);
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
