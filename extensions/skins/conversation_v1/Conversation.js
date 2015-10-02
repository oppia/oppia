// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Controller for the conversation skin.
 *
 * @author sll@google.com (Sean Lip)
 */

var TIME_FADEOUT_MSEC = 100;
var TIME_HEIGHT_CHANGE_MSEC = 500;
var TIME_FADEIN_MSEC = 100;
var TIME_NUM_CARDS_CHANGE_MSEC = 500;
var TIME_PADDING_MSEC = 250;
var TIME_SCROLL_MSEC = 600;


oppia.animation('.conversation-skin-responses-animate-slide', function() {
  return {
    enter: function(element, done) {
      element.hide().slideDown()
    },
    leave: function(element, done) {
      element.slideUp();
    }
  };
});

oppia.animation('.conversation-skin-animate-cards', function() {
  // This removes the newly-added class once the animation is finished.
  var animateCards = function(element, className, done) {
    var tutorCardElt = jQuery(element).find('.conversation-skin-tutor-card');
    var supplementalCardElt = jQuery(element).find(
      '.conversation-skin-supplemental-card');

    if (className === 'animate-to-two-cards') {
      supplementalCardElt.css('opacity', '0');
      tutorCardElt.animate({
        'margin-left': '0'
      }, TIME_NUM_CARDS_CHANGE_MSEC, function() {
        tutorCardElt.css('margin-left', '0');
        tutorCardElt.css('margin-right', '');
        tutorCardElt.css('float', 'left');

        supplementalCardElt.animate({
          'opacity': '1'
        }, TIME_FADEIN_MSEC, function() {
          supplementalCardElt.css('opacity', '1');
          jQuery(element).removeClass('animate-to-two-cards');

          tutorCardElt.css('margin-left', '');
          tutorCardElt.css('margin-right', '');
          tutorCardElt.css('float', '');
          done();
        });
      });

      return function(cancel) {
        if (cancel) {
          tutorCardElt.css('margin-left', '0');
          tutorCardElt.css('margin-right', '');
          tutorCardElt.css('float', 'left');
          tutorCardElt.stop();

          supplementalCardElt.css('opacity', '1');
          supplementalCardElt.stop();

          jQuery(element).removeClass('animate-to-two-cards');
        }
      };
    } else if (className === 'animate-to-one-card') {
      supplementalCardElt.css('opacity', '0');
      tutorCardElt.animate({
        'margin-left': '306px'
      }, TIME_NUM_CARDS_CHANGE_MSEC, function() {
        tutorCardElt.css('margin-left', 'auto');
        tutorCardElt.css('margin-right', 'auto');
        tutorCardElt.css('float', '');

        supplementalCardElt.css('opacity', '');

        jQuery(element).removeClass('animate-to-one-card');
        done();
      });

      return function(cancel) {
        if (cancel) {
          supplementalCardElt.css('opacity', '0');
          supplementalCardElt.stop();

          tutorCardElt.css('margin-left', '');
          tutorCardElt.css('margin-right', '');
          tutorCardElt.css('float', '');
          tutorCardElt.stop();

          jQuery(element).removeClass('animate-to-one-card');
        }
      };
    } else {
      return;
    }
  };

  return {
    addClass: animateCards
  };
});


