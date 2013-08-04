im = angular.module('im', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
im.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function initialize() {
  var coords = GLOBALS.coords || [0, 0];
  var zoom_level = parseInt(GLOBALS.zoom, 10) || 0;
  var map = new google.maps.Map(document.getElementById("map-canvas"), {
      center: new google.maps.LatLng(coords[0], coords[1]),
      zoom: zoom_level,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Set a marker at where user just clicked on.
  var response_coords = GLOBALS.response_coords || [0, 0];
  new google.maps.Marker({
    position: new google.maps.LatLng(response_coords[0], response_coords[1]),
    map: map
  });
}
google.maps.event.addDomListener(window, 'load', initialize);
