function Gallery($scope, $http, warningsData) {
  $scope.currentUrl = document.URL;

  /**
   * Displays a model explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
   $scope.showModal = function(id) {
     $scope.currentId = id;
     $('#embedModal').modal();
   };

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
Gallery.$inject = ['$scope', '$http', 'warningsData'];
