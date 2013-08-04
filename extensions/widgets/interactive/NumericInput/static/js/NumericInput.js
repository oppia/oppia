var numeric = angular.module('numeric', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
numeric.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function NumericInput($scope) {
  $scope.placeholder = GLOBALS.placeholder;

  $scope.submitAnswer = function(answer) {
    if (parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': answer}),
          window.location.protocol + '//' + window.location.host
      );
    }
  };
}
