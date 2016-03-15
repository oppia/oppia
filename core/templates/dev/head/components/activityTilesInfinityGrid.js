oppia.directive('activityTilesInfinityGrid', [function() {
  return {
    restrict: 'E',
    templateUrl: 'components/activityTilesInfinityGrid',
    controller: [
      '$scope', '$rootScope', '$modal', '$window', 'searchService',
      function($scope, $rootScope, $modal, $window, searchService) {
        $scope.showMoreExplorations = function() {
          if (!$rootScope.loadingMessage) {
            $scope.pageLoaderIsBusy = true;
            searchService.loadMoreData(function(data,
              hasPageFinishedLoading) {
              $scope.allExplorationsInOrder =
              $scope.allExplorationsInOrder.concat(
                data.explorations_list);
              $scope.finishedLoadingPage = hasPageFinishedLoading;
              $scope.pageLoaderIsBusy = false;
            });
          }
        };
      }
    ]
  };
}]);
