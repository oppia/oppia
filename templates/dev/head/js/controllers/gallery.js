oppia.factory('GalleryData', function($rootScope, $http, warningsData) {
  var GalleryData = {};
  var galleryUrl = '/gallery/data/';

  GalleryData.getData = function() {
    var obj = this;
    $http.get(galleryUrl).success(function(data) {
      obj.data = data;
      obj.broadcastGalleryData();
    }).error(function(data) {
      warningsData.addWarning('Server error: ' + data.error);
    });
  };

  GalleryData.broadcastGalleryData = function() {
    $rootScope.$broadcast('galleryData');
  };

  GalleryData.getData();

  return GalleryData;
});


function Gallery($scope, $http, warningsData, GalleryData) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;

  $scope.$on('galleryData', function() {
    console.log(GalleryData.data.categories);
    $scope.categories = GalleryData.data.categories;
  });

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
    $scope.includeYamlFile = false;
    $scope.useSampleExploration = false;
    $('#newExplorationModal').modal();
  };

  $scope.closeNewExplorationModal = function() {
    $('#newExplorationModal').modal('hide');
  };

  $scope.createNewExploration = function() {
    if ($scope.file && $scope.includeYamlFile) {
      // A yaml file was uploaded.
      var form = new FormData();
      form.append('yaml', $scope.file);
      form.append('category', $scope.newExplorationCategory || '');
      form.append('title', $scope.newExplorationTitle || '');

      $.ajax({
          url: '/create_new',
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          success: function(data) {
            $scope.newExplorationTitle = '';
            $scope.newExplorationCategory = '';
            $scope.newExplorationYaml = '';
            window.location = '/create/' + JSON.parse(data).explorationId;
          },
          error: function(data) {
            warningsData.addWarning(data.error || 'Error communicating with server.');
          }
      });
      return;
    } else {
      var request = $.param({
          title: $scope.newExplorationTitle || '',
          category: $scope.newExplorationCategory || '',
          use_sample: $scope.useSampleExploration
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
    }
  };

}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Gallery.$inject = ['$scope', '$http', 'warningsData', 'GalleryData'];
