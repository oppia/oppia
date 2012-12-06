function IndexReader($scope) {
  /**
   * Redirects the reader to the editor page.
   */
  $scope.openEditor = function() {
    window.location = editorUrl;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
IndexReader.$inject = ['$scope'];
