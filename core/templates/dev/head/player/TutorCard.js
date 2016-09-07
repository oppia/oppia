oppia.directive('tutorCard', [function() {
  return {
    restrict: 'E',
    scope: {
      activeCard: '=',
      isInteractionInline: '=',
      startCardChangeAnimation: '=',
      showNextCard: '&',
      interactionInstructions: '=',
      showSupplementalCard: '&'
    },
    templateUrl: 'skins/TutorCard',
    controller: [
    '$scope', 'oppiaPlayerService', 'UrlInterpolationService',
    'playerPositionService', 'playerTranscriptService',
      function($scope, oppiaPlayerService, UrlInterpolationService) {
        $scope.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_black_72px.png'));

        var CONTENT_FOCUS_LABEL_PREFIX = 'content-focus-label-';
        $scope.getContentFocusLabel = function(index) {
          return CONTENT_FOCUS_LABEL_PREFIX + index;
        };

        $scope.arePreviousResponsesShown = false;
        $scope.toggleShowPreviousResponses = function() {
          $scope.arePreviousResponsesShown = !$scope.arePreviousResponsesShown;
        };

        $scope.profilePicture = (UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png'));
        $scope.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER =
            GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER;

        oppiaPlayerService.getUserProfileImage().then(function(result) {
          $scope.profilePicture = result;
        });

        var TWO_CARD_THRESHOLD_PX = 960;
        $scope.isViewportNarrow = function() {
          return $scope.windowWidth < TWO_CARD_THRESHOLD_PX;
        };
        $scope.submitAnswer = function(answer, interactionRulesService) {
          $scope.$parent.submitAnswer(answer, interactionRulesService);
        };
      }
    ]
  };
}]);
