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
    $http.put(
        '/create/' + $scope.explorationId + '/' + $scope.stateId + '/data/',
        'yaml_file=' + encodeURIComponent($scope.yaml),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.$parent.states[$scope.stateId] = data.state;
              $scope.$parent.stateContent = data.stateContent;

              // TODO(sll): Try and do this refresh without requiring an
              // update from the backend.
              // TODO(sll): Update the exploration and graph view.
              $scope.processStateData(explorationData.getStateData($scope.stateId));
            }).error(function(data) {
              warningsData.addWarning(data.error ||
                  'Error: Could not add new state.');
            });
  };
}

YamlEditor.$inject = ['$scope', '$http', '$routeParams', 'explorationData', 'warningsData'];
