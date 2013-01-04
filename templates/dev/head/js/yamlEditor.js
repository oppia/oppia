function YamlEditor($scope, $http, stateData, explorationData, warningsData) {
  // Switch to the stateEditor tab when this controller is activated.
  $('#editorViewTab a[href="#stateEditor"]').tab('show');

  // Initializes the YAML textarea using data from the backend.
  stateData.getData($scope.stateId);
  $scope.$on('stateData', function() {
    $scope.yaml = stateData.yaml;
  });

  /**
   * Saves the YAML representation of a state.
   */
  $scope.saveState = function() {
    $http.put(
        '/create/convert/' + $scope.explorationId,
        'state_id=' + $scope.stateId +
            '&yaml_file=' + encodeURIComponent($scope.yaml),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.$parent.states[$scope.stateId] = data.state;
              $scope.$parent.stateContent = data.stateContent;
              $scope.$parent.inputType = data.inputType;
              $scope.$parent.classifier = data.classifier;

              // TODO(sll): Try and do this refresh without requiring an
              // update from the backend.
              // TODO(sll): Update the exploration and graph view.
              stateData.getData($scope.stateId);
            }).error(function(data) {
              warningsData.addWarning(data.error ||
                  'Error: Could not add new state.');
            });
  };
}

YamlEditor.$inject = ['$scope', '$http', 'stateData', 'explorationData', 'warningsData'];
