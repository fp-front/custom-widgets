jQuery(function(){
  console.log('map-widget - ready');

  if ($(window).width() > 991){
    $('.fp_map [data-list]').slideUp(0);
  }
  else {
    $('.fp_map [data-map]').slideDown(0);
  }

  $('.fp_map [data-regionlist]').each(function(){
    var $list = $(this);
    if($list.data('regionlist') != 'all'){
      $list.slideUp(0);
    }
  });

  $('.fp_map [data-maptoggle]').on('click', function(ev){
    ev.preventDefault();
    var $link = $(this);
    var $map = $('.fp_map [data-map]');
    var $list = $('.fp_map [data-list]');
    var toggle = $link.data('maptoggle');

    $link.siblings('[data-maptoggle]').removeClass('active');
    $link.addClass('active');

    if(toggle == 'map' & !$map.is(':visible')){
      $list.slideUp(300);
      $map.slideDown(300);
    }
    else if(toggle == 'list' & !$list.is(':visible')){
      $map.slideUp(300);
      $list.slideDown(300);
    }
  });

  $('.fp_map [data-mapfilter]').on('click', function(ev){
    ev.preventDefault();
    var $link = $(this);
    var $lists = $('.fp_map [data-regionlist]');
    var lat = parseFloat($link.data('lat'));
    var lng = parseFloat($link.data('lng'));
    var zoom = parseFloat($link.data('zoom'));
    var region = $link.data('region');

    $link.closest('ul').find('[data-mapfilter]').removeClass('active');
    $link.addClass('active');

    map.setCenter({lat:lat, lng:lng});
    map.setZoom(zoom);

    $lists.each(function(){
      var $list = $(this);
      if($list.data('regionlist') != region){
        $list.slideUp(300);
      }
    });

    $lists.filter('[data-regionlist="' + region + '"]').slideDown(300);
  });

  $('.fp_map [data-accordionheader]').on('click', function(ev){
    ev.preventDefault();
    var $header = $(this);
    var region = $header.data('accordionheader');

    if(!$header.hasClass('active')){
      $('.fp_map [data-accordioncontent]').slideUp(300);
      $('.fp_map [data-accordioncontent=' + region + ']').slideDown(300);

      $('.fp_map [data-accordionheader]').removeClass('active');
      $header.addClass('active');
    }
    else {
      $('.fp_map [data-accordioncontent]').slideUp(300);
      $('.fp_map [data-accordionheader]').removeClass('active');
    }
  });

  $(window).on('load', function(){
    initMap();
  });
});

var mapStyle = [
  {
    stylers: [
      {saturation:-100},
      {visibility:"simplified"}
    ]
  },
  {
    featureType:"water",
    stylers:[
      {color:"#ffffff"}
    ]
  },
  {
    featureType:"landscape",
    stylers:[
      {color:"#f1f1f1"}
    ]
  },
  {
    featureType:"administrative.country",
    elementType:"labels.text.fill",
    stylers:[
      {color:"#737373"},
      {visibility:"simplified"}
    ]
  },
  {
    featureType:"administrative.locality",
    stylers:[
      {visibility:"simplified"}
    ]
  }
];

var map, markers, markerImg, markerShape, clusterImg, clusterExt, infoWindows;

