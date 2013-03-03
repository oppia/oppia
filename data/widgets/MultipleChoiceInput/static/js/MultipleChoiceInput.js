var mc = angular.module('mc', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
mc.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function MultipleChoiceInput($scope) {
  $scope.submitAnswer = function(answer) {
    if (!answer) {
      return;
    }
    window.parent.postMessage(
        {'submit': answer}, window.location.origin
    );
  };
}
