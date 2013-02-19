function Continue($scope) {
  $scope.submitAnswer = function() {
  	$scope.$parent.submitAnswer();
  }
}
