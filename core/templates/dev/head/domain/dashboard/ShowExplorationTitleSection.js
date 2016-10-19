oppia.directive('explorationTitleSection', function($compile) {
  return {
    restrict: 'E',
    scope: {
      getExploration: '&exploration',
      activeExplorationId: '=activeExplorationId'
    },
    link: function(scope, element) {
      scope.exploration = scope.getExploration();
      var titleSection = (
        (scope.exploration.status === 'private') ?
         ('<a ng-href="/create/<[exploration.id]>">' +
          element.html() + '</a>') : element.html());

      element.replaceWith($compile(titleSection)(scope));
    }
  };
});
