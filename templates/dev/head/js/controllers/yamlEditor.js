function YamlEditor($scope, $http, $routeParams, explorationData, warningsData) {
  $scope.$parent.stateId = $routeParams.stateId;
  // Switch to the stateEditor tab when this controller is activated.
  $('#editorViewTab a[href="#stateEditor"]').tab('show');

  // Initializes the YAML textarea using data from the backend.
  var data = explorationData.getStateData($scope.stateId);
  $scope.processStateData(data);
  $scope.yaml = data.yaml;

  /**
   * Saves the YAML representation of a state.
   */
  $scope.saveState = function() {
    explorationData.saveStateData($scope.stateId, {'yaml_file': $scope.yaml});
  };
}

YamlEditor.$inject = ['$scope', '$http', '$routeParams', 'explorationData', 'warningsData'];
