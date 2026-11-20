// Neon Sunset Cover Studio — page wiring: photos, layouts, panels, grade, caption,
// export. Classic script; cover.js and shots.js must load first.

var state = {
  photos: [], // { name, img }
  layout: 'triple',
  panels: [],
  grade: 0.6,
  caption: 'Sunset Heist',
  captionPos: 'bottom',
  accent: '#FFFFFF',
  size: '1920x1080',
  selected: 0
};

var PREVIEW_MAX = 960;
var MAX_PHOTOS = 5;
var canvas = document.getElementById('cover');
var statusEl = document.getElementById('status');
var thumbsEl = document.getElementById('thumbs');
var panelsEl = document.getElementById('panels');

function setStatus(msg) { statusEl.textContent = msg || ''; }

function panelCount() {
  return LAYOUTS[state.layout](1, 1, 0).length;
}

// Rebuilds the panel list for the current layout, keeping each panel's photo,
// zoom and pan where that panel still exists.
function resetPanels() {
  var old = state.panels;
  var n = panelCount();
  var next = [];
  for (var i = 0; i < n; i++) {
    next.push(old[i] || { photo: -1, zoom: 1, ox: 0, oy: 0, auto: true });
  }
  state.panels = next;
  if (state.selected >= n) state.selected = 0;
}

// Sizes the preview canvas to the export aspect (capped at PREVIEW_MAX) and draws.
function render() {
  var parts = state.size.split('x');
  var w = parseInt(parts[0], 10);
  var h = parseInt(parts[1], 10);
  var scale = PREVIEW_MAX / Math.max(w, h);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  drawCover(canvas, state, { preview: true, selected: state.selected });
}

function loadImage(url) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function photoLabel(i) {
  return state.photos[i] ? (i + 1) + '. ' + state.photos[i].name : 'Empty';
}

function rebuildThumbs() {
  thumbsEl.innerHTML = '';
  state.photos.forEach(function (p, i) {
    var box = document.createElement('div');
    box.className = 'thumb';
    box.title = p.name;
    var img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    var x = document.createElement('button');
    x.type = 'button';
    x.textContent = '×';
    x.setAttribute('aria-label', 'Remove ' + p.name);
    x.addEventListener('click', function () { removePhoto(i); });
    box.appendChild(img);
    box.appendChild(x);
    thumbsEl.appendChild(box);
  });
}

function rebuildPanels() {
  panelsEl.innerHTML = '';
  state.panels.forEach(function (p, i) {
    var row = document.createElement('div');
    row.className = 'panelrow' + (i === state.selected ? ' selected' : '');
    row.setAttribute('data-i', String(i));
    var num = document.createElement('span');
    num.className = 'pnum';
    num.textContent = 'Panel ' + (i + 1);
    var sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Photo for panel ' + (i + 1));
    var empty = document.createElement('option');
    empty.value = '-1';
    empty.textContent = 'Empty';
    sel.appendChild(empty);
    state.photos.forEach(function (ph, pi) {
      var o = document.createElement('option');
      o.value = String(pi);
      o.textContent = photoLabel(pi);
      sel.appendChild(o);
    });
    sel.value = String(p.photo);
    sel.addEventListener('change', function () {
      state.panels[i].photo = parseInt(sel.value, 10);
      state.panels[i].auto = false;
      state.selected = i;
      rebuildPanels();
      render();
    });
    var zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(p.zoom);
    zoom.title = 'Zoom panel ' + (i + 1);
    zoom.setAttribute('aria-label', 'Zoom panel ' + (i + 1));
    zoom.addEventListener('input', function () {
      state.panels[i].zoom = parseFloat(zoom.value);
      state.selected = i;
      render();
    });
    var center = document.createElement('button');
    center.type = 'button';
    center.textContent = 'Center';
    center.addEventListener('click', function () {
      state.panels[i].zoom = 1;
      state.panels[i].ox = 0;
      state.panels[i].oy = 0;
      state.selected = i;
      rebuildPanels();
      render();
    });
    row.appendChild(num);
    row.appendChild(sel);
    row.appendChild(zoom);
    row.appendChild(center);
    row.addEventListener('click', function () {
      state.selected = i;
      rebuildPanels();
      render();
    });
    panelsEl.appendChild(row);
  });
}

function refreshUI() {
  rebuildThumbs();
  rebuildPanels();
  render();
}

function removePhoto(i) {
  state.photos.splice(i, 1);
  state.panels.forEach(function (p) {
    if (p.photo === i) { p.photo = -1; p.auto = true; }
    else if (p.photo > i) p.photo -= 1;
  });
  setStatus('Removed a photo.');
  refreshUI();
}

// Fills every panel that is empty or still on its automatic photo with the
// loaded photos in turn, so one photo spans the whole cover and two photos
// alternate across the panels. A panel the user picked by hand keeps its photo.
function autoAssign() {
  state.panels.forEach(function (p, i) {
    if (p.photo === -1 || p.auto) {
      p.photo = state.photos.length ? i % state.photos.length : -1;
      p.auto = state.photos.length > 0;
    }
  });
}

function addImage(name, img) {
  if (state.photos.length >= MAX_PHOTOS) {
    setStatus('Five photos at most — remove one first.');
    return false;
  }
  state.photos.push({ name: name, img: img });
  autoAssign();
  refreshUI();
  return true;
}

