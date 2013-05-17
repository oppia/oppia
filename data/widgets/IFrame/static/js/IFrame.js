app = angular.module('app', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function IFrame($scope) {
  $scope.childPageUrl = GLOBALS.childPageUrl;
  $scope.$apply();

  window.addEventListener('message', receiveMessage, false);

  function receiveMessage(evt) {
    console.log('Event received from child iframe.');
    if (evt.origin == window.location.protocol + '//' + window.location.host
        && parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': answer}),
          window.location.protocol + '//' + window.location.host
      );
    }
  }
}
