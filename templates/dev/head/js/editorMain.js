function EditorMain($scope, $http, warningsData) {
  $scope.openNewExplorationModal = function() {
    $scope.newExplorationIsBeingAdded = true;
    $('#newExplorationModal').modal();
  };

  $scope.closeNewExplorationModal = function() {
    $('#newExplorationModal').modal('hide');
  };

  $scope.createNewExploration = function() {
    var request = $.param({
        title: $scope.newExplorationTitle,
        category: $scope.newExplorationCategory
    }, true);

    $http.post(
        '/create_new',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.newExplorationTitle = '';
              $scope.newExplorationCategory = '';
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
