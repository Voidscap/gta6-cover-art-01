// Fixed scenes for screenshots: ?shot=editor shows the editor with both sample
// photos loaded; ?shot=cover shows the cover alone at the export size from the
// query (w and h), with the layout and caption from the query too. The two
// samples alternate across the panels, so the cover reads as a finished poster.
// window.__shotReady is set once the scene is painted.
function runShot(shot, query, api) {
  var photo = query.get('photo') || 'pier';
  var other = photo === 'pier' ? 'boulevard' : 'pier';
  var caption = query.get('caption') || 'Sunset Heist';
  var layout = query.get('layout') || 'triple';
  var w = parseInt(query.get('w') || '1080', 10) || 1080;
  var h = parseInt(query.get('h') || '1080', 10) || 1080;
  function ready() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { window.__shotReady = true; });
    });
  }
  function loadBoth(done) {
    api.loadSample(photo, function () { api.loadSample(other, done); });
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    loadBoth(function () {
      api.setLayout(layout);
      api.setCaption(caption);
      api.setExportSize(w + 'x' + h);
      // A wide hero panel crops a square photo to its middle band; nudge it
      // down so faces near the top of the photo stay in frame.
      if (layout === 'hero') api.setPanelPan(0, 0, 0.55);
      api.renderCoverOnly(w, h);
      ready();
    });
  } else if (shot === 'editor') {
    loadBoth(function () {
      api.setLayout(layout);
      api.setCaption(caption);
      api.render();
      ready();
    });
  } else {
    api.render();
    ready();
  }
}
