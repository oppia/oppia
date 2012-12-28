function YamlEditor($scope, $http, stateData, explorationData, warningsData) {
  // The pathname should be: .../create/{exploration_id}/[state_id]
  var pathnameArray = window.location.pathname.split('/');
  $scope.$parent.explorationId = pathnameArray[2];

  // Initializes the YAML textarea using data from the backend.
  stateData.getData($scope.$parent.stateId);
  $scope.$on('stateData', function() {
    $scope.yaml = stateData.yaml;
  });

  /**
   * Saves the YAML representation of a state.
   */
  $scope.saveState = function() {
    $http.put(
        '/create/convert/' + $scope.$parent.explorationId,
        'state_id=' + $scope.$parent.stateId +
            '&yaml_file=' + encodeURIComponent($scope.yaml),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.$parent.states[$scope.$parent.stateId] = data.state;
              $scope.$parent.stateContent = data.stateContent;
              $scope.$parent.inputType = data.inputType;
              $scope.$parent.classifier = data.classifier;

              // TODO(sll): Try and do this refresh without requiring an
              // update from the backend.
              stateData.getData($scope.$parent.stateId);
            }).error(function(data) {
              warningsData.addWarning(data.error ||
                  'Error: Could not add new state.');
            });
  };
}

YamlEditor.$inject = ['$scope', '$http', 'stateData', 'explorationData', 'warningsData'];
