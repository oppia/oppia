oppia.directive('playthroughImprovementCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        data: '=',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'playthrough_improvement_card_directive.html'),
      controller: [
        '$scope', '$attrs', 'HtmlEscaperService', 'PlaythroughIssuesService',
        function($scope, $attrs, HtmlEscaperService, PlaythroughIssuesService) {
          $scope.openPlaythroughModal = function(playthroughId, index) {
            PlaythroughIssuesService.openPlaythroughModal(playthroughId, index);
          };
        }
      ]
    }
  }
]);
