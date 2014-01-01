var text = angular.module('text', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
text.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

window.onWidgetLoad = function() {
  window.parent.postMessage(
    {'widgetHeight': document.body.scrollHeight},
    window.location.protocol + '//' + window.location.host);
};

function TextInput($scope) {
  $scope.placeholder = GLOBALS.placeholder;
  $scope.rows = GLOBALS.rows;
  $scope.cols = GLOBALS.columns;
  $scope.answer = '';

  $scope.submitAnswer = function(answer) {
    if (!answer) {
      return;
    }
    if (parent.location.pathname.indexOf('/explore') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': answer}),
          window.location.protocol + '//' + window.location.host
      );
    }
  };
}
