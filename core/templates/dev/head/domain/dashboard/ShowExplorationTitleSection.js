oppia.directive('explorationTitleSection', function($compile) {
  return {
    restrict: 'E',
    scope: {
      exploration: '='
    },
    link: function(scope, element) {
      var titleSection = (
        (scope.exploration.status === 'private') ?
         ('<a ng-href="/create/<[exploration.id]>">' +
          element.html() + '</a>') : element.html());

      element.replaceWith($compile(titleSection)(scope));
    }
  };
});