function initMap(){
  //var host = window.location.protocol + "//" +  window.location.host ;
  var clusterBase64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMzZweCIgaGVpZ2h0PSIzNnB4IiB2aWV3Qm94PSIwIDAgMzYgMzYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5VbnRpdGxlZDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIHg9IjAiIHk9IjAiIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiI+PC9yZWN0PgogICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwiIGZpbGwtb3BhY2l0eT0iMC41IiBmaWxsPSIjMDAzMzhEIiBjeD0iMTgiIGN5PSIxOCIgcj0iMTciPjwvY2lyY2xlPgogICAgPC9nPgo8L3N2Zz4=";

  var markerBase64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjdweCIgaGVpZ2h0PSIzNnB4IiB2aWV3Qm94PSIwIDAgMjcgMzYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUyLjIgKDY3MTQ1KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5VbnRpdGxlZDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJtYXJrZXItLW9yaWciIGZpbGw9IiMwMDMzOEQiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy4zMTMwNzY5LDAgQzUuOTYyODQwOTYsMC4wMDU2NzIxNzUzMyAwLjAwNTcyNjcxNTQ4LDUuOTA2MDUxOTkgNi43ODU3NTAzNWUtMTYsMTMuMTg2Mjg1NyBDLTAuMDA2NDE5NDA1NzYsMTUuMDQxMzA3NyAwLjM5MDI1MTM5NSwxNi44NzU5Nzc2IDEuMTYzMDc2OTIsMTguNTY1NzE0MyBDNC40OTY1Mzg0NiwyNS43NjU3MTQzIDEwLjg3MjY5MjMsMzMuMzk3NzE0MyAxMi43NTIzMDc3LDM1LjU1NzcxNDMgQzEyLjg5MjM5MDQsMzUuNzIwMjQ3OCAxMy4wOTczMjA2LDM1LjgxMzg1MiAxMy4zMTMwNzY5LDM1LjgxMzg1MiBDMTMuNTI4ODMzMiwzNS44MTM4NTIgMTMuNzMzNzYzNCwzNS43MjAyNDc4IDEzLjg3Mzg0NjIsMzUuNTU3NzE0MyBDMTUuNzUzNDYxNSwzMy4zOTc3MTQzIDIyLjE4MTUzODUsMjUuNzg2Mjg1NyAyNS40NjMwNzY5LDE4LjU2NTcxNDMgQzI2LjIzNTkwMjUsMTYuODc1OTc3NiAyNi42MzI1NzMzLDE1LjA0MTMwNzcgMjYuNjI2MTUzOCwxMy4xODYyODU3IEMyNi42MjA0MjcxLDUuOTA2MDUxOTkgMjAuNjYzMzEyOSwwLjAwNTY3MjE3NTMzIDEzLjMxMzA3NjksMCBaIE0xMy4zMTMwNzY5LDIwLjAzNjU3MTQgQzkuNDkzMzkwNjMsMjAuMDM2NTcxNCA2LjM5NjkyMzA4LDE2Ljk2OTU5NCA2LjM5NjkyMzA4LDEzLjE4NjI4NTcgQzYuMzk2OTIzMDgsOS40MDI5NzczOCA5LjQ5MzM5MDYzLDYuMzM2IDEzLjMxMzA3NjksNi4zMzYgQzE3LjEzMjc2MzIsNi4zMzYgMjAuMjI5MjMwOCw5LjQwMjk3NzM4IDIwLjIyOTIzMDgsMTMuMTg2Mjg1NyBDMjAuMjIzNTExOSwxNi45NjcyNDUzIDE3LjEzMDM5MTksMjAuMDMwOTA3MSAxMy4zMTMwNzY5LDIwLjAzNjU3MTQgWiIgaWQ9IlNoYXBlIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";

  markerImg = {
    // url: host + '/wp-content/plugins/custom-widgets/widgets/map-widget/assets/map/marker.svg',
    url: markerBase64,
    size: new google.maps.Size(36, 36),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(18, 36),
    scaledSize: new google.maps.Size(36, 36)
  };

  markerShape = {
      coords: [0, 0, 36, 0, 36, 36, 0, 36],
      type: 'poly'
  };

  // clusterImg = host + '/wp-content/plugins/custom-widgets/widgets/map-widget/assets/map/cluster';
  // clusterExt = 'svg';
  clusterImg = '';

  var wrapper = document.getElementsByClassName('fp_map__content__map__google-map')[0];
  map = new google.maps.Map(wrapper, {
    zoom: 2.5,
    center: {
      lat: 25,
      lng: 0
    },
    styles: mapStyle,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false
  });

  markers = [];
  infoWindows = [];
  for(var i = 0; i < locations.length; i++){
    var loc =  locations[i];
    var markerMessage = makeMessage(loc);
    var m = makeMarker(new google.maps.LatLng(loc.lat, loc.lng), markerImg, markerShape, markerMessage);
    markers.push(m);
  }

  var clusterOpts = {
    styles: [
      {
        anchorIcon: [18, 18],
        height: 36,
        width: 36,
        // url: clusterImg + '1.' + clusterExt,
        url: clusterBase64,
        textColor: 'white',
        textSize: 16
      },
      {
        anchorIcon: [18, 18],
        height: 36,
        width: 36,
        // url: clusterImg + '2.' + clusterExt,
        url: clusterBase64,
        textColor: 'white',
        textSize: 16
      },
      {
        anchorIcon: [18, 18],
        height: 36,
        width: 36,
        // url: clusterImg + '3.' + clusterExt,
        url: clusterBase64,
        textColor: 'white',
        textSize: 16
      },
      {
        anchorIcon: [18, 18],
        height: 36,
        width: 36,
        // url: clusterImg + '4.' + clusterExt,
        url: clusterBase64,
        textColor: 'white',
        textSize: 16
      },
      {
        anchorIcon: [18, 18],
        height: 36,
        width: 36,
        // url: clusterImg + '5.' + clusterExt,
        url: clusterBase64,
        textColor: 'white',
        textSize: 16
      },
    ]
  }
  // Add a marker clusterer to manage the markers.
  var markerCluster = new MarkerClusterer(map, markers, clusterOpts);

  // Set map bounds with all markers
  // boundsMarkers(markers);
}

