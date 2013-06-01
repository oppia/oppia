var text = angular.module('text', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
text.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function TextInput($scope) {
  $scope.placeholder = GLOBALS.placeholder;

  $scope.submitAnswer = function(answer) {
    if (!answer) {
      return;
    }
    if (parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': answer}),
          window.location.protocol + '//' + window.location.host
      );
    }
  };
}
