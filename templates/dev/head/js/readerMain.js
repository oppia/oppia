function ReaderMain($scope, $http, warningsData) {
  $scope.currentUrl = document.URL;

  /**
   * Displays a model explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
   $scope.showModal = function(id) {
     $scope.currentId = id;
     $('#embedModal').modal();
   };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderMain.$inject = ['$scope', '$http', 'warningsData'];
