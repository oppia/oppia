function SetInput($scope) {
  $scope.answer = [];

  $scope.addElement = function() {
    $scope.answer.push($scope.newElement);
    $scope.newElement = '';
  };

  $scope.deleteElement = function(index) {
    $scope.answer.splice(index, 1);
  };

  $scope.submitAnswer = function(answer) {
    // Send a JSON version of $scope.answer to the backend.
    $scope.$parent.submitAnswer(JSON.stringify($scope.answer));
  };
}
