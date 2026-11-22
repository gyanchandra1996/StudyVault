import { PDF_JS_BASE64, PDF_WORKER_BASE64 } from './pdfjsAssets';

export const VIEWER_HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <title>StudyVault PDF Reader</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @font-face {
      font-family: 'Mangal';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Nirmala UI';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Kruti Dev 010';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Devlys 010';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'DV-TTSurekh';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'DV-TTSurekhNormal';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'DV-TTSurekhBold';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'DV-Surekh';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'DV-TTSurekhEN';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Walkman-Chanakya';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Chanakya';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'APS-DV-Priyanka';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Shree-Dev-0714';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Lohit Devanagari';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    @font-face {
      font-family: 'Arial Unicode MS';
      src: local('Noto Sans Devanagari'), local('NotoSansDevanagari'), local('sans-serif');
    }
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "DV-TTSurekh", "DV-Surekh", "Mangal", "Nirmala UI", Helvetica, Arial, sans-serif;
      overflow-x: auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      user-select: text;
      -webkit-user-select: text;
    }
    body.night-mode {
      background-color: #11111B !important;
    }
    #viewer-container {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0 80px 0;
      box-sizing: border-box;
      transition: background-color 0.2s;
    }
    .page-container {
      position: relative;
      margin: 0 auto 14px auto;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      border-radius: 4px;
      background-color: #FFFFFF;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    body.night-mode .page-container {
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
    }
    body.night-mode .page-container canvas {
      filter: invert(0.9) hue-rotate(180deg);
    }
    .textLayer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      opacity: 1;
      line-height: 1.0;
      user-select: text;
      -webkit-user-select: text;
      pointer-events: auto;
      z-index: 2;
    }
    .textLayer span {
      color: transparent !important;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    ::selection {
      background: rgba(99, 102, 241, 0.4);
    }
    .highlights-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    .annotation-highlight {
      position: absolute;
      mix-blend-mode: multiply;
      pointer-events: auto;
      border-radius: 2px;
      cursor: pointer;
    }
    .annotation-underline {
      position: absolute;
      border-bottom-width: 2.5px;
      border-bottom-style: solid;
      pointer-events: auto;
      cursor: pointer;
    }
    .annotation-strikethrough {
      position: absolute;
      border-bottom-width: 2px;
      border-bottom-style: solid;
      pointer-events: auto;
      transform: translateY(-50%);
      cursor: pointer;
    }
    .search-highlight {
      position: absolute;
      background-color: rgba(255, 220, 0, 0.6) !important;
      border-radius: 2px;
      mix-blend-mode: multiply;
      pointer-events: none;
      z-index: 15;
    }
    .search-highlight.current {
      background-color: rgba(255, 120, 0, 0.8) !important;
    }
    #loading-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      color: #64748B;
      font-weight: 600;
      background: rgba(255,255,255,0.9);
      padding: 12px 24px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 999;
    }
  </style>
