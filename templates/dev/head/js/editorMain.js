function EditorMain($scope, $http, warningsData) {
  $scope.openNewExplorationModal = function() {
    $scope.newExplorationIsBeingAdded = true;
    $('#newExplorationModal').modal();
  };

  $scope.closeNewExplorationModal = function() {
    $('#newExplorationModal').modal('hide');
  };

  // TODO(sll): Change the YAML file input to a file upload, rather than
  // a textarea.
  $scope.createNewExploration = function() {
    console.log($scope.newExplorationYaml);
    var request = $.param({
        title: $scope.newExplorationTitle || '',
        category: $scope.newExplorationCategory || '',
        yaml: $scope.newExplorationYaml || ''
    }, true);

    $http.post(
        '/create_new',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.newExplorationTitle = '';
              $scope.newExplorationCategory = '';
              $scope.newExplorationYaml = '';
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              warningsData.addWarning(data.error ? data.error :
                    'Error: Could not add new exploration.');
            });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorMain.$inject = ['$scope', '$http', 'warningsData'];
