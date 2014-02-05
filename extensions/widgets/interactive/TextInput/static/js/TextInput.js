window.onWidgetLoad = function() {
  window.parent.postMessage(
    JSON.stringify({'widgetHeight': document.body.scrollHeight}),
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
