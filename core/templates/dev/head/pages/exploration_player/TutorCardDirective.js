oppia.animation('.conversation-skin-responses-animate-slide', function() {
  return {
    removeClass: function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      element.hide().slideDown(400, done);
    },
    addClass: function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      element.slideUp(400, done);
    }
  };
});

oppia.animation('.conversation-skin-animate-card-contents', function() {
  var animateCardChange = function(element, className, done) {
    if (className !== 'animate-card-change') {
      return;
    }

    var currentHeight = element.height();
    var expectedNextHeight = $(
      '.conversation-skin-future-tutor-card ' +
      '.conversation-skin-tutor-card-content'
    ).height();

    // Fix the current card height, so that it does not change during the
    // animation, even though its contents might.
    element.css('height', currentHeight);

    jQuery(element).animate({
      opacity: 0
    }, TIME_FADEOUT_MSEC).animate({
      height: expectedNextHeight
    }, TIME_HEIGHT_CHANGE_MSEC).animate({
      opacity: 1
    }, TIME_FADEIN_MSEC, function() {
      element.css('height', '');
      done();
    });

    return function(cancel) {
      if (cancel) {
        element.css('opacity', '1.0');
        element.css('height', '');
        element.stop();
      }
    };
  };

  return {
    addClass: animateCardChange
  };
});

oppia.directive('tutorCard', ['$compile', function($compile) {
  return {
    restrict: 'E',
    scope: {
      startCardChangeAnimation: '=',
      showNextCard: '&',
      showSupplementalCard: '&'
    },
    templateUrl: 'components/TutorCard',
    compile: function() {
      return {
        pre: function(scope, iElement) {
         /* var attributes = $(iElement).prop('attributes');
          var tutorCard = $(iElement).find(
            '.conversation-skin-main-tutor-card');
          $.each(attributes, function() {
            if (this.name === 'class' || this.name === 'ng-class' ||
                this.name === 'style' || this.name == 'ng-style') {
              tutorCard.attr(this.name, this.value);
              $(iElement).removeAttr(this.name, null);
            }
          });
          $compile(tutorCard)(scope);*/
        }
      };
    },
    controller: [
    '$scope', 'oppiaPlayerService', 'UrlInterpolationService',
    'playerPositionService', 'playerTranscriptService',
    'ExplorationObjectFactory', 'windowDimensionsService',
    function($scope, oppiaPlayerService, UrlInterpolationService,
      playerPositionService, playerTranscriptService, explorationObjectFactory,
      windowDimensionsService) {
      var CONTENT_FOCUS_LABEL_PREFIX = 'content-focus-label-';
      var TWO_CARD_THRESHOLD_PX = 960;

      var updateActiveCard = function() {
        var index = playerPositionService.getActiveCardIndex();
        if (index === null) {
          return;
        }

        var exploration = explorationObjectFactory.get();
        $scope.arePreviousResponsesShown = false;
        $scope.activeCard = playerTranscriptService.getCard(index);
        $scope.isInteractionInline = exploration.isInteractionInline(
          $scope.activeCard.stateName);
        $scope.interactionInstructions = exploration.getInteractionInstructions(
          $scope.activeCard.stateName);
      };

      $scope.arePreviousResponsesShown = false;

      $scope.profilePicture = (UrlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.png'));

      $scope.OPPIA_AVATAR_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/avatar/oppia_black_72px.png'));

      oppiaPlayerService.getUserProfileImage().then(function(result) {
        $scope.profilePicture = result;
      });

      $scope.getContentFocusLabel = function(index) {
        return CONTENT_FOCUS_LABEL_PREFIX + index;
      };

      $scope.toggleShowPreviousResponses = function() {
        $scope.arePreviousResponsesShown = !$scope.arePreviousResponsesShown;
      };

      $scope.isViewportNarrow = function() {
        return windowDimensionsService.getWidth() < TWO_CARD_THRESHOLD_PX;
      };

      $scope.submitAnswer = function(answer, interactionRulesService) {
        $scope.$parent.submitAnswer(answer, interactionRulesService);
      };

      $scope.$on('activeCardChanged', function() {
        updateActiveCard();
      });

      $scope.$on('destinationCardAvailable', function(event, card) {
        $scope.upcomingContentHtml = card.upcomingContentHtml;
        $scope.upcomingParams = card.upcomingParams;
        $scope.upcomingStateName = card.upcomingStateName;
        $scope.upcomingInlineInteractionHtml = (
          card.upcomingInlineInteractionHtml);
      });

      updateActiveCard();
    }
    ]
  };
}]);
