var numeric = angular.module('numeric', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
numeric.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function NumericInput($scope) {
  $scope.submitAnswer = function(answer) {
    if (!answer) {
      return;
    }
    window.parent.postMessage(
        {'submit': answer}, window.location.origin
    );
  };
}
