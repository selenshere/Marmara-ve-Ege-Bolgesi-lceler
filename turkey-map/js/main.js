// Sadece bu iller gözüksün
var allowedProvinces = [
  'Afyonkarahisar',
  'Balıkesir',
  'Bilecik',
  'Bursa',
  'Çanakkale',
  'Kütahya',
  'Yalova'
];

var currentZoom = 1.0;

// Zoom uygula
function applyZoom() {
  var svg = $('#turkey-map svg');
  if (!svg.length) return;
  svg.css('transform', 'scale(' + currentZoom + ')');
}

// Seçili iller dışındakileri gizle
function filterProvinces() {
  $('#turkey-map svg #turkey > g').each(function () {
    var id = this.id || '';
    if (allowedProvinces.indexOf(id) === -1) {
      $(this).hide();
    } else {
      $(this).show();
    }
  });
}

// Haritayı yerleştir
function buildMap(svgText) {
  var $map = $('#turkey-map');
  $map.empty();

  var $container = $('<div class="map-container"></div>');
  $container.html(svgText);
  $map.append($container);

  filterProvinces();

  var bg = $map.attr('data-bg-color');
  if (bg) $map.css('background-color', bg);

  currentZoom = 1.0;
  applyZoom();
}

function GetMap() {
  $.get('turkey-map/source/turkey-demo.svg', function (data) {
    buildMap(data);
  }, 'text');
}

// Etiketleri oluştur
function buildLabels() {
  var svg = $('#turkey-map svg')[0];
  if (!svg) return;

  $('#turkey-map svg #turkey > g:visible > g').each(function () {
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
    } catch (e) {}
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

  // İlçeye tıklayınca renklendir
  $(document).on('click', '#turkey-map svg #turkey > g > g', function () {
    var $district = $(this);
    var color = $('#colorPicker').val() || '#3EA1AA';
    $district.find('path, polygon').css('fill', color);
  });

  // İsimleri göster/gizle
  $('#toggleLabels').on('click', function () {
    var $map = $('#turkey-map');
    if ($map.hasClass('labels-visible')) {
      $map.removeClass('labels-visible');
      $(this).text('İsimleri Göster');
    } else {
      buildLabels();
      updateLabelSize();
      $map.addClass('labels-visible');
      $(this).text('İsimleri Gizle');
    }
  });

  // Yazı boyutu
  $('#labelSize').on('input change', function () {
    updateLabelSize();
  });

  // İl sınırları
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

  // Zoom butonları
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

  // SVG kaydet
  $('#saveSvg').on('click', function () {
    var svgElem = $('#turkey-map svg')[0];
    if (!svgElem) return;

    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgElem);
    if (!source.match(/^<\?xml/)) {
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    var blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'secili-iller-harita.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Kayıtlı SVG yükle
  $('#loadSvg').on('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var text = ev.target.result;
      buildMap(text);
      $('#turkey-map').removeClass('labels-visible');
      $('#toggleLabels').text('İsimleri Göster');
    };
    reader.readAsText(file);
  });
});
