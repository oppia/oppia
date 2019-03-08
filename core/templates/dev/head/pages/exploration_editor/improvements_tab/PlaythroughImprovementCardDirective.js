oppia.directive('playthroughImprovementCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'playthrough_improvement_card_directive.html'),
      controller: [
        '$scope', '$attrs', 'HtmlEscaperService', 'PlaythroughIssuesService',
        function($scope, $attrs, HtmlEscaperService, PlaythroughIssuesService) {
          var data = HtmlEscaperService.escapedJsonToObj($attrs.data);
          $scope.playthroughIds = data.playthrough_ids;
          $scope.suggestions = data.suggestions;

          $scope.showPlaythrough = PlaythroughIssuesService.showPlaythroughModal;
        }
      ]
    }
  }
]);