</head>
<body>
  <div id="loading-indicator">Loading document...</div>
  <div id="viewer-container"></div>

  <script>
    // Inlined 100% offline Mozilla PDF.js engine and worker
    try {
      // 1. Inject worker script first into global scope so globalThis.pdfjsWorker is available
      var workerCode = atob('${PDF_WORKER_BASE64}');
      var workerScriptTag = document.createElement('script');
      workerScriptTag.text = workerCode;
      document.head.appendChild(workerScriptTag);

      // 2. Inject main PDF.js library
      var pdfJsCode = atob('${PDF_JS_BASE64}');
      var scriptTag = document.createElement('script');
      scriptTag.text = pdfJsCode;
      document.head.appendChild(scriptTag);

      if (typeof pdfjsLib !== 'undefined') {
        // Enable fonts and use in-memory WorkerMessageHandler
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }
    } catch (engineErr) {
      console.error('Failed to initialize inline pdfjsLib:', engineErr);
    }

    var pdfDoc = null;
    var currentPage = 1;
    var totalPages = 0;
    var basePageWidth = 595.28;
    var basePageHeight = 841.89;
    var fitWidthScale = 1.0;
    var userZoomRatio = 1.0;
    var currentScale = 1.0;
    var scrollMode = 'continuous'; // 'continuous' or 'single'
    var isNightMode = false;
    var allHighlights = [];
    var pageRenders = {};
    var searchMatches = [];
    var currentMatchIndex = -1;

    function sendToRN(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    window.onerror = function(msg, url, line) {
      sendToRN({ type: 'ERROR', message: msg + ' at ' + url + ':' + line });
    };

    function calculateFitScale() {
      var clientW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 360;
      // Allow 16px total horizontal margins (8px on each side) for clean, readable page borders
      var targetWidth = Math.max(260, clientW - 16);
      fitWidthScale = targetWidth / basePageWidth;
      currentScale = fitWidthScale * userZoomRatio;
    }

    var pdfStreamTotalBytes = 0;
    var pdfStreamReceivedBytes = 0;
    var pdfStreamChunks = [];
    var pdfStreamStartPage = 1;

    window.startPdfStream = function(totalBytes, startPage) {
      pdfStreamTotalBytes = totalBytes || 0;
      pdfStreamReceivedBytes = 0;
      pdfStreamChunks = [];
      pdfStreamStartPage = startPage && startPage > 0 ? startPage : 1;

      var loader = document.getElementById('loading-indicator');
      if (loader) {
        loader.style.display = 'block';
        loader.innerText = 'Streaming document (0%)...';
      }
    };

    window.appendPdfChunk = function(base64Chunk) {
      try {
        var binary = atob(base64Chunk);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        pdfStreamChunks.push(bytes);
        pdfStreamReceivedBytes += bytes.length;

        var loader = document.getElementById('loading-indicator');
        if (loader && pdfStreamTotalBytes > 0) {
          var pct = Math.min(99, Math.round((pdfStreamReceivedBytes / pdfStreamTotalBytes) * 100));
          loader.innerText = 'Streaming document (' + pct + '%)...';
        }
      } catch (err) {
        sendToRN({ type: 'ERROR', message: 'Chunk decoding error: ' + err.message });
      }
    };

    window.finishPdfStream = function() {
      try {
        var loader = document.getElementById('loading-indicator');
        if (loader) {
          loader.innerText = 'Rendering document...';
        }

        var fullBytes = new Uint8Array(pdfStreamReceivedBytes);
        var offset = 0;
        for (var c = 0; c < pdfStreamChunks.length; c++) {
          var chunk = pdfStreamChunks[c];
          fullBytes.set(chunk, offset);
          offset += chunk.length;
        }
        pdfStreamChunks = []; // Free chunks memory immediately

        loadPdfFromUint8Array(fullBytes, pdfStreamStartPage);
      } catch (err) {
        sendToRN({ type: 'ERROR', message: 'Stream finalization error: ' + err.message });
      }
    };

    function CachingCMapReaderFactory(options) {
      this.baseUrl = (options && options.baseUrl) || 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/';
      this.isCompressed = options ? options.isCompressed !== false : true;
    }
    CachingCMapReaderFactory.prototype = {
      fetch: function(query) {
        var name = query.name;
        if (!name) return Promise.reject(new Error('CMap name is missing'));
        var ext = this.isCompressed ? '.bcmap' : '';
        var cacheKey = 'cmap_cache_' + name;

        try {
          var cached = localStorage.getItem(cacheKey);
          if (cached) {
            var raw = atob(cached);
            var uint8 = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) {
              uint8[i] = raw.charCodeAt(i);
            }
            return Promise.resolve({ cMapData: uint8, isCompressed: true });
          }
        } catch (e) {}

        var url1 = this.baseUrl + name + ext;
        var url2 = 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/' + name + ext;
        var url3 = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/' + name + ext;

        function fetchCMap(u) {
          return fetch(u).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.arrayBuffer();
          });
        }

        return fetchCMap(url1)
          .catch(function() { return fetchCMap(url2); })
          .catch(function() { return fetchCMap(url3); })
          .then(function(buffer) {
            var bytes = new Uint8Array(buffer);
            try {
              var binaryStr = '';
              var chunkSize = 8192;
              for (var j = 0; j < bytes.length; j += chunkSize) {
                var slice = bytes.subarray(j, Math.min(j + chunkSize, bytes.length));
                binaryStr += String.fromCharCode.apply(null, slice);
              }
              localStorage.setItem(cacheKey, btoa(binaryStr));
            } catch (err) {}
            return { cMapData: bytes, isCompressed: true };
          })
          .catch(function(err) {
            console.warn('CMap fetch fallback for ' + name + ':', err);
            return { cMapData: new Uint8Array(0), isCompressed: false };
          });
      }
    };

    function CachingStandardFontDataFactory(options) {
      this.baseUrl = (options && options.baseUrl) || 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/';
    }
    CachingStandardFontDataFactory.prototype = {
      fetch: function(query) {
        var filename = query.filename;
        if (!filename) return Promise.reject(new Error('Font filename is missing'));
        var cacheKey = 'font_cache_' + filename;

        try {
          var cached = localStorage.getItem(cacheKey);
          if (cached) {
            var raw = atob(cached);
            var uint8 = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) {
              uint8[i] = raw.charCodeAt(i);
            }
            return Promise.resolve(uint8);
          }
        } catch (e) {}

        var url1 = this.baseUrl + filename;
        var url2 = 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/' + filename;

        function fetchFont(u) {
          return fetch(u).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.arrayBuffer();
          });
        }

        return fetchFont(url1)
          .catch(function() { return fetchFont(url2); })
          .then(function(buffer) {
            var bytes = new Uint8Array(buffer);
            try {
              var binaryStr = '';
              var chunkSize = 8192;
              for (var j = 0; j < bytes.length; j += chunkSize) {
                var slice = bytes.subarray(j, Math.min(j + chunkSize, bytes.length));
                binaryStr += String.fromCharCode.apply(null, slice);
              }
              localStorage.setItem(cacheKey, btoa(binaryStr));
            } catch (err) {}
            return bytes;
          })
          .catch(function(err) {
            console.warn('Standard font fetch fallback for ' + filename + ':', err);
            return new Uint8Array(0);
          });
      }
    };

    function loadPdfFromUint8Array(uint8Array, startPage) {
      try {
        var CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/';
        var CMAP_PACKED = true;
        var STANDARD_FONT_DATA_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/';

        var loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          cMapUrl: CMAP_URL,
          cMapPacked: CMAP_PACKED,
          CMapReaderFactory: CachingCMapReaderFactory,
          standardFontDataUrl: STANDARD_FONT_DATA_URL,
          StandardFontDataFactory: CachingStandardFontDataFactory,
          useWorkerFetch: true,
          enableXfa: true,
          useSystemFonts: true,
          disableFontFace: false,
          fontExtraProperties: true,
          isEvalSupported: true,
        });

        loadingTask.promise.then(function(doc) {
          pdfDoc = doc;
          totalPages = doc.numPages;
          currentPage = startPage && startPage <= totalPages ? startPage : 1;

          return doc.getPage(1);
        }).then(function(firstPage) {
          var unscaledViewport = firstPage.getViewport({ scale: 1.0 });
          basePageWidth = unscaledViewport.width || 595.28;
          basePageHeight = unscaledViewport.height || 841.89;

          calculateFitScale();

          var loader = document.getElementById('loading-indicator');
          if (loader) loader.style.display = 'none';

          sendToRN({ type: 'DOC_LOADED', totalPages: totalPages, initialPage: currentPage });

          renderPages();
        }).catch(function(err) {
          var loader = document.getElementById('loading-indicator');
          if (loader) loader.innerText = 'Failed to load document';
          sendToRN({ type: 'ERROR', message: 'PDF parsing error: ' + err.message });
        });
      } catch (err) {
        sendToRN({ type: 'ERROR', message: 'Loading error: ' + err.message });
      }
    }

    window.loadPdfData = function(base64Data, startPage) {
      try {
        var raw = atob(base64Data);
        var uint8Array = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) {
          uint8Array[i] = raw.charCodeAt(i);
        }
        loadPdfFromUint8Array(uint8Array, startPage);
      } catch (err) {
        sendToRN({ type: 'ERROR', message: 'Decoding error: ' + err.message });
      }
    };

    function renderPages() {
      var container = document.getElementById('viewer-container');
      container.innerHTML = '';

      if (scrollMode === 'single') {
        renderSinglePage(currentPage);
      } else {
        for (var p = 1; p <= totalPages; p++) {
          createPageWrapper(p);
        }
        renderVisiblePages();
      }
    }

    function createPageWrapper(pageNum) {
      var container = document.getElementById('viewer-container');
      var wrapper = document.createElement('div');
      wrapper.id = 'page-' + pageNum;
      wrapper.className = 'page-container';
      wrapper.dataset.page = pageNum;

      var displayWidth = Math.round(basePageWidth * currentScale);
      var displayHeight = Math.round(basePageHeight * currentScale);

      wrapper.style.width = displayWidth + 'px';
      wrapper.style.minHeight = displayHeight + 'px';

      var canvas = document.createElement('canvas');
      canvas.id = 'canvas-' + pageNum;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      wrapper.appendChild(canvas);

      var textLayer = document.createElement('div');
      textLayer.id = 'text-layer-' + pageNum;
      textLayer.className = 'textLayer';
      textLayer.style.width = displayWidth + 'px';
      textLayer.style.height = displayHeight + 'px';
      wrapper.appendChild(textLayer);

      var highlightsLayer = document.createElement('div');
      highlightsLayer.id = 'highlights-layer-' + pageNum;
      highlightsLayer.className = 'highlights-layer';
      highlightsLayer.style.width = displayWidth + 'px';
      highlightsLayer.style.height = displayHeight + 'px';
      wrapper.appendChild(highlightsLayer);

      container.appendChild(wrapper);
    }

    function renderPageCanvas(pageNum) {
      if (!pdfDoc || pageRenders[pageNum]) return;
      pageRenders[pageNum] = true;

      pdfDoc.getPage(pageNum).then(function(page) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        var viewport = page.getViewport({ scale: currentScale * dpr });
        var displayViewport = page.getViewport({ scale: currentScale });

        var wrapper = document.getElementById('page-' + pageNum);
        if (!wrapper) return;

        var displayWidth = Math.round(displayViewport.width);
        var displayHeight = Math.round(displayViewport.height);

        wrapper.style.width = displayWidth + 'px';
        wrapper.style.height = displayHeight + 'px';

        var canvas = document.getElementById('canvas-' + pageNum);
        if (canvas) {
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          canvas.style.width = displayWidth + 'px';
          canvas.style.height = displayHeight + 'px';

          var ctx = canvas.getContext('2d');
          var renderTask = page.render({ canvasContext: ctx, viewport: viewport });
          renderTask.promise.then(function() {
            return page.getTextContent();
          }).then(function(textContent) {
            var textLayerDiv = document.getElementById('text-layer-' + pageNum);
            if (!textLayerDiv) return;
            textLayerDiv.innerHTML = '';
            textLayerDiv.style.width = displayWidth + 'px';
            textLayerDiv.style.height = displayHeight + 'px';
            textLayerDiv.style.setProperty('--scale-factor', displayViewport.scale);

            pdfjsLib.renderTextLayer({
              textContent: textContent,
              container: textLayerDiv,
              viewport: displayViewport,
              textDivs: []
            });

            renderPageHighlights(pageNum);
          }).catch(function(err) {
            console.warn('Text layer render error:', err);
          });
        }
      }).catch(function(err) {
        console.warn('Page render error:', err);
        pageRenders[pageNum] = false;
      });
    }

    function renderSinglePage(pageNum) {
      var container = document.getElementById('viewer-container');
      container.innerHTML = '';
      pageRenders = {};
      createPageWrapper(pageNum);
      renderPageCanvas(pageNum);
    }

    function renderVisiblePages() {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var pageNum = parseInt(entry.target.dataset.page, 10);
              renderPageCanvas(pageNum);
              if (pageNum < totalPages) renderPageCanvas(pageNum + 1);
              if (pageNum > 1) renderPageCanvas(pageNum - 1);
              currentPage = pageNum;
              sendToRN({ type: 'PAGE_CHANGE', page: pageNum, totalPages: totalPages });
            }
          });
        }, { rootMargin: '300px 0px' });

        document.querySelectorAll('.page-container').forEach(function(el) {
          observer.observe(el);
        });
      } else {
        for (var p = 1; p <= totalPages; p++) {
          renderPageCanvas(p);
        }
      }

      renderPageCanvas(currentPage);
      if (currentPage < totalPages) renderPageCanvas(currentPage + 1);
      if (currentPage > 1) renderPageCanvas(currentPage - 1);
    }

    // TEXT SELECTION HANDLING
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('mouseup', handleSelection);

    function handleSelection() {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

      var text = sel.toString().trim();
      if (!text || text.length === 0) return;

      var range = sel.getRangeAt(0);
      var pageEl = range.startContainer.parentElement;
      while (pageEl && !pageEl.classList.contains('page-container')) {
        pageEl = pageEl.parentElement;
      }
      if (!pageEl) return;

      var pageNum = parseInt(pageEl.dataset.page, 10);
      var pageRect = pageEl.getBoundingClientRect();
      var clientRects = range.getClientRects();
      var rects = [];

      for (var i = 0; i < clientRects.length; i++) {
        var r = clientRects[i];
        rects.push({
          x: (r.left - pageRect.left) / pageRect.width,
          y: (r.top - pageRect.top) / pageRect.height,
          width: r.width / pageRect.width,
          height: r.height / pageRect.height,
        });
      }

      sendToRN({
        type: 'TEXT_SELECTED',
        text: text,
        page: pageNum,
        rects: rects,
      });
    }

    // HIGHLIGHT RENDERING
    window.loadSavedHighlights = function(highlights) {
      allHighlights = highlights || [];
      for (var p = 1; p <= totalPages; p++) {
        renderPageHighlights(p);
      }
    };

    window.applyHighlight = function(h) {
      allHighlights.push(h);
      renderPageHighlights(h.page_number);
      // Clear selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    };

    window.removeHighlight = function(highlightId) {
      allHighlights = allHighlights.filter(function(h) { return h.id !== highlightId; });
      var el = document.getElementById('hl-' + highlightId);
      if (el) el.remove();
    };

    function renderPageHighlights(pageNum) {
      var layer = document.getElementById('highlights-layer-' + pageNum);
      if (!layer) return;
      layer.innerHTML = '';

      var pageWrapper = document.getElementById('page-' + pageNum);
      if (!pageWrapper) return;
      var pWidth = pageWrapper.clientWidth;
      var pHeight = pageWrapper.clientHeight;

      var pageHighlights = allHighlights.filter(function(h) {
        return h.page_number === pageNum;
      });

      pageHighlights.forEach(function(h) {
        var data;
        try {
          data = typeof h.annotation_data === 'string' ? JSON.parse(h.annotation_data) : h.annotation_data;
        } catch(e) { return; }

        if (!data || !data.rects) return;

        var colorMap = {
          yellow: '#FACC15',
          green: '#22C55E',
          blue: '#3B82F6',
          pink: '#EC4899',
          orange: '#F97316',
          purple: '#A855F7',
        };
        var color = colorMap[h.color] || h.color || '#FACC15';
        var type = data.type || 'highlight';

        data.rects.forEach(function(r, idx) {
          var el = document.createElement('div');
          el.id = 'hl-' + h.id + '-' + idx;
          el.style.left = (r.x * pWidth) + 'px';
          el.style.top = (r.y * pHeight) + 'px';
          el.style.width = (r.width * pWidth) + 'px';
          el.style.height = (r.height * pHeight) + 'px';

          if (type === 'highlight') {
            el.className = 'annotation-highlight';
            el.style.backgroundColor = color;
            el.style.opacity = '0.45';
          } else if (type === 'underline') {
            el.className = 'annotation-underline';
            el.style.borderBottomColor = color;
          } else if (type === 'strikethrough') {
            el.className = 'annotation-strikethrough';
            el.style.borderBottomColor = color;
          }

          el.onclick = function(e) {
            e.stopPropagation();
            sendToRN({ type: 'HIGHLIGHT_CLICKED', highlight: h });
          };

          layer.appendChild(el);
        });
      });
    }

    // ZOOM & NAVIGATION
    window.setZoom = function(ratio) {
      userZoomRatio = ratio;
      calculateFitScale();
      pageRenders = {};
      renderPages();
    };

    window.fitToWidth = function() {
      userZoomRatio = 1.0;
      calculateFitScale();
      pageRenders = {};
      renderPages();
    };

    window.addEventListener('resize', function() {
      calculateFitScale();
      pageRenders = {};
      renderPages();
    });

    window.setScrollMode = function(mode) {
      scrollMode = mode;
      renderPages();
      if (mode === 'continuous') {
        window.goToPage(currentPage);
      }
    };

    window.goToPage = function(pageNum) {
      if (pageNum < 1 || pageNum > totalPages) return;
      currentPage = pageNum;
      if (scrollMode === 'single') {
        renderSinglePage(pageNum);
      } else {
        var el = document.getElementById('page-' + pageNum);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          renderPageCanvas(pageNum);
          var newEl = document.getElementById('page-' + pageNum);
          if (newEl) newEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
      sendToRN({ type: 'PAGE_CHANGE', page: pageNum, totalPages: totalPages });
    };

    window.setNightMode = function(enabled) {
      isNightMode = enabled;
      if (enabled) {
        document.body.classList.add('night-mode');
      } else {
        document.body.classList.remove('night-mode');
      }
    };

    // SEARCH INSIDE PDF
    window.searchPdf = function(query) {
      searchMatches = [];
      currentMatchIndex = -1;
      document.querySelectorAll('.search-highlight').forEach(function(el) { el.remove(); });

      if (!query || !query.trim()) {
        sendToRN({ type: 'SEARCH_RESULTS', count: 0, current: 0 });
        return;
      }

      var term = query.toLowerCase();
      var count = 0;

      for (var p = 1; p <= totalPages; p++) {
        var textLayer = document.getElementById('text-layer-' + p);
        if (!textLayer) continue;
        var pageWrapper = document.getElementById('page-' + p);
        var pWidth = pageWrapper ? pageWrapper.clientWidth : 0;
        var pHeight = pageWrapper ? pageWrapper.clientHeight : 0;

        var spans = textLayer.querySelectorAll('span');
        for (var s = 0; s < spans.length; s++) {
          var span = spans[s];
          var text = span.textContent.toLowerCase();
          if (text.indexOf(term) !== -1) {
            var rect = span.getBoundingClientRect();
            var pageRect = pageWrapper.getBoundingClientRect();

            var mark = document.createElement('div');
            mark.className = 'search-highlight';
            mark.style.left = (rect.left - pageRect.left) + 'px';
            mark.style.top = (rect.top - pageRect.top) + 'px';
            mark.style.width = rect.width + 'px';
            mark.style.height = rect.height + 'px';
            pageWrapper.appendChild(mark);

            searchMatches.push({ page: p, element: mark });
            count++;
          }
        }
      }

      if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        highlightCurrentMatch();
      }

      sendToRN({
        type: 'SEARCH_RESULTS',
        count: searchMatches.length,
        current: currentMatchIndex + 1,
      });
    };

    window.nextSearchResult = function() {
      if (searchMatches.length === 0) return;
      currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
      highlightCurrentMatch();
      sendToRN({
        type: 'SEARCH_RESULTS',
        count: searchMatches.length,
        current: currentMatchIndex + 1,
      });
    };

    window.prevSearchResult = function() {
      if (searchMatches.length === 0) return;
      currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
      highlightCurrentMatch();
      sendToRN({
        type: 'SEARCH_RESULTS',
        count: searchMatches.length,
        current: currentMatchIndex + 1,
      });
    };

    function highlightCurrentMatch() {
      searchMatches.forEach(function(m) { m.element.classList.remove('current'); });
      var match = searchMatches[currentMatchIndex];
      if (match) {
        match.element.classList.add('current');
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  </script>
</body>
</html>`;
