app = angular.module('app', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function IFrame($scope) {
  $scope.childPageUrl = GLOBALS.childPageUrl;
  $scope.childUrlArray = $scope.childPageUrl.split('/');
  $scope.childUrlProtocol = $scope.childUrlArray[0];
  $scope.childUrlHost = $scope.childUrlArray[2];
}
