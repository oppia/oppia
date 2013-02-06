function NumericInput($scope) {
  $scope.submitAnswer = function() {
  	$scope.$parent.submitAnswer();
  }
}
