app = angular.module('app', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function IFrame($scope) {
  $scope.childPageUrl = GLOBALS.childPageUrl;
  $scope.childUrlArray = $scope.childPageUrl.split('/');
  $scope.childUrlProtocol = $scope.childUrlArray[0];
  $scope.childUrlHost = $scope.childUrlArray[2];

  window.addEventListener('message', receiveMessage, false);

  function receiveMessage(evt) {
    console.log('Event received from child iframe.');
    console.log(evt);
    if (evt.origin == $scope.childUrlProtocol + '//' + $scope.childUrlHost &&
      parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': evt.data}),
          window.location.protocol + '//' + window.location.host
      );
    }
  }
}
