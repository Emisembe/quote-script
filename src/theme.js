// River Musa theme behaviour: mobile menu, sticky-header shadow, brand initials,
// hero title accent, copy-link button and footer year. No dependencies.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  // Sub-menus: in the Link List, a link whose name starts with "_" becomes a
  // sub-item of the closest link above it without "_".
  var menuList = doc.querySelector('.site-nav .widget-content > ul');
  if (menuList) {
    var parentItem = null;
    var menuItems = Array.prototype.slice.call(menuList.children);
    for (var mi = 0; mi < menuItems.length; mi++) {
      var item = menuItems[mi];
      var link = item.querySelector('a');
      if (!link) continue;
      var label = link.textContent.replace(/^\s+/, '');
      if (label.charAt(0) === '_' && parentItem) {
        link.textContent = label.replace(/^_+\s*/, '');
        var sub = parentItem.querySelector('ul.sub-menu');
        if (!sub) {
          sub = doc.createElement('ul');
          sub.className = 'sub-menu';
          parentItem.appendChild(sub);
          parentItem.classList.add('has-sub');
          var subToggle = doc.createElement('button');
          subToggle.type = 'button';
          subToggle.className = 'sub-toggle';
          subToggle.setAttribute('aria-expanded', 'false');
          subToggle.setAttribute('aria-label', 'Show ' + parentItem.querySelector('a').textContent.trim() + ' pages');
          subToggle.innerHTML = '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24" width="16"><polyline points="6 9 12 15 18 9"/></svg>';
          parentItem.insertBefore(subToggle, sub);
        }
        sub.appendChild(item);
      } else {
        if (label.charAt(0) === '_') link.textContent = label.replace(/^_+\s*/, '');
        parentItem = item;
      }
    }
    menuList.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.sub-toggle') : null;
      if (!btn) return;
      var li = btn.parentNode;
      var open = !li.classList.contains('open');
      var siblings = menuList.querySelectorAll('li.has-sub.open');
      for (var si = 0; si < siblings.length; si++) {
        siblings[si].classList.remove('open');
        siblings[si].querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
      }
      if (open) li.classList.add('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Social links: add an icon based on the link's address
  var socialIcons = {
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 9 15 12 10 15 10 9"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.6 2.6 2.6 4.6 5 4.8"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    x: '<path d="M4 4l16 16"/><path d="M20 4L4 20"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7.5-.7 10.5 1"/><path d="M7.5 12.7c2.9-.8 6-.5 8.5.9"/><path d="M8 15.8c2.3-.6 4.6-.4 6.6.7"/>',
    podcast: '<circle cx="12" cy="11" r="3"/><path d="M8.5 16.5a6 6 0 1 1 7 0"/><path d="M12 14v8"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  };
  function socialType(href) {
    var h = (href || '').toLowerCase();
    if (h.indexOf('mailto:') === 0) return 'email';
    if (/youtube\.com|youtu\.be/.test(h)) return 'youtube';
    if (/tiktok\.com/.test(h)) return 'tiktok';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/linkedin\.com/.test(h)) return 'linkedin';
    if (/facebook\.com|fb\.com|fb\.me/.test(h)) return 'facebook';
    if (/(^|\/\/|\.)(x|twitter)\.com/.test(h)) return 'x';
    if (/whatsapp\.com|wa\.me/.test(h)) return 'whatsapp';
    if (/spotify\.com/.test(h)) return 'spotify';
    if (/podcasts\.apple\.com|anchor\.fm|podbean|buzzsprout/.test(h)) return 'podcast';
    return 'link';
  }
  var socialLinks = doc.querySelectorAll('#footer-connect .widget-content a');
  for (var so = 0; so < socialLinks.length; so++) {
    var sl = socialLinks[so];
    if (sl.querySelector('svg')) continue;
    var svg = '<svg aria-hidden="true" class="social-icon" fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="18">' + socialIcons[socialType(sl.getAttribute('href'))] + '</svg>';
    sl.insertAdjacentHTML('afterbegin', svg);
    if (/^https?:/i.test(sl.getAttribute('href') || '')) {
      sl.setAttribute('target', '_blank');
      sl.setAttribute('rel', 'noopener');
    }
  }

  // Host card video: a YouTube link (or YouTube embed) in the host card gadget
  // replaces the microphone with the video. The player loads only on play.
  var hostCard = doc.querySelector('.host-card');
  var hostRole = hostCard ? hostCard.querySelector('.host-role') : null;
  var ytPattern = /(?:youtube\.com\/(?:watch\?(?:[^\s"'<>]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})[^\s"'<>]*/;
  function findVideoId(node) {
    var frames = node.querySelectorAll('iframe');
    for (var fi = 0; fi < frames.length; fi++) {
      var fm = ytPattern.exec(frames[fi].getAttribute('src') || '');
      if (fm) { frames[fi].parentNode.removeChild(frames[fi]); return fm[1]; }
    }
    var anchors = node.querySelectorAll('a');
    for (var ai = 0; ai < anchors.length; ai++) {
      var am = ytPattern.exec(anchors[ai].getAttribute('href') || '');
      if (am) { anchors[ai].parentNode.removeChild(anchors[ai]); return am[1]; }
    }
    var walker = doc.createTreeWalker(node, 4, null, false);
    var textNode;
    while ((textNode = walker.nextNode())) {
      var tm = ytPattern.exec(textNode.nodeValue);
      if (tm) {
        textNode.nodeValue = textNode.nodeValue.replace(/\S*(?:youtube\.com|youtu\.be)\S*/, '').replace(/\s+$/, '');
        return tm[1];
      }
    }
    return null;
  }
  if (hostCard && hostRole) {
    var videoId = findVideoId(hostRole);
    if (videoId) {
      var paras = hostRole.querySelectorAll('p, div');
      for (var pi = 0; pi < paras.length; pi++) {
        if (!paras[pi].textContent.trim() && !paras[pi].querySelector('img')) paras[pi].parentNode.removeChild(paras[pi]);
      }
      var avatarSlot = hostCard.querySelector('.host-avatar');
      var video = doc.createElement('div');
      video.className = 'host-video';
      var playBtn = doc.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'host-video-play';
      playBtn.setAttribute('aria-label', 'Play video');
      var thumb = doc.createElement('img');
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.src = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
      playBtn.appendChild(thumb);
      playBtn.insertAdjacentHTML('beforeend', '<span class="host-video-icon"><svg aria-hidden="true" fill="currentColor" height="28" viewBox="0 0 24 24" width="28"><polygon points="8 5 19 12 8 19 8 5"/></svg></span>');
      playBtn.addEventListener('click', function () {
        var frame = doc.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
        frame.title = 'Video';
        frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        frame.setAttribute('allowfullscreen', '');
        video.innerHTML = '';
        video.appendChild(frame);
      });
      video.appendChild(playBtn);
      if (avatarSlot) avatarSlot.parentNode.replaceChild(video, avatarSlot);
      else hostCard.insertBefore(video, hostCard.firstChild);
      hostCard.classList.add('has-video');
    }
  }

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
  var googleImage = /^https?:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|bp\.blogspot\.com|ggpht\.com)\//i;
  var youtubeThumb = /^(https?:\/\/(img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)[a-z]*default\.jpg$/i;
  var cardImgs = doc.querySelectorAll('img.js-resize');
  for (var c = 0; c < cardImgs.length; c++) {
    var src = cardImgs[c].getAttribute('src') || '';
    var sized = src;
    if (googleImage.test(src)) {
      sized = src
        .replace(/\/s\d+(-[a-z]+)*\//i, '/w720-h405-c/')
        .replace(/\/w\d+-h\d+(-[a-z]+)*\//i, '/w720-h405-c/')
        .replace(/=s\d+(-[a-z]+)*$/i, '=w720-h405-c')
        .replace(/=w\d+-h\d+(-[a-z]+)*$/i, '=w720-h405-c');
    } else if (youtubeThumb.test(src)) {
      sized = src.replace(youtubeThumb, '$1hqdefault.jpg');
    }
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
