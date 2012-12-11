function EditorConverter($scope, $http) {
  // The pathname should be: .../create/convert/{exploration_id}
  var pathnameArray = window.location.pathname.split('/');
  $scope.explorationId = pathnameArray[3];

  // TODO(sll): Initialize this default with the current status of the
  // exploration in the datastore.
  $scope.yaml = 'Activity 1:\n  answers:\n  - default:\n      dest: END\n' +
      '      text: First category\n  content:\n  - text: Text1\n  - text: Text2\n  ' +
      '- image: 41pMJXnVrf\n  - video: jd5ffc48RJU\n  - widget: Yp9mxyOKSa\n' +
      '  input_type:\n    name: set';

  /**
   * Saves an exploration.
   */
  $scope.saveExploration = function() {
    $http.put(
        '/create/convert/' + $scope.explorationId,
        'yaml_file=' + encodeURIComponent($scope.yaml),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              console.log(data);
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              $scope.addWarning(data.error ||
                  'Error: Could not add new exploration.');
            });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorConverter.$inject = ['$scope', '$http'];
