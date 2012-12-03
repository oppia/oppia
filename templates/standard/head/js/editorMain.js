function EditorMain($scope, $http) {
  /**
   * Creates a new exploration.
   */
  $scope.createNewExploration = function() {
    $http.get(
        'create_new',
        '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              console.log(data);
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              $scope.addWarning(data.error ? data.error :
                    'Error: Could not add new exploration.');
            });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorMain.$inject = ['$scope', '$http'];