oppia.animation('.conversation-skin-animate-card-contents', function() {
  var animateCardChange = function(element, className, done) {
    if (className !== 'animate-card-change') {
      return;
    }

    var currentHeight = element.height();
    var expectedNextHeight = $('#futurePreview').height();

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


oppia.directive('conversationSkin', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'skins/Conversation',
    controller: [
        '$scope', '$timeout', '$rootScope', '$window', 'messengerService',
        'oppiaPlayerService', 'urlService', 'focusService', 'ratingService',
        'windowDimensionsService',
        function(
          $scope, $timeout, $rootScope, $window, messengerService,
          oppiaPlayerService, urlService, focusService, ratingService,
          windowDimensionsService) {

      // The minimum width, in pixels, needed to be able to show two cards
      // side-by-side.
      $scope.TWO_CARD_THRESHOLD_PX = 1120;
      $scope.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';
      // The minimum width, in pixels, needed to be able to show the feedback
      // popover on the bottom of its click target.
      var FEEDBACK_POPOVER_THRESHOLD_PX = 700;

      var hasInteractedAtLeastOnce = false;
      var _answerIsBeingProcessed = false;
      var _nextFocusLabel = null;

      $scope.isInPreviewMode = oppiaPlayerService.isInPreviewMode();
      $scope.isIframed = urlService.isIframed();
      $rootScope.loadingMessage = 'Loading';
      $scope.explorationCompleted = false;

      $scope.oppiaAvatarImageUrl = oppiaPlayerService.getOppiaAvatarImageUrl();

      $scope.activeCard = null;
      $scope.numProgressDots = 0;
      $scope.currentProgressDotIndex = null;
      $scope.arePreviousResponsesShown = false;

      $scope.waitingForContinueButtonClick = false;

      $scope.upcomingStateName = null;
      $scope.upcomingContentHtml = null;
      $scope.upcomingInlineInteractionHtml = null;

      $scope.panels = [];
      $scope.PANEL_TUTOR = 'tutor';
      $scope.PANEL_INTERACTION = 'interaction';

      $scope.profilePicture = '/images/general/user_blue_72px.png';
      oppiaPlayerService.getUserProfileImage().then(function(result) {
        $scope.profilePicture = result;
      });

      // If the exploration is iframed, send data to its parent about its
      // height so that the parent can be resized as necessary.
      $scope.lastRequestedHeight = 0;
      $scope.lastRequestedScroll = false;
      $scope.adjustPageHeight = function(scroll, callback) {
        $timeout(function() {
          var newHeight = document.body.scrollHeight;
          if (Math.abs($scope.lastRequestedHeight - newHeight) > 50.5 ||
              (scroll && !$scope.lastRequestedScroll)) {
            // Sometimes setting iframe height to the exact content height still
            // produces scrollbar, so adding 50 extra px.
            newHeight += 50;
            messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
              {height: newHeight, scroll: scroll});
            $scope.lastRequestedHeight = newHeight;
            $scope.lastRequestedScroll = scroll;
          }

          if (callback) {
            callback();
          }
        }, 100);
      };

      $scope.getThumbnailSrc = function(panelName) {
        if (panelName === $scope.PANEL_TUTOR) {
          return '/images/general/o_black_72px.png';
        } else if (panelName === $scope.PANEL_INTERACTION) {
          return oppiaPlayerService.getInteractionThumbnailSrc(
            $scope.activeCard.stateName);
        } else {
          throw Error(
            'Found a panel not corresponding to a tutor or interaction: ' +
            panelName);
        }
      };

      var _recomputeAndResetPanels = function() {
        $scope.panels = [];
        if (!$scope.canWindowFitTwoCards()) {
          $scope.panels.push($scope.PANEL_TUTOR);
        }
        if (!$scope.interactionIsInline) {
          $scope.panels.push($scope.PANEL_INTERACTION);
        }
        $scope.resetVisiblePanel();
      };

      $scope.currentVisiblePanelName = null;

      $scope.isPanelVisible = function(panelName) {
        if (panelName === $scope.PANEL_TUTOR && $scope.canWindowFitTwoCards()) {
          return true;
        } else {
          return panelName == $scope.currentVisiblePanelName;
        }
      };

      $scope.setVisiblePanel = function(panelName) {
        $scope.currentVisiblePanelName = panelName;
        if (panelName === $scope.PANEL_INTERACTION) {
          $scope.$broadcast('showInteraction');
        }
      };

      $scope.resetVisiblePanel = function() {
        if ($scope.panels.length === 0) {
          $scope.currentVisiblePanelName = null;
        } else {
          $scope.currentVisiblePanelName = $scope.panels[0];
        }
      };

      // Changes the currently-active card, and resets the 'show previous
      // responses' setting.
      var _navigateToCard = function(index) {
        $scope.activeCard = $scope.transcript[index];
        $scope.arePreviousResponsesShown = false;
        $scope.interactionIsInline = oppiaPlayerService.isInteractionInline(
          $scope.activeCard.stateName);

        _recomputeAndResetPanels();
        if (_nextFocusLabel && index === $scope.transcript.length - 1) {
          focusService.setFocus(_nextFocusLabel);
        } else {
          focusService.setFocus($scope.activeCard.contentHtmlFocusLabel);
        }
      };

      var _addNewCard = function(stateName, contentHtml, interactionHtml) {
        var interactionIsInline = oppiaPlayerService.isInteractionInline(
          stateName);
        var interactionInstructions = (
          oppiaPlayerService.getInteractionInstructions(stateName));

        var oldStateName = null;
        if ($scope.transcript.length >= 1) {
          oldStateName = $scope.transcript[$scope.transcript.length - 1].stateName;
        }

        oppiaPlayerService.applyCachedParamUpdates();
        $scope.transcript.push({
          stateName: stateName,
          contentHtml: contentHtml,
          contentHtmlFocusLabel: focusService.generateFocusLabel(),
          interactionHtml: interactionHtml,
          interactionIsInline: interactionIsInline,
          interactionIsDisabled: false,
          interactionInstructions: interactionInstructions,
          answerFeedbackPairs: []
        });

        $scope.numProgressDots++;

        if ($scope.canWindowFitTwoCards() &&
            oldStateName &&
            oppiaPlayerService.isInteractionInline(oldStateName) &&
            !oppiaPlayerService.isInteractionInline(stateName)) {
          $scope.isAnimatingToTwoCards = true;
          $timeout(function() {
            $scope.isAnimatingToTwoCards = false;
            $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
          }, TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
        } else if (
            $scope.canWindowFitTwoCards() &&
            oldStateName &&
            !oppiaPlayerService.isInteractionInline(oldStateName) &&
            oppiaPlayerService.isInteractionInline(stateName)) {
          $scope.isAnimatingToOneCard = true;
          $timeout(function() {
            $scope.isAnimatingToOneCard = false;
            $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
          }, TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
        } else {
          $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
        }
      };

      $scope.toggleShowPreviousResponses = function() {
        $scope.arePreviousResponsesShown = !$scope.arePreviousResponsesShown;
      };

      $scope.initializePage = function() {
        $scope.transcript = [];
        $scope.interactionIsInline = false;
        $scope.waitingForOppiaFeedback = false;
        hasInteractedAtLeastOnce = false;

        oppiaPlayerService.init(function(stateName, initHtml) {
          $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
          _nextFocusLabel = focusService.generateFocusLabel();
          $scope.gadgetPanelsContents = (
            oppiaPlayerService.getGadgetPanelsContents());

          _addNewCard(
            stateName,
            initHtml,
            oppiaPlayerService.getInteractionHtml(stateName, _nextFocusLabel));
          $rootScope.loadingMessage = '';

          $scope.adjustPageHeight(false, null);
          $window.scrollTo(0, 0);
          focusService.setFocus(_nextFocusLabel);

          $scope.explorationCompleted = oppiaPlayerService.isStateTerminal(
            stateName);
        });
      };

      $scope.submitAnswer = function(answer) {
        // For some reason, answers are getting submitted twice when the submit
        // button is clicked. This guards against that.
        if (_answerIsBeingProcessed) {
          return;
        }

        $timeout(function() {
          _recomputeAndResetPanels();
        }, TIME_PADDING_MSEC);

        _answerIsBeingProcessed = true;
        hasInteractedAtLeastOnce = true;
        $scope.waitingForOppiaFeedback = true;

        var _oldStateName = (
          $scope.transcript[$scope.transcript.length - 1].stateName);
        $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs.push({
          learnerAnswer: oppiaPlayerService.getAnswerAsHtml(answer),
          shortLearnerAnswer: oppiaPlayerService.getShortAnswerAsHtml(answer),
          oppiaFeedback: null
        });

        oppiaPlayerService.submitAnswer(answer, function(
            newStateName, refreshInteraction, feedbackHtml, contentHtml) {
          $scope.waitingForOppiaFeedback = false;
          var pairs = (
            $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs);
          var lastAnswerFeedbackPair = pairs[pairs.length - 1];

          if (_oldStateName === newStateName) {
            // Stay on the same card.
            lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
            if (refreshInteraction) {
              // Replace the previous interaction (even though it might be of
              // the same type).
              _nextFocusLabel = focusService.generateFocusLabel();
              $scope.transcript[$scope.transcript.length - 1].interactionHtml = (
                oppiaPlayerService.getInteractionHtml(newStateName, _nextFocusLabel) +
                oppiaPlayerService.getRandomSuffix());
            }
            focusService.setFocus(_nextFocusLabel);
            scrollToBottom();
          } else {
            // There is a new card. Disable the current interaction -- then, if
            // there is no feedback, move on immediately. Otherwise, give the
            // learner a chance to read the feedback, and display a 'Continue'
            // button.
            $scope.transcript[$scope.transcript.length - 1].interactionIsDisabled = true;

            _nextFocusLabel = focusService.generateFocusLabel();

            // These are used to compute the dimensions for the next card.
            $scope.upcomingStateName = newStateName;
            $scope.upcomingContentHtml = (
              contentHtml + oppiaPlayerService.getRandomSuffix());
            var _isNextInteractionInline = oppiaPlayerService.isInteractionInline(
              newStateName);
            $scope.upcomingInlineInteractionHtml = (
              _isNextInteractionInline ?
              oppiaPlayerService.getInteractionHtml(
                newStateName, _nextFocusLabel
              ) + oppiaPlayerService.getRandomSuffix() : '');

            if (feedbackHtml) {
              lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
              $scope.waitingForContinueButtonClick = true;
              _nextFocusLabel = $scope.CONTINUE_BUTTON_FOCUS_LABEL;
              focusService.setFocus(_nextFocusLabel);
              scrollToBottom();
            } else {
              // Note that feedbackHtml is an empty string if no feedback has
              // been specified. This causes the answer-feedback pair to change
              // abruptly, so we make the change only after the animation has
              // completed.
              $scope.showPendingCard(
                newStateName,
                contentHtml + oppiaPlayerService.getRandomSuffix(),
                function() {
                  lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
                });
            }
          }

          $scope.explorationCompleted = oppiaPlayerService.isStateTerminal(
            newStateName);
          _answerIsBeingProcessed = false;
        }, true);
      };

      $scope.startCardChangeAnimation = false;
      $scope.showPendingCard = function(newStateName, newContentHtml, successCallback) {
        $scope.waitingForContinueButtonClick = false;
        $scope.startCardChangeAnimation = true;

        $timeout(function() {
          _addNewCard(
            newStateName,
            newContentHtml,
            oppiaPlayerService.getInteractionHtml(
              newStateName, _nextFocusLabel) + oppiaPlayerService.getRandomSuffix());

          $scope.upcomingStateName = null;
          $scope.upcomingContentHtml = null;
          $scope.upcomingInlineInteractionHtml = null;
        }, TIME_FADEOUT_MSEC + 0.1 * TIME_HEIGHT_CHANGE_MSEC);

        $timeout(function() {
          focusService.setFocus(_nextFocusLabel);
          scrollToTop();
        }, TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + 0.5 * TIME_FADEIN_MSEC);

        $timeout(function() {
          $scope.startCardChangeAnimation = false;
          if (successCallback) {
            successCallback();
          }
        }, TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
      };

      var scrollToBottom = function() {
        $timeout(function() {
          var tutorCard = $('.conversation-skin-tutor-card-active');
          var tutorCardBottom = tutorCard.offset().top + tutorCard.outerHeight();
          if ($(window).scrollTop() + $(window).height() < tutorCardBottom) {
            $('html, body').animate({
              scrollTop: tutorCardBottom - $(window).height() + 12
            }, {
              duration: TIME_SCROLL_MSEC,
              easing: 'easeOutQuad'
            });
          }
        }, 100);
      };

      var scrollToTop = function() {
        $timeout(function() {
          $(window).scrollTop(0);
        });
      };

      $scope.submitUserRating = function(ratingValue) {
        ratingService.submitUserRating(ratingValue);
      };
      $scope.$on('ratingUpdated', function() {
        $scope.userRating = ratingService.getUserRating();
      });

      $scope.$watch('currentProgressDotIndex', function(newValue) {
        if (newValue !== null) {
          _navigateToCard(newValue);
        }
      });

      $scope.getFeedbackPopoverPlacement = function() {
        return (
          $(window).width() < FEEDBACK_POPOVER_THRESHOLD_PX ? 'left' : 'bottom');
      };

      $window.addEventListener('beforeunload', function(e) {
        if (hasInteractedAtLeastOnce && !$scope.explorationCompleted &&
            !$scope.isInPreviewMode) {
          oppiaPlayerService.registerMaybeLeaveEvent();
          var confirmationMessage = (
            'If you navigate away from this page, your progress on the ' +
            'exploration will be lost.');
          (e || $window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });

      $scope.windowWidth = windowDimensionsService.getWidth();
      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
        $scope.windowWidth = windowDimensionsService.getWidth();
        _recomputeAndResetPanels();
      };

      $window.addEventListener('scroll', function() {
        fadeDotsOnScroll();
        fixSupplementOnScroll();
      });

      var fadeDotsOnScroll = function() {
        var progressDots = $('.conversation-skin-progress-dots');
        var progressDotsTop = progressDots.height();
        var newOpacity = Math.max(
          (progressDotsTop - $(window).scrollTop()) / progressDotsTop, 0);
        progressDots.css({opacity: newOpacity});
      };

      var fixSupplementOnScroll = function() {
        var supplementCard = $('md-card.conversation-skin-supplemental-card');
        var topMargin = $('.navbar-container').height() - 20;
        if ($(window).scrollTop() > topMargin) {
          supplementCard.addClass('conversation-skin-supplemental-card-fixed');
        } else {
          supplementCard.removeClass('conversation-skin-supplemental-card-fixed');
        }
      };

      $scope.canWindowFitTwoCards = function() {
        return $scope.windowWidth >= $scope.TWO_CARD_THRESHOLD_PX;
      };

      $scope.initializePage();
      ratingService.init(function(userRating) {
        $scope.userRating = userRating;
      });
    }]
  };
}]);


oppia.directive('answerFeedbackPair', [function() {
  return {
    restrict: 'E',
    scope: {
      answer: '&',
      feedback: '&',
      oppiaAvatarImageUrl: '&',
      profilePicture: '&',
      shortAnswer: '&'
    },
    templateUrl: 'components/answerFeedbackPair'
  };
}]);


oppia.directive('progressDots', [function() {
  return {
    restrict: 'E',
    scope: {
      getNumDots: '&numDots',
      currentDotIndex: '='
    },
    templateUrl: 'components/progressDots',
    controller: ['$scope', function($scope) {

      $scope.MAX_DOTS = 18;
      $scope.dots = [];
      var initialDotCount = $scope.getNumDots();
      for (var i = 0; i < initialDotCount; i++) {
        $scope.dots.push({});
      }

      $scope.$watch(function() {
        return $scope.getNumDots();
      }, function(newValue) {
        var oldValue = $scope.dots.length;

        if (newValue === oldValue) {
          return;
        } else if (newValue === oldValue + 1) {
          $scope.dots.push({});
          $scope.currentDotIndex = $scope.dots.length - 1;
          $scope.rightmostVisibleDotIndex = $scope.dots.length - 1;
          if ($scope.dots.length > $scope.MAX_DOTS) {
            $scope.leftmostVisibleDotIndex = $scope.rightmostVisibleDotIndex - $scope.MAX_DOTS + 1;
          } else {
            $scope.leftmostVisibleDotIndex = 0;
          }
        } else {
          throw Error(
            'Unexpected change to number of dots from ' + oldValue + ' to ' +
            newValue);
        }
      });

      $scope.changeActiveDot = function(index) {
        $scope.currentDotIndex = index;
      };

      $scope.decrementCurrentDotIndex = function() {
        if ($scope.currentDotIndex > 0) {
          if ($scope.currentDotIndex === $scope.leftmostVisibleDotIndex) {
            $scope.leftmostVisibleDotIndex = $scope.leftmostVisibleDotIndex - 1;
            $scope.rightmostVisibleDotIndex = $scope.rightmostVisibleDotIndex - 1;
          }
          $scope.changeActiveDot($scope.currentDotIndex - 1);
        }
      };

      $scope.incrementCurrentDotIndex = function() {
        if ($scope.currentDotIndex < $scope.dots.length - 1) {
          if ($scope.currentDotIndex === $scope.rightmostVisibleDotIndex) {
            $scope.rightmostVisibleDotIndex = $scope.rightmostVisibleDotIndex + 1;
            $scope.leftmostVisibleDotIndex = $scope.leftmostVisibleDotIndex + 1;
          }
          $scope.changeActiveDot($scope.currentDotIndex + 1);
        }
      };

    }]
  };
}]);
