angular.module('activityTilesInfinityGridModule').directive('activityTilesInfinityGrid', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library/' +
        'activity_tiles_infinity_grid_directive.html'),
      controller: [
        '$scope', '$rootScope', 'SearchService', 'WindowDimensionsService',
        function($scope, $rootScope, SearchService, WindowDimensionsService) {
          $scope.endOfPageIsReached = false;
          $scope.allActivitiesInOrder = [];
          // Called when the first batch of search results is retrieved from the
          // server.
          $scope.$on(
            'initialSearchResultsLoaded', function(evt, activityList) {
              $scope.allActivitiesInOrder = activityList;
              $scope.endOfPageIsReached = false;
            }
          );

          $scope.showMoreActivities = function() {
            if (!$rootScope.loadingMessage && !$scope.endOfPageIsReached) {
              $scope.searchResultsAreLoading = true;
              SearchService.loadMoreData(function(data, endOfPageIsReached) {
                $scope.allActivitiesInOrder =
                $scope.allActivitiesInOrder.concat(
                  data.activity_list);
                $scope.endOfPageIsReached = endOfPageIsReached;
                $scope.searchResultsAreLoading = false;
              }, function(endOfPageIsReached) {
                $scope.endOfPageIsReached = endOfPageIsReached;
                $scope.searchResultsAreLoading = false;
              });
            }
          };

          var libraryWindowCutoffPx = 530;
          $scope.libraryWindowIsNarrow = (
            WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$apply();
          });
        }
      ]
    };
  }
]);
