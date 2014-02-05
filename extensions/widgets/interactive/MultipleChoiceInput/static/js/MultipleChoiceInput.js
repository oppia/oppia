function MultipleChoiceInput($scope) {
  $scope.choices = GLOBALS.choices;

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

/**
 * Injects dependencies in a way that is preserved by minification.
 */
MultipleChoiceInput.$inject = ['$scope'];
