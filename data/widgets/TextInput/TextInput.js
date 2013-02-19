function TextInput($scope) {
  $scope.submitAnswer = function() {
  	$scope.$parent.submitAnswer();
  }
}
