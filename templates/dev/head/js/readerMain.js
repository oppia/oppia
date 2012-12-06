function ReaderMain($scope, $http) {
  $scope.currentUrl = document.URL;

  /**
   * Displays a model explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
   $scope.showModal = function(id) {
     $scope.currentId = id;
     $('#embedModal').modal();
   };

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
ReaderMain.$inject = ['$scope', '$http'];
