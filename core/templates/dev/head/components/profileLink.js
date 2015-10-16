oppia.directive('profileLinkText', [function() {
  return {
    restrict: 'E',
    scope: {
      linkedName: '@'
    },
    templateUrl: 'components/profileLinkText',
  };
}]);

oppia.directive('profileLinkImage', [function() { 
  return {
    restrict: 'E',
    scope: {
      linkedImage: '@'
    },
    templateUrl: 'components/profileLinkImage',
  };
}]);
