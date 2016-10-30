oppia.directive('supplementalCard', [function() {
  return {
    restrict: 'E',
    scope: {
      showNextCard: '&'
    },
    templateUrl: 'components/SupplementalCard',
    controller: [
    '$scope', 'oppiaPlayerService', 'UrlInterpolationService',
    'playerPositionService', 'playerTranscriptService',
    'ExplorationObjectFactory', 'windowDimensionsService', '$window',
    function($scope, oppiaPlayerService, UrlInterpolationService,
      playerPositionService, playerTranscriptService, explorationObjectFactory,
      windowDimensionsService, $window) {
      var CONTENT_FOCUS_LABEL_PREFIX = 'content-focus-label-';
      var TWO_CARD_THRESHOLD_PX = 960;

      var updateActiveCard = function() {
        var index = playerPositionService.getActiveCardIndex();
        if (index === null) {
          return;
        }
        $scope.activeCard = playerTranscriptService.getCard(index);
        $scope.clearHelpCard();
      };

      $scope.OPPIA_AVATAR_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/avatar/oppia_black_72px.png'));

      $scope.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';

      $scope.helpCardHtml = null;
      $scope.helpCardHasContinueButton = false;

      $scope.clearHelpCard = function() {
        $scope.helpCardHtml = null;
        $scope.helpCardHasContinueButton = false;
      };

      $scope.isViewportNarrow = function() {
        return windowDimensionsService.getWidth() < TWO_CARD_THRESHOLD_PX;
      };
      $scope.isWindowTall = function() {
        return document.body.scrollHeight > $window.innerHeight;
      };

      $scope.submitAnswer = function(answer, interactionRulesService) {
        $scope.$parent.submitAnswer(answer, interactionRulesService);
      };

      $scope.$on('activeCardChanged', function() {
        updateActiveCard();
      });

      $scope.$on('helpCardAvailable', function(event, helpCard) {
        $scope.helpCardHtml = helpCard.helpCardHtml;
        $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
      });

      updateActiveCard();
    }
    ]
  };
}]);
