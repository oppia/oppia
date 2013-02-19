function MultipleChoiceInput($scope) {
  $scope.submitAnswer = function() {
  	$scope.$parent.submitAnswer();
  }
}