function addFiles(files) {
  var list = Array.prototype.slice.call(files || []);
  var added = 0;
  var pending = list.filter(function (f) { return f.type.indexOf('image/') === 0; });
  if (!pending.length) {
    setStatus('Drop image files to add them.');
    return;
  }
  pending.forEach(function (f) {
    if (state.photos.length + added >= MAX_PHOTOS) return;
    var reader = new FileReader();
    reader.onload = function () {
      loadImage(reader.result).then(function (img) {
        if (addImage(f.name, img)) {
          added++;
          setStatus('Added ' + f.name + '.');
        }
      }).catch(function () { setStatus('Could not read ' + f.name + '.'); });
    };
    reader.readAsDataURL(f);
  });
}

function loadSample(name, done) {
  loadImage('samples/' + name + '.jpg').then(function (img) {
    addImage(name + '.jpg', img);
    setStatus('Loaded the ' + name + ' sample.');
    if (done) done();
  }).catch(function () {
    setStatus('Could not load the ' + name + ' sample.');
    if (done) done();
  });
}

// --- Controls ---------------------------------------------------------------

document.getElementById('photoInput').addEventListener('change', function (e) {
  addFiles(e.target.files);
  e.target.value = '';
});
document.getElementById('demoBoulevard').addEventListener('click', function () { loadSample('boulevard'); });
document.getElementById('demoPier').addEventListener('click', function () { loadSample('pier'); });

document.addEventListener('dragover', function (e) {
  e.preventDefault();
  document.body.classList.add('dragover');
});
document.addEventListener('dragleave', function (e) {
  if (e.target === document.body) document.body.classList.remove('dragover');
});
document.addEventListener('drop', function (e) {
  e.preventDefault();
  document.body.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

document.querySelectorAll('.layoutbtn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    state.layout = btn.getAttribute('data-layout');
    document.querySelectorAll('.layoutbtn').forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });
    resetPanels();
    autoAssign();
    refreshUI();
  });
});

var gradeInput = document.getElementById('grade');
var gradeVal = document.getElementById('gradeVal');
gradeInput.addEventListener('input', function () {
  state.grade = parseInt(gradeInput.value, 10) / 100;
  gradeVal.textContent = gradeInput.value + '%';
  render();
});

var captionInput = document.getElementById('caption');
captionInput.addEventListener('input', function () {
  state.caption = captionInput.value;
  render();
});

var posTopBtn = document.getElementById('posTop');
var posBottomBtn = document.getElementById('posBottom');
function setCaptionPos(pos) {
  state.captionPos = pos;
  posTopBtn.classList.toggle('active', pos === 'top');
  posBottomBtn.classList.toggle('active', pos === 'bottom');
  render();
}
posTopBtn.addEventListener('click', function () { setCaptionPos('top'); });
posBottomBtn.addEventListener('click', function () { setCaptionPos('bottom'); });

document.querySelectorAll('.swatch').forEach(function (sw) {
  sw.addEventListener('click', function () {
    state.accent = sw.getAttribute('data-color');
    document.querySelectorAll('.swatch').forEach(function (s) {
      s.classList.toggle('active', s === sw);
    });
    render();
  });
});

document.querySelectorAll('input[name=size]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    if (radio.checked) {
      state.size = radio.value;
      render();
    }
  });
});

// --- Export -----------------------------------------------------------------

function renderOffscreen(w, h) {
  var off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, { preview: false });
  return off;
}

document.getElementById('export').addEventListener('click', function () {
  var parts = state.size.split('x');
  var w = parseInt(parts[0], 10);
  var h = parseInt(parts[1], 10);
  try {
    renderOffscreen(w, h).toBlob(function (blob) {
      if (!blob) {
        setStatus('Export failed — try opening the app through the local server.');
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'neon-sunset-cover-' + w + 'x' + h + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      setStatus('Saved neon-sunset-cover-' + w + 'x' + h + '.png');
    }, 'image/png');
  } catch (err) {
    setStatus('Export failed — photos loaded from disk need the local server.');
  }
});

// Headless hook used by the screenshot driver: renders the cover at w x h and
// hands back a PNG data URL. The export button above uses the same renderer.
window.__exportCover = function (w, h) {
  return renderOffscreen(w, h).toDataURL('image/png');
};

// --- Shot scenes and first paint -------------------------------------------

var api = {
  loadSample: loadSample,
  setLayout: function (layout) {
    if (LAYOUTS[layout]) {
      state.layout = layout;
      document.querySelectorAll('.layoutbtn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-layout') === layout);
      });
      resetPanels();
      autoAssign();
    }
  },
  setCaption: function (text) {
    state.caption = text;
    captionInput.value = text;
  },
  setExportSize: function (size) {
    state.size = size;
    document.querySelectorAll('input[name=size]').forEach(function (radio) {
      radio.checked = radio.value === size;
    });
  },
  setPanelPan: function (i, ox, oy) {
    if (state.panels[i]) {
      state.panels[i].ox = ox;
      state.panels[i].oy = oy;
    }
  },
  renderCoverOnly: function (w, h) {
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas, state, { preview: false });
  },
  render: render
};

resetPanels();
var query = new URLSearchParams(location.search);
var shot = query.get('shot');
if (shot) {
  runShot(shot, query, api);
} else {
  refreshUI();
}
