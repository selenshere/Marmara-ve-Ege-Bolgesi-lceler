var currentZoom = 1.0;

function applyZoom() {
  var svg = $('#turkey-map svg');
  if (!svg.length) return;
  svg.css('transform', 'scale(' + currentZoom + ')');
}

function buildMap(svgText) {
  var $map = $('#turkey-map');
  $map.find('.map-container, .map-tooltip, .map-title').remove();

  // SVG'yi sayfaya ekle
  $map.append('<div class="map-container">' + svgText + '</div>');
  $map.append('<div class="map-tooltip"></div>');
  $map.append('<div class="map-title"><span class="map-close"></span><strong></strong></div>');

  // Arka plan rengi
  var bg = $map.attr('data-bg-color');
  if (bg) $map.css('background-color', bg);

  // Yeni SVG yüklendiğinde zoom'u sıfırla
  currentZoom = 1.0;
  applyZoom();
}

function GetMap() {
  $.get('turkey-map/source/turkey-demo.svg', function (data) {
    buildMap(data);
  }, 'text');
}

function buildLabels() {
  var svg = $('#turkey-map svg')[0];
  if (!svg) return;

  $('#turkey-map svg #turkey > g > g').each(function () {
    var g = this;
    var $g = $(g);

    if ($g.find('text.district-label').length) return;

    var $city = $g.parent('g');
    var cityName = $city.attr('id') || '';
    var distName = $g.attr('id') || '';

    var labelText = distName || cityName;
    if (!labelText) return;

    try {
      var box = g.getBBox();
      var x = box.x + box.width / 2;
      var y = box.y + box.height / 2;

      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'district-label');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.textContent = labelText;
      g.appendChild(text);
    } catch (e) {
      // getBBox hataya düşerse sessiz geç
    }
  });
}

function updateLabelSize() {
  var size = parseInt($('#labelSize').val() || '11', 10);
  $('.district-label').attr('font-size', size + 'px');
  $('#labelSizeValue').text(size + 'px');
}

$(function () {
  var $mapRoot = $('#turkey-map');
  $mapRoot.addClass('labels-hidden');

  GetMap();

  // İlçe üzerine gelince tooltip göster
  $(document).on({
    mouseenter: function () {
      var $d = $(this);              // ilçe
      var $city = $d.parent('g');    // il
      var cityName = $city.attr('id') || '';
      var distName = $d.attr('id') || '';

      var box = $d[0].getBoundingClientRect();
      var mapOffset = $('#turkey-map').offset();
      var centerX = box.left + box.width / 2;
      var topY = box.top;

      var $tip = $('.map-tooltip');
      $tip.html('<span>' + cityName + '</span> ' + distName);

      var tipWidth = $tip.outerWidth(true) / 2;
      $tip.css({
        transform: 'translate(' +
          ((centerX - tipWidth) - mapOffset.left) + 'px, ' +
          (topY - mapOffset.top) + 'px)'
      }).addClass('hovered');
    },
    mouseleave: function () {
      $('.map-tooltip').text('').removeClass('hovered');
    },
    click: function () {
      var $district = $(this);
      var $city = $district.parent('g');
      var cityName = $city.attr('id') || '';
      var distName = $district.attr('id') || '';
      var color = $('#colorPicker').val() || '#3EA1AA';

      // Sadece tıklanan ilçeyi renklendir
      $district.find('path, polygon').css('fill', color);

      $('#turkey-map svg g').removeClass('selected');
      $city.addClass('selected');

      $('#turkey-map .map-title strong').text(
        (cityName || '') + (distName ? ' - ' + distName : '')
      );
    }
  }, '#turkey > g > g');

  // Geri butonu sadece seçimi sıfırlasın
  $(document).on('click', '#turkey-map .map-title .map-close', function () {
    $('#turkey-map svg g').removeClass('selected');
    $('#turkey-map .map-title strong').text('');
  });

  // İsimleri göster / gizle
  $('#toggleLabels').on('click', function () {
    var $map = $('#turkey-map');
    if ($map.hasClass('labels-hidden')) {
      buildLabels();
      updateLabelSize();
      $map.removeClass('labels-hidden').addClass('labels-visible');
      $(this).text('İsimleri Gizle');
    } else {
      $map.removeClass('labels-visible').addClass('labels-hidden');
      $(this).text('İsimleri Göster');
    }
  });

  // Yazı boyutunu değiştir
  $('#labelSize').on('input change', function () {
    updateLabelSize();
  });

  // İl sınırlarını göster / gizle
  $('#toggleBorders').on('click', function () {
    var $map = $('#turkey-map');
    if ($map.hasClass('borders-on')) {
      $map.removeClass('borders-on');
      $(this).text('İl Sınırlarını Göster');
    } else {
      $map.addClass('borders-on');
      $(this).text('İl Sınırlarını Gizle');
    }
  });

  // Zoom kontrolleri
  $('#zoomIn').on('click', function () {
    currentZoom = Math.min(currentZoom + 0.2, 4);
    applyZoom();
  });
  $('#zoomOut').on('click', function () {
    currentZoom = Math.max(currentZoom - 0.2, 0.4);
    applyZoom();
  });
  $('#zoomReset').on('click', function () {
    currentZoom = 1.0;
    applyZoom();
  });

  // SVG'yi kaydet
  $('#saveSvg').on('click', function () {
    var svg = $('#turkey-map svg')[0];
    if (!svg) return;

    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    if (!source.match(/^<\?xml/)) {
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    var blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'selected-districts-map.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // PNG olarak kaydet
  $('#savePng').on('click', function () {
    var svgElem = $('#turkey-map svg')[0];
    if (!svgElem) return;

    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgElem);

    var svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(svgBlob);

    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');

      var viewBox = svgElem.viewBox;
      var width = viewBox && viewBox.baseVal && viewBox.baseVal.width ? viewBox.baseVal.width : svgElem.getBoundingClientRect().width;
      var height = viewBox && viewBox.baseVal && viewBox.baseVal.height ? viewBox.baseVal.height : svgElem.getBoundingClientRect().height;

      canvas.width = width;
      canvas.height = height;

      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(function (blob) {
        var pngUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'selected-districts-map.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      });
    };
    img.src = url;
  });

  // Daha önce kaydedilmiş bir SVG haritayı yükle
  $('#loadSvg').on('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      var text = ev.target.result;
      buildMap(text);
      $('#turkey-map').removeClass('labels-visible').addClass('labels-hidden');
      $('#toggleLabels').text('İsimleri Göster');
    };
    reader.readAsText(file);
  });
});
