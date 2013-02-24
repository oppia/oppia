function SetInput($scope) {
  $scope.submitAnswer = function() {
    $scope.$parent.submitAnswer();
  };

  $scope.addElement = function() {
    $scope.$parent.answer.push($scope.newElement);
    $scope.newElement = '';
  };

  $scope.deleteElement = function(index) {
    $scope.$parent.answer.splice(index, 1);
  };

  $scope.submitAnswer = function() {
    // Send a JSON version of $scope.answer to the backend.
    $http.post(
        '/learn/' + $scope.explorationId + '/' + $scope.stateId,
        'answer=' + JSON.stringify($scope.$parent.answer) +
            '&block_number=' + JSON.stringify($scope.blockNumber),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshPage);
  };
}
