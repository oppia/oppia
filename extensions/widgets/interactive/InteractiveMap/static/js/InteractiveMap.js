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

  google.maps.event.addListener(map, 'click', function(e) {
    var ll = e.latLng;
    new google.maps.Marker({
      position: ll,
      map: map
    });
    if (parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': ll.lat() + ',' + ll.lng()}),
          window.location.protocol + '//' + window.location.host);
    }
  });
}
google.maps.event.addDomListener(window, 'load', initialize);
