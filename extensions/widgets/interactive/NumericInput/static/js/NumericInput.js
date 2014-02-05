window.onWidgetLoad = function() {
  window.parent.postMessage(
    JSON.stringify({'widgetHeight': document.body.scrollHeight}),
    window.location.protocol + '//' + window.location.host);
};

function NumericInput($scope) {
  $scope.placeholder = GLOBALS.placeholder;

  $scope.submitAnswer = function(answer) {
    if (parent.location.pathname.indexOf('/explore') === 0) {
      window.parent.postMessage(
          JSON.stringify({'submit': answer}),
          window.location.protocol + '//' + window.location.host
      );
    }
  };
}