function makeMessage(mrkr){
  var m = mrkr;
  var msg = '';

  msg = msg + '<div class="marker_content">';
  if (m.image.length){
    msg = msg + '<div class="marker_content__image">';
    msg = msg + '<img src="' + m.image + '">';
    msg = msg + '</div>';
  }
  msg = msg + '<div class="marker_content__info">';

  msg = msg + '<p class="marker_content__info__title">' + m.title + '</p>';
  msg = msg + '<p class="marker_content__info__text">' + m.text + '</p>';
  if (m.phone.length){
    msg = msg + '<a href="tel:' + m.phone + '" class="marker_content__info__link marker_content__info__link--tel">' + m.phone + '</a>';
  }
  if (m.email.length){
    msg = msg + '<a href="mailto:' + m.email + '" class="marker_content__info__link marker_content__info__link--mail">' + m.email + '</a>';
  }
  msg = msg + '<p class="marker_content__info__address">' + m.address + '</p>';
  if (m.cta){
    msg = msg + '<a href="' + m.cta_url + '" class="marker_content__info__cta marker_content__info__cta--' + m.cta_style +'" ';
    if (m.cta_blank){
      msg = msg + 'target="_blank"';
    }
    msg = msg + '><span>' + m.cta_text + '</span></a>'
  }
  msg = msg + '</div>';
  msg = msg + '</div>';

  return msg;
}

// Create a custom marker
// makeMarker(new google.maps.LatLng(latitude, longitude), icon, shape, "message");
function makeMarker( position, icon, shape, message ) {
  var m = new google.maps.Marker({
      position: position,
      map: map,
      icon: icon,
      shape: shape,
      message: message
  });
  google.maps.event.addListener(m, 'click', function() {
      var infowindow = new google.maps.InfoWindow({
          content: this.message,
          position: this.position
      });

      if (infoWindows.length) {
        for (var i = 0; i < infoWindows.length; i++) {
          infoWindows[i].close();
        }
        infoWindows = [];
      }

      infowindow.open(map);
      infoWindows.push(infowindow);
  });
  return m;
}

// function boundsMarkers(marcadores){
//   var bounds = new google.maps.LatLngBounds();
//   for (var i = 0; i < marcadores.length; i++) {
//     bounds.extend(marcadores[i].getPosition());
//   }
//   map.fitBounds(bounds); // Adjust map view to contain all markers
//   map.panTo(bounds.getCenter()); // Fix to avoid markers disappearence (happens sometimes with map.setCenter and map.fitBounds)
// }
