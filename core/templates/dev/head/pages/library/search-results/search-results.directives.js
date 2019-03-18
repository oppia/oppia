angular.module('searchResultsModule').directive('searchResults', [
    '$q', 'UrlInterpolationService', function($q, UrlInterpolationService) {
      return {
        restrict: 'E',
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/library/search-results/search-results.template.html'),
        controller: [
          '$scope', '$rootScope', '$q', '$timeout', '$window',
          'SiteAnalyticsService', 'UserService',
          function($scope, $rootScope, $q, $timeout, $window,
              SiteAnalyticsService, UserService) {
            $scope.someResultsExist = true;
  
            $scope.userIsLoggedIn = null;
            $rootScope.loadingMessage = 'Loading';
            var userInfoPromise = UserService.getUserInfoAsync();
            userInfoPromise.then(function(userInfo) {
              $scope.userIsLoggedIn = userInfo.isLoggedIn();
            });
  
            // Called when the first batch of search results is retrieved from the
            // server.
            var searchResultsPromise = $scope.$on(
              'initialSearchResultsLoaded', function(evt, activityList) {
                $scope.someResultsExist = activityList.length > 0;
              }
            );
  
            $q.all([userInfoPromise, searchResultsPromise]).then(function() {
              $rootScope.loadingMessage = '';
            });
  
            $scope.onRedirectToLogin = function(destinationUrl) {
              SiteAnalyticsService.registerStartLoginEvent('noSearchResults');
              $timeout(function() {
                $window.location = destinationUrl;
              }, 150);
              return false;
            };
  
            $scope.noExplorationsImgUrl =
             UrlInterpolationService.getStaticImageUrl(
               '/general/no_explorations_found.png');
          }
        ]
      };
    }]);
  ;
